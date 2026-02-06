'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBInput,
    MDBTextArea,
    MDBBtn,
    MDBSwitch,
    MDBIcon,
    MDBModal,
    MDBModalDialog,
    MDBModalContent,
    MDBModalHeader,
    MDBModalTitle,
    MDBModalBody,
    MDBModalFooter,
    MDBTable,
    MDBTableHead,
    MDBTableBody,
    MDBBadge,
    MDBTabs,
    MDBTabsItem,
    MDBTabsLink,
    MDBTabsContent,
    MDBTabsPane,
} from 'mdb-react-ui-kit';
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';

interface KnowledgeFile {
    id: string;
    name: string;
    size?: number;
    mimeType?: string;
    sourceType?: string;
    uploadedAt?: string;
    url?: string;
}

interface QAPair {
    question: string;
    answer: string;
}

interface CrawledPage {
    id?: string;
    url: string;
    title?: string;
    status?: string;
    lastCrawledAt?: string;
    contentLength?: number;
}

interface KnowledgeBaseResponse {
    files?: KnowledgeFile[];
    websites?: CrawledPage[];
    texts?: string[];
    qaPairs?: QAPair[];
    dataSourceSummary?: {
        totalFiles?: number;
        totalPages?: number;
        lastUpdated?: string;
    };
}

interface KnowledgeBase {
    id: string;
    chatbotId: string;
    knowledgeOf: string;
    knowledgeType: string;
    createdBy: string;
    created: string | number; // Can be ISO string or timestamp
}

interface Chatbot {
    id: string;
    title: string;
    name: string;
    createdAt: string;
    createdBy: string;
    status: string;
    message: string;
    selectedDataSource?: string;
    fileIds?: string[];
    files?: KnowledgeFile[];
    addedWebsites?: string[];
    addedTexts?: string[];
    qaPairs?: QAPair[];
    width?: number;
    height?: number;
    enableWhatsappIntegration?: boolean;
    enableFacebookIntegration?: boolean;
    instructions?: string; // Instructions for replying user
    fallbackMessage?: string; // Fallback message for replying user
    greetingMessage?: string; // Greeting message for replying user
    restrictToDataSource?: boolean; // Restrict to Datasource and knowledgebase during user's reply
}

export default function ChatbotDetailPage() {
    const params = useParams();
    const router = useRouter();
    const chatbotId = params?.id as string;
    
    const [chatbot, setChatbot] = useState<Chatbot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedChatbot, setEditedChatbot] = useState<Chatbot | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showEmbedCode, setShowEmbedCode] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const [showApiCopyTooltip, setShowApiCopyTooltip] = useState(false);
    const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
    const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseResponse | null>(null);
    const [knowledgeBasesList, setKnowledgeBasesList] = useState<KnowledgeBase[]>([]);
    const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
    const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);
    const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
    const [previewWidth, setPreviewWidth] = useState<number>(400);
    const [previewHeight, setPreviewHeight] = useState<number>(500);
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);
    const [showFacebookModal, setShowFacebookModal] = useState(false);
    const [activeChannelTab, setActiveChannelTab] = useState<'whatsapp' | 'slack' | 'custom'>('whatsapp');
    const [whatsappForm, setWhatsappForm] = useState({
        name: '',
        businessAccountId: '',
        appId: '',
        appSecret: '',
        phoneNumberId: '',
        phoneNumber: '',
        accessToken: '',
        webhookUrl: '',
        webhookVerifyToken: '',
    });
    const [whatsappErrors, setWhatsappErrors] = useState<Record<string, string>>({});
    const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);
    const [whatsappTestResult, setWhatsappTestResult] = useState<'success' | 'error' | null>(null);
    const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
    const [whatsappIntegration, setWhatsappIntegration] = useState<{
        id?: string;
        chatbotId?: string;
        name?: string;
        businessAccountId?: string;
        appId?: string;
        appSecret?: string;
        phoneNumberId?: string;
        phoneNumber?: string;
        accessToken?: string;
        webhookUrl?: string;
        webhookVerifyToken?: string;
        enabled?: boolean;
    } | null>(null);
    const [isLoadingWhatsappIntegration, setIsLoadingWhatsappIntegration] = useState(false);
    const [facebookForm, setFacebookForm] = useState({
        pageName: '',
        pageId: '',
        accessToken: '',
        verifyToken: '',
    });
    const [facebookErrors, setFacebookErrors] = useState<Record<string, string>>({});
    const [isTestingFacebook, setIsTestingFacebook] = useState(false);
    const [facebookTestResult, setFacebookTestResult] = useState<'success' | 'error' | null>(null);
    const [isSavingFacebook, setIsSavingFacebook] = useState(false);
    const [messengerIntegration, setMessengerIntegration] = useState<{
        id?: string;
        chatbotId?: string;
        pageName?: string;
        pageId?: string;
        accessToken?: string;
        verifyToken?: string;
        enabled?: boolean;
    } | null>(null);
    const [isLoadingMessengerIntegration, setIsLoadingMessengerIntegration] = useState(false);
    const [isConversationDrawerOpen, setIsConversationDrawerOpen] = useState(false);
    const [conversationDrawerMode, setConversationDrawerMode] = useState<'history' | 'new'>('history');
    const [conversationSearchTerm, setConversationSearchTerm] = useState('');
    const [newConversationForm, setNewConversationForm] = useState({
        customerName: '',
        topic: '',
        channel: 'Website widget',
        priority: 'Normal',
        message: '',
    });
    const [conversations, setConversations] = useState<Array<{
        id: string;
        title: string;
        updatedAt: string;
        preview: string;
    }>>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [conversationMessages, setConversationMessages] = useState<Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        createdAt: Date;
    }>>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    
    // Knowledge base editing state
    interface UploadedFileInfo {
        id: string;
        name: string;
        size: number;
        fileId: string | null;
        isUploading: boolean;
        uploadError: string | null;
        isExisting?: boolean; // Track if this is an existing file from the chatbot
    }
    
    interface QAInfo {
        id: string;
        question: string;
        answer: string;
        isExisting?: boolean; // Track if this is an existing QA pair from the chatbot
    }
    
    interface TextInfo {
        content: string;
        isExisting?: boolean; // Track if this is existing text from the chatbot
    }
    
    interface WebsiteInfo {
        url: string;
        isExisting?: boolean; // Track if this is existing website from the chatbot
    }
    
    const [editingFiles, setEditingFiles] = useState<UploadedFileInfo[]>([]);
    const [editingQAPairs, setEditingQAPairs] = useState<QAInfo[]>([]);
    const [editingTexts, setEditingTexts] = useState<TextInfo[]>([]);
    const [editingWebsites, setEditingWebsites] = useState<WebsiteInfo[]>([]);
    const [currentQAQuestion, setCurrentQAQuestion] = useState('');
    const [currentQAAnswer, setCurrentQAAnswer] = useState('');
    const [currentTextContent, setCurrentTextContent] = useState('');
    const [currentWebsiteUrl, setCurrentWebsiteUrl] = useState('');
    
    // Interface for UserChatHistory from API
    interface UserChatHistory {
        id: string | null;
        email: string | null;
        conversationid: string;
        userMessage: string;
        createdAt: number | string; // Can be timestamp in seconds (number) or ISO string
        aiMessage: string;
        mode: string;
        isAnonymous: boolean;
    }

    // Helper function to detect if content contains HTML
    const containsHTML = (text: string): boolean => {
        if (!text) return false;
        const htmlRegex = /<[a-z][\s\S]*>/i;
        return htmlRegex.test(text);
    };
    
    const conversationHistory = useMemo(() => conversations, [conversations]);

    const filteredConversations = useMemo(() => {
        if (!conversationSearchTerm.trim()) {
            return conversationHistory;
        }
        const term = conversationSearchTerm.toLowerCase();
        return conversationHistory.filter(
            (item) =>
                item.title.toLowerCase().includes(term) ||
                item.preview.toLowerCase().includes(term) ||
                item.id.toLowerCase().includes(term),
        );
    }, [conversationHistory, conversationSearchTerm]);

    const { isSignedIn, isLoaded } = useUser();
    const { getToken } = useAuth();

    // Google Calendar integration states
    const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
    const [isCheckingGoogleCalendar, setIsCheckingGoogleCalendar] = useState(false);
    const [isConnectingGoogleCalendar, setIsConnectingGoogleCalendar] = useState(false);

    // Check Google Calendar connection status
    const checkGoogleCalendarConnection = useCallback(async () => {
        if (!chatbotId || !isSignedIn) return;
        
        setIsCheckingGoogleCalendar(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (getToken) {
                const token = await getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/chatbot/google-calendar/${chatbotId}`, {
                method: 'GET',
                headers,
            });

            if (response.ok) {
                const data = await response.json();
                setGoogleCalendarConnected(!!data?.connected || !!data?.accessToken);
            } else {
                setGoogleCalendarConnected(false);
            }
        } catch (error) {
            console.error('Failed to check Google Calendar connection:', error);
            setGoogleCalendarConnected(false);
        } finally {
            setIsCheckingGoogleCalendar(false);
        }
    }, [chatbotId, isSignedIn, getToken]);

    // Initiate Google Calendar OAuth for chatbot owner
    const initiateGoogleCalendarAuth = useCallback(async () => {
        if (!chatbotId) return;
        
        setIsConnectingGoogleCalendar(true);
        try {
            let clerkToken = '';
            if (getToken) {
                const token = await getToken();
                if (token) {
                    clerkToken = token;
                }
            }

            // Build the authorize URL
            const authUrl = new URL('/api/google-oauth/authorize-chatbot', window.location.origin);
            authUrl.searchParams.set('chatbotId', chatbotId);
            if (clerkToken) {
                authUrl.searchParams.set('clerkToken', clerkToken);
            }

            // Fetch the Google OAuth URL
            const response = await fetch(authUrl.toString());
            const data = await response.json();

            if (data.authUrl) {
                // Open popup for OAuth
                const popup = window.open(
                    data.authUrl,
                    'Google Calendar Authorization',
                    'width=600,height=700,scrollbars=yes'
                );

                // Listen for OAuth completion message
                const handleMessage = (event: MessageEvent) => {
                    if (event.data?.type === 'GOOGLE_CALENDAR_OAUTH_SUCCESS') {
                        window.removeEventListener('message', handleMessage);
                        setIsConnectingGoogleCalendar(false);
                        if (event.data.success) {
                            setGoogleCalendarConnected(true);
                        } else {
                            console.error('Google Calendar OAuth failed:', event.data.error);
                        }
                    }
                };

                window.addEventListener('message', handleMessage);

                // Also check if popup was closed without completing
                const checkPopup = setInterval(() => {
                    if (popup?.closed) {
                        clearInterval(checkPopup);
                        window.removeEventListener('message', handleMessage);
                        setIsConnectingGoogleCalendar(false);
                        // Re-check connection status
                        checkGoogleCalendarConnection();
                    }
                }, 1000);
            } else {
                console.error('Failed to get OAuth URL:', data.error);
                setIsConnectingGoogleCalendar(false);
            }
        } catch (error) {
            console.error('Failed to initiate Google Calendar auth:', error);
            setIsConnectingGoogleCalendar(false);
        }
    }, [chatbotId, getToken, checkGoogleCalendarConnection]);

    // Disconnect Google Calendar
    const disconnectGoogleCalendar = useCallback(async () => {
        if (!chatbotId) return;
        
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (getToken) {
                const token = await getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/chatbot/google-calendar/${chatbotId}`, {
                method: 'DELETE',
                headers,
            });

            if (response.ok) {
                setGoogleCalendarConnected(false);
            }
        } catch (error) {
            console.error('Failed to disconnect Google Calendar:', error);
        }
    }, [chatbotId, getToken]);

    // Check Google Calendar connection on mount
    useEffect(() => {
        if (chatbotId && isSignedIn) {
            checkGoogleCalendarConnection();
        }
    }, [chatbotId, isSignedIn, checkGoogleCalendarConnection]);

    // Fetch conversation history from API
    const fetchConversationHistory = useCallback(async () => {
        if (!chatbotId || !isSignedIn) return;
        
        setIsLoadingConversations(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (getToken) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        console.warn('Failed to get auth token');
                        setIsLoadingConversations(false);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to get auth token:', error);
                    setIsLoadingConversations(false);
                    return;
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/n8n/authenticated/chatHistory/${chatbotId}`, {
                method: 'POST',
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: UserChatHistory[] = await response.json();
            
            // Group by conversationid and create conversation list
            const conversationMap = new Map<string, UserChatHistory[]>();
            data.forEach((item) => {
                const convId = item.conversationid;
                if (!conversationMap.has(convId)) {
                    conversationMap.set(convId, []);
                }
                conversationMap.get(convId)!.push(item);
            });

            // Convert to conversation list format
            const conversationList = Array.from(conversationMap.entries()).map(([convId, items]) => {
                // Sort items by createdAt to get the most recent first
                items.sort((a, b) => {
                    // Handle timestamp in seconds (multiply by 1000 to convert to milliseconds)
                    const aTime = typeof a.createdAt === 'number' ? a.createdAt * 1000 : new Date(a.createdAt).getTime();
                    const bTime = typeof b.createdAt === 'number' ? b.createdAt * 1000 : new Date(b.createdAt).getTime();
                    return bTime - aTime;
                });
                
                const firstItem = items[0];
                
                // Use createdAt from API to calculate "days ago"
                // Handle timestamp in seconds (multiply by 1000 to convert to milliseconds)
                const createdAtTimestamp = typeof firstItem.createdAt === 'number' 
                    ? firstItem.createdAt * 1000 
                    : new Date(firstItem.createdAt).getTime();
                const createdAtDate = new Date(createdAtTimestamp);
                const now = new Date();
                const diffMs = now.getTime() - createdAtDate.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                const diffWeeks = Math.floor(diffDays / 7);
                
                let updatedAtStr = '';
                if (diffHours < 1) {
                    updatedAtStr = 'Just now';
                } else if (diffHours < 24) {
                    updatedAtStr = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
                } else if (diffDays < 7) {
                    updatedAtStr = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
                } else if (diffWeeks < 4) {
                    updatedAtStr = `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
                } else {
                    updatedAtStr = `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'month' : 'months'} ago`;
                }

                // Generate title from first user message or use conversation ID
                const title = firstItem.userMessage?.substring(0, 50).trim() || `Conversation ${convId.substring(0, 8)}`;
                
                // Generate preview from first user or AI message
                const preview = firstItem.userMessage?.substring(0, 100).trim() || 
                              firstItem.aiMessage?.substring(0, 100).trim() || 
                              'No preview available';

                return {
                    id: convId,
                    title,
                    updatedAt: updatedAtStr,
                    preview,
                };
            });

            // Sort by most recent first (based on latest message in each conversation)
            // Since items are already sorted with newest first, use firstItem for comparison
            conversationList.sort((a, b) => {
                const aItems = conversationMap.get(a.id) || [];
                const bItems = conversationMap.get(b.id) || [];
                const aTime = aItems.length > 0 ? new Date(aItems[0].createdAt).getTime() : 0;
                const bTime = bItems.length > 0 ? new Date(bItems[0].createdAt).getTime() : 0;
                return bTime - aTime;
            });

            setConversations(conversationList);
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            setConversations([]); // Set empty array on error
        } finally {
            setIsLoadingConversations(false);
        }
    }, [chatbotId, isSignedIn, getToken]);

    const handleDrawerStateChange = (isOpen: boolean, activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'AI Chatbots') {
            router.push('/ai-chatbots');
            return;
        }

        if (itemHref && itemHref !== '#') {
            router.push(itemHref);
        }
    };

    const handleOpenConversationDrawer = (mode: 'history' | 'new') => {
        setConversationDrawerMode(mode);
        setIsConversationDrawerOpen(true);
        // Reset selected conversation when opening drawer
        setSelectedConversationId(null);
        setConversationMessages([]);
        // Fetch conversations when opening history drawer
        if (mode === 'history') {
            fetchConversationHistory();
        }
    };

    // Fetch conversation messages
    const fetchConversationMessages = useCallback(async (conversationId: string) => {
        if (!chatbotId || !isSignedIn || !conversationId) return;
        
        setIsLoadingMessages(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (getToken) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        console.warn('Failed to get auth token');
                        setIsLoadingMessages(false);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to get auth token:', error);
                    setIsLoadingMessages(false);
                    return;
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/n8n/authenticated/chatHistory/${chatbotId}/${conversationId}`, {
                method: 'POST',
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: UserChatHistory[] = await response.json();
            
            // Convert UserChatHistory to Message format
            const messages: Array<{
                id: string;
                role: 'user' | 'assistant';
                content: string;
                createdAt: Date;
            }> = [];
            
            data.forEach((item) => {
                // Handle timestamp in seconds (multiply by 1000 to convert to milliseconds)
                const createdAtTimestamp = typeof item.createdAt === 'number' 
                    ? item.createdAt * 1000 
                    : new Date(item.createdAt).getTime();
                const createdAtDate = new Date(createdAtTimestamp);
                
                // Add user message
                if (item.userMessage) {
                    messages.push({
                        id: `${item.id}_user`,
                        role: 'user',
                        content: item.userMessage,
                        createdAt: createdAtDate,
                    });
                }
                
                // Add AI message
                if (item.aiMessage) {
                    messages.push({
                        id: `${item.id}_ai`,
                        role: 'assistant',
                        content: item.aiMessage,
                        createdAt: createdAtDate,
                    });
                }
            });

            // Sort messages by creation time
            messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            setConversationMessages(messages);
        } catch (error) {
            console.error('Error fetching conversation messages:', error);
            setConversationMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [chatbotId, isSignedIn, getToken]);

    const handleConversationClick = (conversationId: string) => {
        setSelectedConversationId(conversationId);
        fetchConversationMessages(conversationId);
    };

    const handleBackToConversations = () => {
        setSelectedConversationId(null);
        setConversationMessages([]);
    };

    const handleCloseConversationDrawer = () => {
        setIsConversationDrawerOpen(false);
    };

    const handleConversationSearch = (value: string) => {
        setConversationSearchTerm(value);
    };

    const handleConversationFormChange = (field: keyof typeof newConversationForm, value: string) => {
        setNewConversationForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCreateConversation = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Placeholder submit handler. Integrate API call here.
        setNewConversationForm({
            customerName: '',
            topic: '',
            channel: 'Website widget',
            priority: 'Normal',
            message: '',
        });
        setIsConversationDrawerOpen(false);
    };

    const handleKnowledgeModalOpen = () => {
        setShowKnowledgeModal(true);
    };

    const handleKnowledgeModalClose = () => {
        setShowKnowledgeModal(false);
    };

    useEffect(() => {
        if (chatbotId && isLoaded) {
            fetchChatbotDetails();
        }
    }, [chatbotId, isLoaded]);

    const fetchChatbotDetails = async () => {
        setIsLoading(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (isSignedIn) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.warn('Failed to get auth token:', error);
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch chatbot details');
            }

            const result = await response.json();
            const chatbotData = result.data || result;
            setChatbot(chatbotData);
            setEditedChatbot(chatbotData);
            
            // Fetch messenger and WhatsApp integrations after chatbot is loaded
            await fetchMessengerIntegration();
            await fetchWhatsappIntegration();
        } catch (error) {
            console.error('Error fetching chatbot details:', error);
            // alert('Failed to load chatbot details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessengerIntegration = async () => {
        if (!chatbotId || !isSignedIn) return;
        
        setIsLoadingMessengerIntegration(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (getToken) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        console.warn('Failed to get auth token for messenger integration');
                        setIsLoadingMessengerIntegration(false);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to get auth token:', error);
                    setIsLoadingMessengerIntegration(false);
                    return;
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/chatbot/messenger/${chatbotId}`, {
                method: 'GET',
                headers,
            });

            if (response.status === 404) {
                // No integration found, which is fine
                setMessengerIntegration(null);
                setChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: false } : prev);
                setEditedChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: false } : prev);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch messenger integration');
            }

            const integration = await response.json();
            setMessengerIntegration(integration);
            
            // Update chatbot enabled status
            const isEnabled = integration.enabled !== false; // Default to true if not specified
            setChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: isEnabled } : prev);
            setEditedChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: isEnabled } : prev);
            
            // Pre-fill the form with existing integration data
            if (integration) {
                setFacebookForm({
                    pageName: integration.pageName || '',
                    pageId: integration.pageId || '',
                    accessToken: integration.accessToken || '',
                    verifyToken: integration.verifyToken || '',
                });
            }
        } catch (error) {
            console.error('Error fetching messenger integration:', error);
            // Don't show alert, just log the error
        } finally {
            setIsLoadingMessengerIntegration(false);
        }
    };

    const fetchWhatsappIntegration = async () => {
        if (!chatbotId || !isSignedIn) return;
        
        setIsLoadingWhatsappIntegration(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (getToken) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        console.warn('Failed to get auth token for WhatsApp integration');
                        setIsLoadingWhatsappIntegration(false);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to get auth token:', error);
                    setIsLoadingWhatsappIntegration(false);
                    return;
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/chatbot/whatsapp/${chatbotId}`, {
                method: 'GET',
                headers,
            });

            if (response.status === 404) {
                // No integration found, which is fine
                setWhatsappIntegration(null);
                setChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: false } : prev);
                setEditedChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: false } : prev);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch WhatsApp integration');
            }

            const integration = await response.json();
            setWhatsappIntegration(integration);
            
            // Update chatbot enabled status
            const isEnabled = integration.enabled !== false; // Default to true if not specified
            setChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: isEnabled } : prev);
            setEditedChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: isEnabled } : prev);
            
            // Pre-fill the form with existing integration data
            if (integration) {
                setWhatsappForm({
                    name: integration.name || '',
                    businessAccountId: integration.businessAccountId || '',
                    appId: integration.appId || '',
                    appSecret: integration.appSecret || '',
                    phoneNumberId: integration.phoneNumberId || '',
                    phoneNumber: integration.phoneNumber || '',
                    accessToken: integration.accessToken || '',
                    webhookUrl: integration.webhookUrl || '',
                    webhookVerifyToken: integration.webhookVerifyToken || '',
                });
            }
        } catch (error) {
            console.error('Error fetching WhatsApp integration:', error);
            // Don't show alert, just log the error
        } finally {
            setIsLoadingWhatsappIntegration(false);
        }
    };

    const handleOpenWhatsappModal = () => {
        // Pre-fill form if integration exists
        if (whatsappIntegration) {
            setWhatsappForm({
                name: whatsappIntegration.name || '',
                businessAccountId: whatsappIntegration.businessAccountId || '',
                appId: whatsappIntegration.appId || '',
                appSecret: whatsappIntegration.appSecret || '',
                phoneNumberId: whatsappIntegration.phoneNumberId || '',
                phoneNumber: whatsappIntegration.phoneNumber || '',
                accessToken: whatsappIntegration.accessToken || '',
                webhookUrl: whatsappIntegration.webhookUrl || '',
                webhookVerifyToken: whatsappIntegration.webhookVerifyToken || '',
            });
        }
        setShowWhatsappModal(true);
        setWhatsappTestResult(null);
    };

    const handleCloseWhatsappModal = () => {
        setShowWhatsappModal(false);
    };

    const handleOpenFacebookModal = () => {
        // Pre-fill form if integration exists
        if (messengerIntegration) {
            setFacebookForm({
                pageName: messengerIntegration.pageName || '',
                pageId: messengerIntegration.pageId || '',
                accessToken: messengerIntegration.accessToken || '',
                verifyToken: messengerIntegration.verifyToken || '',
            });
        }
        setShowFacebookModal(true);
        setFacebookTestResult(null);
    };

    const handleCloseFacebookModal = () => {
        setShowFacebookModal(false);
    };

    const handleWhatsappInputChange = (field: string, value: string) => {
        setWhatsappForm((prev) => ({ ...prev, [field]: value }));
        if (whatsappErrors[field]) {
            setWhatsappErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validateWhatsappForm = () => {
        const errors: Record<string, string> = {};
        if (!whatsappForm.name.trim()) {
            errors.name = 'WhatsApp name is required';
        }
        if (!whatsappForm.businessAccountId.trim()) {
            errors.businessAccountId = 'Business Account ID is required';
        }
        if (!whatsappForm.appId.trim()) {
            errors.appId = 'App ID is required';
        }
        if (!whatsappForm.phoneNumberId.trim()) {
            errors.phoneNumberId = 'Phone Number ID is required';
        } else if (!/^\d+$/.test(whatsappForm.phoneNumberId.trim())) {
            errors.phoneNumberId = 'Phone Number ID should contain only digits';
        }
        if (!whatsappForm.phoneNumber.trim()) {
            errors.phoneNumber = 'Phone Number is required';
        }
        if (!whatsappForm.accessToken.trim()) {
            errors.accessToken = 'Access token is required';
        }
        if (!whatsappForm.webhookVerifyToken.trim()) {
            errors.webhookVerifyToken = 'Webhook verify token is required';
        }
        setWhatsappErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleTestWhatsappConfiguration = async () => {
        if (!validateWhatsappForm()) {
            setWhatsappTestResult('error');
            return;
        }

        setIsTestingWhatsapp(true);
        setWhatsappTestResult(null);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1200));
            setWhatsappTestResult('success');
        } catch (error) {
            console.error('WhatsApp test configuration failed:', error);
            setWhatsappTestResult('error');
        } finally {
            setIsTestingWhatsapp(false);
        }
    };

    const handleSaveWhatsappConfiguration = async () => {
        if (!validateWhatsappForm()) {
            return;
        }

        if (!chatbotId) {
            alert('Chatbot ID is missing. Please refresh the page and try again.');
            return;
        }

        setIsSavingWhatsapp(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Get auth token
            if (getToken) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        console.warn('Failed to get auth token');
                        alert('Authentication failed. Please try again.');
                        setIsSavingWhatsapp(false);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to get auth token:', error);
                    alert('Authentication failed. Please try again.');
                    setIsSavingWhatsapp(false);
                    return;
                }
            }

            // Prepare request payload
            const payload = {
                chatbotId: chatbotId,
                name: whatsappForm.name,
                businessAccountId: whatsappForm.businessAccountId,
                appId: whatsappForm.appId,
                appSecret: whatsappForm.appSecret,
                phoneNumberId: whatsappForm.phoneNumberId,
                phoneNumber: whatsappForm.phoneNumber,
                accessToken: whatsappForm.accessToken,
                webhookUrl: whatsappForm.webhookUrl,
                webhookVerifyToken: whatsappForm.webhookVerifyToken,
            };

            // Call backend API
            const response = await fetch(`${backendUrl}/v1/api/chatbot/whatsapp/setup`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.errorMessage || errorData.message || `Failed to save WhatsApp integration: ${response.status}`;
                alert(errorMessage);
                setIsSavingWhatsapp(false);
                return;
            }

            const result = await response.json();
            console.log('WhatsApp configuration saved successfully:', result);
            alert('WhatsApp integration saved successfully!');
            setShowWhatsappModal(false);
            
            // Refresh WhatsApp integration data
            await fetchWhatsappIntegration();
            
            // Don't reset form - keep the saved values in case user wants to edit again
            setWhatsappErrors({});
            setWhatsappTestResult(null);
        } catch (error) {
            console.error('Error saving WhatsApp configuration:', error);
            alert('An error occurred while saving the WhatsApp integration. Please try again.');
        } finally {
            setIsSavingWhatsapp(false);
        }
    };

    const validateFacebookForm = () => {
        const errors: Record<string, string> = {};
        if (!facebookForm.pageName.trim()) {
            errors.pageName = 'Page name is required';
        }
        if (!facebookForm.pageId.trim()) {
            errors.pageId = 'Page ID is required';
        }
        if (!facebookForm.accessToken.trim()) {
            errors.accessToken = 'Access token is required';
        }
        if (!facebookForm.verifyToken.trim()) {
            errors.verifyToken = 'Verify token is required';
        }
        setFacebookErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleTestFacebookConfiguration = async () => {
        if (!validateFacebookForm()) {
            setFacebookTestResult('error');
            return;
        }

        setIsTestingFacebook(true);
        setFacebookTestResult(null);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            setFacebookTestResult('success');
        } catch (error) {
            console.error('Facebook test configuration failed:', error);
            setFacebookTestResult('error');
        } finally {
            setIsTestingFacebook(false);
        }
    };

    const handleSaveFacebookConfiguration = async () => {
        if (!validateFacebookForm()) {
            return;
        }

        if (!chatbotId) {
            alert('Chatbot ID is missing. Please refresh the page and try again.');
            return;
        }

        setIsSavingFacebook(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Get auth token
            if (getToken) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        console.warn('Failed to get auth token');
                        alert('Authentication failed. Please try again.');
                        setIsSavingFacebook(false);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to get auth token:', error);
                    alert('Authentication failed. Please try again.');
                    setIsSavingFacebook(false);
                    return;
                }
            }

            // Prepare request payload
            const payload = {
                chatbotId: chatbotId,
                pageName: facebookForm.pageName,
                pageId: facebookForm.pageId,
                accessToken: facebookForm.accessToken,
                verifyToken: facebookForm.verifyToken,
            };

            // Call backend API
            const response = await fetch(`${backendUrl}/v1/api/chatbot/messenger/setup`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.errorMessage || errorData.message || `Failed to save Facebook integration: ${response.status}`;
                alert(errorMessage);
                setIsSavingFacebook(false);
                return;
            }

            const result = await response.json();
            console.log('Facebook configuration saved successfully:', result);
            alert('Facebook Messenger integration saved successfully!');
            setShowFacebookModal(false);
            
            // Refresh messenger integration data
            await fetchMessengerIntegration();
            
            // Don't reset form - keep the saved values in case user wants to edit again
            setFacebookErrors({});
            setFacebookTestResult(null);
        } catch (error) {
            console.error('Error saving Facebook configuration:', error);
            alert('An error occurred while saving the Facebook integration. Please try again.');
        } finally {
            setIsSavingFacebook(false);
        }
    };

    const handleSave = async () => {
        if (!editedChatbot) return;

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (isSignedIn) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.warn('Failed to get auth token:', error);
                }
            }

            // Extract fileIds from uploaded files
            const fileIds = editingFiles
                .filter(file => file.fileId !== null)
                .map(file => file.fileId as string);
            
            // Prepare QA pairs (remove internal id field and isExisting flag)
            const qaPairs = editingQAPairs.map(qa => ({
                question: qa.question,
                answer: qa.answer
            }));
            
            // Prepare texts (extract content from TextInfo)
            const texts = editingTexts.map(textInfo => textInfo.content);
            
            // Prepare websites (extract url from WebsiteInfo)
            const websites = editingWebsites.map(websiteInfo => websiteInfo.url);

            // Ensure width and height are included from current preview values
            const chatbotToSave = {
                ...editedChatbot,
                width: previewWidth,
                height: previewHeight,
                fileIds: fileIds,
                qaPairs: qaPairs,
                addedTexts: texts,
                addedWebsites: websites,
            };

            const response = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(chatbotToSave),
            });

            if (!response.ok) {
                throw new Error('Failed to update chatbot');
            }

            const result = await response.json();
            const updatedChatbot = result.data || result;
            setChatbot(updatedChatbot);
            setEditedChatbot(updatedChatbot);
            setIsEditing(false);
            
            // Clear editing state
            setEditingFiles([]);
            setEditingQAPairs([]);
            setEditingTexts([]);
            setEditingWebsites([]);
        } catch (error) {
            console.error('Error updating chatbot:', error);
            alert('Failed to update chatbot');
        }
    };

    const handleCancel = () => {
        setEditedChatbot(chatbot);
        setIsEditing(false);
        // Reset editing state
        setEditingFiles([]);
        setEditingQAPairs([]);
        setEditingTexts([]);
        setEditingWebsites([]);
        setCurrentQAQuestion('');
        setCurrentQAAnswer('');
        setCurrentTextContent('');
        setCurrentWebsiteUrl('');
    };
    
    // Initialize editing state when entering edit mode
    useEffect(() => {
        if (isEditing && chatbot) {
            // Initialize files from chatbot
            let files: UploadedFileInfo[] = [];
            
            // First, use full file objects if available
            if (chatbot.files && chatbot.files.length > 0) {
                files = chatbot.files.map((file, index) => ({
                    id: file.id || `existing-${index}`,
                    name: file.name || `File ${index + 1}`,
                    size: file.size || 0,
                    fileId: file.id || null,
                    isUploading: false,
                    uploadError: null,
                    isExisting: true, // Mark as existing
                }));
            }
            
            // If we have fileIds but no full file objects (or fileIds not in files), create entries from fileIds
            if (chatbot.fileIds && chatbot.fileIds.length > 0) {
                // Get existing fileIds from files array
                const existingFileIds = new Set(files.map(f => f.fileId).filter(Boolean));
                
                // Add entries for fileIds that aren't already in files
                chatbot.fileIds.forEach((fileId, index) => {
                    if (!existingFileIds.has(fileId)) {
                        // Find if this fileId was already added from files array
                        const existingFile = files.find(f => f.fileId === fileId);
                        if (!existingFile) {
                            files.push({
                                id: fileId,
                                name: `File ${files.length + 1}`,
                                size: 0,
                                fileId: fileId,
                                isUploading: false,
                                uploadError: null,
                                isExisting: true, // Mark as existing
                            });
                        }
                    }
                });
                
                // If no files were created from files array, create all from fileIds
                if (files.length === 0) {
                    files = chatbot.fileIds.map((fileId, index) => ({
                        id: fileId,
                        name: `File ${index + 1}`,
                        size: 0,
                        fileId: fileId,
                        isUploading: false,
                        uploadError: null,
                        isExisting: true, // Mark as existing
                    }));
                }
            }
            
            setEditingFiles(files);
            
            // Initialize QA pairs - mark as existing
            const qaPairs: QAInfo[] = (chatbot.qaPairs || []).map((qa, index) => ({
                id: `existing-qa-${index}`,
                question: qa.question,
                answer: qa.answer,
                isExisting: true, // Mark as existing
            }));
            setEditingQAPairs(qaPairs);
            
            // Initialize texts - mark as existing
            const texts: TextInfo[] = (chatbot.addedTexts || []).map(text => ({
                content: text,
                isExisting: true, // Mark as existing
            }));
            setEditingTexts(texts);
            
            // Initialize websites - mark as existing
            const websites: WebsiteInfo[] = (chatbot.addedWebsites || []).map(url => ({
                url: url,
                isExisting: true, // Mark as existing
            }));
            setEditingWebsites(websites);
        }
    }, [isEditing, chatbot]);
    
    // File upload handler
    const uploadFile = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workflowId', 'chatbot-creation');
        formData.append('webhookUrl', 'chatbot-creation');

        const headers: Record<string, string> = {};
        
        if (isSignedIn) {
            try {
                const token = await getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (error) {
                console.warn('Failed to get auth token:', error);
            }
        }
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const response = await fetch(`${backendUrl}/v1/api/file/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errorMessage || `Failed to upload file: ${response.status}`);
        }

        const result = await response.json();
        if (!result.fileId) {
            throw new Error(result.errorMessage || 'File upload failed');
        }

        return result.fileId;
    };
    
    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;
        
        const newFiles = Array.from(files).filter(file => {
            const isValidSize = file.size <= 30 * 1024 * 1024; // 30MB
            if (!isValidSize) {
                alert(`${file.name} is too large. Please select files smaller than 30MB.`);
                return false;
            }
            return true;
        });

        // Check total file count
        const currentCount = editingFiles.length;
        if (currentCount + newFiles.length > 50) {
            alert('Maximum 50 files allowed. Some files were not added.');
            newFiles.splice(50 - currentCount);
        }

        // Add files to state with uploading status - mark as NOT existing (newly added)
        const newFileInfos: UploadedFileInfo[] = newFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            fileId: null,
            isUploading: true,
            uploadError: null,
            isExisting: false, // Mark as newly added, not existing
        }));

        setEditingFiles(prev => [...prev, ...newFileInfos]);

        // Upload files asynchronously
        newFiles.forEach(async (file, index) => {
            const fileInfoId = newFileInfos[index].id;
            try {
                const fileId = await uploadFile(file);
                setEditingFiles(prev =>
                    prev.map(f =>
                        f.id === fileInfoId
                            ? { ...f, fileId, isUploading: false, uploadError: null }
                            : f
                    )
                );
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                setEditingFiles(prev =>
                    prev.map(f =>
                        f.id === fileInfoId
                            ? {
                                  ...f,
                                  isUploading: false,
                                  uploadError: error instanceof Error ? error.message : 'Upload failed',
                              }
                            : f
                    )
                );
                alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    };
    
    const handleRemoveFile = (id: string) => {
        setEditingFiles(prev => prev.filter(f => f.id !== id));
    };
    
    const handleAddQA = () => {
        if (currentQAQuestion.trim() && currentQAAnswer.trim()) {
            const newQA: QAInfo = {
                id: Date.now().toString(),
                question: currentQAQuestion.trim(),
                answer: currentQAAnswer.trim(),
                isExisting: false, // Mark as newly added, not existing
            };
            setEditingQAPairs(prev => [...prev, newQA]);
            setCurrentQAQuestion('');
            setCurrentQAAnswer('');
        }
    };
    
    const handleRemoveQA = (id: string) => {
        setEditingQAPairs(prev => prev.filter(qa => qa.id !== id));
    };
    
    const handleAddText = () => {
        if (currentTextContent.trim()) {
            const newText: TextInfo = {
                content: currentTextContent.trim(),
                isExisting: false, // Mark as newly added, not existing
            };
            setEditingTexts(prev => [...prev, newText]);
            setCurrentTextContent('');
        } else {
            alert('Please enter some text content');
        }
    };
    
    const handleRemoveText = (index: number) => {
        setEditingTexts(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleAddWebsite = () => {
        if (currentWebsiteUrl.trim()) {
            try {
                new URL(currentWebsiteUrl.trim()); // Validate URL
                const newWebsite: WebsiteInfo = {
                    url: currentWebsiteUrl.trim(),
                    isExisting: false, // Mark as newly added, not existing
                };
                setEditingWebsites(prev => [...prev, newWebsite]);
                setCurrentWebsiteUrl('');
            } catch {
                alert('Please enter a valid website URL');
            }
        } else {
            alert('Please enter a website URL');
        }
    };
    
    const handleRemoveWebsite = (index: number) => {
        setEditingWebsites(prev => prev.filter((_, i) => i !== index));
    };

    // Fetch knowledge bases list
    const fetchKnowledgeBasesList = useCallback(async () => {
        if (!chatbotId) return;

        setIsLoadingKnowledgeBases(true);
        setKnowledgeError(null);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                setKnowledgeError('Backend URL is not configured');
                return;
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (isSignedIn) {
                try {
                    const token = await getToken();
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.warn('Failed to get auth token for knowledge bases:', error);
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/knowledge-bases`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch knowledge bases (${response.status})`);
            }

            const result = await response.json();
            // Handle different response formats
            const data: KnowledgeBase[] = Array.isArray(result) ? result : (result.data || result.list || []);
            setKnowledgeBasesList(data);
        } catch (error) {
            console.error('Error loading knowledge bases:', error);
            setKnowledgeError(error instanceof Error ? error.message : 'Failed to load knowledge bases');
        } finally {
            setIsLoadingKnowledgeBases(false);
        }
    }, [chatbotId, isSignedIn, getToken]);

    useEffect(() => {
        if (showKnowledgeModal) {
            fetchKnowledgeBasesList();
        }
    }, [showKnowledgeModal, fetchKnowledgeBasesList]);

    // Create files list - prioritize knowledgeBase files, then chatbot files, then create from fileIds
    let mergedFiles: KnowledgeFile[] = [];
    if (knowledgeBase?.files && knowledgeBase.files.length > 0) {
        mergedFiles = knowledgeBase.files;
    } else if (chatbot?.files && chatbot.files.length > 0) {
        mergedFiles = chatbot.files;
    } else if (chatbot?.fileIds && chatbot.fileIds.length > 0) {
        // Create file entries from fileIds with names like "File 1", "File 2", etc.
        mergedFiles = chatbot.fileIds.map((fileId, index) => ({
            id: fileId,
            name: `File ${index + 1}`,
            size: undefined,
            mimeType: undefined,
            sourceType: undefined,
            uploadedAt: undefined,
            url: undefined,
        }));
    }
    
    const mergedWebsites =
        knowledgeBase?.websites ||
        (chatbot?.addedWebsites || []).map((url, index) => ({
            id: `added-${index}`,
            url,
            status: 'PENDING',
            title: undefined,
            lastCrawledAt: undefined,
            contentLength: undefined,
        }) as CrawledPage);
    const mergedTexts = knowledgeBase?.texts || chatbot?.addedTexts || [];
    const mergedQAPairs = knowledgeBase?.qaPairs || chatbot?.qaPairs || [];

    useEffect(() => {
        const width = (isEditing ? editedChatbot?.width : chatbot?.width) ?? 400;
        const height = (isEditing ? editedChatbot?.height : chatbot?.height) ?? 500;
        setPreviewWidth(width);
        setPreviewHeight(height);
    }, [isEditing, editedChatbot?.width, editedChatbot?.height, chatbot?.width, chatbot?.height]);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const handlePreviewWidthChange = (value: number) => {
        const clamped = clamp(Number(value) || 0, 240, 1024);
        setPreviewWidth(clamped);
        setEditedChatbot((prev) => (prev ? { ...prev, width: clamped } : prev));
        if (!isEditing) {
            setChatbot((prev) => (prev ? { ...prev, width: clamped } : prev));
        }
    };

    const handlePreviewHeightChange = (value: number) => {
        const clamped = clamp(Number(value) || 0, 240, 1024);
        setPreviewHeight(clamped);
        setEditedChatbot((prev) => (prev ? { ...prev, height: clamped } : prev));
        if (!isEditing) {
            setChatbot((prev) => (prev ? { ...prev, height: clamped } : prev));
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes || bytes <= 0) return '—';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const renderKnowledgeModal = () => (
        <MDBModal open={showKnowledgeModal} setOpen={setShowKnowledgeModal} tabIndex='-1'>
            <MDBModalDialog size='lg' scrollable>
                <MDBModalContent>
                    <MDBModalHeader>
                        <MDBModalTitle>Knowledge Base</MDBModalTitle>
                        <MDBBtn className='btn-close' color='none' onClick={handleKnowledgeModalClose}></MDBBtn>
                    </MDBModalHeader>
                    <MDBModalBody>
                        {/* Knowledge Bases List */}
                        <div className="mb-4">
                            <h5 className="mb-3 d-flex align-items-center gap-2">
                                <MDBIcon icon="database" className="text-primary" />
                                Knowledge Bases
                                <MDBBadge color="primary" pill>{knowledgeBasesList.length}</MDBBadge>
                            </h5>
                            {isLoadingKnowledgeBases ? (
                                <div className="py-3 text-center text-muted">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2 mb-0 small">Loading knowledge bases...</p>
                                </div>
                            ) : knowledgeBasesList.length === 0 ? (
                                <p className="text-muted mb-0">No knowledge bases found for this chatbot.</p>
                            ) : (
                                <div className="table-responsive">
                                    <MDBTable align='middle' hover small>
                                        <MDBTableHead>
                                            <tr>
                                                <th>Knowledge Of</th>
                                                <th>Type</th>
                                                <th>Created By</th>
                                                <th>Created</th>
                                            </tr>
                                        </MDBTableHead>
                                        <MDBTableBody>
                                            {knowledgeBasesList.map((kb) => {
                                                // Handle timestamp in seconds (multiply by 1000 to convert to milliseconds)
                                                const createdTimestamp = typeof kb.created === 'number' 
                                                    ? kb.created * 1000 
                                                    : new Date(kb.created).getTime();
                                                const createdDate = new Date(createdTimestamp);
                                                
                                                return (
                                                    <tr key={kb.id}>
                                                        <td>
                                                            <div className="fw-semibold">{kb.knowledgeOf || 'N/A'}</div>
                                                        </td>
                                                        <td>
                                                            <MDBBadge color="info" pill>
                                                                {kb.knowledgeType || 'N/A'}
                                                            </MDBBadge>
                                                        </td>
                                                        <td>
                                                            <span className="text-muted">{kb.createdBy || '—'}</span>
                                                        </td>
                                                        <td>
                                                            {createdDate.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </MDBTableBody>
                                    </MDBTable>
                                </div>
                            )}
                        </div>
                    </MDBModalBody>
                    <MDBModalFooter>
                        <MDBBtn color="secondary" onClick={handleKnowledgeModalClose}>
                            Close
                        </MDBBtn>
                    </MDBModalFooter>
                </MDBModalContent>
            </MDBModalDialog>
        </MDBModal>
    );

    // Show loading while Clerk is initializing or fetching chatbot
    if (!isLoaded || isLoading) {
        return (
            <div className="full-height-layout">
                <LeftSidebar 
                    onDrawerStateChange={handleDrawerStateChange}
                    onNavItemClick={handleNavItemClick}
                />
                <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <MDBContainer>
                        <MDBCard className="mt-5">
                            <MDBCardBody className="text-center py-5">
                                <p>Loading chatbot details...</p>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBContainer>
                </div>
            </div>
        );
    }

    if (!chatbot) {
        return (
            <div className="full-height-layout">
                <LeftSidebar 
                    onDrawerStateChange={handleDrawerStateChange}
                    onNavItemClick={handleNavItemClick}
                />
                <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <MDBContainer>
                        <MDBCard className="mt-5">
                            <MDBCardBody className="text-center py-5">
                                <p>Chatbot not found</p>
                                <MDBBtn onClick={() => router.back()}>Go Back</MDBBtn>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBContainer>
                </div>
            </div>
        );
    }

    return (
        <div className="full-height-layout">
            <LeftSidebar 
                onDrawerStateChange={handleDrawerStateChange}
                onNavItemClick={handleNavItemClick}
            />
            <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <MDBContainer className="mt-5">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                <h2 className="mb-0">Chatbot Details</h2>
                <div className="d-flex flex-wrap gap-2">
                    <MDBBtn 
                        color="info" 
                        outline 
                        onClick={handleKnowledgeModalOpen}
                        className="d-flex align-items-center gap-2"
                    >
                        <MDBIcon icon="database" />
                        Knowledge Base
                    </MDBBtn>
                                <MDBBtn
                                    color="secondary"
                                    outline
                                    onClick={() => handleOpenConversationDrawer('history')}
                                    className="d-flex align-items-center gap-2"
                                    style={{
                                        borderRadius: '999px',
                                        padding: '10px 20px',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                    }}
                                >
                                    <MDBIcon icon="history" />
                                    Conversation History
                                </MDBBtn>
                                <MDBBtn
                                    color="primary"
                                    onClick={() => handleOpenConversationDrawer('new')}
                                    className="d-flex align-items-center gap-2"
                                    style={{
                                        borderRadius: '999px',
                                        padding: '10px 20px',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                    }}
                                >
                                    <MDBIcon icon="plus" />
                                    New Conversation
                                </MDBBtn>
                    {!isEditing ? (
                        <MDBBtn onClick={() => {
                            setEditedChatbot(chatbot);
                            setIsEditing(true);
                        }} color="primary" className="d-flex align-items-center gap-2">
                            <MDBIcon icon="edit" />
                            Edit
                        </MDBBtn>
                    ) : (
                        <>
                            <MDBBtn onClick={handleCancel} color="secondary" className="d-flex align-items-center gap-2">
                                <MDBIcon icon="undo" />
                                Cancel
                            </MDBBtn>
                            <MDBBtn onClick={handleSave} color="success" className="d-flex align-items-center gap-2">
                                <MDBIcon icon="save" />
                                Save Changes
                            </MDBBtn>
                        </>
                    )}
                </div>
            </div>

            <MDBCard>
                <MDBCardBody className="p-4">
                    <MDBRow>
                        <MDBCol md="6" className="mb-3">
                            <label className="form-label">Title</label>
                            {isEditing ? (
                                <MDBInput
                                    value={editedChatbot?.title || ''}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, title: e.target.value } : null
                                        )
                                    }
                                />
                            ) : (
                                <p className="mb-0">{chatbot.title}</p>
                            )}
                        </MDBCol>

                        <MDBCol md="6" className="mb-3">
                            <label className="form-label">Name</label>
                            {isEditing ? (
                                <MDBInput
                                    value={editedChatbot?.name || ''}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, name: e.target.value } : null
                                        )
                                    }
                                />
                            ) : (
                                <p className="mb-0">{chatbot.name}</p>
                            )}
                        </MDBCol>

                        <MDBCol md="12" className="mb-3">
                            <label className="form-label">Status</label>
                            {isEditing ? (
                                <MDBSwitch
                                    checked={editedChatbot?.status === 'ACTIVE'}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      status: e.target.checked ? 'ACTIVE' : 'DISABLED',
                                                  }
                                                : null
                                        )
                                    }
                                />
                            ) : (
                                <p className="mb-0">
                                    <span
                                        style={{
                                            padding: '4px 12px',
                                            backgroundColor:
                                                chatbot.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6',
                                            color: chatbot.status === 'ACTIVE' ? '#065f46' : '#6b7280',
                                            borderRadius: '16px',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {chatbot.status}
                                    </span>
                                </p>
                            )}
                        </MDBCol>

                        <MDBCol md="12" className="mb-3">
                            <label className="form-label">Instructions for Replying User</label>
                            {isEditing ? (
                                <MDBTextArea
                                    rows={4}
                                    value={editedChatbot?.instructions || ''}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, instructions: e.target.value } : null
                                        )
                                    }
                                    placeholder="Enter instructions for how the chatbot should reply to users..."
                                />
                            ) : (
                                <p className="mb-0">{chatbot.instructions || 'No instructions set'}</p>
                            )}
                        </MDBCol>

                        <MDBCol md="12" className="mb-3">
                            <label className="form-label">Fallback Message for Replying User</label>
                            {isEditing ? (
                                <MDBTextArea
                                    rows={3}
                                    value={editedChatbot?.fallbackMessage || ''}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, fallbackMessage: e.target.value } : null
                                        )
                                    }
                                    placeholder="Enter fallback message when the chatbot cannot find an answer..."
                                    maxLength={1000}
                                />
                            ) : (
                                <p className="mb-0">{chatbot.fallbackMessage || 'No fallback message set'}</p>
                            )}
                        </MDBCol>

                        <MDBCol md="12" className="mb-3">
                            <label className="form-label">Greeting Message for Replying User</label>
                            {isEditing ? (
                                <MDBTextArea
                                    rows={3}
                                    value={editedChatbot?.greetingMessage || ''}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, greetingMessage: e.target.value } : null
                                        )
                                    }
                                    placeholder="Enter greeting message for the chatbot..."
                                    maxLength={1000}
                                />
                            ) : (
                                <p className="mb-0">{chatbot.greetingMessage || 'No greeting message set'}</p>
                            )}
                        </MDBCol>

                        <MDBCol md="12" className="mb-3">
                            <label className="form-label">Restrict to Datasource and Knowledgebase</label>
                            {isEditing ? (
                                <MDBSwitch
                                    checked={editedChatbot?.restrictToDataSource || false}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, restrictToDataSource: e.target.checked } : null
                                        )
                                    }
                                    label="Restrict replies to only use datasource and knowledgebase content"
                                />
                            ) : (
                                <p className="mb-0">
                                    <span
                                        style={{
                                            padding: '4px 12px',
                                            backgroundColor: chatbot.restrictToDataSource ? '#d1fae5' : '#f3f4f6',
                                            color: chatbot.restrictToDataSource ? '#065f46' : '#6b7280',
                                            borderRadius: '16px',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {chatbot.restrictToDataSource ? 'Enabled' : 'Disabled'}
                                    </span>
                                </p>
                            )}
                        </MDBCol>
                        
                        {/* Knowledge Base View Section (Non-edit mode) */}
                        {!isEditing && (mergedFiles.length > 0 || mergedQAPairs.length > 0 || mergedTexts.length > 0 || mergedWebsites.length > 0) && (
                            <>
                                <MDBCol md="12" className="mb-4 mt-4">
                                    <hr />
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <MDBIcon icon="database" className="text-primary" />
                                        Knowledge Base
                                    </h5>
                                </MDBCol>
                                
                                {/* Files Display */}
                                {mergedFiles.length > 0 && (
                                    <MDBCol md="12" className="mb-3">
                                        <label className="form-label fw-bold">Files ({mergedFiles.length})</label>
                                        <MDBCard className="border">
                                            <MDBCardBody>
                                                <div className="d-flex flex-column gap-2">
                                                    {mergedFiles.map((file, index) => (
                                                        <div
                                                            key={file.id || index}
                                                            className="d-flex align-items-center justify-content-between p-2 border rounded"
                                                            style={{ backgroundColor: '#f9fafb' }}
                                                        >
                                                            <div className="d-flex align-items-center gap-2">
                                                                <MDBIcon icon="file" className="text-primary" />
                                                                <div>
                                                                    <div className="fw-semibold">{file.name}</div>
                                                                    {file.size && (
                                                                        <small className="text-muted">
                                                                            {formatFileSize(file.size)}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </MDBCardBody>
                                        </MDBCard>
                                    </MDBCol>
                                )}
                                
                                {/* QA Pairs Display */}
                                {mergedQAPairs.length > 0 && (
                                    <MDBCol md="12" className="mb-3">
                                        <label className="form-label fw-bold">Question & Answer Pairs ({mergedQAPairs.length})</label>
                                        <MDBCard className="border">
                                            <MDBCardBody>
                                                <div className="d-flex flex-column gap-3">
                                                    {mergedQAPairs.map((qa, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-3 border rounded"
                                                            style={{ backgroundColor: '#f9fafb' }}
                                                        >
                                                            <div className="fw-semibold text-primary mb-1">
                                                                <MDBIcon icon="question-circle" className="me-1" />
                                                                {qa.question}
                                                            </div>
                                                            <div className="text-muted">
                                                                <MDBIcon icon="check-circle" className="me-1" />
                                                                {qa.answer}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </MDBCardBody>
                                        </MDBCard>
                                    </MDBCol>
                                )}
                                
                                {/* Texts Display */}
                                {mergedTexts.length > 0 && (
                                    <MDBCol md="12" className="mb-3">
                                        <label className="form-label fw-bold">Text Content ({mergedTexts.length})</label>
                                        <MDBCard className="border">
                                            <MDBCardBody>
                                                <div className="d-flex flex-column gap-2">
                                                    {mergedTexts.map((text, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-2 border rounded"
                                                            style={{ backgroundColor: '#f9fafb' }}
                                                        >
                                                            <small className="text-muted">
                                                                {text.substring(0, 200)}
                                                                {text.length > 200 ? '...' : ''}
                                                            </small>
                                                        </div>
                                                    ))}
                                                </div>
                                            </MDBCardBody>
                                        </MDBCard>
                                    </MDBCol>
                                )}
                                
                                {/* Websites Display */}
                                {mergedWebsites.length > 0 && (
                                    <MDBCol md="12" className="mb-3">
                                        <label className="form-label fw-bold">Website URLs ({mergedWebsites.length})</label>
                                        <MDBCard className="border">
                                            <MDBCardBody>
                                                <div className="d-flex flex-column gap-2">
                                                    {mergedWebsites.map((website, index) => (
                                                        <div
                                                            key={website.id || index}
                                                            className="d-flex align-items-center p-2 border rounded"
                                                            style={{ backgroundColor: '#f9fafb' }}
                                                        >
                                                            <MDBIcon icon="link" className="me-2 text-primary" />
                                                            <a href={website.url} target="_blank" rel="noopener noreferrer">
                                                                {website.url}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </MDBCardBody>
                                        </MDBCard>
                                    </MDBCol>
                                )}
                            </>
                        )}
                        
                        {/* Knowledge Base Editing Section */}
                        {isEditing && (
                            <>
                                <MDBCol md="12" className="mb-4 mt-4">
                                    <hr />
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <MDBIcon icon="database" className="text-primary" />
                                        Knowledge Base
                                    </h5>
                                </MDBCol>
                                
                                {/* Files Section */}
                                <MDBCol md="12" className="mb-4">
                                    <label className="form-label fw-bold">Files</label>
                                    <MDBCard className="border">
                                        <MDBCardBody>
                                            <div className="mb-3">
                                                <input
                                                    type="file"
                                                    id="file-upload-input"
                                                    multiple
                                                    accept=".pdf,.txt,.doc,.docx,.md,.csv,.json"
                                                    onChange={(e) => handleFileSelect(e.target.files)}
                                                    style={{ display: 'none' }}
                                                />
                                                <MDBBtn
                                                    color="primary"
                                                    outline
                                                    onClick={() => document.getElementById('file-upload-input')?.click()}
                                                    className="d-flex align-items-center gap-2"
                                                >
                                                    <MDBIcon icon="upload" />
                                                    Upload Files (PDF, TXT, DOC, etc.)
                                                </MDBBtn>
                                                <small className="text-muted d-block mt-2">
                                                    Supported: PDF, TXT, DOC, DOCX, MD, CSV, JSON (Max 30MB per file, up to 50 files)
                                                </small>
                                            </div>
                                            
                                            {editingFiles.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 className="mb-2">Uploaded Files ({editingFiles.length})</h6>
                                                    <div className="d-flex flex-column gap-2">
                                                        {editingFiles.map((fileInfo) => (
                                                            <div
                                                                key={fileInfo.id}
                                                                className="d-flex align-items-center justify-content-between p-2 border rounded"
                                                                style={{
                                                                    backgroundColor: fileInfo.isUploading
                                                                        ? '#f0f9ff'
                                                                        : fileInfo.uploadError
                                                                        ? '#fef2f2'
                                                                        : fileInfo.fileId
                                                                        ? '#f0fdf4'
                                                                        : '#f9fafb',
                                                                }}
                                                            >
                                                                <div className="d-flex align-items-center gap-2 flex-grow-1">
                                                                    {fileInfo.isUploading ? (
                                                                        <div className="spinner-border spinner-border-sm text-info" role="status">
                                                                            <span className="visually-hidden">Loading...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <MDBIcon
                                                                            icon={
                                                                                fileInfo.uploadError
                                                                                    ? 'exclamation-triangle'
                                                                                    : 'check-circle'
                                                                            }
                                                                            className={
                                                                                fileInfo.uploadError
                                                                                    ? 'text-danger'
                                                                                    : 'text-success'
                                                                            }
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <div className="fw-semibold">{fileInfo.name}</div>
                                                                        <small className="text-muted">
                                                                            {formatFileSize(fileInfo.size || 0)}
                                                                            {fileInfo.isUploading && ' - Uploading...'}
                                                                            {fileInfo.uploadError && ` - Error: ${fileInfo.uploadError}`}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                                {!fileInfo.isExisting && (
                                                                    <MDBBtn
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveFile(fileInfo.id)}
                                                                        disabled={fileInfo.isUploading}
                                                                    >
                                                                        <MDBIcon icon="trash" />
                                                                    </MDBBtn>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                                
                                {/* QA Pairs Section */}
                                <MDBCol md="12" className="mb-4">
                                    <label className="form-label fw-bold">Question & Answer Pairs</label>
                                    <MDBCard className="border">
                                        <MDBCardBody>
                                            <div className="mb-3">
                                                <MDBInput
                                                    label="Question"
                                                    value={currentQAQuestion}
                                                    onChange={(e) => setCurrentQAQuestion(e.target.value)}
                                                    className="mb-2"
                                                />
                                                <MDBTextArea
                                                    label="Answer"
                                                    rows={3}
                                                    value={currentQAAnswer}
                                                    onChange={(e) => setCurrentQAAnswer(e.target.value)}
                                                    className="mb-2"
                                                />
                                                <MDBBtn
                                                    color="primary"
                                                    onClick={handleAddQA}
                                                    disabled={!currentQAQuestion.trim() || !currentQAAnswer.trim()}
                                                >
                                                    <MDBIcon icon="plus" className="me-2" />
                                                    Add QA Pair
                                                </MDBBtn>
                                            </div>
                                            
                                            {editingQAPairs.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 className="mb-2">QA Pairs ({editingQAPairs.length})</h6>
                                                    <div className="d-flex flex-column gap-3">
                                                        {editingQAPairs.map((qa) => (
                                                            <div
                                                                key={qa.id}
                                                                className="p-3 border rounded"
                                                                style={{ backgroundColor: '#f9fafb' }}
                                                            >
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div className="flex-grow-1">
                                                                        <div className="fw-semibold text-primary mb-1">
                                                                            <MDBIcon icon="question-circle" className="me-1" />
                                                                            {qa.question}
                                                                        </div>
                                                                        <div className="text-muted">
                                                                            <MDBIcon icon="check-circle" className="me-1" />
                                                                            {qa.answer}
                                                                        </div>
                                                                    </div>
                                                                    {!qa.isExisting && (
                                                                        <MDBBtn
                                                                            color="danger"
                                                                            size="sm"
                                                                            onClick={() => handleRemoveQA(qa.id)}
                                                                        >
                                                                            <MDBIcon icon="trash" />
                                                                        </MDBBtn>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                                
                                {/* Text Content Section */}
                                <MDBCol md="12" className="mb-4">
                                    <label className="form-label fw-bold">Text Content</label>
                                    <MDBCard className="border">
                                        <MDBCardBody>
                                            <div className="mb-3">
                                                <MDBTextArea
                                                    label="Add Text Content"
                                                    rows={4}
                                                    value={currentTextContent}
                                                    onChange={(e) => setCurrentTextContent(e.target.value)}
                                                    className="mb-2"
                                                    placeholder="Enter text content for training..."
                                                />
                                                <MDBBtn
                                                    color="primary"
                                                    onClick={handleAddText}
                                                    disabled={!currentTextContent.trim()}
                                                >
                                                    <MDBIcon icon="plus" className="me-2" />
                                                    Add Text
                                                </MDBBtn>
                                            </div>
                                            
                                            {editingTexts.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 className="mb-2">Text Contents ({editingTexts.length})</h6>
                                                    <div className="d-flex flex-column gap-2">
                                                        {editingTexts.map((textInfo, index) => (
                                                            <div
                                                                key={index}
                                                                className="d-flex align-items-start justify-content-between p-2 border rounded"
                                                                style={{ backgroundColor: '#f9fafb' }}
                                                            >
                                                                <div className="flex-grow-1">
                                                                    <small className="text-muted">
                                                                        {textInfo.content.substring(0, 150)}
                                                                        {textInfo.content.length > 150 ? '...' : ''}
                                                                    </small>
                                                                </div>
                                                                {!textInfo.isExisting && (
                                                                    <MDBBtn
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveText(index)}
                                                                    >
                                                                        <MDBIcon icon="trash" />
                                                                    </MDBBtn>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                                
                                {/* Website URLs Section */}
                                <MDBCol md="12" className="mb-4">
                                    <label className="form-label fw-bold">Website URLs</label>
                                    <MDBCard className="border">
                                        <MDBCardBody>
                                            <div className="mb-3">
                                                <MDBInput
                                                    label="Website URL"
                                                    type="url"
                                                    value={currentWebsiteUrl}
                                                    onChange={(e) => setCurrentWebsiteUrl(e.target.value)}
                                                    className="mb-2"
                                                    placeholder="https://example.com"
                                                />
                                                <MDBBtn
                                                    color="primary"
                                                    onClick={handleAddWebsite}
                                                    disabled={!currentWebsiteUrl.trim()}
                                                >
                                                    <MDBIcon icon="plus" className="me-2" />
                                                    Add Website
                                                </MDBBtn>
                                            </div>
                                            
                                            {editingWebsites.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 className="mb-2">Website URLs ({editingWebsites.length})</h6>
                                                    <div className="d-flex flex-column gap-2">
                                                        {editingWebsites.map((websiteInfo, index) => (
                                                            <div
                                                                key={index}
                                                                className="d-flex align-items-center justify-content-between p-2 border rounded"
                                                                style={{ backgroundColor: '#f9fafb' }}
                                                            >
                                                                <div className="flex-grow-1">
                                                                    <MDBIcon icon="link" className="me-2 text-primary" />
                                                                    <a href={websiteInfo.url} target="_blank" rel="noopener noreferrer">
                                                                        {websiteInfo.url}
                                                                    </a>
                                                                </div>
                                                                {!websiteInfo.isExisting && (
                                                                    <MDBBtn
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveWebsite(index)}
                                                                    >
                                                                        <MDBIcon icon="trash" />
                                                                    </MDBBtn>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                            </>
                        )}

                        <MDBCol md="6" className="mb-3">
                            <label className="form-label">Created At</label>
                            <p className="mb-0">
                                {new Date(chatbot.createdAt).toLocaleString()}
                            </p>
                        </MDBCol>

                        <MDBCol md="6" className="mb-3">
                            <label className="form-label">Created By</label>
                            <p className="mb-0">{chatbot.createdBy || 'N/A'}</p>
                        </MDBCol>

                        <MDBCol md="6" className="mb-3">
                            <label className="form-label d-flex align-items-center justify-content-between">
                                <span>Embed Width (px)</span>
                                {!isEditing && (
                                    <span className="text-muted small">Live preview updates instantly</span>
                                )}
                            </label>
                            <div className="d-flex align-items-center gap-3">
                                <input
                                    type="range"
                                    min={240}
                                    max={1024}
                                    value={previewWidth}
                                    onChange={(e) => handlePreviewWidthChange(Number(e.target.value))}
                                    disabled={!isEditing}
                                    style={{ flex: 1 }}
                                />
                                {isEditing ? (
                                    <MDBInput
                                        type="number"
                                        min={240}
                                        max={1024}
                                        value={previewWidth}
                                        onChange={(e) => handlePreviewWidthChange(Number(e.target.value))}
                                        style={{ maxWidth: '120px' }}
                                    />
                                ) : (
                                    <p className="mb-0">{previewWidth}px</p>
                                )}
                            </div>
                        </MDBCol>

                        <MDBCol md="6" className="mb-3">
                            <label className="form-label d-flex align-items-center justify-content-between">
                                <span>Embed Height (px)</span>
                                {!isEditing && (
                                    <span className="text-muted small">Adjust the widget size to match your site</span>
                                )}
                            </label>
                            <div className="d-flex align-items-center gap-3">
                                <input
                                    type="range"
                                    min={240}
                                    max={1024}
                                    value={previewHeight}
                                    onChange={(e) => handlePreviewHeightChange(Number(e.target.value))}
                                    disabled={!isEditing}
                                    style={{ flex: 1 }}
                                />
                                {isEditing ? (
                                    <MDBInput
                                        type="number"
                                        min={240}
                                        max={1024}
                                        value={previewHeight}
                                        onChange={(e) => handlePreviewHeightChange(Number(e.target.value))}
                                        style={{ maxWidth: '120px' }}
                                    />
                                ) : (
                                    <p className="mb-0">{previewHeight}px</p>
                                )}
                            </div>
                        </MDBCol>
                    </MDBRow>
                </MDBCardBody>
            </MDBCard>

            {/* Embed & Integration Section */}
            <MDBCard className="mt-4">
                <MDBCardBody className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">Embed & Integration</h4>
                        <MDBIcon icon="puzzle-piece" className="text-primary" size="2x" />
                    </div>
                    <p className="text-muted mb-4">
                        Integrate your chatbot into websites and communication channels. Configure embed codes and connect to messaging platforms.
                    </p>

                    <div className="row g-4">
                        {/* Website Widget Embed */}
                        <MDBCol md="6">
                            <div className="border rounded p-4 h-100" style={{ backgroundColor: '#f8f9fa' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <MDBIcon icon="globe" size="2x" className="text-primary me-3" />
                                    <h5 className="mb-0">Website Widget</h5>
                                </div>
                                <p className="text-muted small mb-3">
                                    Embed your chatbot as a chat widget on your website. Visitors can interact with your chatbot directly from your site.
                                </p>
                                <div className="d-flex flex-column gap-2">
                                    <MDBBtn 
                                        color="primary" 
                                        outline
                                        className="d-flex align-items-center gap-2"
                                        onClick={() => setShowEmbedCode((prev) => !prev)}
                                    >
                                        <MDBIcon icon="code" />
                                        {showEmbedCode ? 'Hide Embed Code' : 'Show Embed Code'}
                                    </MDBBtn>
                                    {showEmbedCode && (
                                        <div className="position-relative">
                                            <pre
                                                className="p-3 rounded"
                                                style={{
                                                    backgroundColor: '#0f172a',
                                                    color: '#e2e8f0',
                                                    fontSize: '12px',
                                                    lineHeight: 1.6,
                                                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget-dist/chat-widget.iife.js"></script>
<script>
  window.initChatWidget({
    chatbotId: "${chatbotId}",
    apiUrl: "${process.env.NEXT_PUBLIC_BACKEND_URL || ''}",
    width: ${(isEditing ? editedChatbot?.width : chatbot?.width) ?? 380},
    height: ${(isEditing ? editedChatbot?.height : chatbot?.height) ?? 600}
  });
</script>`}
                                            </pre>
                                            <MDBBtn
                                                color="primary"
                                                size="sm"
                                                className="d-flex align-items-center gap-2 position-absolute"
                                                style={{ top: '12px', right: '12px' }}
                                                onClick={async () => {
                                                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                                    const width = (isEditing ? editedChatbot?.width : chatbot?.width) ?? 380;
                                                    const height = (isEditing ? editedChatbot?.height : chatbot?.height) ?? 600;
                                                    const embedCode = `<script src="${origin}/widget-dist/chat-widget.iife.js"></script>
<script>
  window.initChatWidget({
    chatbotId: "${chatbotId}",
    apiUrl: "${process.env.NEXT_PUBLIC_BACKEND_URL || ''}",
    width: ${width},
    height: ${height}
  });
</script>`;
                                                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                                        try {
                                                            await navigator.clipboard.writeText(embedCode);
                                                            setCopyStatus('copied');
                                                            setTimeout(() => setCopyStatus('idle'), 2000);
                                                        } catch (error) {
                                                            console.error('Failed to copy embed code:', error);
                                                            setCopyStatus('error');
                                                        }
                                                    } else {
                                                        setCopyStatus('error');
                                                    }
                                                }}
                                            >
                                                <MDBIcon icon={copyStatus === 'copied' ? 'check' : 'copy'} />
                                                {copyStatus === 'copied'
                                                    ? 'Copied'
                                                    : copyStatus === 'error'
                                                        ? 'Copy Failed'
                                                        : 'Copy'}
                                            </MDBBtn>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </MDBCol>

                        {/* API Integration */}
                        <MDBCol md="6">
                            <div className="border rounded p-4 h-100" style={{ backgroundColor: '#f8f9fa' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <MDBIcon icon="plug" size="2x" className="text-success me-3" />
                                    <h5 className="mb-0">API Integration</h5>
                                </div>
                                <p className="text-muted small mb-3">
                                    Use our REST API to integrate your chatbot into custom applications and workflows.
                                </p>
                                <MDBBtn 
                                    color="success" 
                                    outline
                                    onClick={() => {
                                        const apiInfo = `API Endpoint: ${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/api/chatbot/${chatbotId}/chat
Method: POST
Headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_TOKEN" }
Body: { "message": "Hello", "sessionId": "optional" }`;
                                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                            navigator.clipboard.writeText(apiInfo).then(() => {
                                                setShowApiCopyTooltip(true);
                                                setTimeout(() => setShowApiCopyTooltip(false), 3000);
                                            }).catch(() => {
                                                alert('Failed to copy API info. Please select and copy manually.');
                                            });
                                        } else {
                                            alert('Clipboard API not available. Please copy the API information manually.');
                                        }
                                    }}
                                >
                                    <MDBIcon icon="key" className="me-2" />
                                    Get API Info
                                </MDBBtn>
                                
                                {/* Google Calendar Integration */}
                                <div className="mt-4 pt-4 border-top">
                                    <div className="d-flex align-items-center mb-2">
                                        <MDBIcon icon="calendar-alt" className="text-primary me-2" />
                                        <h6 className="mb-0">Google Calendar</h6>
                                        {isCheckingGoogleCalendar && (
                                            <span className="ms-2 spinner-border spinner-border-sm text-muted" />
                                        )}
                                    </div>
                                    <p className="text-muted small mb-3">
                                        Connect your Google Calendar to allow the chatbot to schedule meetings with consumers.
                                    </p>
                                    {googleCalendarConnected ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <MDBBadge color="success" className="d-flex align-items-center">
                                                <MDBIcon icon="check-circle" className="me-1" />
                                                Connected
                                            </MDBBadge>
                                            <MDBBtn
                                                color="danger"
                                                size="sm"
                                                outline
                                                onClick={disconnectGoogleCalendar}
                                            >
                                                Disconnect
                                            </MDBBtn>
                                        </div>
                                    ) : (
                                        <MDBBtn
                                            color="primary"
                                            outline
                                            onClick={initiateGoogleCalendarAuth}
                                            disabled={isConnectingGoogleCalendar}
                                        >
                                            {isConnectingGoogleCalendar ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <MDBIcon icon="calendar-plus" className="me-2" />
                                                    Connect Google Calendar
                                                </>
                                            )}
                                        </MDBBtn>
                                    )}
                                </div>
                            </div>
                        </MDBCol>

                        {/* WhatsApp Integration */}
                        <MDBCol md="4">
                            <div
                                className="border rounded-4 p-4 h-100"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    border: chatbot?.enableWhatsappIntegration ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #E5E7EB',
                                    boxShadow: chatbot?.enableWhatsappIntegration ? '0 15px 30px rgba(34, 197, 94, 0.08)' : 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '14px',
                                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#22C55E',
                                            }}
                                        >
                                            <MDBIcon icon="whatsapp" />
                                        </div>
                                        <div>
                                            <h6 className="mb-1" style={{ fontWeight: 600, color: '#111827' }}>WhatsApp</h6>
                                            <p className="text-muted small mb-0">Connect to WhatsApp Business</p>
                                        </div>
                                    </div>
                                    <MDBSwitch 
                                        id="whatsapp" 
                                        label=""
                                        checked={!!chatbot?.enableWhatsappIntegration}
                                        onChange={async (e) => {
                                            const enabled = e.target.checked;
                                            
                                            // If enabling and no integration exists, open the modal first
                                            if (enabled && !whatsappIntegration) {
                                                setTimeout(() => setShowWhatsappModal(true), 120);
                                                // Don't toggle until integration is set up
                                                return;
                                            }
                                            
                                            // Optimistically update UI
                                            setEditedChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: enabled } : prev);
                                            setChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: enabled } : prev);
                                            
                                            // Call backend API to toggle integration
                                            try {
                                                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                                                const headers: Record<string, string> = {
                                                    'Content-Type': 'application/json',
                                                };

                                                if (getToken) {
                                                    try {
                                                        const token = await getToken();
                                                        if (token) {
                                                            headers['Authorization'] = `Bearer ${token}`;
                                                        }
                                                    } catch (error) {
                                                        console.error('Failed to get auth token:', error);
                                                    }
                                                }

                                                const response = await fetch(`${backendUrl}/v1/api/chatbot/whatsapp/${chatbotId}/toggle?enabled=${enabled}`, {
                                                    method: 'PUT',
                                                    headers,
                                                });

                                                if (!response.ok) {
                                                    // Revert on error
                                                    setEditedChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: !enabled } : prev);
                                                    setChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: !enabled } : prev);
                                                    
                                                    const errorData = await response.json().catch(() => ({}));
                                                    const errorMessage = errorData.message || errorData.errorMessage || 'Failed to toggle WhatsApp integration';
                                                    alert(errorMessage);
                                                    return;
                                                }

                                                const result = await response.json();
                                                console.log('WhatsApp integration toggled:', result);
                                                
                                                // Refresh integration data to get updated enabled status
                                                await fetchWhatsappIntegration();
                                            } catch (error) {
                                                console.error('Error toggling WhatsApp integration:', error);
                                                // Revert on error
                                                setEditedChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: !enabled } : prev);
                                                setChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: !enabled } : prev);
                                                alert('An error occurred while toggling the WhatsApp integration. Please try again.');
                                            }
                                        }}
                                    />
                                </div>
                                <div className="mt-3">
                                    <div className="mb-3 small" style={{ color: '#475569' }}>
                                        {chatbot?.enableWhatsappIntegration
                                            ? 'WhatsApp Business integration is active. Configure advanced settings via WhatsApp Channel.'
                                            : 'Toggle to enable WhatsApp Business integration for this chatbot.'}
                                    </div>
                                    <MDBBtn
                                        disabled={!chatbot?.enableWhatsappIntegration}
                                        color="success"
                                        outline={!chatbot?.enableWhatsappIntegration}
                                        onClick={handleOpenWhatsappModal}
                                        style={{
                                            borderRadius: '999px',
                                            fontWeight: 600,
                                            width: '100%',
                                        }}
                                    >
                                        Manage WhatsApp Channel
                                    </MDBBtn>
                                </div>
                            </div>
                        </MDBCol>

                        {/* Facebook Messenger Integration */}
                        <MDBCol md="4">
                            <div
                                className="border rounded-4 p-4 h-100"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    border: chatbot?.enableFacebookIntegration ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #E5E7EB',
                                    boxShadow: chatbot?.enableFacebookIntegration ? '0 15px 30px rgba(59, 130, 246, 0.12)' : 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '14px',
                                                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#3B82F6',
                                            }}
                                        >
                                            <MDBIcon icon="facebook" />
                                        </div>
                                        <div>
                                            <h6 className="mb-1" style={{ fontWeight: 600, color: '#111827' }}>Facebook Messenger</h6>
                                            <p className="text-muted small mb-0">Engage customers via Messenger</p>
                                        </div>
                                    </div>
                                    <MDBSwitch 
                                        id="facebook" 
                                        label=""
                                        checked={!!chatbot?.enableFacebookIntegration}
                                        onChange={async (e) => {
                                            const enabled = e.target.checked;
                                            
                                            // If enabling and no integration exists, open the modal first
                                            if (enabled && !messengerIntegration) {
                                                setTimeout(() => setShowFacebookModal(true), 120);
                                                // Don't toggle until integration is set up
                                                return;
                                            }
                                            
                                            // Optimistically update UI
                                            setEditedChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: enabled } : prev);
                                            setChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: enabled } : prev);
                                            
                                            // Call backend API to toggle integration
                                            try {
                                                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                                                const headers: Record<string, string> = {
                                                    'Content-Type': 'application/json',
                                                };

                                                if (getToken) {
                                                    try {
                                                        const token = await getToken();
                                                        if (token) {
                                                            headers['Authorization'] = `Bearer ${token}`;
                                                        }
                                                    } catch (error) {
                                                        console.error('Failed to get auth token:', error);
                                                    }
                                                }

                                                const response = await fetch(`${backendUrl}/v1/api/chatbot/messenger/${chatbotId}/toggle?enabled=${enabled}`, {
                                                    method: 'PUT',
                                                    headers,
                                                });

                                                if (!response.ok) {
                                                    // Revert on error
                                                    setEditedChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: !enabled } : prev);
                                                    setChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: !enabled } : prev);
                                                    
                                                    const errorData = await response.json().catch(() => ({}));
                                                    const errorMessage = errorData.message || errorData.errorMessage || 'Failed to toggle Facebook integration';
                                                    alert(errorMessage);
                                                    return;
                                                }

                                                const result = await response.json();
                                                console.log('Facebook integration toggled:', result);
                                                
                                                // Refresh integration data to get updated enabled status
                                                await fetchMessengerIntegration();
                                            } catch (error) {
                                                console.error('Error toggling Facebook integration:', error);
                                                // Revert on error
                                                setEditedChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: !enabled } : prev);
                                                setChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: !enabled } : prev);
                                                alert('An error occurred while toggling the Facebook integration. Please try again.');
                                            }
                                        }}
                                    />
                                </div>
                                <div className="mt-3">
                                    <div className="mb-3 small" style={{ color: '#475569' }}>
                                        {chatbot?.enableFacebookIntegration
                                            ? 'Facebook Messenger integration is active. Manage webhook and page credentials below.'
                                            : 'Toggle to connect your Facebook page for Messenger automation.'}
                                    </div>
                                    <MDBBtn
                                        disabled={!chatbot?.enableFacebookIntegration}
                                        color="primary"
                                        outline={!chatbot?.enableFacebookIntegration}
                                      onClick={handleOpenFacebookModal}
                                        style={{
                                            borderRadius: '999px',
                                            fontWeight: 600,
                                            width: '100%',
                                        }}
                                    >
                                        Manage Messenger Channel
                                    </MDBBtn>
                                </div>
                            </div>
                        </MDBCol>

                        {/* Website Integration */}
                        <MDBCol md="4">
                            <div className="border rounded p-3 text-center h-100" style={{ backgroundColor: '#f8f9fa' }}>
                                <MDBIcon icon="home" size="2x" className="text-info mb-2" />
                                <h6>Website</h6>
                                <p className="text-muted small mb-3">Enable website integration</p>
                                <MDBSwitch 
                                    id="website" 
                                    label="Enable"
                                    checked={true}
                                />
                            </div>
                        </MDBCol>
                    </div>
                </MDBCardBody>
            </MDBCard>
            </MDBContainer>
            </div>
            
            {renderKnowledgeModal()}
            <MDBModal open={showWhatsappModal} setOpen={setShowWhatsappModal} tabIndex='-1'>
                <MDBModalDialog size='lg'>
                    <MDBModalContent>
                        <MDBModalHeader className="border-0 pb-0">
                            <div>
                                <MDBModalTitle className="fs-4">WhatsApp API Setup</MDBModalTitle>
                                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                                    Configure your WhatsApp Business API credentials to enable WhatsApp integration for your chatbot.
                                </p>
                            </div>
                            <MDBBtn className="btn-close" color="none" onClick={handleCloseWhatsappModal}></MDBBtn>
                        </MDBModalHeader>
                        <MDBModalBody className="pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <MDBRow className="g-4">
                                        <MDBCol md="6">
                                            <label className="form-label fw-semibold">
                                                WhatsApp Name <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                placeholder="Enter a name for this configuration..."
                                                value={whatsappForm.name}
                                                onChange={(e) => handleWhatsappInputChange('name', e.target.value)}
                                                className={whatsappErrors.name ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                A friendly name to identify this WhatsApp configuration.
                                            </small>
                                            {whatsappErrors.name && (
                                                <div className="invalid-feedback">{whatsappErrors.name}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="6">
                                            <label className="form-label fw-semibold">
                                                Business Account ID <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                placeholder="Enter Business Account ID..."
                                                value={whatsappForm.businessAccountId}
                                                onChange={(e) => handleWhatsappInputChange('businessAccountId', e.target.value)}
                                                className={whatsappErrors.businessAccountId ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                Your WhatsApp Business Account ID from Meta Business Suite.
                                            </small>
                                            {whatsappErrors.businessAccountId && (
                                                <div className="invalid-feedback d-block">{whatsappErrors.businessAccountId}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="6">
                                            <label className="form-label fw-semibold">
                                                App ID <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                placeholder="Enter App ID..."
                                                value={whatsappForm.appId}
                                                onChange={(e) => handleWhatsappInputChange('appId', e.target.value)}
                                                className={whatsappErrors.appId ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                Your WhatsApp App ID from Meta Developer Console.
                                            </small>
                                            {whatsappErrors.appId && (
                                                <div className="invalid-feedback d-block">{whatsappErrors.appId}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="6">
                                            <label className="form-label fw-semibold">
                                                App Secret
                                            </label>
                                            <MDBInput
                                                type="password"
                                                placeholder="Enter App Secret (optional)..."
                                                value={whatsappForm.appSecret}
                                                onChange={(e) => handleWhatsappInputChange('appSecret', e.target.value)}
                                                className={whatsappErrors.appSecret ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                Your WhatsApp App Secret for additional security (optional).
                                            </small>
                                            {whatsappErrors.appSecret && (
                                                <div className="invalid-feedback d-block">{whatsappErrors.appSecret}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="6">
                                            <label className="form-label fw-semibold">
                                                Phone Number ID <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                placeholder="Enter digits only..."
                                                value={whatsappForm.phoneNumberId}
                                                onChange={(e) => handleWhatsappInputChange('phoneNumberId', e.target.value)}
                                                className={whatsappErrors.phoneNumberId ? 'is-invalid' : ''}
                                            />
                                            <small className={whatsappErrors.phoneNumberId ? 'text-danger' : 'text-muted'}>
                                                Phone Number ID should contain only digits.
                                            </small>
                                            {whatsappErrors.phoneNumberId && (
                                                <div className="invalid-feedback d-block">{whatsappErrors.phoneNumberId}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="6">
                                            <label className="form-label fw-semibold">
                                                Phone Number <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                placeholder="e.g., +1234567890"
                                                value={whatsappForm.phoneNumber}
                                                onChange={(e) => handleWhatsappInputChange('phoneNumber', e.target.value)}
                                                className={whatsappErrors.phoneNumber ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                The actual WhatsApp phone number in international format.
                                            </small>
                                            {whatsappErrors.phoneNumber && (
                                                <div className="invalid-feedback d-block">{whatsappErrors.phoneNumber}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="12">
                                            <label className="form-label fw-semibold">
                                                Access Token <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                type="password"
                                                placeholder="Enter access token..."
                                                value={whatsappForm.accessToken}
                                                onChange={(e) => handleWhatsappInputChange('accessToken', e.target.value)}
                                                className={whatsappErrors.accessToken ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                Your permanent access token from Facebook Developer Console.
                                            </small>
                                            {whatsappErrors.accessToken && (
                                                <div className="invalid-feedback d-block">{whatsappErrors.accessToken}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="12">
                                            <label className="form-label fw-semibold">
                                                Webhook URL
                                            </label>
                                            <MDBInput
                                                placeholder="https://your-domain.com/webhook/whatsapp"
                                                value={whatsappForm.webhookUrl}
                                                onChange={(e) => handleWhatsappInputChange('webhookUrl', e.target.value)}
                                                className={whatsappErrors.webhookUrl ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                The URL where WhatsApp will send incoming messages (optional, can be configured later).
                                            </small>
                                            {whatsappErrors.webhookUrl && (
                                                <div className="invalid-feedback d-block">{whatsappErrors.webhookUrl}</div>
                                            )}
                                        </MDBCol>
                                        <MDBCol md="12">
                                            <label className="form-label fw-semibold">
                                                Webhook Verify Token <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                placeholder="Enter webhook verify token..."
                                                value={whatsappForm.webhookVerifyToken}
                                                onChange={(e) => handleWhatsappInputChange('webhookVerifyToken', e.target.value)}
                                                className={whatsappErrors.webhookVerifyToken ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                A secure token for webhook verification. This must match the token configured in Meta Developer Console.
                                            </small>
                                            {whatsappErrors.webhookVerifyToken && (
                                                <div className="invalid-feedback d-block">
                                                    {whatsappErrors.webhookVerifyToken}
                                                </div>
                                            )}
                                        </MDBCol>
                                    </MDBRow>

                                    <div
                                        className="mt-4 p-4 rounded"
                                        style={{
                                            background: '#F8FAFC',
                                            border: '1px solid #E2E8F0',
                                        }}
                                    >
                                        <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2">
                                            <MDBIcon icon="vial" className="text-primary" />
                                            Configuration Test
                                        </h6>
                                        <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                                            Test your credentials before saving the configuration.
                                        </p>
                                        <div className="d-flex align-items-center gap-3">
                                            <MDBBtn
                                                color="dark"
                                                style={{ borderRadius: '999px', padding: '10px 24px' }}
                                                onClick={handleTestWhatsappConfiguration}
                                                disabled={isTestingWhatsapp}
                                            >
                                                {isTestingWhatsapp ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Testing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MDBIcon icon="flask" className="me-2" />
                                                        Test Configuration
                                                    </>
                                                )}
                                            </MDBBtn>
                                            {whatsappTestResult === 'success' && (
                                                <span className="text-success d-flex align-items-center gap-2">
                                                    <MDBIcon icon="check-circle" />
                                                    Connection successful
                                                </span>
                                            )}
                                            {whatsappTestResult === 'error' && (
                                                <span className="text-danger d-flex align-items-center gap-2">
                                                    <MDBIcon icon="times-circle" />
                                                    Test failed. Check your credentials.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                        </MDBModalBody>
                        <MDBModalFooter className="border-0">
                            <MDBBtn color="secondary" outline onClick={handleCloseWhatsappModal}>
                                Cancel
                            </MDBBtn>
                            <MDBBtn
                                color="primary"
                                style={{ minWidth: '160px' }}
                                onClick={handleSaveWhatsappConfiguration}
                                disabled={isSavingWhatsapp}
                            >
                                {isSavingWhatsapp ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <MDBIcon icon="plus" className="me-2" />
                                        Add Channel
                                    </>
                                )}
                            </MDBBtn>
                        </MDBModalFooter>
                    </MDBModalContent>
                </MDBModalDialog>
            </MDBModal>
            <MDBModal open={showFacebookModal} setOpen={setShowFacebookModal} tabIndex='-1'>
                <MDBModalDialog size='lg'>
                    <MDBModalContent>
                        <MDBModalHeader className="border-0 pb-0">
                            <div>
                                <MDBModalTitle className="fs-4">Facebook Messenger Setup</MDBModalTitle>
                                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                                    Configure your Facebook page credentials to enable Messenger conversations for this chatbot.
                                </p>
                            </div>
                            <MDBBtn className="btn-close" color="none" onClick={handleCloseFacebookModal}></MDBBtn>
                        </MDBModalHeader>
                        <MDBModalBody className="pt-2">
                            <MDBRow className="g-4">
                                <MDBCol md="6">
                                    <label className="form-label fw-semibold">
                                        Page Name <span className="text-danger">*</span>
                                    </label>
                                    <MDBInput
                                        placeholder="Enter Facebook page name..."
                                        value={facebookForm.pageName}
                                        onChange={(e) =>
                                            setFacebookForm((prev) => ({ ...prev, pageName: e.target.value }))
                                        }
                                        className={facebookErrors.pageName ? 'is-invalid' : ''}
                                    />
                                    <small className="text-muted">
                                        A friendly name to identify this integration.
                                    </small>
                                    {facebookErrors.pageName && (
                                        <div className="invalid-feedback d-block">{facebookErrors.pageName}</div>
                                    )}
                                </MDBCol>
                                <MDBCol md="6">
                                    <label className="form-label fw-semibold">
                                        Page ID <span className="text-danger">*</span>
                                    </label>
                                    <MDBInput
                                        placeholder="Enter Facebook page ID..."
                                        value={facebookForm.pageId}
                                        onChange={(e) =>
                                            setFacebookForm((prev) => ({ ...prev, pageId: e.target.value }))
                                        }
                                        className={facebookErrors.pageId ? 'is-invalid' : ''}
                                    />
                                    <small className="text-muted">
                                        You can find this in your Facebook Page settings.
                                    </small>
                                    {facebookErrors.pageId && (
                                        <div className="invalid-feedback d-block">{facebookErrors.pageId}</div>
                                    )}
                                </MDBCol>
                                <MDBCol md="12">
                                    <label className="form-label fw-semibold">
                                        Page Access Token <span className="text-danger">*</span>
                                    </label>
                                    <MDBInput
                                        type="password"
                                        placeholder="Enter page access token..."
                                        value={facebookForm.accessToken}
                                        onChange={(e) =>
                                            setFacebookForm((prev) => ({ ...prev, accessToken: e.target.value }))
                                        }
                                        className={facebookErrors.accessToken ? 'is-invalid' : ''}
                                    />
                                    <small className="text-muted">
                                        Generate a long-lived token from Meta Developer Console.
                                    </small>
                                    {facebookErrors.accessToken && (
                                        <div className="invalid-feedback d-block">{facebookErrors.accessToken}</div>
                                    )}
                                </MDBCol>
                                <MDBCol md="12">
                                    <label className="form-label fw-semibold">
                                        Verify Token <span className="text-danger">*</span>
                                    </label>
                                    <MDBInput
                                        placeholder="Enter webhook verify token..."
                                        value={facebookForm.verifyToken}
                                        onChange={(e) =>
                                            setFacebookForm((prev) => ({ ...prev, verifyToken: e.target.value }))
                                        }
                                        className={facebookErrors.verifyToken ? 'is-invalid' : ''}
                                    />
                                    <small className="text-muted">
                                        Used by Facebook to verify webhook ownership.
                                    </small>
                                    {facebookErrors.verifyToken && (
                                        <div className="invalid-feedback d-block">{facebookErrors.verifyToken}</div>
                                    )}
                                </MDBCol>
                            </MDBRow>

                            <div
                                className="mt-4 p-4 rounded"
                                style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2">
                                    <MDBIcon icon="vial" className="text-primary" />
                                    Configuration Test
                                </h6>
                                <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                                    Test your credentials before saving the configuration.
                                </p>
                                <div className="d-flex align-items-center gap-3">
                                    <MDBBtn
                                        color="primary"
                                        style={{ borderRadius: '999px', padding: '10px 24px' }}
                                        onClick={handleTestFacebookConfiguration}
                                        disabled={isTestingFacebook}
                                    >
                                        {isTestingFacebook ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <MDBIcon icon="flask" className="me-2" />
                                                Test Configuration
                                            </>
                                        )}
                                    </MDBBtn>
                                    {facebookTestResult === 'success' && (
                                        <span className="text-success d-flex align-items-center gap-2">
                                            <MDBIcon icon="check-circle" />
                                            Connection successful
                                        </span>
                                    )}
                                    {facebookTestResult === 'error' && (
                                        <span className="text-danger d-flex align-items-center gap-2">
                                            <MDBIcon icon="times-circle" />
                                            Test failed. Check your credentials.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </MDBModalBody>
                        <MDBModalFooter className="border-0">
                            <MDBBtn color="secondary" outline onClick={handleCloseFacebookModal}>
                                Cancel
                            </MDBBtn>
                            <MDBBtn
                                color="primary"
                                style={{ minWidth: '160px' }}
                                onClick={handleSaveFacebookConfiguration}
                                disabled={isSavingFacebook}
                            >
                                {isSavingFacebook ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <MDBIcon icon="plus" className="me-2" />
                                        Add Channel
                                    </>
                                )}
                            </MDBBtn>
                        </MDBModalFooter>
                    </MDBModalContent>
                </MDBModalDialog>
            </MDBModal>
            
            {/* API Copy Tooltip */}
            {showApiCopyTooltip && (
                <div
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: showApiCopyTooltip ? 1 : 0,
                        transform: showApiCopyTooltip ? 'translateY(0)' : 'translateY(-10px)',
                        transition: 'opacity 0.3s ease-in, transform 0.3s ease-in',
                    }}
                >
                    <MDBIcon icon="check-circle" className="me-2" />
                    <span>API information copied to clipboard!</span>
                </div>
            )}
            
            {isConversationDrawerOpen && (
                <div className="conversation-drawer-overlay" onClick={handleCloseConversationDrawer} aria-hidden="true"></div>
            )}
            <aside className={`conversation-drawer ${isConversationDrawerOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div>
                        <h4>{conversationDrawerMode === 'history' ? 'Conversation History' : 'Start New Conversation'}</h4>
                        <p>
                            {conversationDrawerMode === 'history'
                                ? 'Review recent user chats for this bot.'
                                : 'Capture context before connecting a user to the assistant.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="drawer-close"
                        onClick={handleCloseConversationDrawer}
                        aria-label="Close conversation drawer"
                    >
                        ×
                    </button>
                </div>

                {conversationDrawerMode === 'history' ? (
                    selectedConversationId ? (
                        <div className="drawer-conversation">
                            <div className="conversation-header">
                                <button 
                                    className="conversation-back-btn"
                                    onClick={handleBackToConversations}
                                    aria-label="Back to conversations"
                                >
                                    <MDBIcon icon="arrow-left" className="me-2" />
                                    Back
                                </button>
                                <h5 className="conversation-title">
                                    {conversations.find(c => c.id === selectedConversationId)?.title || 'Conversation'}
                                </h5>
                            </div>
                            <div className="conversation-messages">
                                {isLoadingMessages ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-3">Loading messages...</p>
                                    </div>
                                ) : conversationMessages.length === 0 ? (
                                    <div className="text-center py-5">
                                        <MDBIcon icon="comment-slash" className="text-muted" style={{ fontSize: '48px', opacity: 0.5 }} />
                                        <p className="text-muted mt-3">No messages found</p>
                                    </div>
                                ) : (
                                    conversationMessages.map((message) => {
                                        const isUser = message.role === 'user';
                                        const hasHTML = containsHTML(message.content);
                                        return (
                                            <div key={message.id} className={`conversation-message ${isUser ? 'message-user' : 'message-assistant'}`}>
                                                <div 
                                                    className={`message-content ${hasHTML ? 'message-html' : ''}`}
                                                    {...(hasHTML ? {
                                                        dangerouslySetInnerHTML: { __html: message.content }
                                                    } : {})}
                                                >
                                                    {!hasHTML && message.content}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="drawer-history">
                            <div className="history-toolbar">
                                <div className="history-search">
                                    <MDBIcon icon="search" className="me-2 text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={conversationSearchTerm}
                                        onChange={(e) => handleConversationSearch(e.target.value)}
                                    />
                                </div>
                                <span className="history-count">{filteredConversations.length} results</span>
                            </div>
                            <div className="history-list">
                                {isLoadingConversations ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-3">Loading conversations...</p>
                                    </div>
                                ) : filteredConversations.length === 0 ? (
                                    <div className="text-center py-5">
                                        <MDBIcon icon="inbox" className="text-muted" style={{ fontSize: '48px', opacity: 0.5 }} />
                                        <p className="text-muted mt-3">No conversations found</p>
                                    </div>
                                ) : (
                                    filteredConversations.map((conversation) => (
                                        <div 
                                            key={conversation.id} 
                                            className="history-card"
                                            onClick={() => handleConversationClick(conversation.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="history-card-icon">
                                                <MDBIcon icon="robot" className="text-primary" />
                                            </div>
                                            <div>
                                                <h5>{conversation.title}</h5>
                                                <p>{conversation.preview}</p>
                                            </div>
                                            <div className="history-meta">
                                                <span>{conversation.updatedAt}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                ) : (
                    <form className="drawer-form" onSubmit={handleCreateConversation}>
                        <label>
                            Customer Name
                            <input
                                type="text"
                                placeholder="Jane Doe"
                                value={newConversationForm.customerName}
                                onChange={(e) => handleConversationFormChange('customerName', e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Conversation Topic
                            <input
                                type="text"
                                placeholder="What is the conversation about?"
                                value={newConversationForm.topic}
                                onChange={(e) => handleConversationFormChange('topic', e.target.value)}
                                required
                            />
                        </label>
                        <div className="drawer-form-row">
                            <label>
                                Channel
                                <select
                                    value={newConversationForm.channel}
                                    onChange={(e) => handleConversationFormChange('channel', e.target.value)}
                                >
                                    <option>Website widget</option>
                                    <option>WhatsApp</option>
                                    <option>Facebook Messenger</option>
                                    <option>Email</option>
                                </select>
                            </label>
                            <label>
                                Priority
                                <select
                                    value={newConversationForm.priority}
                                    onChange={(e) => handleConversationFormChange('priority', e.target.value)}
                                >
                                    <option>Urgent</option>
                                    <option>High</option>
                                    <option>Normal</option>
                                    <option>Low</option>
                                </select>
                            </label>
                        </div>
                        <label>
                            Initial Message
                            <textarea
                                rows={4}
                                placeholder="Write the opening message that will greet the user..."
                                value={newConversationForm.message}
                                onChange={(e) => handleConversationFormChange('message', e.target.value)}
                                required
                            />
                        </label>
                        <button type="submit" className="drawer-submit">
                            Launch Conversation
                        </button>
                    </form>
                )}
            </aside>
            <style jsx>{`
                .full-height-layout {
                    display: flex;
                    width: 100%;
                    height: 100vh;
                    position: relative;
                    background-color: #F8F9FA;
                }
                
                .main-content {
                    flex: 1;
                    margin-left: 280px;
                    padding: 2rem;
                    min-height: 100vh;
                    background-color: #ffffff;
                    transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow-x: hidden;
                    position: relative;
                    z-index: 1;
                }
                
                .main-content.collapsed {
                    margin-left: 60px;
                }
                
                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 0;
                        padding: 1rem;
                    }
                    .conversation-drawer {
                        width: 100%;
                        right: ${isConversationDrawerOpen ? '0' : '-100%'};
                    }
                }

                .conversation-drawer-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: 990;
                }

                .conversation-drawer {
                    position: fixed;
                    top: 0;
                    right: -420px;
                    width: 420px;
                    height: 100%;
                    background: #ffffff;
                    border-left: 1px solid rgba(226, 232, 240, 0.9);
                    box-shadow: -24px 0 48px rgba(15, 23, 42, 0.08);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 28px;
                    transition: right 0.3s ease;
                }

                .conversation-drawer.open {
                    right: 0;
                }

                .drawer-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    align-items: flex-start;
                }

                .drawer-header h4 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: #0f172a;
                }

                .drawer-header p {
                    margin: 6px 0 0;
                    font-size: 14px;
                    color: #64748b;
                }

                .drawer-close {
                    border: none;
                    background: rgba(148, 163, 184, 0.2);
                    color: #0f172a;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 18px;
                    cursor: pointer;
                }

                .drawer-history {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    flex: 1;
                }

                .history-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }

                .history-search {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    border-radius: 12px;
                    background: #f8fafc;
                    border: 1px solid rgba(226, 232, 240, 0.9);
                }

                .history-search input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 14px;
                    color: #0f172a;
                }

                .history-count {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 600;
                }

                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    overflow-y: auto;
                }

                .history-card {
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    padding: 16px;
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    gap: 14px;
                    box-shadow: 0 16px 28px rgba(15, 23, 42, 0.05);
                    background: #ffffff;
                }

                .history-card-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: rgba(37, 99, 235, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
                }

                .history-card-icon .fa-robot {
                    font-size: 20px;
                    color: #2563eb;
                }

                .history-card h5 {
                    margin: 0 0 6px;
                    font-size: 15px;
                    color: #0f172a;
                }

                .history-card p {
                    margin: 0;
                    font-size: 13px;
                    color: #64748b;
                }

                .history-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    align-items: flex-end;
                    font-size: 12px;
                    color: #94a3b8;
                    font-weight: 600;
                }

                .history-card:hover {
                    background: #f8fafc;
                    border-color: rgba(37, 99, 235, 0.3);
                    transform: translateY(-2px);
                    transition: all 0.2s ease;
                }

                .drawer-conversation {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    flex: 1;
                    height: 100%;
                    overflow: hidden;
                }

                .conversation-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
                }

                .conversation-back-btn {
                    border: none;
                    background: rgba(37, 99, 235, 0.1);
                    color: #2563eb;
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s ease;
                }

                .conversation-back-btn:hover {
                    background: rgba(37, 99, 235, 0.15);
                    transform: translateX(-2px);
                }

                .conversation-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #0f172a;
                    flex: 1;
                }

                .conversation-messages {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    overflow-y: auto;
                    flex: 1;
                    padding-right: 4px;
                }

                .conversation-message {
                    display: flex;
                    justify-content: flex-start;
                    animation: fadeIn 0.3s ease;
                }

                .conversation-message.message-user {
                    justify-content: flex-end;
                }

                .message-content {
                    max-width: 75%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 14px;
                    line-height: 1.5;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }

                .message-content.message-html {
                    white-space: normal;
                }

                .message-user .message-content {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: #ffffff;
                    box-shadow: 0 14px 28px rgba(37, 99, 235, 0.25);
                }

                .message-assistant .message-content {
                    background: #f1f3f5;
                    color: #1f2937;
                    box-shadow: 0 8px 18px rgba(148, 163, 184, 0.18);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .drawer-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .drawer-form label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .drawer-form input,
                .drawer-form textarea,
                .drawer-form select {
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    border-radius: 12px;
                    padding: 12px 14px;
                    font-size: 14px;
                    background: #f8fafc;
                    color: #0f172a;
                    outline: none;
                }

                .drawer-form input:focus,
                .drawer-form textarea:focus,
                .drawer-form select:focus {
                    border-color: #2563eb;
                    background: #ffffff;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
                }

                .drawer-form-row {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                }

                .drawer-submit {
                    border: none;
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 14px;
                    border-radius: 14px;
                    cursor: pointer;
                    box-shadow: 0 18px 32px rgba(37, 99, 235, 0.24);
                    margin-top: 8px;
                }
            `}</style>
            <div
                className="chatbot-preview-container"
                style={{
                    position: 'fixed',
                    right: '24px',
                    bottom: '24px',
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    zIndex: 999,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '-72px',
                        right: '0',
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 10px 20px rgba(15, 23, 42, 0.12)',
                        padding: '12px 16px',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MDBIcon icon="expand-arrows-alt" className="text-primary" />
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>Widget Size</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>W</span>
                        <input
                            type="number"
                            min={240}
                            max={1024}
                            value={previewWidth}
                            onChange={(e) => handlePreviewWidthChange(Number(e.target.value))}
                            disabled={!isEditing}
                            style={{
                                width: '72px',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                fontSize: '12px',
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>px</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>H</span>
                        <input
                            type="number"
                            min={240}
                            max={1024}
                            value={previewHeight}
                            onChange={(e) => handlePreviewHeightChange(Number(e.target.value))}
                            disabled={!isEditing}
                            style={{
                                width: '72px',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                fontSize: '12px',
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>px</span>
                    </div>
                    {!isEditing && (
                        <MDBBadge
                            color="light"
                            style={{
                                backgroundColor: '#e2e8f0',
                                color: '#475569',
                                marginTop: '-20px',
                            }}
                        >
                            Enable edit mode to save changes
                        </MDBBadge>
                    )}
                </div>
                <div
                    className="chatbot-preview-frame"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '22px',
                        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
                        overflow: 'hidden',
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        background: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    }}
                >
                    <div
                        style={{
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #10B981 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: '22px 22px 0 0',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                }}
                            >
                                {chatbot.name?.charAt(0).toUpperCase() ?? 'C'}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '16px' }}>{chatbot.name || 'Chatbot'}</div>
                        </div>
                        <button
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '20px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                lineHeight: '1',
                            }}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <div style={{ flex: 1, padding: '18px', overflow: 'auto', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div
                            style={{
                                alignSelf: 'flex-start',
                                backgroundColor: '#e0f2fe',
                                color: '#0f172a',
                                padding: '12px 16px',
                                borderRadius: '18px',
                                maxWidth: '80%',
                                boxShadow: '0 8px 20px rgba(14, 116, 144, 0.18)',
                            }}
                        >
                            👋 Hi there! Ask me anything about your automation.
                        </div>
                        <div
                            style={{
                                alignSelf: 'flex-end',
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#ffffff',
                                padding: '12px 16px',
                                borderRadius: '18px',
                                maxWidth: '80%',
                                boxShadow: '0 12px 24px rgba(37, 99, 235, 0.22)',
                            }}
                        >
                            Sure, can you help me schedule a follow-up?
                        </div>
                    </div>
                    <div
                        style={{
                            padding: '14px 18px',
                            borderTop: '1px solid rgba(148, 163, 184, 0.25)',
                            backgroundColor: '#f1f5f9',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: '#ffffff',
                                borderRadius: '24px',
                                padding: '8px 14px',
                                boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.2)',
                            }}
                        >
                            <div
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.15)',
                                }}
                            ></div>
                            <span style={{ fontSize: '12px', color: '#475569' }}>
                                Preview only — actual conversations appear in production.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


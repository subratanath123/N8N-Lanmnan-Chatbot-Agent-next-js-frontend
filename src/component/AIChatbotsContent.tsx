'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBIcon,
    MDBBtn,
    MDBSwitch,
    MDBModal,
    MDBModalDialog,
    MDBModalContent,
    MDBModalHeader,
    MDBModalTitle,
    MDBModalBody,
    MDBModalFooter,
} from 'mdb-react-ui-kit';
import ChatbotCreationForm from './ChatbotCreationForm';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface AIChatbotsContentProps {
    activeItem: string;
    embedOrigin?: string;
}

interface GlobalStats {
    totalChatbots: number;
    totalConversations: number;
    totalMessages: number;
    activeDomains: number;
}

interface ChatbotStats {
    totalConversations: number;
    totalMessages: number;
}

export default function AIChatbotsContent({ activeItem, embedOrigin: externalOrigin }: AIChatbotsContentProps) {
    const [showCreationForm, setShowCreationForm] = useState(false);
    const [chatbots, setChatbots] = useState<any[]>([]);
    const [isLoadingChatbots, setIsLoadingChatbots] = useState(false);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    // Per-chatbot stats: { [chatbotId]: { totalConversations, totalMessages } }
    const [chatbotStats, setChatbotStats] = useState<Record<string, ChatbotStats>>({});
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [expandedChatbotId, setExpandedChatbotId] = useState<string | null>(null);
    const [copyStates, setCopyStates] = useState<Record<string, 'idle' | 'copied' | 'error'>>({});
    const [resolvedOrigin, setResolvedOrigin] = useState<string>(externalOrigin || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuContainerRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    
    // Close dropdown when clicking outside
    useEffect(() => {
        if (!openMenuId) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);
    
    // Clerk Authentication
    const { isSignedIn, user } = useUser();
    const { getToken } = useAuth();

    const isChatbotOwner = (c: { createdBy?: string }) => {
        const me = user?.primaryEmailAddress?.emailAddress;
        if (!me || !c?.createdBy) return false;
        return me.toLowerCase() === String(c.createdBy).toLowerCase();
    };

    // Close delete confirmation on Esc
    useEffect(() => {
        if (!showDeleteModal) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowDeleteModal(false);
                setChatbotToDelete(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showDeleteModal]);

    // Close validation errors dialog on Esc
    useEffect(() => {
        if (!showErrorModal) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowErrorModal(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showErrorModal]);

    const handleCreateChatbot = () => {
        setShowCreationForm(true);
    };

    const handleCancelCreation = () => {
        setShowCreationForm(false);
    };

    const handleSubmitChatbot = async (chatbotData: any) => {
        try {
            console.log('Chatbot data submitted:', chatbotData);
            
            // Prepare data with fileIds instead of base64 files
            const processedData: any = {
                title: chatbotData.title,
                name: chatbotData.name,
                hideName: chatbotData.hideName,
                instructions: chatbotData.instructions,
                restrictToDataSource: chatbotData.restrictToDataSource,
                customFallbackMessage: chatbotData.customFallbackMessage,
                fallbackMessage: chatbotData.fallbackMessage,
                greetingMessage: chatbotData.greetingMessage,
                selectedDataSource: chatbotData.selectedDataSource,
                qaPairs: [],
                fileIds: chatbotData.fileIds || [],
                addedWebsites: chatbotData.addedWebsites || [],
                addedTexts: chatbotData.addedTexts || [],
                model: chatbotData.model,
                widgetPosition: chatbotData.widgetPosition,
                headerBackground: chatbotData.headerBackground,
                headerText: chatbotData.headerText,
                aiBackground: chatbotData.aiBackground,
                aiText: chatbotData.aiText,
                userBackground: chatbotData.userBackground,
                userText: chatbotData.userText,
                aiAvatar: (typeof chatbotData.aiAvatar === 'string' && !chatbotData.aiAvatar.startsWith('blob:'))
                    ? chatbotData.aiAvatar
                    : undefined,
                avatarFileId: chatbotData.avatarFileId,
            };

            // Process QA pairs - remove internal id field
            if (chatbotData.qaPairs && chatbotData.qaPairs.length > 0) {
                processedData.qaPairs = chatbotData.qaPairs.map((qa: any) => ({
                    question: qa.question,
                    answer: qa.answer
                }));
            }

            console.log('Processed chatbot data:', processedData);
            const headers = await getAuthHeaders();

            // Call the backend API to create the chatbot
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const response = await fetch(`${backendUrl}/v1/api/chatbot/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify(processedData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Extract validation errors
                const errors: string[] = [];
                
                // Check for validation errors array
                if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
                    errors.push(...errorData.validationErrors);
                } else if (errorData.errors && Array.isArray(errorData.errors)) {
                    errors.push(...errorData.errors);
                } else if (errorData.error && Array.isArray(errorData.error)) {
                    errors.push(...errorData.error);
                } else if (errorData.message && Array.isArray(errorData.message)) {
                    errors.push(...errorData.message);
                }
                
                // Check for single error message
                if (errorData.errorMessage) {
                    errors.push(errorData.errorMessage);
                } else if (errorData.message && !Array.isArray(errorData.message)) {
                    errors.push(errorData.message);
                } else if (errorData.error && !Array.isArray(errorData.error)) {
                    errors.push(errorData.error);
                }
                
                // If no specific errors found, add generic error
                if (errors.length === 0) {
                    errors.push(errorData.errorMessage || `Failed to create chatbot: ${response.status}`);
                }
                
                // Show errors in modal
                setValidationErrors(errors);
                setShowErrorModal(true);
                return;
            }

            const result = await response.json();
            console.log('Chatbot created successfully:', result);
            
            // Try to navigate directly to the chatbot details page if we have an ID
            const createdId = result?.id || result?.chatbotId || result?.botId;
            if (createdId) {
                setShowCreationForm(false);
                router.push(`/ai-chatbots/${createdId}`);
                return;
            }
            
            // Fallback: refresh the chatbots list + stats and close the form
            await fetchChatbots();
            fetchStats();
            setShowCreationForm(false);
            
        } catch (error) {
            console.error('Error creating chatbot:', error);
            // Parse error for validation messages
            const errors: string[] = [];
            
            if (error instanceof Error) {
                // Try to parse JSON error message
                try {
                    const errorObj = JSON.parse(error.message);
                    if (errorObj.validationErrors && Array.isArray(errorObj.validationErrors)) {
                        errors.push(...errorObj.validationErrors);
                    } else if (errorObj.errors && Array.isArray(errorObj.errors)) {
                        errors.push(...errorObj.errors);
                    } else {
                        errors.push(error.message);
                    }
                } catch {
                    errors.push(error.message);
                }
            } else {
                errors.push('Failed to create chatbot. Please try again.');
            }
            
            // Show errors in modal
            setValidationErrors(errors);
            setShowErrorModal(true);
        }
    };

    // Build auth headers helper
    const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (isSignedIn) {
            try {
                const token = await getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;
            } catch (err) {
                console.warn('Failed to get auth token:', err);
            }
        }
        return headers;
    }, [isSignedIn, getToken]);

    // Fetch global stats from /v1/api/chatbot/stats
    const fetchStats = useCallback(async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) return;
            const headers = await getAuthHeaders();
            const res = await fetch(`${backendUrl}/v1/api/chatbot/stats`, { method: 'GET', headers });
            if (!res.ok) {
                console.warn('Stats endpoint returned', res.status);
                return;
            }
            const data = await res.json();
            setGlobalStats({
                totalChatbots:     data.totalChatbots     ?? 0,
                totalConversations: data.totalConversations ?? 0,
                totalMessages:     data.totalMessages     ?? 0,
                activeDomains:     data.activeDomains     ?? 0,
            });
        } catch (err) {
            console.error('Error fetching chatbot stats:', err);
        }
    }, [getAuthHeaders]);

    // Fetch per-chatbot stats in parallel from GET /v1/api/chatbot/{id}/stats
    const fetchPerChatbotStats = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) return;
        const headers = await getAuthHeaders();

        const results = await Promise.allSettled(
            ids.map((id) =>
                fetch(`${backendUrl}/v1/api/chatbot/${id}/stats`, { method: 'GET', headers })
                    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
                    .then((data) => ({
                        id,
                        totalConversations: data.totalConversations ?? data.conversationCount ?? 0,
                        totalMessages:      data.totalMessages      ?? data.messageCount      ?? 0,
                    }))
            )
        );

        const map: Record<string, ChatbotStats> = {};
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                const { id, totalConversations, totalMessages } = result.value;
                map[id] = { totalConversations, totalMessages };
            }
        });

        // Merge into existing map so already-loaded entries aren't wiped
        setChatbotStats((prev) => ({ ...prev, ...map }));
    }, [getAuthHeaders]);

    // Fetch chatbots from API
    const fetchChatbots = useCallback(async () => {
        setIsLoadingChatbots(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const headers = await getAuthHeaders();

            const response = await fetch(`${backendUrl}/v1/api/chatbot/list`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                console.error('Failed to fetch chatbots:', response.status);
                return;
            }

            const result = await response.json();
            console.log('Chatbots fetched:', result);
            
            let chatbotList = [];
            if (Array.isArray(result)) {
                chatbotList = result;
            } else if (result.data && Array.isArray(result.data)) {
                chatbotList = result.data;
            } else if (result.chatbots && Array.isArray(result.chatbots)) {
                chatbotList = result.chatbots;
            }
            
            setChatbots(chatbotList);

            // Fire per-chatbot stats requests right after list is ready
            const ids: string[] = chatbotList.map((b: any) => b.id).filter(Boolean);
            fetchPerChatbotStats(ids);
            
        } catch (error) {
            console.error('Error fetching chatbots:', error);
        } finally {
            setIsLoadingChatbots(false);
        }
    }, [getAuthHeaders, fetchPerChatbotStats]);

    // Fetch chatbots + stats on mount and when activeItem changes
    useEffect(() => {
        fetchChatbots();
        fetchStats();
    }, [activeItem, fetchChatbots, fetchStats]);

    useEffect(() => {
        if (externalOrigin) {
            setResolvedOrigin(externalOrigin);
            return;
        }

        if (typeof window !== 'undefined') {
            setResolvedOrigin(window.location.origin);
        }
    }, [externalOrigin]);

    const getEmbedCode = (chatbotId: string, width?: number, height?: number) => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const origin = resolvedOrigin || '';
        const widgetWidth = width || 380;
        const widgetHeight = height || 600;

        return `<script src="${origin}/widget-dist/chat-widget.iife.js"></script>
<script>
  window.initChatWidget({
    chatbotId: "${chatbotId}",
    apiUrl: "${backendUrl}",
    width: ${widgetWidth},
    height: ${widgetHeight}
  });
</script>`;
    };

    const handleToggleEmbed = (chatbotId: string) => {
        setExpandedChatbotId((prev) => (prev === chatbotId ? null : chatbotId));
    };

    const handleCopyEmbed = async (chatbotId: string) => {
        const chatbot = chatbots.find(c => c.id === chatbotId);
        const embedCode = getEmbedCode(chatbotId, chatbot?.embedWidth, chatbot?.embedHeight);

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(embedCode);
                setCopyStates((prev) => ({ ...prev, [chatbotId]: 'copied' }));
                setTimeout(() => {
                    setCopyStates((prev) => ({ ...prev, [chatbotId]: 'idle' }));
                }, 2000);
            } catch (error) {
                console.error('Failed to copy embed code:', error);
                setCopyStates((prev) => ({ ...prev, [chatbotId]: 'error' }));
            }
        } else {
            setCopyStates((prev) => ({ ...prev, [chatbotId]: 'error' }));
        }
    };

    // Handle chatbot click - navigate to detail page
    const handleChatbotClick = (chatbotId: string) => {
        router.push(`/ai-chatbots/${chatbotId}`);
    };

    // Handle delete chatbot
    const handleDeleteChatbot = async (chatbotId: string) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) throw new Error('Backend URL is not configured');
            const headers = await getAuthHeaders();

            const response = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                throw new Error('Failed to delete chatbot');
            }

            // Remove from local state, clean up its stats entry, refresh global stats
            setChatbots((prev) => {
                const next = prev.filter(bot => bot.id !== chatbotId);
                return next;
            });
            setChatbotStats((prev) => {
                const next = { ...prev };
                delete next[chatbotId];
                return next;
            });
            setShowDeleteModal(false);
            setChatbotToDelete(null);
            fetchStats();
        } catch (error) {
            console.error('Error deleting chatbot:', error);
            alert('Failed to delete chatbot');
        }
    };

    // Handle enable/disable toggle
    const handleToggleEnabled = async (chatbotId: string, currentStatus: string) => {
        const bot = chatbots.find((b) => b.id === chatbotId);
        if (bot?.canConfigure !== true) return;
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
            const headers = await getAuthHeaders();

            const response = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/toggle`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update chatbot status');
            }

            // Update local state
            setChatbots(prev => prev.map(bot => 
                bot.id === chatbotId ? { ...bot, status: newStatus } : bot
            ));
        } catch (error) {
            console.error('Error toggling chatbot:', error);
            alert('Failed to update chatbot status');
        }
    };

    const renderDashboardContent = () => {
        // Use stats from the dedicated endpoint; fall back to local counts while loading
        const statsLoaded = globalStats !== null;
        const statItems = [
            {
                label: 'Total Chatbots',
                value: statsLoaded ? globalStats!.totalChatbots : chatbots.length,
            },
            {
                label: 'Total Conversations',
                value: statsLoaded ? globalStats!.totalConversations : 0,
            },
            {
                label: 'Total Messages',
                value: statsLoaded ? globalStats!.totalMessages : 0,
            },
            {
                label: 'Active Domains',
                value: statsLoaded ? globalStats!.activeDomains : chatbots.filter(b => b.status === 'ACTIVE').length,
            },
        ];

        return (
        <>
            <style>{`
                .ai-chatbots-stats { display: grid; grid-template-columns: repeat(4, 1fr); }
                .ai-chatbots-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
                @media (max-width: 1200px) {
                    .ai-chatbots-stats { grid-template-columns: repeat(2, 1fr); }
                    .ai-chatbots-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .ai-chatbots-stats { grid-template-columns: 1fr; }
                    .ai-chatbots-grid { grid-template-columns: 1fr; }
                }
            `}</style>
            {/* Page Title */}

            <br/>
            {/* Statistics Section */}
            <div className="ai-chatbots-stats" style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px 32px',
                marginBottom: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
                gap: 0,
            }}>

                {statItems.map((stat, i) => (
                    <div key={stat.label} style={{
                        padding: i < statItems.length - 1 ? '0 24px 0 0' : 0,
                        borderRight: i < statItems.length - 1 ? '1px solid #e5e7eb' : 'none',
                    }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{stat.label}</div>
                        <div style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#2B59C3',
                            // Subtle skeleton shimmer while stats load
                            opacity: !statsLoaded ? 0.4 : 1,
                            transition: 'opacity 0.3s ease',
                        }}>
                            {stat.value.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create New Chatbot */}
            <div
                onClick={handleCreateChatbot}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '48px 24px',
                    border: '2px dashed #cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    marginBottom: '40px',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2B59C3';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = 'white';
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(43, 89, 195, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <MDBIcon icon="plus" size="2x" style={{ color: '#2B59C3' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Create New Chatbot</span>
            </div>

            {/* My Chatbots Section */}
            <div>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 24px 0'
                }}>
                    My Chatbots
                </h2>

                {isLoadingChatbots ? (
                    <div style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '60px 40px',
                        backgroundColor: 'white',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: '#6b7280' }}>Loading chatbots...</p>
                    </div>
                ) : chatbots.length > 0 ? (
                    <div className="ai-chatbots-grid" style={{
                        gap: '24px',
                        alignItems: 'stretch'
                    }}>
                        {chatbots.map((chatbot, index) => {
                            const perStats = chatbotStats[chatbot.id];
                            // perStats is undefined while the request is in-flight → show skeleton dash
                            const statsReady = perStats !== undefined;
                            const totalConversations = perStats?.totalConversations ?? 0;
                            const totalMessages      = perStats?.totalMessages      ?? 0;
                            const isExpanded = expandedChatbotId === chatbot.id;
                            const menuOpen = openMenuId === chatbot.id;

                            return (
                                <div
                                    key={chatbot.id || index}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        background: '#FFFFFF',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        transition: 'box-shadow 0.2s ease',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'visible',
                                    }}
                                    onClick={() => handleChatbotClick(chatbot.id)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                                        // Don't close dropdown here - it's below the card, so mouse would leave before click registers
                                    }}
                                >
                                    {/* Header: Avatar + Menu */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#F3F4F6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#6b7280',
                                        }}>
                                            {(chatbot.title || chatbot.name || 'C').charAt(0).toUpperCase()}
                                        </div>
                                        <div ref={menuOpen ? (el) => { menuContainerRef.current = el; } : undefined} style={{ position: 'relative' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(menuOpen ? null : chatbot.id);
                                                }}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'rgba(43, 89, 195, 0.1)',
                                                    color: '#2B59C3',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px',
                                                }}
                                            >
                                                <MDBIcon icon="ellipsis-v" />
                                            </button>
                                            {menuOpen && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    right: 0,
                                                    marginTop: '4px',
                                                    zIndex: 10,
                                                    backgroundColor: 'white',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    border: '1px solid #e5e7eb',
                                                    minWidth: '140px',
                                                    padding: '4px 0',
                                                }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            handleToggleEmbed(chatbot.id);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 16px',
                                                            border: 'none',
                                                            background: 'none',
                                                            textAlign: 'left',
                                                            fontSize: '14px',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {isExpanded ? 'Hide Embed' : 'Show Embed'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            handleCopyEmbed(chatbot.id);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 16px',
                                                            border: 'none',
                                                            background: 'none',
                                                            textAlign: 'left',
                                                            fontSize: '14px',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Copy Embed
                                                    </button>
                                                    {isChatbotOwner(chatbot) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(null);
                                                            setChatbotToDelete(chatbot.id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 16px',
                                                            border: 'none',
                                                            background: 'none',
                                                            textAlign: 'left',
                                                            fontSize: '14px',
                                                            color: '#dc2626',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info: Name, Date, Toggle */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                {chatbot.title || chatbot.name || `Chatbot ${index + 1}`}
                                                {!isChatbotOwner(chatbot) && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        color: '#4f46e5',
                                                        background: '#eef2ff',
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                    }}>
                                                        Shared
                                                    </span>
                                                )}
                                            </h3>
                                            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                                                Created on {chatbot.createdAt
                                                    ? new Date(chatbot.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
                                                    : 'Unknown'}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                                             onClick={(e) => e.stopPropagation()}>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{chatbot.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                                            <MDBSwitch
                                                checked={chatbot.status === 'ACTIVE'}
                                                disabled={chatbot.canConfigure !== true}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleEnabled(chatbot.id, chatbot.status);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer: Stats */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 0,
                                        paddingTop: '16px',
                                        borderTop: '1px solid #e5e7eb',
                                    }}>
                                        {[
                                            { label: 'Total Conversations', value: totalConversations, border: true },
                                            { label: 'Total Messages',      value: totalMessages,      border: false },
                                        ].map(({ label, value, border }) => (
                                            <div key={label} style={{
                                                paddingRight: border ? '16px' : undefined,
                                                paddingLeft:  border ? undefined : '16px',
                                                borderRight:  border ? '1px solid #e5e7eb' : 'none',
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
                                                {statsReady ? (
                                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                                                        {value.toLocaleString()}
                                                    </div>
                                                ) : (
                                                    // Skeleton bar while loading
                                                    <div style={{
                                                        height: '24px',
                                                        width: '48px',
                                                        borderRadius: '6px',
                                                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                                                        backgroundSize: '200% 100%',
                                                        animation: 'shimmer 1.4s infinite',
                                                        marginTop: '2px',
                                                    }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <style>{`
                                        @keyframes shimmer {
                                            0%   { background-position: 200% 0; }
                                            100% { background-position: -200% 0; }
                                        }
                                    `}</style>

                                    {isExpanded && (
                                    <div style={{
                                        marginTop: '18px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: '#f9fafb',
                                        padding: '16px',
                                        position: 'relative',
                                    }}
                                    onClick={(e) => e.stopPropagation()}>
                                        <pre style={{
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontSize: '12px',
                                            lineHeight: 1.6,
                                            fontFamily: 'monospace',
                                            color: '#374151',
                                        }}>
{getEmbedCode(chatbot.id, chatbot.embedWidth, chatbot.embedHeight)}
                                        </pre>
                                        <MDBBtn
                                            color="primary"
                                            size="sm"
                                            style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 10px',
                                                fontSize: '12px',
                                                backgroundColor: '#2B59C3',
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleCopyEmbed(chatbot.id);
                                            }}
                                        >
                                            <MDBIcon icon={copyStates[chatbot.id] === 'copied' ? 'check' : 'copy'} size="sm" />
                                            {copyStates[chatbot.id] === 'copied' ? 'Copied' : copyStates[chatbot.id] === 'error' ? 'Failed' : 'Copy'}
                                        </MDBBtn>
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '60px 40px',
                        backgroundColor: 'white',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '64px',
                            marginBottom: '24px',
                            opacity: '0.3'
                        }}>
                            🤖
                        </div>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 12px 0'
                        }}>
                            No Chatbots.
                        </h3>
                        <p style={{
                            fontSize: '16px',
                            color: '#6b7280',
                            margin: '0',
                            maxWidth: '400px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }}>
                            Looks like you don't have any chatbot. Click on one of the cards above to create your first bot.
                        </p>
                    </div>
                )}
            </div>
        </>
        );
    };

    const renderChatbotsContent = () => (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: '0' }}>Your Chatbots</h2>
                <MDBBtn
                    color="primary"
                    onClick={handleCreateChatbot}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <MDBIcon icon="plus" size="sm" />
                    Create New Chatbot
                </MDBBtn>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Manage your AI chatbots here.</p>
            {/* Placeholder for chatbot list/management UI */}
            <div style={{ height: '200px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: '8px' }}>
                Chatbot List / Management UI
            </div>
        </div>
    );

    const renderConversationsContent = () => (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>Conversations</h2>
            <p style={{ color: '#6b7280' }}>View and manage chatbot conversations.</p>
            {/* Placeholder for conversations list/management UI */}
            <div style={{ height: '200px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: '8px' }}>
                Conversations List / Management UI
            </div>
        </div>
    );

    const renderDefaultContent = (itemName: string) => (
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>{itemName}</h2>
            <p style={{ color: '#6b7280' }}>Content for {itemName} will appear here.</p>
            <div style={{ height: '200px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: '8px' }}>
                {itemName} Specific UI
            </div>
        </div>
    );

    // Validation Errors Dialog (custom portal dialog, not MDBModal, to avoid Chromium blur)
    const renderErrorModal = () => {
        if (typeof document === 'undefined') return null;
        if (!showErrorModal) return null;

        return ReactDOM.createPortal(
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="validation-errors-title"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowErrorModal(false);
                    }
                }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.45)',
                    zIndex: 20000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '560px',
                        background: '#ffffff',
                        borderRadius: '14px',
                        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.25)',
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                        overflow: 'hidden',
                        WebkitFontSmoothing: 'subpixel-antialiased',
                        backfaceVisibility: 'hidden',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <MDBIcon icon="exclamation-triangle" />
                        <div
                            id="validation-errors-title"
                            style={{
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '18px',
                                lineHeight: 1.2,
                            }}
                        >
                            Validation Errors
                        </div>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <p
                            style={{
                                marginBottom: '16px',
                                color: '#6b7280',
                                fontSize: '14px',
                            }}
                        >
                            Please fix the following errors before creating your chatbot:
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {validationErrors.map((error, index) => (
                                <li
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        marginBottom: '12px',
                                        padding: '12px',
                                        backgroundColor: '#fef2f2',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid #dc2626',
                                    }}
                                >
                                    <MDBIcon
                                        icon="circle"
                                        className="text-danger me-3 mt-1"
                                        style={{ fontSize: '8px', flexShrink: 0 }}
                                    />
                                    <span style={{ color: '#991b1b', fontSize: '14px', lineHeight: '1.5' }}>
                                        {error}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <MDBBtn
                            color="danger"
                            onClick={() => setShowErrorModal(false)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: '500',
                            }}
                        >
                            Close
                        </MDBBtn>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    // Delete Confirmation (custom dialog, not MDBModal, to avoid Chromium blur issues)
    const renderDeleteModal = () => {
        if (typeof document === 'undefined') return null;
        if (!showDeleteModal) return null;

        return ReactDOM.createPortal(
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-chatbot-title"
                onMouseDown={(e) => {
                    // click on backdrop closes
                    if (e.target === e.currentTarget) {
                        setShowDeleteModal(false);
                        setChatbotToDelete(null);
                    }
                }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.45)',
                    zIndex: 20000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '520px',
                        background: '#ffffff',
                        borderRadius: '14px',
                        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.25)',
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                        overflow: 'hidden',
                        WebkitFontSmoothing: 'subpixel-antialiased',
                        backfaceVisibility: 'hidden',
                    }}
                >
                    <div style={{ padding: '22px 22px 0' }}>
                        <div
                            id="delete-chatbot-title"
                            style={{
                                fontWeight: 600,
                                fontSize: '20px',
                                color: '#111827',
                            }}
                        >
                            Delete Chatbot
                        </div>
                    </div>

                    <div style={{ padding: '14px 22px 20px' }}>
                        <p
                            style={{
                                margin: 0,
                                color: '#6b7280',
                                fontSize: '15px',
                                lineHeight: '1.6',
                            }}
                        >
                            Are you sure you want to delete this chatbot? This action cannot be undone and all
                            associated data will be permanently removed.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            padding: '0 22px 22px',
                        }}
                    >
                        <MDBBtn
                            color="light"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setChatbotToDelete(null);
                            }}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                border: '1px solid #e5e7eb',
                            }}
                        >
                            Cancel
                        </MDBBtn>
                        <MDBBtn
                            color="danger"
                            onClick={() => {
                                if (chatbotToDelete) {
                                    handleDeleteChatbot(chatbotToDelete);
                                }
                            }}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: '500',
                            }}
                        >
                            Delete Chatbot
                        </MDBBtn>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    // If showing creation form, render it with modal
    if (showCreationForm) {
        return (
            <>
                <ChatbotCreationForm
                    onCancel={handleCancelCreation}
                    onSubmit={handleSubmitChatbot}
                />
                {renderErrorModal()}
            </>
        );
    }

    // Render content with modal
    let content;
    switch (activeItem) {
        case 'dashboard':
            content = renderDashboardContent();
            break;
        case 'chatbots':
            content = renderChatbotsContent();
            break;
        case 'conversations':
            content = renderConversationsContent();
            break;
        default:
            content = renderDefaultContent(activeItem);
    }

    return (
        <>
            {content}
            {renderErrorModal()}
            {renderDeleteModal()}
        </>
    );
}

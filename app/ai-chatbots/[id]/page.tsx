'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    embedWidth?: number;
    embedHeight?: number;
    enableWhatsappIntegration?: boolean;
    enableFacebookIntegration?: boolean;
    instructions?: string; // Instructions for replying user
    fallbackMessage?: string; // Fallback message for replying user
    restrictDataSource?: boolean; // Restrict to Datasource and knowledgebase during user's reply
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
    const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
    const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseResponse | null>(null);
    const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
    const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
    const [previewWidth, setPreviewWidth] = useState<number>(400);
    const [previewHeight, setPreviewHeight] = useState<number>(500);
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);
    const [showFacebookModal, setShowFacebookModal] = useState(false);
    const [activeChannelTab, setActiveChannelTab] = useState<'whatsapp' | 'slack' | 'custom'>('whatsapp');
    const [whatsappForm, setWhatsappForm] = useState({
        name: '',
        phoneNumberId: '',
        accessToken: '',
        webhookVerifyToken: '',
    });
    const [whatsappErrors, setWhatsappErrors] = useState<Record<string, string>>({});
    const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);
    const [whatsappTestResult, setWhatsappTestResult] = useState<'success' | 'error' | null>(null);
    const [facebookForm, setFacebookForm] = useState({
        pageName: '',
        pageId: '',
        accessToken: '',
        verifyToken: '',
    });
    const [facebookErrors, setFacebookErrors] = useState<Record<string, string>>({});
    const [isTestingFacebook, setIsTestingFacebook] = useState(false);
    const [facebookTestResult, setFacebookTestResult] = useState<'success' | 'error' | null>(null);
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
    
    const conversationHistory = useMemo(() => [
        {
            id: 'CNV-' + chatbotId,
            title: 'New Conversation',
            messageCount: 2,
            updatedAt: '22 hours ago',
            preview: 'Hey there! How can I help you today?',
        },
        {
            id: 'CNV-1023',
            title: 'Onboarding Walkthrough',
            messageCount: 5,
            updatedAt: '1 day ago',
            preview: 'We are deploying the chatbot this week...',
        },
        {
            id: 'CNV-1022',
            title: 'Pricing Clarification',
            messageCount: 12,
            updatedAt: '1 week ago',
            preview: 'Could you explain the enterprise plan limits?',
        },
        {
            id: 'CNV-1021',
            title: 'Widget Customization',
            messageCount: 17,
            updatedAt: '1 week ago',
            preview: 'Is there a way to change the header color?',
        },
        {
            id: 'CNV-1020',
            title: 'Integration Follow-up',
            messageCount: 9,
            updatedAt: '3 weeks ago',
            preview: 'Thanks for sharing the API docs!',
        },
    ], [chatbotId]);

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

    const { isSignedIn } = useUser();
    const { getToken } = useAuth();

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
        if (chatbotId) {
            fetchChatbotDetails();
        }
    }, [chatbotId]);

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
        } catch (error) {
            console.error('Error fetching chatbot details:', error);
            alert('Failed to load chatbot details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenWhatsappModal = () => {
        setShowWhatsappModal(true);
        setWhatsappTestResult(null);
    };

    const handleCloseWhatsappModal = () => {
        setShowWhatsappModal(false);
    };

    const handleOpenFacebookModal = () => {
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
        if (!whatsappForm.phoneNumberId.trim()) {
            errors.phoneNumberId = 'Phone Number ID is required';
        } else if (!/^\d+$/.test(whatsappForm.phoneNumberId.trim())) {
            errors.phoneNumberId = 'Phone Number ID should contain only digits';
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

    const handleSaveWhatsappConfiguration = () => {
        if (!validateWhatsappForm()) {
            return;
        }

        console.log('WhatsApp configuration saved:', whatsappForm);
        alert('WhatsApp channel added (frontend only).');
        setShowWhatsappModal(false);
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

    const handleSaveFacebookConfiguration = () => {
        if (!validateFacebookForm()) {
            return;
        }

        console.log('Facebook configuration saved:', facebookForm);
        alert('Facebook channel added (frontend only).');
        setShowFacebookModal(false);
    };
    const fetchKnowledgeBase = async () => {
        if (!chatbotId) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
            setKnowledgeError('Backend URL is not configured');
            return;
        }

        setIsLoadingKnowledge(true);
        setKnowledgeError(null);

        try {
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
                    console.warn('Failed to get auth token for knowledge base:', error);
                }
            }

            const response = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/knowledge-base`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch knowledge base (${response.status})`);
            }

            const result = await response.json();
            const data: KnowledgeBaseResponse = result.data || result;
            setKnowledgeBase(data);
        } catch (error) {
            console.error('Error loading knowledge base:', error);
            setKnowledgeError(error instanceof Error ? error.message : 'Failed to load knowledge base');
        } finally {
            setIsLoadingKnowledge(false);
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

            const response = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(editedChatbot),
            });

            if (!response.ok) {
                throw new Error('Failed to update chatbot');
            }

            const result = await response.json();
            const updatedChatbot = result.data || result;
            setChatbot(updatedChatbot);
            setEditedChatbot(updatedChatbot);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating chatbot:', error);
            alert('Failed to update chatbot');
        }
    };

    const handleCancel = () => {
        setEditedChatbot(chatbot);
        setIsEditing(false);
    };

    useEffect(() => {
        if (showKnowledgeModal && !knowledgeBase && !isLoadingKnowledge) {
            fetchKnowledgeBase();
        }
    }, [showKnowledgeModal]);

    const mergedFiles = knowledgeBase?.files || chatbot?.files || [];
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
        const width = (isEditing ? editedChatbot?.embedWidth : chatbot?.embedWidth) ?? 400;
        const height = (isEditing ? editedChatbot?.embedHeight : chatbot?.embedHeight) ?? 500;
        setPreviewWidth(width);
        setPreviewHeight(height);
    }, [isEditing, editedChatbot?.embedWidth, editedChatbot?.embedHeight, chatbot?.embedWidth, chatbot?.embedHeight]);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const handlePreviewWidthChange = (value: number) => {
        const clamped = clamp(Number(value) || 0, 240, 1024);
        setPreviewWidth(clamped);
        setEditedChatbot((prev) => (prev ? { ...prev, embedWidth: clamped } : prev));
        if (!isEditing) {
            setChatbot((prev) => (prev ? { ...prev, embedWidth: clamped } : prev));
        }
    };

    const handlePreviewHeightChange = (value: number) => {
        const clamped = clamp(Number(value) || 0, 240, 1024);
        setPreviewHeight(clamped);
        setEditedChatbot((prev) => (prev ? { ...prev, embedHeight: clamped } : prev));
        if (!isEditing) {
            setChatbot((prev) => (prev ? { ...prev, embedHeight: clamped } : prev));
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
                        {isLoadingKnowledge ? (
                            <div className="py-4 text-center text-muted">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 mb-0">Loading knowledge base...</p>
                            </div>
                        ) : knowledgeError ? (
                            <div className="alert alert-danger mb-0" role="alert">
                                {knowledgeError}
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <MDBIcon icon="folder-open" className="text-warning" />
                                        Training Files
                                        <MDBBadge color="primary" pill>{mergedFiles.length}</MDBBadge>
                                    </h5>
                                    {mergedFiles.length === 0 ? (
                                        <p className="text-muted mb-0">No files have been associated with this chatbot yet.</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <MDBTable align='middle' hover small>
                                                <MDBTableHead>
                                                    <tr>
                                                        <th>File</th>
                                                        <th>Source</th>
                                                        <th>Size</th>
                                                        <th>Uploaded</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </MDBTableHead>
                                                <MDBTableBody>
                                                    {mergedFiles.map((file) => (
                                                        <tr key={file.id || file.name}>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <MDBIcon icon="file-alt" className="text-secondary" />
                                                                    <div>
                                                                        <div className="fw-semibold">{file.name || 'Untitled file'}</div>
                                                                        {file.mimeType && (
                                                                            <small className="text-muted text-uppercase">{file.mimeType}</small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {file.sourceType ? (
                                                                    <MDBBadge color="info" pill>{file.sourceType}</MDBBadge>
                                                                ) : (
                                                                    <span className="text-muted">Upload</span>
                                                                )}
                                                            </td>
                                                            <td>{formatFileSize(file.size)}</td>
                                                            <td>
                                                                {file.uploadedAt
                                                                    ? new Date(file.uploadedAt).toLocaleString()
                                                                    : '—'}
                                                            </td>
                                                            <td>
                                                                {file.url ? (
                                                                    <a
                                                                        href={file.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="btn btn-sm btn-outline-primary"
                                                                    >
                                                                        <MDBIcon icon="external-link-alt" size="sm" className="me-1" />
                                                                        View
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-muted">N/A</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </MDBTableBody>
                                            </MDBTable>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <MDBIcon icon="globe" className="text-primary" />
                                        Crawled Website Pages
                                        <MDBBadge color="primary" pill>{mergedWebsites.length}</MDBBadge>
                                    </h5>
                                    {mergedWebsites.length === 0 ? (
                                        <p className="text-muted mb-0">No website pages have been crawled for this chatbot.</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <MDBTable align='middle' hover small>
                                                <MDBTableHead>
                                                    <tr>
                                                        <th>URL</th>
                                                        <th>Status</th>
                                                        <th>Last Crawled</th>
                                                        <th>Length</th>
                                                    </tr>
                                                </MDBTableHead>
                                                <MDBTableBody>
                                                    {mergedWebsites.map((page, index) => (
                                                        <tr key={page.id || `${page.url}-${index}`}>
                                                            <td style={{ maxWidth: '320px' }}>
                                                                <div className="d-flex flex-column">
                                                                    <a href={page.url} target="_blank" rel="noopener noreferrer">
                                                                        {page.url}
                                                                    </a>
                                                                    {page.title && (
                                                                        <small className="text-muted">{page.title}</small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {page.status ? (
                                                                    <MDBBadge
                                                                        color={
                                                                            page.status === 'COMPLETED'
                                                                                ? 'success'
                                                                                : page.status === 'FAILED'
                                                                                    ? 'danger'
                                                                                    : 'secondary'
                                                                        }
                                                                        pill
                                                                    >
                                                                        {page.status}
                                                                    </MDBBadge>
                                                                ) : (
                                                                    <span className="text-muted">Pending</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {page.lastCrawledAt
                                                                    ? new Date(page.lastCrawledAt).toLocaleString()
                                                                    : '—'}
                                                            </td>
                                                            <td>
                                                                {page.contentLength
                                                                    ? `${page.contentLength.toLocaleString()} chars`
                                                                    : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </MDBTableBody>
                                            </MDBTable>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <MDBIcon icon="sticky-note" className="text-success" />
                                        Text Snippets
                                        <MDBBadge color="primary" pill>{mergedTexts.length}</MDBBadge>
                                    </h5>
                                    {mergedTexts.length === 0 ? (
                                        <p className="text-muted mb-0">No custom text snippets have been added.</p>
                                    ) : (
                                        <div className="list-group">
                                            {mergedTexts.map((text, index) => (
                                                <div className="list-group-item" key={`text-${index}`}>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="mb-1">Snippet {index + 1}</h6>
                                                        <small className="text-muted">{text.length} chars</small>
                                                    </div>
                                                    <p className="mb-0 text-muted" style={{
                                                        whiteSpace: 'pre-wrap',
                                                        maxHeight: '120px',
                                                        overflow: 'auto'
                                                    }}>
                                                        {text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h5 className="mb-3 d-flex align-items-center gap-2">
                                        <MDBIcon icon="question-circle" className="text-info" />
                                        Q&A Pairs
                                        <MDBBadge color="primary" pill>{mergedQAPairs.length}</MDBBadge>
                                    </h5>
                                    {mergedQAPairs.length === 0 ? (
                                        <p className="text-muted mb-0">No Q&A pairs configured for this chatbot.</p>
                                    ) : (
                                        <div className="accordion" id="qaAccordion">
                                            {mergedQAPairs.map((qa, index) => (
                                                <div className="accordion-item" key={`qa-${index}`}>
                                                    <h2 className="accordion-header" id={`qa-heading-${index}`}>
                                                        <button
                                                            className="accordion-button collapsed"
                                                            type="button"
                                                            data-bs-toggle="collapse"
                                                            data-bs-target={`#qa-collapse-${index}`}
                                                            aria-expanded="false"
                                                            aria-controls={`qa-collapse-${index}`}
                                                        >
                                                            {qa.question}
                                                        </button>
                                                    </h2>
                                                    <div
                                                        id={`qa-collapse-${index}`}
                                                        className="accordion-collapse collapse"
                                                        aria-labelledby={`qa-heading-${index}`}
                                                        data-bs-parent="#qaAccordion"
                                                    >
                                                        <div className="accordion-body">
                                                            {qa.answer}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
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

    if (isLoading) {
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
                        <MDBBtn onClick={() => setIsEditing(true)} color="primary" className="d-flex align-items-center gap-2">
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
                            <label className="form-label">Message</label>
                            {isEditing ? (
                                <MDBTextArea
                                    rows={4}
                                    value={editedChatbot?.message || ''}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, message: e.target.value } : null
                                        )
                                    }
                                />
                            ) : (
                                <p className="mb-0">{chatbot.message || 'No message'}</p>
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
                                />
                            ) : (
                                <p className="mb-0">{chatbot.fallbackMessage || 'No fallback message set'}</p>
                            )}
                        </MDBCol>

                        <MDBCol md="12" className="mb-3">
                            <label className="form-label">Restrict to Datasource and Knowledgebase</label>
                            {isEditing ? (
                                <MDBSwitch
                                    checked={editedChatbot?.restrictDataSource || false}
                                    onChange={(e) =>
                                        setEditedChatbot((prev) =>
                                            prev ? { ...prev, restrictDataSource: e.target.checked } : null
                                        )
                                    }
                                    label="Restrict replies to only use datasource and knowledgebase content"
                                />
                            ) : (
                                <p className="mb-0">
                                    <span
                                        style={{
                                            padding: '4px 12px',
                                            backgroundColor: chatbot.restrictDataSource ? '#d1fae5' : '#f3f4f6',
                                            color: chatbot.restrictDataSource ? '#065f46' : '#6b7280',
                                            borderRadius: '16px',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {chatbot.restrictDataSource ? 'Enabled' : 'Disabled'}
                                    </span>
                                </p>
                            )}
                        </MDBCol>

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
    width: ${(isEditing ? editedChatbot?.embedWidth : chatbot?.embedWidth) ?? 380},
    height: ${(isEditing ? editedChatbot?.embedHeight : chatbot?.embedHeight) ?? 600}
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
                                                    const width = (isEditing ? editedChatbot?.embedWidth : chatbot?.embedWidth) ?? 380;
                                                    const height = (isEditing ? editedChatbot?.embedHeight : chatbot?.embedHeight) ?? 600;
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
                                                alert('API information copied to clipboard!');
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
                                        onChange={(e) => {
                                            const enabled = e.target.checked;
                                            setEditedChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: enabled } : prev);
                                            setChatbot((prev) => prev ? { ...prev, enableWhatsappIntegration: enabled } : prev);
                                            if (enabled) {
                                                setTimeout(() => setShowWhatsappModal(true), 120);
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
                                        onChange={(e) => {
                                            const enabled = e.target.checked;
                                            setEditedChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: enabled } : prev);
                                            setChatbot((prev) => prev ? { ...prev, enableFacebookIntegration: enabled } : prev);
                                            if (enabled) {
                                                setTimeout(() => setShowFacebookModal(true), 120);
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
                        <MDBModalBody className="pt-2">
                            <MDBTabs pills>
                                <MDBTabsItem>
                                    <MDBTabsLink
                                        onClick={() => setActiveChannelTab('whatsapp')}
                                        active={activeChannelTab === 'whatsapp'}
                                    >
                                        <MDBIcon icon="whatsapp" className="me-2 text-success" />
                                        WhatsApp
                                    </MDBTabsLink>
                                </MDBTabsItem>
                                <MDBTabsItem>
                                    <MDBTabsLink
                                        onClick={() => setActiveChannelTab('slack')}
                                        active={activeChannelTab === 'slack'}
                                    >
                                        <MDBIcon icon="slack" className="me-2 text-info" />
                                        Slack <span className="text-muted">(coming soon)</span>
                                    </MDBTabsLink>
                                </MDBTabsItem>
                                <MDBTabsItem>
                                    <MDBTabsLink
                                        onClick={() => setActiveChannelTab('custom')}
                                        active={activeChannelTab === 'custom'}
                                    >
                                        <MDBIcon icon="plug" className="me-2 text-primary" />
                                        Custom Webhook <span className="text-muted">(coming soon)</span>
                                    </MDBTabsLink>
                                </MDBTabsItem>
                            </MDBTabs>

                            <MDBTabsContent className="mt-4">
                                <MDBTabsPane show={activeChannelTab === 'whatsapp'}>
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
                                                Webhook Verify Token <span className="text-danger">*</span>
                                            </label>
                                            <MDBInput
                                                placeholder="Enter webhook verify token..."
                                                value={whatsappForm.webhookVerifyToken}
                                                onChange={(e) => handleWhatsappInputChange('webhookVerifyToken', e.target.value)}
                                                className={whatsappErrors.webhookVerifyToken ? 'is-invalid' : ''}
                                            />
                                            <small className="text-muted">
                                                A secure token for webhook verification.
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
                                </MDBTabsPane>
                                <MDBTabsPane show={activeChannelTab === 'slack'}>
                                    <div className="text-center text-muted py-5">
                                        <MDBIcon icon="slack" size="3x" className="mb-3 text-info" />
                                        <h5>Slack integration coming soon</h5>
                                        <p>We are working on Slack support. Stay tuned!</p>
                                    </div>
                                </MDBTabsPane>
                                <MDBTabsPane show={activeChannelTab === 'custom'}>
                                    <div className="text-center text-muted py-5">
                                        <MDBIcon icon="plug" size="3x" className="mb-3 text-primary" />
                                        <h5>Custom webhook integration coming soon</h5>
                                        <p>Bring your own channel by registering a custom webhook.</p>
                                    </div>
                                </MDBTabsPane>
                            </MDBTabsContent>
                        </MDBModalBody>
                        <MDBModalFooter className="border-0">
                            <MDBBtn color="secondary" outline onClick={handleCloseWhatsappModal}>
                                Cancel
                            </MDBBtn>
                            <MDBBtn
                                color="primary"
                                style={{ minWidth: '160px' }}
                                onClick={handleSaveWhatsappConfiguration}
                            >
                                <MDBIcon icon="plus" className="me-2" />
                                Add Channel
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
                            >
                                <MDBIcon icon="plus" className="me-2" />
                                Add Channel
                            </MDBBtn>
                        </MDBModalFooter>
                    </MDBModalContent>
                </MDBModalDialog>
            </MDBModal>
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
                            {filteredConversations.map((conversation) => (
                                <div key={conversation.id} className="history-card">
                                    <div className="history-card-id">{conversation.id}</div>
                                    <div>
                                        <h5>{conversation.title}</h5>
                                        <p>{conversation.preview}</p>
                                    </div>
                                    <div className="history-meta">
                                        <span>{conversation.messageCount} messages</span>
                                        <span>{conversation.updatedAt}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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

                .history-card-id {
                    font-size: 12px;
                    font-weight: 700;
                    color: #2563eb;
                    background: rgba(37, 99, 235, 0.12);
                    padding: 6px 12px;
                    border-radius: 999px;
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
                            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
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
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '16px' }}>{chatbot.name || 'Chatbot'}</div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>Live widget preview</div>
                            </div>
                        </div>
                        <MDBBadge color="success" pill style={{ backgroundColor: 'rgba(16, 185, 129, 0.9)', fontWeight: 600 }}>
                            online
                        </MDBBadge>
                    </div>
                    <div style={{ flex: 1, padding: '18px', overflow: 'auto', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div
                            style={{
                                backgroundColor: '#0f172a',
                                borderRadius: '18px',
                                padding: '16px 18px',
                                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.25)',
                                color: '#E2E8F0',
                                fontSize: '14px',
                                lineHeight: 1.7,
                            }}
                        >
                            <strong style={{ color: '#60a5fa' }}>Hello!</strong> This is a live size preview of your chatbot widget.
                            <br />
                            Adjust the width and height values above to instantly update this preview. The widget will use these dimensions when embedded on your site.
                        </div>
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


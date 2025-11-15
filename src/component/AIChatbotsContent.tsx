import React, { useState, useEffect } from 'react';
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

export default function AIChatbotsContent({ activeItem, embedOrigin: externalOrigin }: AIChatbotsContentProps) {
    const [showCreationForm, setShowCreationForm] = useState(false);
    const [chatbots, setChatbots] = useState<any[]>([]);
    const [isLoadingChatbots, setIsLoadingChatbots] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [expandedChatbotId, setExpandedChatbotId] = useState<string | null>(null);
    const [copyStates, setCopyStates] = useState<Record<string, 'idle' | 'copied' | 'error'>>({});
    const [resolvedOrigin, setResolvedOrigin] = useState<string>(externalOrigin || '');
    const router = useRouter();
    
    // Clerk Authentication
    const { isSignedIn } = useUser();
    const { getToken } = useAuth();

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
                addedTexts: chatbotData.addedTexts || []
            };

            // Process QA pairs - remove internal id field
            if (chatbotData.qaPairs && chatbotData.qaPairs.length > 0) {
                processedData.qaPairs = chatbotData.qaPairs.map((qa: any) => ({
                    question: qa.question,
                    answer: qa.answer
                }));
            }

            console.log('Processed chatbot data:', processedData);
            
            // Prepare headers with authentication if user is signed in
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add bearer token if user is signed in
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
            
            // Refresh the chatbots list
            await fetchChatbots();
            
            // Close the form on success
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

    // Fetch chatbots from API
    const fetchChatbots = async () => {
        setIsLoadingChatbots(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            
            // Prepare headers with authentication if user is signed in
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add bearer token if user is signed in
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
            
            // Handle different response formats
            // Expected backend response format: List<ChatBotCreationResponse>
            // Could be wrapped in { data: [...] } or return array directly
            let chatbotList = [];
            if (Array.isArray(result)) {
                chatbotList = result;
            } else if (result.data && Array.isArray(result.data)) {
                chatbotList = result.data;
            } else if (result.chatbots && Array.isArray(result.chatbots)) {
                chatbotList = result.chatbots;
            }
            
            setChatbots(chatbotList);
            
        } catch (error) {
            console.error('Error fetching chatbots:', error);
        } finally {
            setIsLoadingChatbots(false);
        }
    };

    // Fetch chatbots on component mount and when activeItem changes
    useEffect(() => {
        if (activeItem === 'dashboard' || activeItem === 'chatbots') {
            fetchChatbots();
        }
    }, [activeItem]);

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

    // Handle enable/disable toggle
    const handleToggleEnabled = async (chatbotId: string, currentStatus: string) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
            
            // Prepare headers with authentication
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

    const renderDashboardContent = () => (
        <>
            {/* AI Chatbots Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '32px'
            }}>
                <div>
                    <h1 style={{ 
                        fontSize: '32px', 
                        fontWeight: '700', 
                        color: '#111827', 
                        margin: '0 0 8px 0' 
                    }}>
                        Dashboard
                    </h1>
                    <p style={{ 
                        fontSize: '16px', 
                        color: '#6b7280', 
                        margin: '0' 
                    }}>
                        An overview of your account statistics.
                    </p>
                </div>
                
                        {/* New Chatbot Button */}
                        <MDBBtn
                            color="dark"
                            outline
                            onClick={handleCreateChatbot}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                border: '1px solid #111827',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <MDBIcon icon="plus" size="sm" />
                            New Chatbot
                        </MDBBtn>
            </div>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {/* All Conversations Card */}
                <div className="stat-card" style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280',
                            margin: '0'
                        }}>
                            All Conversations
                        </h3>
                        <a href="#" style={{
                            fontSize: '12px',
                            color: '#111827',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}>
                            See all &gt;
                        </a>
                    </div>
                    <div style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1'
                    }}>
                        0
                    </div>
                </div>

                {/* Total Users Card */}
                <div className="stat-card" style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280',
                            margin: '0'
                        }}>
                            Total users
                        </h3>
                    </div>
                    <div style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1'
                    }}>
                        0
                    </div>
                </div>

                {/* Total Active Bots Card */}
                <div className="stat-card" style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280',
                            margin: '0'
                        }}>
                            Total active bots
                        </h3>
                        <a href="#" style={{
                            fontSize: '12px',
                            color: '#111827',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}>
                            See all &gt;
                        </a>
                    </div>
                    <div style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1'
                    }}>
                        {chatbots.length}
                    </div>
                </div>
            </div>

            {/* Your Chatbots Section */}
            <div>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 24px 0'
                }}>
                    Your Chatbots
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
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '32px',
                        alignItems: 'stretch'
                    }}>
                        {chatbots.map((chatbot, index) => {
                            const totalConversations =
                                chatbot.totalConversations ??
                                chatbot.conversationCount ??
                                chatbot.conversations ??
                                0;
                            const totalMessages =
                                chatbot.totalMessages ??
                                chatbot.messageCount ??
                                chatbot.messages ??
                                0;

                            const isExpanded = expandedChatbotId === chatbot.id;

                            return (
                                <div
                                    key={chatbot.id || index}
                                    style={{
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '20px',
                                        padding: '28px',
                                        background: '#FFFFFF',
                                        boxShadow: '0 18px 32px rgba(15, 23, 42, 0.04)',
                                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    onClick={() => handleChatbotClick(chatbot.id)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 22px 45px rgba(15, 23, 42, 0.08)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: isExpanded ? 'rgba(226, 232, 240, 0.28)' : 'transparent',
                                            opacity: isExpanded ? 1 : 0,
                                            transition: 'opacity 0.2s ease',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ display: 'flex', gap: '16px', flex: '1 1 auto' }}>
                                            <div
                                                style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    borderRadius: '18px',
                                                    background: '#F3F4F6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.3)',
                                                }}
                                            >
                                                <MDBIcon icon="robot" size="lg" className="text-muted" />
                                            </div>
                                            <div>
                                                <h3
                                                    style={{
                                                        fontSize: '20px',
                                                        fontWeight: 700,
                                                        color: '#0f172a',
                                                        margin: '0 0 6px',
                                                        letterSpacing: '-0.01em',
                                                    }}
                                                >
                                                    {chatbot.title || chatbot.name || `Chatbot ${index + 1}`}
                                                </h3>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                                                    Created on{' '}
                                                    {chatbot.createdAt
                                                        ? new Date(chatbot.createdAt).toLocaleDateString(undefined, {
                                                              day: 'numeric',
                                                              month: 'long',
                                                              year: 'numeric',
                                                          })
                                                        : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '12px', color: '#4b5563' }}>
                                                {chatbot.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                            </span>
                                            <MDBSwitch
                                                checked={chatbot.status === 'ACTIVE'}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleEnabled(chatbot.id, chatbot.status);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                            gap: '18px',
                                            paddingTop: '20px',
                                            marginTop: '20px',
                                            borderTop: '1px solid #E5E7EB',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '18px 12px',
                                                borderRight: '1px solid #E5E7EB',
                                            }}
                                        >
                                            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.1em', fontWeight: 600 }}>
                                                Total Conversations
                                            </span>
                                            <span style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                                                {totalConversations.toLocaleString()}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '18px 12px',
                                            }}
                                        >
                                            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.1em', fontWeight: 600 }}>
                                                Total Messages
                                            </span>
                                            <span style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                                                {totalMessages.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                    <div style={{
                                        marginTop: '18px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(17, 24, 39, 0.25)',
                                        backgroundColor: '#1F2937',
                                        color: '#F9FAFB',
                                        padding: '20px',
                                        position: 'relative',
                                        boxShadow: '0 18px 38px rgba(15, 23, 42, 0.35)',
                                    }}>
                                        <pre style={{
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontSize: '13px',
                                            lineHeight: 1.7,
                                            fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
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
                                                fontSize: '12px'
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleCopyEmbed(chatbot.id);
                                            }}
                                        >
                                            <MDBIcon icon={copyStates[chatbot.id] === 'copied' ? 'check' : 'copy'} size="sm" />
                                            {copyStates[chatbot.id] === 'copied'
                                                ? 'Copied'
                                                : copyStates[chatbot.id] === 'error'
                                                    ? 'Copy Failed'
                                                    : 'Copy'}
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
                            Looks like you don't have any chatbot. Click on the button above to create your first bot.
                        </p>
                    </div>
                )}
            </div>
        </>
    );

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

    // Error Modal Component
    const renderErrorModal = () => (
        <MDBModal open={showErrorModal} setOpen={setShowErrorModal} tabIndex='-1'>
            <MDBModalDialog centered>
                <MDBModalContent>
                    <MDBModalHeader style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        borderBottom: 'none',
                        padding: '20px 24px'
                    }}>
                        <MDBModalTitle style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <MDBIcon icon="exclamation-triangle" className="me-2" />
                            Validation Errors
                        </MDBModalTitle>
                    </MDBModalHeader>
                    <MDBModalBody style={{ padding: '24px' }}>
                        <p style={{ 
                            marginBottom: '16px', 
                            color: '#6b7280',
                            fontSize: '14px'
                        }}>
                            Please fix the following errors before creating your chatbot:
                        </p>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }}>
                            {validationErrors.map((error, index) => (
                                <li key={index} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    marginBottom: '12px',
                                    padding: '12px',
                                    backgroundColor: '#fef2f2',
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #dc2626'
                                }}>
                                    <MDBIcon 
                                        icon="circle" 
                                        className="text-danger me-3 mt-1" 
                                        style={{ fontSize: '8px', flexShrink: 0 }}
                                    />
                                    <span style={{ 
                                        color: '#991b1b',
                                        fontSize: '14px',
                                        lineHeight: '1.5'
                                    }}>
                                        {error}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </MDBModalBody>
                    <MDBModalFooter>
                        <MDBBtn 
                            color="danger" 
                            onClick={() => setShowErrorModal(false)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: '500'
                            }}
                        >
                            Close
                        </MDBBtn>
                    </MDBModalFooter>
                </MDBModalContent>
            </MDBModalDialog>
        </MDBModal>
    );

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
        </>
    );
}

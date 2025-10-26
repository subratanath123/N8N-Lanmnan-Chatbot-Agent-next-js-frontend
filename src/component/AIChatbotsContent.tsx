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
} from 'mdb-react-ui-kit';
import ChatbotCreationForm from './ChatbotCreationForm';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface AIChatbotsContentProps {
    activeItem: string;
}

export default function AIChatbotsContent({ activeItem }: AIChatbotsContentProps) {
    const [showCreationForm, setShowCreationForm] = useState(false);
    const [chatbots, setChatbots] = useState<any[]>([]);
    const [isLoadingChatbots, setIsLoadingChatbots] = useState(false);
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
            
            // Convert File objects to base64 strings for JSON serialization
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
                uploadedFiles: [] as Array<{ name: string; size: number; type: string; content: string }>,
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

            // Convert File objects to base64 if they exist
            if (chatbotData.uploadedFiles && chatbotData.uploadedFiles.length > 0) {
                for (const file of chatbotData.uploadedFiles) {
                    if (file instanceof File) {
                        const base64 = await fileToBase64(file);
                        processedData.uploadedFiles.push({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            content: base64
                        });
                    }
                }
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
                throw new Error(errorData.errorMessage || `Failed to create chatbot: ${response.status}`);
            }

            const result = await response.json();
            console.log('Chatbot created successfully:', result);
            
            // Refresh the chatbots list
            await fetchChatbots();
            
            // Close the form on success
            setShowCreationForm(false);
            
            // You could add a success notification here
            alert('Chatbot created successfully!');
            
        } catch (error) {
            console.error('Error creating chatbot:', error);
            alert(error instanceof Error ? error.message : 'Failed to create chatbot. Please try again.');
        }
    };

    // Helper function to convert File to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove the data:application/pdf;base64, prefix if present
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to convert file to base64'));
            reader.readAsDataURL(file);
        });
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
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {chatbots.map((chatbot, index) => (
                            <div
                                key={chatbot.id || index}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    backgroundColor: 'white',
                                    transition: 'box-shadow 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <h3 
                                        onClick={() => handleChatbotClick(chatbot.id)}
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#111827',
                                            margin: '0',
                                            cursor: 'pointer'
                                        }}>
                                        {chatbot.title || chatbot.name || `Chatbot ${index + 1}`}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Enabled</span>
                                        <MDBSwitch
                                            checked={chatbot.status === 'ACTIVE'}
                                            onChange={(e) => handleToggleEnabled(chatbot.id, chatbot.status)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                {chatbot.message && (
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#6b7280',
                                        margin: '0 0 12px 0',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {chatbot.message}
                                    </p>
                                )}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    color: '#6b7280'
                                }}>
                                    {chatbot.createdAt && (
                                        <span>{new Date(chatbot.createdAt).toLocaleDateString()}</span>
                                    )}
                                    <span style={{
                                        padding: '4px 8px',
                                        backgroundColor: chatbot.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6',
                                        color: chatbot.status === 'ACTIVE' ? '#065f46' : '#6b7280',
                                        borderRadius: '4px',
                                        fontWeight: '500'
                                    }}>
                                        {chatbot.status || 'UNKNOWN'}
                                    </span>
                                </div>
                            </div>
                        ))}
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

    // If showing creation form, render it
    if (showCreationForm) {
        return (
            <ChatbotCreationForm
                onCancel={handleCancelCreation}
                onSubmit={handleSubmitChatbot}
            />
        );
    }

    switch (activeItem) {
        case 'dashboard':
            return renderDashboardContent();
        case 'chatbots':
            return renderChatbotsContent();
        case 'conversations':
            return renderConversationsContent();
        default:
            return renderDefaultContent(activeItem);
    }
}

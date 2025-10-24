import React, { useState } from 'react';
import {
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBIcon,
    MDBBtn,
} from 'mdb-react-ui-kit';
import ChatbotCreationForm from './ChatbotCreationForm';

interface AIChatbotsContentProps {
    activeItem: string;
}

export default function AIChatbotsContent({ activeItem }: AIChatbotsContentProps) {
    const [showCreationForm, setShowCreationForm] = useState(false);

    const handleCreateChatbot = () => {
        setShowCreationForm(true);
    };

    const handleCancelCreation = () => {
        setShowCreationForm(false);
    };

    const handleSubmitChatbot = (chatbotData: any) => {
        console.log('Chatbot data submitted:', chatbotData);
        // Here you would typically send the data to your backend API
        // For now, we'll just close the form and show a success message
        setShowCreationForm(false);
        // You could add a success notification here
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
                        0
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

                {/* Empty State */}
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

'use client';

import React, { useState, useEffect } from 'react';
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
} from 'mdb-react-ui-kit';
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';

interface Chatbot {
    id: string;
    title: string;
    name: string;
    createdAt: string;
    createdBy: string;
    status: string;
    message: string;
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
    
    const { isSignedIn } = useUser();
    const { getToken } = useAuth();

    const handleDrawerStateChange = (isOpen: boolean, activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemHref && itemHref !== '#' && itemHref.startsWith('/')) {
            window.location.href = itemHref;
        }
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

    const displayData = isEditing && editedChatbot ? editedChatbot : chatbot;

    return (
        <div className="full-height-layout">
            <LeftSidebar 
                onDrawerStateChange={handleDrawerStateChange}
                onNavItemClick={handleNavItemClick}
            />
            <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <MDBContainer className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Chatbot Details</h2>
                <div>
                    {!isEditing ? (
                        <MDBBtn onClick={() => setIsEditing(true)} color="primary">
                            <MDBIcon icon="edit" className="me-1" />
                            Edit
                        </MDBBtn>
                    ) : (
                        <>
                            <MDBBtn onClick={handleCancel} color="secondary" className="me-2">
                                Cancel
                            </MDBBtn>
                            <MDBBtn onClick={handleSave} color="success">
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
                                <MDBBtn 
                                    color="primary" 
                                    outline 
                                    onClick={() => {
                                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                        const embedCode = `<script src="${origin}/widget-dist/chat-widget.iife.js"></script>
<script>
  window.initChatWidget({
    chatbotId: "${chatbotId}",
    apiUrl: "${process.env.NEXT_PUBLIC_BACKEND_URL || ''}"
  });
</script>`;
                                        
                                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                            navigator.clipboard.writeText(embedCode).then(() => {
                                                alert('Embed code copied to clipboard!');
                                            }).catch(() => {
                                                alert('Failed to copy embed code. Please select and copy manually.');
                                            });
                                        } else {
                                            alert('Clipboard API not available. Please copy the embed code manually.');
                                        }
                                    }}
                                >
                                    <MDBIcon icon="code" className="me-2" />
                                    Get Embed Code
                                </MDBBtn>
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
                            <div className="border rounded p-3 text-center h-100" style={{ backgroundColor: '#f8f9fa' }}>
                                <MDBIcon icon="whatsapp" size="2x" className="text-success mb-2" />
                                <h6>WhatsApp</h6>
                                <p className="text-muted small mb-3">Connect to WhatsApp Business</p>
                                <MDBSwitch 
                                    id="whatsapp" 
                                    label="Enable"
                                />
                            </div>
                        </MDBCol>

                        {/* Facebook Messenger Integration */}
                        <MDBCol md="4">
                            <div className="border rounded p-3 text-center h-100" style={{ backgroundColor: '#f8f9fa' }}>
                                <MDBIcon icon="facebook" size="2x" className="text-primary mb-2" />
                                <h6>Facebook Messenger</h6>
                                <p className="text-muted small mb-3">Connect to Facebook Messenger</p>
                                <MDBSwitch 
                                    id="facebook" 
                                    label="Enable"
                                />
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
                }
            `}</style>
        </div>
    );
}


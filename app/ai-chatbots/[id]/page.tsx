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
    
    const { isSignedIn } = useUser();
    const { getToken } = useAuth();

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
            alert('Chatbot updated successfully!');
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
            <MDBContainer>
                <MDBCard className="mt-5">
                    <MDBCardBody className="text-center py-5">
                        <p>Loading chatbot details...</p>
                    </MDBCardBody>
                </MDBCard>
            </MDBContainer>
        );
    }

    if (!chatbot) {
        return (
            <MDBContainer>
                <MDBCard className="mt-5">
                    <MDBCardBody className="text-center py-5">
                        <p>Chatbot not found</p>
                        <MDBBtn onClick={() => router.back()}>Go Back</MDBBtn>
                    </MDBCardBody>
                </MDBCard>
            </MDBContainer>
        );
    }

    const displayData = isEditing && editedChatbot ? editedChatbot : chatbot;

    return (
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
        </MDBContainer>
    );
}


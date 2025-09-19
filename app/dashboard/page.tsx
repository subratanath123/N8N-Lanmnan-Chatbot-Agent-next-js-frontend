"use client";

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/component/DashboardLayout';
import LeftSidebar from '@/component/LeftSidebar';
import AIChatbotsContent from '@/component/AIChatbotsContent';
import {
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBIcon,
    MDBBtn
} from 'mdb-react-ui-kit';

export default function DashboardPage() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [showAIChatbots, setShowAIChatbots] = React.useState(false);
    const [activeChatbotItem, setActiveChatbotItem] = React.useState('dashboard');

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleDrawerStateChange = (isOpen: boolean, activeItem: string) => {
        setShowAIChatbots(isOpen);
        setActiveChatbotItem(activeItem);
    };

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #007bff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: '#6c757d', margin: 0 }}>Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <DashboardLayout showNav={true}>
            <div style={{ 
                display: 'flex', 
                width: '100%', 
                height: 'calc(100vh - 60px)', // Account for navigation height
                position: 'relative',
                marginTop: '60px', // Push content below navigation
                backgroundColor: '#f8f9fa' // Match content background
            }}>
                <LeftSidebar onDrawerStateChange={handleDrawerStateChange} />
                
                {/* Main content area */}
                <div style={{
                    flex: 1,
                    marginLeft: showAIChatbots ? '260px' : '60px', // Start right after collapsed sidebar when no drawer
                    padding: '20px',
                    minHeight: 'calc(100vh - 60px)', // Account for navigation height
                    backgroundColor: '#f8f9fa',
                    transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflowX: 'hidden',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {showAIChatbots ? (
                        <AIChatbotsContent activeItem={activeChatbotItem} />
                    ) : (
                        <>
                            <h3 className="mb-4 fw-bold">Unleash the power of Artificial Intelligence</h3>

                            {/* Statistic Cards */}
                            <MDBRow className="mb-4">
                                <MDBCol md="4">
                                    <MDBCard className="h-100 shadow-sm">
                                        <MDBCardBody>
                                            <MDBCardTitle className="text-muted small">Number of Documents Made</MDBCardTitle>
                                            <h2 className="text-primary fw-bold">70</h2>
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                                <MDBCol md="4">
                                    <MDBCard className="h-100 shadow-sm">
                                        <MDBCardBody>
                                            <MDBCardTitle className="text-muted small">Amount of Images Created</MDBCardTitle>
                                            <h2 className="text-success fw-bold">94</h2>
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                                <MDBCol md="4">
                                    <MDBCard className="h-100 shadow-sm">
                                        <MDBCardBody>
                                            <MDBCardTitle className="text-muted small">Amount of Codes Written</MDBCardTitle>
                                            <h2 className="text-info fw-bold">84</h2>
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                            </MDBRow>

                            {/* Usage Statistics Graph */}
                            <MDBCard className="shadow-sm">
                                <MDBCardBody>
                                    <MDBCardTitle className="mb-3 fw-bold">Usage Statistics</MDBCardTitle>
                                    <div style={{ 
                                        height: '300px', 
                                        backgroundColor: '#f8f9fa', 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center', 
                                        color: '#6c757d', 
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef'
                                    }}>
                                        {/* Placeholder for the actual graph component */}
                                        <div className="text-center">
                                            <MDBIcon icon="chart-line" size="4x" className="text-muted mb-3" />
                                            <p className="text-muted">Usage Statistics Graph</p>
                                            <small className="text-muted">Chart visualization will be implemented here</small>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between mt-3 flex-wrap align-items-center">
                                        <div className="d-flex flex-wrap gap-3">
                                            <small className="text-muted d-flex align-items-center">
                                                <MDBIcon icon="circle" className="text-primary me-1" style={{ fontSize: '8px' }} />
                                                Documents
                                            </small>
                                            <small className="text-muted d-flex align-items-center">
                                                <MDBIcon icon="circle" className="text-success me-1" style={{ fontSize: '8px' }} />
                                                Codes
                                            </small>
                                            <small className="text-muted d-flex align-items-center">
                                                <MDBIcon icon="circle" className="text-info me-1" style={{ fontSize: '8px' }} />
                                                Images
                                            </small>
                                            <small className="text-muted d-flex align-items-center">
                                                <MDBIcon icon="circle" className="text-warning me-1" style={{ fontSize: '8px' }} />
                                                Chats
                                            </small>
                                        </div>
                                        <small className="text-muted fw-bold">Aug 2025</small>
                                    </div>
                                </MDBCardBody>
                            </MDBCard>
                        </>
                    )}
                </div>
            </div>
            
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </DashboardLayout>
    );
}

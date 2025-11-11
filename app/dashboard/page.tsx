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
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleDrawerStateChange = (isOpen: boolean, activeItem: string, collapsed?: boolean) => {
        setShowAIChatbots(isOpen);
        setActiveChatbotItem(activeItem);
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        // Handle AI Chatbots click to show the AIChatbotsContent
        if (itemName === 'AI Chatbots') {
            setShowAIChatbots(true);
            setActiveChatbotItem('dashboard');
        } else if (itemName === 'Dashboard') {
            // Return to main dashboard
            setShowAIChatbots(false);
            setActiveChatbotItem('dashboard');
        } else {
            // For other items, you can add routing logic here
            console.log(`Clicked on ${itemName} with href: ${itemHref}`);
        }
    };

    return (
        <DashboardLayout>
            {isLoading ? (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: 'calc(100vh - 72px)',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div className="loading-spinner" />
                    <p className="loading-text">Loading Dashboard...</p>
                </div>
            ) : (
        <div className="full-height-layout">
            <LeftSidebar 
                onDrawerStateChange={handleDrawerStateChange}
                onNavItemClick={handleNavItemClick}
            />
            
            {/* Main content area */}
            <div className={`main-content ${showAIChatbots ? 'with-drawer' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    {showAIChatbots ? (
                        <AIChatbotsContent activeItem={activeChatbotItem} />
                    ) : (
                        <>
                            {/* Welcome Section */}
                            <div className="welcome-section">
                                <h1 className="welcome-title">Welcome User</h1>
                                <p className="welcome-subtitle">User Dashboard</p>
                            </div>

                            {/* Add New Section */}
                            <div className="mb-5">
                                <h4 style={{ 
                                    fontSize: '1.25rem', 
                                    fontWeight: '600', 
                                    color: '#212529',
                                    marginBottom: '1.5rem'
                                }}>
                                    Add New
                                </h4>
                                <MDBRow>
                                    <MDBCol md="4" className="mb-3">
                                        <MDBCard 
                                            className="h-100 shadow-sm" 
                                            style={{ 
                                                border: '1px solid #e9ecef',
                                                borderRadius: '8px',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                setShowAIChatbots(true);
                                                setActiveChatbotItem('chatbots');
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                                            }}
                                        >
                                            <MDBCardBody className="text-center p-4">
                                                <MDBIcon 
                                                    icon="robot" 
                                                    style={{ 
                                                        fontSize: '2rem', 
                                                        marginBottom: '1rem',
                                                        color: '#007BFF'
                                                    }} 
                                                />
                                                <h5 style={{ fontWeight: '600', color: '#212529', marginBottom: '0.5rem' }}>Create New Chatbot</h5>
                                                <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>Build your AI chatbot</p>
                                            </MDBCardBody>
                                        </MDBCard>
                                    </MDBCol>
                                    <MDBCol md="4" className="mb-3">
                                        <MDBCard 
                                            className="h-100 shadow-sm" 
                                            style={{ 
                                                border: '1px solid #e9ecef',
                                                borderRadius: '8px',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                setShowAIChatbots(true);
                                                setActiveChatbotItem('chatbots');
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                                            }}
                                        >
                                            <MDBCardBody className="text-center p-4">
                                                <MDBIcon 
                                                    icon="comments" 
                                                    style={{ 
                                                        fontSize: '2rem', 
                                                        marginBottom: '1rem',
                                                        color: '#007BFF'
                                                    }} 
                                                />
                                                <h5 style={{ fontWeight: '600', color: '#212529', marginBottom: '0.5rem' }}>Create New Chatbot</h5>
                                                <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>Build your AI chatbot</p>
                                            </MDBCardBody>
                                        </MDBCard>
                                    </MDBCol>
                                    <MDBCol md="4" className="mb-3">
                                        <MDBCard className="h-100 shadow-sm" style={{ 
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                                        }}>
                                            <MDBCardBody className="text-center p-4">
                                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
                                                <h5 style={{ fontWeight: '600', color: '#212529', marginBottom: '0.5rem' }}>Blog Post</h5>
                                                <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>Create engaging blog content</p>
                                            </MDBCardBody>
                                        </MDBCard>
                                    </MDBCol>
                                </MDBRow>
                            </div>

                            {/* Information Cards */}
                            <MDBRow className="mb-4">
                                <MDBCol md="6" className="mb-3">
                                    <MDBCard className="h-100 shadow-sm" style={{ 
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px'
                                    }}>
                                        <MDBCardBody className="p-4">
                                            <h5 style={{ fontWeight: '600', color: '#212529', marginBottom: '1rem' }}>Your Wallet Balance</h5>
                                            <h2 style={{ fontWeight: '700', color: '#28A745', marginBottom: '1rem' }}>$0.00</h2>
                                            <MDBBtn color="success" size="sm" style={{ 
                                                backgroundColor: '#28A745',
                                                border: 'none',
                                                borderRadius: '8px'
                                            }}>
                                                My Wallet &gt;
                                            </MDBBtn>
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                                <MDBCol md="6" className="mb-3">
                                    <MDBCard className="h-100 shadow-sm" style={{ 
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px'
                                    }}>
                                        <MDBCardBody className="p-4">
                                            <h5 style={{ fontWeight: '600', color: '#212529', marginBottom: '1rem' }}>Total Referral Earning</h5>
                                            <h2 style={{ fontWeight: '700', color: '#007BFF', marginBottom: '1rem' }}>$0.00</h2>
                                            <MDBBtn color="primary" size="sm" style={{ 
                                                backgroundColor: '#007BFF',
                                                border: 'none',
                                                borderRadius: '8px'
                                            }}>
                                                Invite & Earn &gt;
                                            </MDBBtn>
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                            </MDBRow>

                            {/* Time Saved Card */}
                            <MDBRow className="mb-4">
                                <MDBCol md="6" className="mb-3">
                                    <MDBCard className="h-100 shadow-sm" style={{ 
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px'
                                    }}>
                                        <MDBCardBody className="p-4">
                                            <h5 style={{ fontWeight: '600', color: '#212529', marginBottom: '1rem' }}>Total Time Saved</h5>
                                            <h2 style={{ fontWeight: '700', color: '#212529', marginBottom: '1rem' }}>3,619 Hours</h2>
                                            <div style={{ 
                                                height: '60px', 
                                                backgroundColor: '#F8F9FA', 
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#6c757d'
                                            }}>
                                                📊 Bar Chart Visualization
                                            </div>
                                        </MDBCardBody>
                                    </MDBCard>
                                </MDBCol>
                                <MDBCol md="6" className="mb-3">
                                    <MDBCard className="h-100 shadow-sm" style={{ 
                                        backgroundColor: '#2654C4',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#ffffff'
                                    }}>
                                        <MDBCardBody className="p-4">
                                            <h5 style={{ fontWeight: '600', marginBottom: '1rem' }}>No Active Plan</h5>
                                            <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1rem' }}>
                                                {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
                                            </p>
                                            <div className="mb-3">
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    marginBottom: '0.5rem' 
                                                }}>
                                                    <span style={{ fontSize: '0.875rem' }}>words left</span>
                                                    <span style={{ fontSize: '0.875rem' }}>Remaining</span>
                                        </div>
                                                <div style={{ 
                                                    width: '100%', 
                                                    height: '8px', 
                                                    backgroundColor: 'rgba(255,255,255,0.2)', 
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{ 
                                                        width: '30%', 
                                                        height: '100%', 
                                                        backgroundColor: '#007BFF',
                                                        borderRadius: '4px'
                                                    }}></div>
                                    </div>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    marginTop: '0.5rem' 
                                                }}>
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Used</span>
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Remaining</span>
                                        </div>
                                    </div>
                                            <MDBBtn color="primary" size="sm" style={{ 
                                                backgroundColor: '#007BFF',
                                                border: 'none',
                                                borderRadius: '8px',
                                                width: '100%'
                                            }}>
                                                    Upgrade Your Plan &gt;
                                            </MDBBtn>
                                </MDBCardBody>
                            </MDBCard>
                                </MDBCol>
                            </MDBRow>
                        </>
                    )}
                </div>
            
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007BFF;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                .loading-text {
                    color: #6c757d;
                    margin: 0;
                }
                
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
                
                .main-content.with-drawer {
                    margin-left: 260px;
                }
                
                .main-content.collapsed {
                    margin-left: 60px;
                }
                
                .main-content.collapsed.with-drawer {
                    margin-left: 60px;
                }
                
                .welcome-section {
                    margin-bottom: 2rem;
                }
                
                .welcome-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #212529;
                    margin-bottom: 0.5rem;
                }
                
                .welcome-subtitle {
                    font-size: 1rem;
                    color: #6c757d;
                    margin: 0;
                }
                
                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 0;
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
            )}
        </DashboardLayout>
    );
}

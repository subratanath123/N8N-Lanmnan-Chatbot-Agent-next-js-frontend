"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardNav from './DashboardNav';
import Header from './Header';
import './dashboard.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
    showNav?: boolean;
}

export default function DashboardLayout({ children, showNav = true }: DashboardLayoutProps) {
    const { isSignedIn, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div className="loading-spinner" />
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-layout" style={{ minHeight: '100vh' }}>
            {isSignedIn && showNav ? (
                <DashboardNav />
            ) : (
                <Header />
            )}
            
            <main className="dashboard-main" style={{ 
                paddingTop: isSignedIn && showNav ? '0' : '0',
                minHeight: 'calc(100vh - 56px)'
            }}>
                {children}
            </main>
            
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
                
                .dashboard-layout {
                    background-color: #F8F9FA;
                }
                
                .dashboard-main {
                    background-color: #ffffff;
                }
                
                @media (max-width: 768px) {
                    .dashboard-main {
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
}

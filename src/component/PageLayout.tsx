"use client";

import React from 'react';
import DashboardNav from './DashboardNav';

interface PageLayoutProps {
    children: React.ReactNode;
    showNav?: boolean;
}

export default function PageLayout({ children, showNav = true }: PageLayoutProps) {
    return (
        <div className="page-layout" style={{
            minHeight: '100vh',
            backgroundColor: '#f8f9fa'
        }}>
            {showNav && <DashboardNav />}
            <div className="page-content" style={{
                padding: '20px',
                minHeight: 'calc(100vh - 60px)',
                backgroundColor: '#f8f9fa'
            }}>
                {children}
            </div>
        </div>
    );
}

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import AIChatbotsContent from './AIChatbotsContentLoader';
import PageHeader from "@/component/PageHeader";

export default function AIChatbotsPage() {
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'AI Chatbots') {
            return;
        }

        if (itemHref && itemHref !== '#') {
            router.push(itemHref);
        }
    };

    const embedOrigin = useMemo(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return '';
        }
        return window.location.origin;
    }, []);

    return (
        <div className="full-height-layout">
            <LeftSidebar 
                onDrawerStateChange={handleDrawerStateChange}
                onNavItemClick={handleNavItemClick}
            />

            <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <PageHeader
                    breadcrumb={['Chatbot Creation']}
                    title="AI Chatbot"
                    subtitle="Create, manage and deploy intelligent chatbots for your business"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    }
                />
                <AIChatbotsContent activeItem="dashboard" embedOrigin={embedOrigin} />
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
                    background-color: #F8F9FA;
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

 
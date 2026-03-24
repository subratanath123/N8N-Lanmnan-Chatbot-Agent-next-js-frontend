"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    MDBListGroup,
    MDBListGroupItem,
    MDBIcon,
    MDBBtn
} from 'mdb-react-ui-kit';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import './dashboard-sidebar.css';
import { appConfig } from '@/lib/config';
import TopBar from './TopBar';

interface NavigationItem {
    name: string;
    icon: string;
    href: string;
    hasArrow?: boolean;
    children?: NavigationItem[];
}

interface NavigationSection {
    title: string;
    items: NavigationItem[];
}

interface LeftSidebarProps {
    onDrawerStateChange?: (isOpen: boolean, activeItem: string, collapsed?: boolean) => void;
    onNavItemClick?: (itemName: string, itemHref: string) => void;
}

interface Chatbot { chatbotId: string; name: string; }

export default function LeftSidebar({ onDrawerStateChange, onNavItemClick }: LeftSidebarProps) {
    const [darkMode, setDarkMode] = useState(false);
    const pathname = usePathname() || '';
    const router = useRouter();
    const { getToken } = useAuth();
    const { isSignedIn } = useUser();

    /* ── Workflow picker state ── */
    const [workflowOpen, setWorkflowOpen] = useState(false);
    const [chatbots, setChatbots] = useState<Chatbot[]>([]);
    const [loadingBots, setLoadingBots] = useState(false);
    const [botsError, setBotsError] = useState(false);
    const fetchedRef = useRef(false);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    const fetchChatbots = useCallback(async () => {
        if (fetchedRef.current) return;        // only fetch once per mount
        fetchedRef.current = true;
        setLoadingBots(true);
        setBotsError(false);
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (isSignedIn && getToken) {
                const t = await getToken();
                if (t) headers['Authorization'] = `Bearer ${t}`;
            }
            const res = await fetch(`${backendUrl}/v1/api/chatbot/list`, { headers });
            if (!res.ok) throw new Error('failed');
            const data = await res.json();
            const bots: Chatbot[] = (Array.isArray(data) ? data : data.chatbots ?? [])
                .map((b: { chatbotId?: string; id?: string; name?: string }) => ({
                    chatbotId: b.chatbotId || b.id || '',
                    name: b.name || b.chatbotId || b.id || 'Unnamed',
                }))
                .filter((b: Chatbot) => b.chatbotId);
            setChatbots(bots);
        } catch {
            setBotsError(true);
        }
        setLoadingBots(false);
    }, [backendUrl, isSignedIn, getToken]);

    const toggleWorkflow = () => {
        const next = !workflowOpen;
        setWorkflowOpen(next);
        if (next) fetchChatbots();
    };


    const sidebarItems = [
        { name: 'Dashboard', icon: '🏠', href: '/dashboard', active: false },
        { name: 'AI Article wizard', icon: '✍️', href: '#', hasArrow: true },
        { name: 'AI Chat', icon: '💬', href: '/chat' },
        { name: 'AI Writer', icon: '✏️', href: '#' },
        { name: 'AI Images', icon: '🖼️', href: '#' },
        { name: 'Social Media Suite', icon: '📱', href: '#' },
        { name: 'AI Textract', icon: '📝', href: '#' },
        { name: 'Subscription Plans', icon: '💳', href: '#' },
        { name: 'Ai Chatbot', icon: '🤖', href: '#', isSpecial: true },
    ];

    const isWorkflowActive = pathname.includes('/workflow');

    const navigationSections: NavigationSection[] = [
        {
            title: 'AI PANEL',
            items: [
                { name: 'Dashboard', icon: 'home', href: '/dashboard' },
            ]
        },
        {
            title: 'YOUR CHATBOTS',
            items: [
                { name: 'AI Chatbots', icon: 'robot', href: '/ai-chatbots' },
            ]
        },
        {
            title: 'CONTENT CREATION',
            items: [
                { name: 'All Templates', icon: 'magic', href: '/content-creation/templates' },
                { name: 'Ads & Marketing', icon: 'trending-up', href: '/content-creation/templates?category=Ads%20%26%20Marketing' },
                { name: 'Articles & Blogs', icon: 'file-text', href: '/content-creation/templates?category=Articles%20%26%20Blogs' },
                { name: 'E-commerce', icon: 'shopping-cart', href: '/content-creation/templates?category=E-commerce' },
                { name: 'General Writing', icon: 'edit', href: '/content-creation/templates?category=General%20Writing' },
                { name: 'Jobs & Companies', icon: 'briefcase', href: '/content-creation/templates?category=Jobs%20%26%20Companies' },
                { name: 'Profile & Bio', icon: 'user', href: '/content-creation/templates?category=Profile%20%26%20Bio' },
                { name: 'SEO & Web', icon: 'globe', href: '/content-creation/templates?category=SEO%20%26%20Web' },
            ]
        },
        {
            title: 'AI CHAT',
            items: [
                { name: 'AI Chat', icon: 'comments', href: '/ai-chat' },
            ]
        },
        {
            title: 'AI SOCIAL MEDIA',
            items: [
                { name: 'Social Media Suite', icon: 'share-alt', href: '/social-media-suite' },
                { name: 'Assets', icon: 'image', href: '/social-media-suite/assets' },
            ]
        },
        {
            title: 'CONTENT ANALYSIS',
            items: [
                { name: 'Plagiarism', icon: 'file-alt', href: '/content-analysis/plagiarism' },
                { name: 'AI Detector', icon: 'robot', href: '/content-analysis/ai-detector' },
            ]
        },
        {
            title: 'ACCOUNT',
            items: [
                { name: 'Subscription Plans', icon: 'credit-card', href: '/subscription' },
            ]
        }
    ];

    return (
        <>
        <TopBar />
        <div 
            className="dashboard-sidebar"
            style={{ 
                width: '280px',
                border: 'none',
            }}
        >
            <div className="dashboard-sidebar-header">
                <h5 className="fw-bold mb-0 text-center">{appConfig.chatbotName}</h5>
            </div>

            <div className="sidebar-navigation">
                <MDBListGroup flush>
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="navigation-section">
                            <div className="section-title">{section.title}</div>

                            {section.items.map((item, index) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                                return (
                                    <React.Fragment key={index}>
                                        <MDBListGroupItem
                                            action
                                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                router.push(item.href);
                                                if (onNavItemClick) onNavItemClick(item.name, item.href);
                                            }}
                                            style={{
                                                backgroundColor: isActive ? 'rgba(99, 145, 255, 0.15)' : 'transparent',
                                                boxShadow: isActive ? 'inset 3px 0 0 #6391ff' : 'none',
                                                border: 'none', color: '#ffffff',
                                                padding: '9px 18px', cursor: 'pointer',
                                                borderRadius: '8px', margin: '1px 8px',
                                            }}
                                        >
                                            <MDBIcon icon={item.icon} className="me-2" />
                                            <span className="sidebar-text">{item.name}</span>
                                        </MDBListGroupItem>

                                        {/* ── Workflow picker — injected right after AI Chatbots ── */}
                                        {item.href === '/ai-chatbots' && (
                                            <div style={{ margin: '1px 8px' }}>
                                                {/* Workflow nav button */}
                                                <button
                                                    onClick={toggleWorkflow}
                                                    style={{
                                                        width: '100%', display: 'flex', alignItems: 'center',
                                                        gap: '10px', padding: '9px 18px', border: 'none',
                                                        borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                                                        fontSize: '14px', fontWeight: 500, fontFamily: 'inherit',
                                                        backgroundColor: workflowOpen || isWorkflowActive
                                                            ? 'rgba(99, 145, 255, 0.15)' : 'transparent',
                                                        boxShadow: workflowOpen || isWorkflowActive
                                                            ? 'inset 3px 0 0 #6391ff' : 'none',
                                                        color: '#fff',
                                                        transition: 'background 0.15s',
                                                    }}
                                                >
                                                    {/* bolt icon */}
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.85 }}>
                                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                                    </svg>
                                                    <span className="sidebar-text" style={{ flex: 1 }}>Workflow</span>
                                                    {/* chevron */}
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                        style={{ opacity: 0.5, transform: workflowOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </button>

                                                {/* Chatbot picker dropdown */}
                                                {workflowOpen && (
                                                    <div style={{
                                                        margin: '4px 0 4px 20px',
                                                        borderLeft: '2px solid rgba(99,145,255,0.3)',
                                                        paddingLeft: '10px',
                                                    }}>
                                                        {loadingBots && (
                                                            <div style={{ padding: '8px 10px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                                    style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                                                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                                                </svg>
                                                                Loading…
                                                            </div>
                                                        )}

                                                        {botsError && !loadingBots && (
                                                            <div style={{ padding: '8px 10px', fontSize: '11.5px', color: 'rgba(255,100,100,0.8)' }}>
                                                                Failed to load chatbots.{' '}
                                                                <button onClick={() => { fetchedRef.current = false; fetchChatbots(); }}
                                                                    style={{ background: 'none', border: 'none', color: 'rgba(99,145,255,0.9)', cursor: 'pointer', fontSize: '11.5px', padding: 0, textDecoration: 'underline' }}>
                                                                    Retry
                                                                </button>
                                                            </div>
                                                        )}

                                                        {!loadingBots && !botsError && chatbots.length === 0 && (
                                                            <div style={{ padding: '8px 10px', fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                                                                No chatbots found
                                                            </div>
                                                        )}

                                                        {!loadingBots && chatbots.map(bot => {
                                                            const wfPath = `/ai-chatbots/${bot.chatbotId}/workflow`;
                                                            const isBotActive = pathname === wfPath;
                                                            return (
                                                                <button key={bot.chatbotId}
                                                                    onClick={() => {
                                                                        router.push(wfPath);
                                                                        if (onNavItemClick) onNavItemClick('Workflow', wfPath);
                                                                    }}
                                                                    style={{
                                                                        width: '100%', display: 'flex', alignItems: 'center',
                                                                        gap: '8px', padding: '7px 10px', border: 'none',
                                                                        borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                                                                        fontSize: '12.5px', fontWeight: isBotActive ? 700 : 400,
                                                                        fontFamily: 'inherit',
                                                                        backgroundColor: isBotActive ? 'rgba(99,145,255,0.18)' : 'transparent',
                                                                        color: isBotActive ? '#a5b4fc' : 'rgba(255,255,255,0.72)',
                                                                        transition: 'background 0.12s, color 0.12s',
                                                                    }}
                                                                    onMouseEnter={e => {
                                                                        if (!isBotActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.07)';
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        if (!isBotActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                                                                    }}
                                                                >
                                                                    {/* tiny robot dot */}
                                                                    <span style={{ fontSize: '11px', flexShrink: 0 }}>🤖</span>
                                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {bot.name}
                                                                    </span>
                                                                    {isBotActive && (
                                                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="#a5b4fc" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                                                                            <circle cx="12" cy="12" r="8" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}

                                                        {/* Quick link to chatbot list */}
                                                        <button
                                                            onClick={() => router.push('/ai-chatbots')}
                                                            style={{
                                                                width: '100%', display: 'flex', alignItems: 'center',
                                                                gap: '6px', padding: '6px 10px', marginTop: '4px',
                                                                border: '1px dashed rgba(99,145,255,0.3)', borderRadius: '6px',
                                                                cursor: 'pointer', fontSize: '11.5px', fontFamily: 'inherit',
                                                                backgroundColor: 'transparent', color: 'rgba(99,145,255,0.75)',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '11px' }}>+</span>
                                                            Manage chatbots
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ))}
                </MDBListGroup>
            </div>

            {/* Footer with Dark Mode */}
            <div className="dashboard-sidebar-footer">
                <div className="dark-mode-toggle">
                    <span>Dark Mode</span>
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={darkMode} 
                            onChange={() => setDarkMode(!darkMode)}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>
            
        </div>
        </>
    );
}


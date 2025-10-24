"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MDBListGroup,
    MDBListGroupItem,
    MDBIcon,
    MDBBtn
} from 'mdb-react-ui-kit';
import './dashboard-sidebar.css';

interface NavigationItem {
    name: string;
    icon: string;
    href: string;
    active?: boolean;
    hasArrow?: boolean;
}

interface NavigationSection {
    title: string;
    items: NavigationItem[];
}

interface LeftSidebarProps {
    onDrawerStateChange?: (isOpen: boolean, activeItem: string, collapsed?: boolean) => void;
    onNavItemClick?: (itemName: string, itemHref: string) => void;
}

export default function LeftSidebar({ onDrawerStateChange, onNavItemClick }: LeftSidebarProps) {
    const [darkMode, setDarkMode] = useState(false);


    const sidebarItems = [
        { name: 'Dashboard', icon: '🏠', href: '/dashboard', active: false },
        { name: 'Documents', icon: '📄', href: '#', hasArrow: true },
        { name: 'AI Article wizard', icon: '✍️', href: '#', hasArrow: true },
        { name: 'AI Chat', icon: '💬', href: '/chat' },
        { name: 'AI Writer', icon: '✏️', href: '#' },
        { name: 'AI Images', icon: '🖼️', href: '#' },
        { name: 'Social Media Suite', icon: '📱', href: '#' },
        { name: 'AI Textract', icon: '📝', href: '#' },
        { name: 'Subscription Plans', icon: '💳', href: '#' },
        { name: 'Ai Chatbot', icon: '🤖', href: '#', isSpecial: true },
    ];

    const navigationSections: NavigationSection[] = [
        {
            title: 'AI PANEL',
            items: [
                { name: 'Dashboard', icon: 'home', href: '/dashboard', active: false },
                { name: 'Documents', icon: 'file-text', href: '/documents' },
                { name: 'AI Chatbots', icon: 'robot', href: '/ai-chatbots', active: true },
            ]
        },
        {
            title: 'AI CHAT',
            items: [
                { name: 'AI Chat', icon: 'comments', href: '/chat' },
                { name: 'AI Realtime Voice Chat', icon: 'microphone', href: '/ai-voice-chat' },
                { name: 'AI File Chat', icon: 'file-alt', href: '/ai-file-chat' },
                { name: 'AI Web Chat', icon: 'globe', href: '/ai-web-chat' },
            ]
        },
        {
            title: 'ACCOUNT',
            items: [
                { name: 'Subscription Plans', icon: 'credit-card', href: '#' },
            ]
        }
    ];

    return (
        <div 
            className="dashboard-sidebar"
            style={{ 
                width: '280px',
                backgroundColor: '#2654C4',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
        >
            <div className="dashboard-sidebar-header">
                <h5 className="fw-bold mb-0 text-center">Jade AI</h5>
            </div>

            <div className="sidebar-navigation">
                <MDBListGroup flush>
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="navigation-section">
                            <div className="section-title">
                                {section.title}
                            </div>
                            {section.items.map((item, index) => (
                                <MDBListGroupItem
                                    key={index}
                                    action
                                    className={`sidebar-item ${item.active ? 'active' : ''}`}
                                    onClick={() => {
                                        if (onNavItemClick) {
                                            onNavItemClick(item.name, item.href);
                                        }
                                    }}
                                    style={{ 
                                        backgroundColor: item.active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                        border: 'none',
                                        color: '#ffffff',
                                        padding: '10px 20px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <MDBIcon icon={item.icon} className="me-2" />
                                    <span className="sidebar-text">{item.name}</span>
                                </MDBListGroupItem>
                            ))}
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
    );
}


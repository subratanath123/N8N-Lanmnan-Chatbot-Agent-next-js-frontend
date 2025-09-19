"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AIChatbotDrawer from './AIChatbotDrawer';
import './dashboard-sidebar.css';

interface LeftSidebarProps {
    onDrawerStateChange?: (isOpen: boolean, activeItem: string) => void;
}

export default function LeftSidebar({ onDrawerStateChange }: LeftSidebarProps) {
    const [darkMode, setDarkMode] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showAIChatbotDrawer, setShowAIChatbotDrawer] = useState(false);
    const [activeChatbotItem, setActiveChatbotItem] = useState('dashboard');

    const handleAIChatbotClick = () => {
        setCollapsed(true);
        setShowAIChatbotDrawer(true);
        // Notify parent component
        if (onDrawerStateChange) {
            onDrawerStateChange(true, activeChatbotItem);
        }
    };

    const handleDrawerClose = () => {
        setShowAIChatbotDrawer(false);
        setCollapsed(false);
        // Notify parent component
        if (onDrawerStateChange) {
            onDrawerStateChange(false, activeChatbotItem);
        }
    };

    const handleChatbotItemClick = (itemId: string) => {
        setActiveChatbotItem(itemId);
        // Notify parent component
        if (onDrawerStateChange) {
            onDrawerStateChange(showAIChatbotDrawer, itemId);
        }
    };

    const handleMainNavClick = (item: any) => {
        // If AI Chatbot drawer is open and we're clicking on a main nav item, close the drawer
        if (showAIChatbotDrawer && item.name !== 'Ai Chatbot') {
            handleDrawerClose();
        }
    };

    // Notify parent when state changes
    useEffect(() => {
        if (onDrawerStateChange) {
            onDrawerStateChange(showAIChatbotDrawer, activeChatbotItem);
        }
    }, [showAIChatbotDrawer, activeChatbotItem, onDrawerStateChange]);

    const sidebarItems = [
        { name: 'Dashboard', icon: '🏠', href: '/dashboard', active: false },
        { name: 'Pre-built Templates', icon: '⊞', href: '#' },
        { name: 'Long Article', icon: '✏️', href: '#' },
        { name: 'Image Maker', icon: '🖼️', href: '#' },
        { name: 'Video Maker', icon: '▶️', href: '#' },
        { name: 'Text To Video', icon: '📝', href: '#' },
        { name: 'Code Writer', icon: '</>', href: '#' },
        { name: 'Speech to Text', icon: '🎤', href: '#' },
        { name: 'Voiceover', icon: '🔊', href: '#' },
        { name: 'Chat', icon: '💬', href: '/chat' },
        { name: 'Ai Chatbot', icon: '🤖', href: '#', isSpecial: true },
        { name: 'Plagiarism', icon: '🔍', href: '#' },
        { name: 'Ai Detector', icon: '👁️', href: '#' },
        { name: 'Voice Clone', icon: '⚠️', href: '#' },
        { name: 'Ai Persona', icon: '⭐', href: '#' },
        { name: 'Ai Avatar', icon: '👤', href: '#' },
    ];

    return (
        <div className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Header with collapse button */}
            <div className="dashboard-sidebar-header">
                {!collapsed && <h5 className="fw-bold">Dashboard</h5>}
                <button 
                    className="collapse-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? '»' : '«'}
                </button>
            </div>

            {/* Navigation Items */}
            <div className="sidebar-navigation">
                {sidebarItems.map((item, index) => {
                    if (item.isSpecial && item.name === 'Ai Chatbot') {
                        return (
                            <button
                                key={index}
                                onClick={handleAIChatbotClick}
                                className="sidebar-item"
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                {!collapsed && <span className="sidebar-text">{item.name}</span>}
                            </button>
                        );
                    }
                    
                    // For Dashboard item, handle click to close drawer if open
                    if (item.name === 'Dashboard') {
                        return (
                            <button
                                key={index}
                                onClick={() => handleMainNavClick(item)}
                                className={`sidebar-item ${item.active ? 'active' : ''}`}
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                {!collapsed && <span className="sidebar-text">{item.name}</span>}
                            </button>
                        );
                    }
                    
                    return (
                        <Link 
                            key={index}
                            href={item.href}
                            className={`sidebar-item ${item.active ? 'active' : ''}`}
                            onClick={() => handleMainNavClick(item)}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            {!collapsed && <span className="sidebar-text">{item.name}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* Footer with Dark Mode */}
            <div className="dashboard-sidebar-footer">
                <div className="dark-mode-toggle">
                    {!collapsed && <span>Dark Mode</span>}
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
            
            {/* AI Chatbot Drawer */}
            <AIChatbotDrawer 
                isOpen={showAIChatbotDrawer}
                onClose={handleDrawerClose}
                activeItem={activeChatbotItem}
                onItemClick={handleChatbotItemClick}
            />
        </div>
    );
}


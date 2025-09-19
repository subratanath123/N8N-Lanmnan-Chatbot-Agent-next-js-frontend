"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useClerk } from "@clerk/nextjs";

interface AIChatbotDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeItem?: string;
    onItemClick?: (itemId: string) => void;
}

export default function AIChatbotDrawer({ isOpen, onClose, activeItem = 'dashboard', onItemClick }: AIChatbotDrawerProps) {
    const { signOut } = useClerk();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Disable click-outside-to-close functionality
    // Users should only close the drawer using the close button or main sidebar
    // useEffect(() => {
    //     const handleClickOutside = (event: MouseEvent) => {
    //         if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
    //             onClose();
    //         }
    //     };

    //     if (isOpen) {
    //         document.addEventListener('mousedown', handleClickOutside);
    //     }

    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, [isOpen, onClose]);

    const chatbotItems = [
        { name: 'Dashboard', icon: '📊', id: 'dashboard' },
        { name: 'Chatbots', icon: '🤖', id: 'chatbots' },
        { name: 'Conversations', icon: '💬', id: 'conversations' },
        { name: 'Test', icon: '🎯', id: 'test' },
        { name: 'AI Training', icon: '🧠', id: 'training' },
        { name: 'Customizations', icon: '🎨', id: 'customizations' },
    ];

    const handleLogout = () => {
        signOut();
    };

    return (
        <div ref={drawerRef} className={`ai-chatbot-drawer ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="drawer-header">
                <h5 className="drawer-title">AI Chatbots</h5>
                <button 
                    className="drawer-close-btn"
                    onClick={onClose}
                    title="Close drawer"
                >
                    «
                </button>
            </div>

            {/* Navigation */}
            <div className="drawer-navigation">
                {chatbotItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onItemClick && onItemClick(item.id)}
                        className={`drawer-item ${activeItem === item.id ? 'active' : ''}`}
                    >
                        <span className="drawer-icon">{item.icon}</span>
                        <span className="drawer-text">{item.name}</span>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="drawer-footer">
                <button 
                    onClick={handleLogout}
                    className="drawer-item logout-item"
                >
                    <span className="drawer-icon">➡️</span>
                    <span className="drawer-text">Logout</span>
                </button>
            </div>
        </div>
    );
}

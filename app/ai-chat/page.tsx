"use client";

import React, { useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect, useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import AIAssistantsShowcase from '@/component/AIAssistantsShowcase';

export default function AIChatPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) {
      setSidebarCollapsed(collapsed);
    }
  };

  const handleNavItemClick = (itemName: string, itemHref: string) => {
    if (itemName === 'AI Chat') {
      return;
    }
    if (itemHref && itemHref !== '#') {
      router.push(itemHref);
    }
  };

  const embedOrigin = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.location.origin;
  }, []);

  if (!isLoaded) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#6b7280',
        }}
      >
        Loading chat assistants…
      </div>
    );
  }

  if (!isSignedIn) {
    redirect('/');
  }

  return (
    <div className="full-height-layout">
      <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <section
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.08em' }}>
              AI CHAT ASSISTANTS
            </span>
            <h1 style={{ fontSize: '34px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Choose Your Assistant
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0, maxWidth: '640px' }}>
              Browse our curated collection of AI companions. Click any assistant to launch the chat widget instantly
              and start a conversation without leaving this page.
            </p>
          </div>
        </section>

        <AIAssistantsShowcase />
      </div>

      <style jsx>{`
        .full-height-layout {
          display: flex;
          width: 100%;
          height: 100vh;
          position: relative;
          background-color: #f8f9fa;
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

        .main-content.collapsed {
          margin-left: 60px;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}


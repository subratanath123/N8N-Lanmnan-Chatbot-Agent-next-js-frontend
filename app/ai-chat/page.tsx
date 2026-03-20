"use client";

import React, { useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect, useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import AIAssistantsShowcase from '@/component/AIAssistantsShowcase';
import PageHeader from '@/component/PageHeader';

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
        <PageHeader
          breadcrumb={['Home', 'AI Chat']}
          title="Choose Your Assistant"
          subtitle="Browse our curated collection of AI companions. Click any assistant to start a conversation instantly."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="#2563eb" /><circle cx="12" cy="10" r="1" fill="#2563eb" /><circle cx="15" cy="10" r="1" fill="#2563eb" />
            </svg>
          }
        />

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


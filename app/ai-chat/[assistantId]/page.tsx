"use client";

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import LeftSidebar from '@/component/LeftSidebar';
import AssistantChatWindow from '@/component/AssistantChatWindow';
import { assistants } from '@/component/AIAssistantsShowcase';
import { redirect } from 'next/navigation';

const assistantProfiles = assistants.reduce<
  Record<
    string,
    {
      chatbotId: string;
      name: string;
      title: string;
      description: string;
      avatar: string;
      accentColor?: string;
      backgroundGradient?: string;
    }
  >
>((acc, assistant) => {
  acc[assistant.id] = {
    chatbotId: assistant.chatbotId,
    name: assistant.name,
    title: assistant.title,
    description:
      assistant.description ||
      'Your AI assistant is ready to collaborate, brainstorm, and support your day-to-day workflows.',
    avatar: assistant.avatar,
    accentColor: assistant.accentColor,
    backgroundGradient: assistant.backgroundGradient,
  };
  return acc;
}, {});

export default function AssistantChatPage() {
  const { assistantId } = useParams<{ assistantId: string }>();
  const assistant = assistantId ? assistantProfiles[assistantId] : undefined;
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) {
      setSidebarCollapsed(collapsed);
    }
  };

  const handleNavItemClick = (itemName: string, itemHref: string) => {
    if (itemHref && itemHref !== '#') {
      router.push(itemHref);
    }
  };

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL || '', []);

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
        Loading assistant…
      </div>
    );
  }

  if (!isSignedIn) {
    redirect('/');
  }

  if (!assistant) {
    redirect('/ai-chat');
  }

  return (
    <div className="full-height-layout">
      <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 16px 32px rgba(15, 23, 42, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 16px 30px rgba(15, 23, 42, 0.15)',
              }}
            >
              <img
                src={assistant.avatar}
                alt={assistant.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                {assistant.name}
              </h1>
              <p style={{ margin: '0 0 12px 0', color: '#4b5563', fontSize: '15px', fontWeight: 500 }}>
                {assistant.title}
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '15px', lineHeight: 1.6 }}>{assistant.description}</p>
            </div>
            <button
              onClick={() => router.push('/ai-chat')}
              style={{
                background: '#f1f5f9',
                color: '#1f2937',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                padding: '10px 18px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              ← Back to assistants
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
            }}
          >
            <AssistantChatWindow
              chatbotId={assistant.chatbotId}
              apiUrl={apiUrl}
              assistantName={assistant.name}
              assistantTitle={assistant.title}
              assistantAvatar={assistant.avatar}
              accentColor={assistant.accentColor}
              backgroundGradient={assistant.backgroundGradient}
            />
          </div>
        </div>
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


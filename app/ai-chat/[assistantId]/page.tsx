"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import LeftSidebar from '@/component/LeftSidebar';
import DashboardNav from '@/component/DashboardNav';
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
  const { getToken } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [isNewConversationMode, setIsNewConversationMode] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [conversations, setConversations] = useState<Array<{
    id: string;
    title: string;
    messageCount: number;
    updatedAt: string;
    preview: string;
  }>>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [newConversationKey, setNewConversationKey] = useState<string>('');
  const fetchConversationListRef = useRef(false);

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

  // Interface for UserChatHistory
  interface UserChatHistory {
    id: string;
    email: string;
    conversationid: string;
    userMessage: string;
    createdAt: string;
    aiMessage: string;
    mode: string;
    isAnonymous: boolean;
  }

  // Function to get conversation list
  const fetchConversationList = useCallback(async () => {
    if (!assistant?.chatbotId || !apiUrl) return;
    
    // Prevent duplicate calls
    if (fetchConversationListRef.current) {
      console.log('fetchConversationList - Already fetching, skipping duplicate call');
      return;
    }
    
    fetchConversationListRef.current = true;
    setIsLoadingConversations(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Always try to get token - endpoint requires authentication
      if (getToken) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Page fetchConversationList - Authorization header added with token');
          } else {
            console.warn('Page fetchConversationList - getToken returned null/undefined');
          }
        } catch (error) {
          console.error('Page fetchConversationList - Failed to get auth token:', error);
          throw new Error('Authentication required but token could not be retrieved');
        }
      } else {
        console.warn('Page fetchConversationList - No getToken function provided, request may fail');
      }

      console.log('Page fetchConversationList - Request headers:', headers);
      const response = await fetch(`${apiUrl}/v1/api/n8n/authenticated/chatHistory/${assistant.chatbotId}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserChatHistory[] = await response.json();
      
      // Group by conversationid and create conversation list
      const conversationMap = new Map<string, UserChatHistory[]>();
      data.forEach((item) => {
        const convId = item.conversationid;
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, []);
        }
        conversationMap.get(convId)!.push(item);
      });

      // Convert to conversation list format
      const conversationList = Array.from(conversationMap.entries()).map(([convId, items]) => {
        // Get the first item (which should be the first chat from the conversation)
        const firstItem = items[0];
        const createdAt = new Date(firstItem.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        let updatedAt = '';
        if (diffHours < 1) {
          updatedAt = 'Just now';
        } else if (diffHours < 24) {
          updatedAt = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffDays < 7) {
          updatedAt = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        }

        return {
          id: convId,
          title: firstItem.userMessage?.substring(0, 50) || 'New Conversation',
          messageCount: items.length * 2, // Approximate (user + ai messages)
          updatedAt,
          preview: firstItem.userMessage?.substring(0, 100) || firstItem.aiMessage?.substring(0, 100) || 'No preview available',
        };
      });

      // Sort by most recent first
      conversationList.sort((a, b) => {
        const aTime = data.find(d => d.conversationid === a.id)?.createdAt || '';
        const bTime = data.find(d => d.conversationid === b.id)?.createdAt || '';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationList);
      
      // Set the first conversation as selected if none is selected
      setSelectedConversationId((prev) => {
        if (!prev && conversationList.length > 0) {
          return conversationList[0].id;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching conversation list:', error);
    } finally {
      setIsLoadingConversations(false);
      fetchConversationListRef.current = false;
    }
  }, [assistant?.chatbotId, apiUrl, isSignedIn, getToken]);

  // Fetch conversations on mount and when assistant changes
  useEffect(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  const filteredConversations = useMemo(() => {
    if (!conversationSearch.trim()) {
      return conversations;
    }
    const term = conversationSearch.toLowerCase();
    return conversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(term) ||
        conversation.preview.toLowerCase().includes(term) ||
        conversation.id.toLowerCase().includes(term)
    );
  }, [conversationSearch, conversations]);

  // Wrapper component to get token and pass to AssistantChatWindow
  const AssistantChatWindowWithToken: React.FC<{
    chatbotId: string;
    apiUrl: string;
    assistantName: string;
    assistantTitle?: string;
    assistantAvatar?: string;
    accentColor?: string;
    backgroundGradient?: string;
    conversationId?: string;
    getToken: ReturnType<typeof useAuth>['getToken'];
    isSignedIn: boolean;
  }> = ({ getToken, isSignedIn, ...props }) => {
    return <AssistantChatWindow {...props} getToken={getToken} isSignedIn={isSignedIn} />;
  };

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
    <div className="assistant-page">
      <DashboardNav />
      <div className="layout-body">
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
              display: 'flex',
              gap: '20px',
              alignItems: 'stretch',
            }}
          >
            <div className="conversation-sidebar">
              <div className="conversation-sidebar-header">
                <div className="conversation-search">
                  <span role="img" aria-label="search">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search conversations"
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="conversation-new-btn"
                  onClick={() => setIsNewConversationMode(true)}
                >
                  + New Conversation
                </button>
              </div>
              <div className="conversation-list">
                {isLoadingConversations ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No conversations yet
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const isActive = selectedConversationId === conversation.id && !isNewConversationMode;
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        className={`conversation-list-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedConversationId(conversation.id);
                          setIsNewConversationMode(false);
                        }}
                      >
                        <div className="conversation-title">{conversation.title}</div>
                        <div className="conversation-preview">{conversation.preview}</div>
                        <div className="conversation-meta">
                          <span>{conversation.messageCount} messages</span>
                          <span>{conversation.updatedAt}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="conversation-chat">
              {isNewConversationMode ? (
                <div className="new-conversation-panel">
                  <div className="new-conversation-header">
                    <h3>Start a new conversation</h3>
                    <p>Send a greeting or a starter message to begin the chat.</p>
                  </div>
                  <textarea
                    className="new-conversation-textarea"
                    rows={6}
                    placeholder="Type your opening message..."
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                  />
                  <div className="new-conversation-actions">
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => setIsNewConversationMode(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => {
                        setIsNewConversationMode(false);
                        // Clear conversationId for new conversation - it will be created when first message is sent
                        setSelectedConversationId('');
                        // Generate a new key to force component remount with new sessionId
                        setNewConversationKey(`new-${Date.now()}`);
                        setDraftMessage('');
                      }}
                      disabled={!draftMessage.trim()}
                    >
                      Launch Conversation
                    </button>
                  </div>
                </div>
              ) : (
                <AssistantChatWindowWithToken
                  key={selectedConversationId || newConversationKey || 'new'}
                  chatbotId={assistant.chatbotId}
                  apiUrl={apiUrl}
                  assistantName={assistant.name}
                  assistantTitle={assistant.title}
                  assistantAvatar={assistant.avatar}
                  accentColor={assistant.accentColor}
                  backgroundGradient={assistant.backgroundGradient}
                  conversationId={selectedConversationId || undefined}
                  getToken={getToken}
                  isSignedIn={isSignedIn}
                />
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      <style jsx>{`
        .assistant-page {
          min-height: 100vh;
          background: #f1f5f9;
        }

        .layout-body {
          display: flex;
          width: 100%;
          min-height: calc(100vh - 72px);
          position: relative;
          padding-top: 12px;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 2.5rem;
          min-height: calc(100vh - 72px);
          background-color: #ffffff;
          transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-x: hidden;
          position: relative;
          z-index: 1;
          margin-top: 12px;
          border-radius: 32px 0 0 32px;
          box-shadow: -24px 0 48px rgba(15, 23, 42, 0.06);
        }

        .main-content.collapsed {
          margin-left: 60px;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1.75rem 1.25rem;
            border-radius: 24px;
            box-shadow: none;
          }
          .layout-body {
            flex-direction: column;
            padding-top: 0;
          }
        }

        .conversation-sidebar {
          width: 260px;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 22px;
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .conversation-sidebar-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .conversation-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          font-size: 14px;
          color: #0f172a;
        }

        .conversation-search input {
          border: none;
          background: transparent;
          outline: none;
          flex: 1;
          font-size: 14px;
          color: #0f172a;
        }

        .conversation-new-btn {
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 16px 28px rgba(37, 99, 235, 0.24);
        }

        .conversation-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
        }

        .conversation-list-item {
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 14px;
          background: #ffffff;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .conversation-list-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 22px rgba(15, 23, 42, 0.06);
        }

        .conversation-list-item.active {
          border-color: rgba(37, 99, 235, 0.4);
          box-shadow: 0 16px 28px rgba(37, 99, 235, 0.16);
        }

        .conversation-title {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }

        .conversation-preview {
          font-size: 13px;
          color: #64748b;
        }

        .conversation-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
        }

        .conversation-chat {
          flex: 1;
          min-height: 560px;
        }

        .new-conversation-panel {
          height: 100%;
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 22px 36px rgba(15, 23, 42, 0.08);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .new-conversation-header h3 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .new-conversation-header p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }

        .new-conversation-textarea {
          flex: 1;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 16px;
          font-size: 14px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
        }

        .new-conversation-textarea:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .new-conversation-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .secondary-action {
          border: none;
          background: #f1f5f9;
          color: #1f2937;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .primary-action {
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 16px 28px rgba(37, 99, 235, 0.24);
        }

        .primary-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 1100px) {
          .conversation-sidebar {
            display: none;
          }
          .conversation-chat {
            flex: 1 1 100%;
          }
        }
      `}</style>
    </div>
  );
}


"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';

interface SupportChatLayoutProps {
  children: React.ReactNode;
}

interface SubTab {
  id: string;
  name: string;
  href: string;
}

const subTabs: SubTab[] = [
  { id: 'overview', name: 'Overview', href: '/support-chat' },
  { id: 'conversations', name: 'Conversations', href: '/support-chat/conversations' },
  { id: 'analytics', name: 'Analytics', href: '/support-chat/analytics' },
];

export default function SupportChatLayout({ children }: SupportChatLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => subTabs[0].id);
  const [drawerMode, setDrawerMode] = useState<'new' | 'history' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    const matchedTab = subTabs.find((tab) => pathname.startsWith(tab.href));
    if (matchedTab) {
      setActiveTab(matchedTab.id);
    }
  }, [pathname]);

  const handleOpenDrawer = (mode: 'new' | 'history') => {
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setDrawerMode(null), 250);
  };

  const recentConversations = useMemo(
    () => [
      {
        id: 'CNV-1042',
        customer: 'Liam Johnson',
        summary: 'Billing cycle adjustment requested for enterprise plan.',
        updatedAt: '3 mins ago',
      },
      {
        id: 'CNV-1041',
        customer: 'Sophia Nguyen',
        summary: 'Asked for transcript of previous automated responses.',
        updatedAt: '12 mins ago',
      },
      {
        id: 'CNV-1040',
        customer: 'Noah Bennett',
        summary: 'Needs guidance on deploying website widget to staging.',
        updatedAt: '25 mins ago',
      },
    ],
    []
  );

  return (
    <div className="full-height-layout">
      <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="support-chat-header">
          <div className="support-chat-title">
            <span>Support Chat</span>
            <h1>Customer Messaging Hub</h1>
            <p>Track conversations, evaluate agent performance, and stay ahead of customer requests.</p>
          </div>
          <div className="support-chat-actions">
            <button
              type="button"
              className="support-action-btn primary"
              onClick={() => handleOpenDrawer('new')}
            >
              New Conversation
            </button>
            <button
              type="button"
              className="support-action-btn"
              onClick={() => handleOpenDrawer('history')}
            >
              Conversation History
            </button>
          </div>
        </div>

        <div className="support-tab-bar">
          {subTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`support-tab ${isActive ? 'active' : ''}`}
                onClick={() => router.push(tab.href)}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="support-chat-content">{children}</div>
      </div>

      {isDrawerOpen && <div className="drawer-overlay" onClick={handleCloseDrawer} aria-hidden="true" />}
      <aside className={`support-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div>
            <h3>{drawerMode === 'history' ? 'Conversation History' : 'Start New Conversation'}</h3>
            <p>
              {drawerMode === 'history'
                ? 'Review the latest support interactions handled by the team.'
                : 'Collect customer details and route the request to the right agent.'}
            </p>
          </div>
          <button type="button" className="drawer-close" onClick={handleCloseDrawer} aria-label="Close drawer">
            ×
          </button>
        </div>

        {drawerMode === 'new' && (
          <form className="drawer-form">
            <label>
              Customer Name
              <input type="text" placeholder="Jane Doe" />
            </label>
            <label>
              Email Address
              <input type="email" placeholder="customer@example.com" />
            </label>
            <label>
              Channel
              <select defaultValue="Website widget">
                <option>Website widget</option>
                <option>WhatsApp</option>
                <option>Facebook Messenger</option>
                <option>Email</option>
              </select>
            </label>
            <label>
              Priority
              <select defaultValue="Normal">
                <option>Urgent</option>
                <option>High</option>
                <option>Normal</option>
                <option>Low</option>
              </select>
            </label>
            <label>
              Initial Message
              <textarea rows={4} placeholder="Describe the customer request…" />
            </label>
            <button type="submit" className="drawer-submit">
              Launch Conversation
            </button>
          </form>
        )}

        {drawerMode === 'history' && (
          <div className="drawer-history">
            <div className="history-summary">
              <div>
                <h4>Recent Conversations</h4>
                <span className="history-count">18 active chats</span>
              </div>
              <button type="button">Open Inbox</button>
            </div>
            <div className="history-list">
              {recentConversations.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-id">{item.id}</div>
                  <div>
                    <h5>{item.customer}</h5>
                    <p>{item.summary}</p>
                  </div>
                  <span className="history-updated">{item.updatedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <style jsx>{`
        .full-height-layout {
          display: flex;
          width: 100%;
          min-height: 100vh;
          position: relative;
          background-color: #f8fafc;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          min-height: 100vh;
          background-color: #ffffff;
          transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .main-content.collapsed {
          margin-left: 60px;
        }

        .support-chat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 28px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.06) 100%);
          border: 1px solid rgba(148, 163, 184, 0.2);
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .support-chat-title span {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2563eb;
        }

        .support-chat-title h1 {
          margin: 8px 0 12px;
          font-size: 32px;
          font-weight: 700;
          color: #0f172a;
        }

        .support-chat-title p {
          margin: 0;
          color: #64748b;
          max-width: 540px;
          font-size: 15px;
        }

        .support-chat-actions {
          display: flex;
          gap: 12px;
        }

        .support-action-btn {
          border-radius: 999px;
          border: 1px solid rgba(59, 130, 246, 0.4);
          background: #ffffff;
          color: #2563eb;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .support-action-btn:hover {
          background: rgba(59, 130, 246, 0.08);
        }

        .support-action-btn.primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #1d4ed8;
        }

        .support-action-btn.primary:hover {
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.25);
        }

        .support-tab-bar {
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          margin-bottom: 24px;
        }

        .support-tab {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .support-tab:hover {
          background: rgba(148, 163, 184, 0.15);
        }

        .support-tab.active {
          background: #ffffff;
          color: #1e40af;
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.18);
        }

        .support-chat-content {
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: #ffffff;
          padding: 24px;
          min-height: 520px;
          box-shadow: 0 20px 32px rgba(15, 23, 42, 0.06);
        }

        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(2px);
          z-index: 1080;
        }

        .support-drawer {
          position: fixed;
          top: 0;
          right: -420px;
          width: 420px;
          height: 100%;
          background: #ffffff;
          border-left: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: -24px 0 48px rgba(15, 23, 42, 0.08);
          z-index: 1100;
          display: flex;
          flex-direction: column;
          padding: 28px;
          gap: 24px;
          transition: right 0.28s ease;
        }

        .support-drawer.open {
          right: 0;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .drawer-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .drawer-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .drawer-close {
          border: none;
          background: rgba(148, 163, 184, 0.18);
          color: #0f172a;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
        }

        .drawer-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .drawer-form label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
          color: #475569;
          font-weight: 600;
        }

        .drawer-form input,
        .drawer-form select,
        .drawer-form textarea {
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        .drawer-form input:focus,
        .drawer-form select:focus,
        .drawer-form textarea:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .drawer-submit {
          margin-top: 4px;
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          padding: 14px;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 18px 32px rgba(37, 99, 235, 0.24);
        }

        .drawer-history {
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: 100%;
        }

        .history-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-summary h4 {
          margin: 0;
          font-size: 16px;
          color: #0f172a;
        }

        .history-summary button {
          border: none;
          background: rgba(37, 99, 235, 0.12);
          color: #1d4ed8;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .history-count {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .history-card {
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 16px;
          background: #ffffff;
          box-shadow: 0 14px 26px rgba(15, 23, 42, 0.05);
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
        }

        .history-id {
          font-size: 12px;
          font-weight: 700;
          color: #1d4ed8;
          background: rgba(37, 99, 235, 0.12);
          padding: 6px 10px;
          border-radius: 999px;
        }

        .history-card h5 {
          margin: 0 0 6px;
          font-size: 15px;
          color: #0f172a;
        }

        .history-card p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .history-updated {
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 992px) {
          .support-chat-header {
            padding: 24px;
            flex-direction: column;
          }

          .support-chat-actions {
            width: 100%;
            justify-content: stretch;
          }

          .support-action-btn {
            flex: 1;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1.5rem 1rem;
          }

          .support-chat-content {
            padding: 16px;
          }

          .support-tab-bar {
            flex-direction: column;
          }

          .support-tab {
            width: 100%;
          }

          .support-drawer {
            width: 100%;
            right: ${isDrawerOpen ? '0' : '-100%'};
          }
        }
      `}</style>
    </div>
  );
}


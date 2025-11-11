"use client";

import React, { useEffect, useState } from 'react';
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
            <button type="button" className="support-action-btn primary">
              Create Ticket
            </button>
            <button type="button" className="support-action-btn">
              Settings
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
        }
      `}</style>
    </div>
  );
}


"use client";

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/component/DashboardLayout';
import LeftSidebar from '@/component/LeftSidebar';

const favoriteAssistants = [
  { name: 'Robert Williams', role: 'Life Coach', tag: 'Premium', color: '#9a8cff', bg: '#f4f0ff' },
  { name: 'Barron Wuffle', role: 'Investment Manager', tag: 'Pro', color: '#60a5fa', bg: '#eef5ff' },
  { name: 'Camila Adams', role: 'Screenwriter', color: '#fb7185', bg: '#fff1f2' },
  { name: 'Samantha Phubber', role: 'Relationship Coach', color: '#fbbf24', bg: '#fff7ed' },
];

const templates = [
  { name: 'Video Descriptions', description: 'Write compelling YouTube descriptions to drive engagement.' },
  { name: 'Welcome Email', description: 'Create warm welcome emails for new customers.' },
  { name: 'Amazon Product Description', description: 'Craft conversion-ready Amazon listings.' },
  { name: 'Company Bio', description: 'Design a comprehensive company overview based on your inputs.' },
];

const quickActions = [
  { title: 'Upgrade Plan', description: '187,471 words left · Remaining vs used', theme: '#2563eb' },
  { title: 'Invite & Earn', description: 'Share Davinci and earn rewards on every signup.' },
  { title: 'Blog Post', description: 'Write a long article with full control.' },
  { title: 'Social Media Post', description: 'Create your next viral post effortlessly.' },
];

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) {
      setSidebarCollapsed(collapsed);
    }
  };

  const handleNavItemClick = (_itemName: string, _itemHref: string) => {
    // Navigation handled within sidebar component for dashboard links
  };

  const stats = useMemo(
    () => [
      { label: 'Words Left', value: '43,906,039', accent: '#2563eb' },
      { label: 'Media Credits Left', value: '0', accent: '#0ea5e9' },
      { label: 'Characters Left', value: '49,791,289', accent: '#6366f1' },
      { label: 'Minutes Left', value: '199,988', accent: '#22d3ee' },
    ],
    []
  );

  const totals = useMemo(
    () => [
      { label: 'Words Generated', value: '1,084,650', icon: '📝' },
      { label: 'Documents Saved', value: '12,219 documents', icon: '💾' },
      { label: 'Images Created', value: '10 images', icon: '🖼️' },
      { label: 'Voiceovers', value: '1,400 tasks', icon: '🎙️' },
      { label: 'Audio Transcribed', value: '29 audio files', icon: '🎧' },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="dashboard-shell">
        <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />

        <main className={`dashboard-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <section className="top-grid">
            <div className="plan-card">
              <div className="plan-header">
                <h2>Words Remaining</h2>
                <span className="plan-cta">Upgrade Your Plan</span>
              </div>
              <div className="plan-counter">
                <div>
                  <div className="plan-total">187,471/375</div>
                  <p className="plan-meta">Words Used</p>
                </div>
                <div className="plan-progress">
                  <div className="plan-progress-bar" />
                  <div className="plan-progress-labels">
                    <span>Remaining</span>
                    <span>Used</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              {quickActions.map((action) => (
                <div key={action.title} className="quick-card">
                  <div className="quick-pill" style={{ backgroundColor: action.theme ?? '#f1f5f9' }} />
                  <div>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                  <button type="button">View More</button>
                </div>
              ))}
            </div>
          </section>

          <section className="search-section">
            <div className="search-left">
              <h2>Hey, What can I do for you today?</h2>
              <p>Search for documents, templates and chatbots…</p>
              <div className="search-input">
                <span role="img" aria-label="search">
                  🔍
                </span>
                <input placeholder="Search for documents, templates and chatbots" />
                <button type="button" className="search-voice">
                  🎙️
                </button>
              </div>
            </div>
            <button type="button" className="new-doc-btn">
              + Create a blank document
            </button>
          </section>

          <section className="metrics-row">
            {stats.map((stat) => (
              <div key={stat.label} className="metric-card">
                <span className="metric-label">{stat.label}</span>
                <div className="metric-value" style={{ color: stat.accent }}>
                  {stat.value}
                </div>
                <a href="#" className="metric-link">
                  View All Credits
                </a>
              </div>
            ))}
          </section>

          <section className="usage-section">
            <div className="usage-progress">
              <div className="usage-bar">
                <div className="usage-bar-fill" />
              </div>
              <div className="usage-metrics">
                {totals.map((item) => (
                  <div key={item.label} className="usage-item">
                    <span className="usage-icon">{item.icon}</span>
                    <div>
                      <div className="usage-value">{item.value}</div>
                      <div className="usage-label">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="two-column">
            <div className="assistants-card">
              <div className="section-header">
                <h2>Favorite AI Chat Assistants</h2>
                <button type="button">View all</button>
              </div>
              <div className="assistants-grid">
                {favoriteAssistants.map((assistant) => (
                  <div key={assistant.name} className="assistant-card" style={{ backgroundColor: assistant.bg }}>
                    <div className="assistant-top">
                      <div className="assistant-avatar" style={{ borderColor: assistant.color }}>
                        {assistant.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      {assistant.tag && (
                        <span className="assistant-tag" style={{ backgroundColor: assistant.color }}>
                          {assistant.tag}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3>{assistant.name}</h3>
                      <p>{assistant.role}</p>
                    </div>
                    <button type="button" className="assistant-cta">
                      Open Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="templates-card">
              <div className="section-header">
                <h2>Favorite AI Templates</h2>
                <button type="button">View all</button>
              </div>
              <div className="template-list">
                {templates.map((template) => (
                  <div key={template.name} className="template-item">
                    <div>
                      <h3>{template.name}</h3>
                      <p>{template.description}</p>
                    </div>
                    <button type="button">Open</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        .dashboard-shell {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
        }

        .dashboard-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          background: #f1f5f9;
          transition: margin-left 0.3s ease;
        }

        .dashboard-main.collapsed {
          margin-left: 60px;
        }

        .top-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .plan-card {
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
          color: #fff;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 24px 40px rgba(37, 99, 235, 0.25);
        }

        .plan-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .plan-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .plan-cta {
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
        }

        .plan-counter {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .plan-total {
          font-size: 34px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .plan-meta {
          margin: 4px 0 0;
          font-size: 13px;
          opacity: 0.8;
        }

        .plan-progress {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .plan-progress-bar {
          width: 100%;
          height: 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .plan-progress-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 58%;
          background: #93c5fd;
        }

        .plan-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          opacity: 0.75;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .quick-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: center;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
        }

        .quick-card h3 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }

        .quick-card p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .quick-card button {
          border: none;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 12px;
          cursor: pointer;
        }

        .quick-pill {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(148, 163, 184, 0.2);
        }

        .search-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 26px;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 24px;
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
          margin-bottom: 24px;
        }

        .search-left h2 {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }

        .search-left p {
          margin: 0 0 20px;
          color: #64748b;
          font-size: 14px;
        }

        .search-input {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          border-radius: 999px;
          padding: 12px 18px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .search-input input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14px;
          outline: none;
          color: #0f172a;
        }

        .search-voice {
          border: none;
          background: #ffffff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
        }

        .new-doc-btn {
          border: none;
          background: #1d4ed8;
          color: #ffffff;
          padding: 14px 20px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 20px 30px rgba(29, 78, 216, 0.25);
          cursor: pointer;
          white-space: nowrap;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 18px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .metric-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .metric-value {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .metric-link {
          font-size: 12px;
          color: #1d4ed8;
          text-decoration: none;
          font-weight: 600;
        }

        .usage-section {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.85);
          padding: 22px;
          box-shadow: 0 18px 30px rgba(15, 23, 42, 0.05);
          margin-bottom: 24px;
        }

        .usage-bar {
          width: 100%;
          height: 14px;
          border-radius: 999px;
          background: #e2e8f0;
          margin-bottom: 18px;
          position: relative;
          overflow: hidden;
        }

        .usage-bar-fill {
          position: absolute;
          inset: 0;
          width: 68%;
          background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
        }

        .usage-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }

        .usage-item {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .usage-icon {
          font-size: 20px;
        }

        .usage-value {
          font-weight: 700;
          color: #0f172a;
          font-size: 15px;
        }

        .usage-label {
          font-size: 13px;
          color: #64748b;
        }

        .two-column {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .assistants-card,
        .templates-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 22px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .section-header button {
          border: none;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .assistants-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .assistant-card {
          border-radius: 20px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .assistant-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .assistant-avatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 700;
          color: #0f172a;
          background: #ffffff;
          border-width: 3px;
          border-style: solid;
        }

        .assistant-tag {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          color: #ffffff;
        }

        .assistant-card h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .assistant-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .assistant-cta {
          align-self: flex-start;
          border: none;
          background: #1d4ed8;
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 14px 24px rgba(29, 78, 216, 0.25);
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .template-item {
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .template-item h3 {
          margin: 0 0 6px;
          font-size: 15px;
          color: #0f172a;
        }

        .template-item p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .template-item button {
          border: none;
          background: #ffffff;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #2563eb;
          cursor: pointer;
          box-shadow: 0 12px 20px rgba(37, 99, 235, 0.18);
        }

        @media (max-width: 1280px) {
          .top-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1024px) {
          .metrics-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .two-column {
            grid-template-columns: 1fr;
          }

          .assistants-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
            padding: 1.25rem;
          }

          .search-section {
            flex-direction: column;
            align-items: stretch;
          }

          .new-doc-btn {
            width: 100%;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LeftSidebar from "@/component/LeftSidebar";

interface SubTab {
  id: string;
  name: string;
  href: string;
}

const subTabs: SubTab[] = [
  { id: "create-post", name: "Create Post", href: "/social-media-suite" },
  { id: "my-accounts", name: "My Accounts", href: "/social-media-suite/my-accounts" },
  { id: "post-calendar", name: "Post Calendar", href: "/social-media-suite/post-calendar" },
  { id: "scheduled-posts", name: "Scheduled Posts", href: "/social-media-suite/scheduled-posts" },
  { id: "assets", name: "Assets", href: "/social-media-suite/assets" },
];

export default function SocialMediaSuiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(subTabs[0].id);
  const router = useRouter();
  const pathname = usePathname();

  const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) {
      setSidebarCollapsed(collapsed);
    }
  };

  const handleNavItemClick = (itemName: string, itemHref: string) => {
    if (itemHref && itemHref !== "#") {
      router.push(itemHref);
    }
  };

  useEffect(() => {
    const matchedTab = subTabs.find((tab) =>
      pathname === tab.href || (tab.href !== "/social-media-suite" && pathname.startsWith(tab.href))
    );
    if (matchedTab) {
      setActiveTab(matchedTab.id);
    } else if (pathname === "/social-media-suite") {
      setActiveTab("create-post");
    }
  }, [pathname]);

  return (
    <div className="full-height-layout">
      <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="social-suite-header">
          <div className="social-suite-title">
            <span>AI Social Media</span>
            <h1>AI Social Media Suite</h1>
            <p>Schedule your next viral post with just a few clicks.</p>
          </div>
        </div>

        <div className="social-suite-breadcrumb">User &gt;&gt; AI Social Media Suite</div>

        <div className="social-suite-body">
          <aside className="social-suite-nav">
            {subTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`social-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => router.push(tab.href)}
                >
                  <span className="social-nav-label">{tab.name}</span>
                </button>
              );
            })}
          </aside>

          <div className="social-suite-main">
            {children}
          </div>
        </div>
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

        .social-suite-header {
          padding: 28px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.06) 100%);
          border: 1px solid rgba(148, 163, 184, 0.2);
          margin-bottom: 16px;
        }

        .social-suite-title span {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2563eb;
        }

        .social-suite-title h1 {
          margin: 8px 0 12px;
          font-size: 32px;
          font-weight: 700;
          color: #0f172a;
        }

        .social-suite-title p {
          margin: 0;
          color: #64748b;
          max-width: 540px;
          font-size: 15px;
        }

        .social-suite-breadcrumb {
          font-size: 13px;
          color: #64748b;
          margin: 16px 0 20px;
        }

        .social-suite-body {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          align-items: flex-start;
          gap: 24px;
        }

        .social-suite-nav {
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid rgba(226, 232, 240, 0.9);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
        }

        .social-nav-item {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.18s ease;
        }

        .social-nav-item:hover {
          background: rgba(148, 163, 184, 0.12);
          color: #1d4ed8;
        }

        .social-nav-item.active {
          background: #ffffff;
          color: #1d4ed8;
          box-shadow: 0 10px 22px rgba(59, 130, 246, 0.18);
        }

        .social-nav-label {
          flex: 1;
        }

        .social-suite-main {
          min-width: 0;
        }

        .social-suite-content {
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: #ffffff;
          padding: 24px;
          min-height: 520px;
          box-shadow: 0 20px 32px rgba(15, 23, 42, 0.06);
        }

        @media (max-width: 960px) {
          .social-suite-body {
            grid-template-columns: minmax(0, 1fr);
          }

          .social-suite-nav {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
          }

          .social-nav-item {
            flex: 1;
            white-space: nowrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

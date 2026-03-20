"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LeftSidebar from "@/component/LeftSidebar";
import PageHeader from "@/component/PageHeader";

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
        <PageHeader
          breadcrumb={["Home", "AI Social Media Suite"]}
          title="AI Social Media Suite"
          subtitle="Schedule your next viral post with just a few clicks."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          }
        />

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

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const NAV_H = 60;
const SIDEBAR_W = 280;

export default function TopBar() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U";
  };

  const displayName = user
    ? user.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : user.emailAddresses[0]?.emailAddress?.split("@")[0] || "User"
    : "";

  const email = user?.emailAddresses[0]?.emailAddress || "";

  /* skeleton while clerk loads */
  if (!isLoaded) {
    return (
      <div style={barStyle}>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "#f1f5f9" }} />
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div style={barStyle}>
      {/* spacer pushes everything to the right */}
      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            style={iconBtn}
            aria-label="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={notifDot} />
          </button>

          {notifOpen && (
            <div style={{ ...dropMenu, width: 280, right: 0 }}>
              <div style={dropHeader}>Notifications</div>
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                <div style={{ fontSize: "30px", marginBottom: "8px" }}>🔔</div>
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => router.push("/settings")}
          style={iconBtn}
          aria-label="Settings"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 26, background: "#e2e8f0", margin: "0 4px" }} />

        {/* User profile chip + dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={profileChip}
            aria-label="User menu"
          >
            {/* Avatar */}
            <div style={avatarCircle}>
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                />
              ) : (
                <span style={{ fontSize: "13px", fontWeight: 700 }}>{getInitials()}</span>
              )}
            </div>

            {/* Name + email */}
            <div style={{ textAlign: "left", lineHeight: 1.3 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {email}
              </div>
            </div>

            {/* Chevron */}
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
              style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div style={{ ...dropMenu, width: 260, right: 0 }}>
              {/* Clerk user info header */}
              <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ ...avatarCircle, width: 44, height: 44, borderRadius: "13px", fontSize: "16px", flexShrink: 0 }}>
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "13px" }} />
                  ) : (
                    <span style={{ fontWeight: 700 }}>{getInitials()}</span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email}
                  </div>
                  {user?.publicMetadata?.role && (
                    <span style={{
                      display: "inline-block", marginTop: "5px", fontSize: "10px", fontWeight: 700,
                      padding: "2px 8px", borderRadius: "999px",
                      background: "#dbeafe", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {String(user.publicMetadata.role)}
                    </span>
                  )}
                </div>
              </div>

              {/* Nav items */}
              <div style={{ padding: "6px 0" }}>
                {[
                  { label: "Dashboard", icon: dashboardIcon, href: "/dashboard" },
                  { label: "AI Chatbots", icon: botIcon, href: "/ai-chatbots" },
                  { label: "Settings", icon: settingsIcon, href: "/settings" },
                  { label: "Subscription", icon: cardIcon, href: "/subscription" },
                ].map(({ label, icon, href }) => (
                  <button
                    key={label}
                    onClick={() => { router.push(href); setDropdownOpen(false); }}
                    style={dropItem}
                  >
                    <span style={{ color: "#64748b", flexShrink: 0 }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div style={{ height: 1, background: "#f1f5f9" }} />

              <div style={{ padding: "6px 0 4px" }}>
                <SignOutButton>
                  <button style={{ ...dropItem, color: "#dc2626" }}>
                    <span style={{ flexShrink: 0 }}>{signOutIcon}</span>
                    <span>Sign Out</span>
                  </button>
                </SignOutButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inline SVG helpers ── */
const dashboardIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const botIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M12 11V5" /><circle cx="12" cy="4" r="1" />
    <line x1="8" y1="15" x2="8" y2="15" strokeLinecap="round" strokeWidth="2.5" />
    <line x1="12" y1="15" x2="12" y2="15" strokeLinecap="round" strokeWidth="2.5" />
    <line x1="16" y1="15" x2="16" y2="15" strokeLinecap="round" strokeWidth="2.5" />
  </svg>
);
const settingsIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const cardIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const signOutIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── Styles ── */
const barStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: SIDEBAR_W,
  right: 0,
  height: NAV_H,
  background: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  paddingLeft: "20px",
  paddingRight: "16px",
  zIndex: 999,
  boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
};

const iconBtn: React.CSSProperties = {
  border: "none",
  background: "#f8fafc",
  color: "#64748b",
  width: 36,
  height: 36,
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  position: "relative",
  transition: "background 0.15s",
  flexShrink: 0,
};

const notifDot: React.CSSProperties = {
  position: "absolute",
  top: "7px",
  right: "7px",
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: "#ef4444",
  border: "1.5px solid #fff",
};

const profileChip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1.5px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: "12px",
  padding: "5px 10px 5px 5px",
  cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
  maxWidth: 260,
};

const avatarCircle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "10px",
  background: "#1e293b",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  overflow: "hidden",
  fontSize: "12px",
};

const dropMenu: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
  zIndex: 2000,
  overflow: "hidden",
  minWidth: 200,
};

const dropHeader: React.CSSProperties = {
  padding: "12px 16px 10px",
  fontWeight: 700,
  fontSize: "13px",
  color: "#0f172a",
  borderBottom: "1px solid #f1f5f9",
};

const dropItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "9px 16px",
  border: "none",
  background: "transparent",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "left",
};

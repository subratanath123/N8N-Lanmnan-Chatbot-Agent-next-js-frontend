"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { appConfig } from "@/lib/config";

/* ─── constants ─── */
const NAV_H = 60;
const SIDEBAR_W = 280;

export default function TopBar() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
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

  if (!isLoaded) {
    return (
      <div style={barStyle}>
        <div style={{ flex: 1 }} />
        <div style={{ width: 120, height: 20, borderRadius: 6, background: "#f1f5f9" }} />
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div style={barStyle}>
      {/* ── Search ── */}
      <div style={searchWrap}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          style={searchInput}
          type="text"
          placeholder="Search chatbots, posts, conversations…"
        />
      </div>

      {/* ── Right actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

        {/* Upgrade pill */}
        <button
          onClick={() => router.push("/subscription")}
          style={upgradePill}
        >
          ⚡ Upgrade
        </button>

        {/* Notification */}
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
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔔</div>
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <a
          href="https://docs.yourapp.com"
          target="_blank"
          rel="noreferrer"
          style={{ ...iconBtn, textDecoration: "none", color: "#64748b" }}
          aria-label="Help"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </a>

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
        <div style={{ width: 1, height: 28, background: "#e2e8f0", margin: "0 4px" }} />

        {/* User avatar + dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={avatarBtn}
            aria-label="User menu"
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={displayName} style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.5px" }}>{getInitials()}</span>
            )}
          </button>

          {dropdownOpen && (
            <div style={{ ...dropMenu, width: 220, right: 0 }}>
              {/* User info */}
              <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{displayName}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
              </div>

              {[
                { label: "Dashboard", icon: "🏠", href: "/dashboard" },
                { label: "Settings", icon: "⚙️", href: "/settings" },
                { label: "Subscription", icon: "💳", href: "/subscription" },
              ].map(({ label, icon, href }) => (
                <button key={label} onClick={() => { router.push(href); setDropdownOpen(false); }} style={dropItem}>
                  <span style={{ fontSize: "15px" }}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}

              <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />

              <SignOutButton>
                <button style={{ ...dropItem, color: "#dc2626" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </SignOutButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  paddingLeft: "24px",
  paddingRight: "20px",
  gap: "14px",
  zIndex: 999,
  boxShadow: "0 1px 8px rgba(15,23,42,0.06)",
};

const searchWrap: React.CSSProperties = {
  flex: 1,
  maxWidth: 420,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "#f8fafc",
  borderRadius: "999px",
  padding: "0 14px",
  height: 38,
  border: "1.5px solid #e2e8f0",
  transition: "border-color 0.15s",
};

const searchInput: React.CSSProperties = {
  flex: 1,
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "13.5px",
  color: "#1e293b",
};

const upgradePill: React.CSSProperties = {
  border: "none",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: "999px",
  padding: "7px 18px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  letterSpacing: "-0.2px",
  boxShadow: "0 4px 12px rgba(15,23,42,0.18)",
  transition: "opacity 0.15s",
};

const iconBtn: React.CSSProperties = {
  border: "none",
  background: "#f8fafc",
  color: "#64748b",
  width: 38,
  height: 38,
  borderRadius: "12px",
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
  top: "8px",
  right: "8px",
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: "#ef4444",
  border: "1.5px solid #fff",
};

const avatarBtn: React.CSSProperties = {
  border: "2px solid #e2e8f0",
  background: "#1e293b",
  color: "#ffffff",
  width: 38,
  height: 38,
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  overflow: "hidden",
  padding: 0,
  transition: "border-color 0.15s",
  flexShrink: 0,
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
  fontSize: "13.5px",
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.12s",
};

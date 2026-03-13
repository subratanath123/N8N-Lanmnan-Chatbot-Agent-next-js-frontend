"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", supportsOAuth: true },
  { id: "twitter", name: "X (Twitter)", icon: "🐦", supportsOAuth: true },
  { id: "linkedin", name: "LinkedIn", icon: "💼", supportsOAuth: false },
  { id: "instagram", name: "Instagram", icon: "📷", supportsOAuth: false },
  { id: "tiktok", name: "TikTok", icon: "🎵", supportsOAuth: false },
];

interface AccountPage {
  pageId: string;
  pageName: string;
}

interface Account {
  accountId: string;
  platform: string;
  connectedAt: string;
  pages?: AccountPage[];
  username?: string;
}

interface FacebookRow {
  accountId: string;
  pageId: string;
  pageName: string;
  connectedAt: string;
}

export default function MyAccountsPage() {
  const { getToken } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const token = await getToken?.();
    if (!token) return;

    try {
      const res = await fetch(`${backendUrl}/v1/api/social-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const text = await res.text();
        let data: { accounts?: Account[] };
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          setAccounts([]);
          return;
        }
        setAccounts(data.accounts || []);
      } else {
        setAccounts([]);
      }
    } catch {
      setAccounts([]);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SOCIAL_OAUTH_RESULT") {
        const { success, platform, error: errMsg } = event.data;
        setLoading((p) => ({ ...p, [platform]: false }));
        if (success) {
          fetchAccounts();
          setError(null);
        } else {
          setError(errMsg || "Failed to connect");
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchAccounts]);

  const handleConnect = async (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform?.supportsOAuth) {
      setError(`${platform?.name} OAuth is coming soon.`);
      return;
    }

    const token = await getToken?.();
    if (!token) {
      setError("Please sign in to connect accounts.");
      return;
    }

    setLoading((prev) => ({ ...prev, [platformId]: true }));
    setError(null);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const authPath =
      platformId === "facebook"
        ? "/auth/social/facebook/authorize"
        : "/auth/social/twitter/authorize";

    try {
      const res = await fetch(`${baseUrl}${authPath}?clerkToken=${encodeURIComponent(token)}`);
      const text = await res.text();
      let data: { authUrl?: string; error?: string };
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(text || "Failed to get authorization URL. Please try again.");
        setLoading((prev) => ({ ...prev, [platformId]: false }));
        return;
      }

      if (data.error) {
        setError(data.error);
        setLoading((prev) => ({ ...prev, [platformId]: false }));
        return;
      }

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        data.authUrl,
        "Social OAuth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start OAuth");
      setLoading((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const handleDisconnect = async (accountId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const token = await getToken?.();
    if (!token) return;

    setLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      const res = await fetch(`${backendUrl}/v1/api/social-accounts/${accountId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
      } else {
        setError("Failed to disconnect account.");
      }
    } catch {
      setError("Failed to disconnect account.");
    } finally {
      setLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const facebookAccounts = accounts.filter((a) => a.platform === "facebook");
  const twitterAccounts = accounts.filter((a) => a.platform === "twitter");
  const facebookRows: FacebookRow[] = facebookAccounts.flatMap((a) => {
    if (!a.pages || a.pages.length === 0) {
      return [
        {
          accountId: a.accountId,
          pageId: "-",
          pageName: "No pages returned",
          connectedAt: a.connectedAt,
        },
      ];
    }
    return a.pages.map((p) => ({
      accountId: a.accountId,
      pageId: p.pageId,
      pageName: p.pageName,
      connectedAt: a.connectedAt,
    }));
  });

  return (
    <div>
      <h2 className="page-title">Connected Social Media Accounts</h2>
      <p className="page-desc">
        Connect multiple accounts with Login with Facebook or X (Twitter). Long-lived tokens are stored in the backend for scheduling posts. Each connection adds a new account.
      </p>

      {error && (
        <div className="error-banner">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="accounts-grid">
        <div className="platform-section">
          <div className="platform-header">
            <span className="account-icon">📘</span>
            <div className="platform-title-wrap">
              <h3>Facebook</h3>
              <p>Connect one or more Facebook accounts. Pages appear below.</p>
            </div>
            <button
              type="button"
              className="connect-btn"
              onClick={() => handleConnect("facebook")}
              disabled={loading.facebook}
            >
              {loading.facebook ? "Connecting..." : "Connect Facebook Account"}
            </button>
          </div>

          {facebookRows.length === 0 ? (
            <div className="empty-state">
              <p>No Facebook accounts connected yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Page Name</th>
                    <th>Page ID</th>
                    <th>Connected</th>
                    <th>Account ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {facebookRows.map((row) => (
                    <tr key={`${row.accountId}-${row.pageId}`}>
                      <td>{row.pageName}</td>
                      <td>{row.pageId}</td>
                      <td>{new Date(row.connectedAt).toLocaleString()}</td>
                      <td className="mono-cell">{row.accountId}</td>
                      <td>
                        <button
                          type="button"
                          className="connect-btn disconnect"
                          onClick={() => handleDisconnect(row.accountId)}
                          disabled={loading[row.accountId]}
                        >
                          {loading[row.accountId] ? "..." : "Disconnect"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="platform-section">
          <div className="platform-header">
            <span className="account-icon">🐦</span>
            <div className="platform-title-wrap">
              <h3>X (Twitter)</h3>
              <p>Connect one or more X accounts for scheduling.</p>
            </div>
            <button
              type="button"
              className="connect-btn"
              onClick={() => handleConnect("twitter")}
              disabled={loading.twitter}
            >
              {loading.twitter ? "Connecting..." : "Connect X Account"}
            </button>
          </div>
          {twitterAccounts.length === 0 ? (
            <div className="empty-state">
              <p>No X accounts connected yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="accounts-table twitter-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Connected</th>
                    <th>Account ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {twitterAccounts.map((a) => (
                    <tr key={a.accountId}>
                      <td>{a.username ? `@${a.username}` : "Connected X account"}</td>
                      <td>{new Date(a.connectedAt).toLocaleString()}</td>
                      <td className="mono-cell">{a.accountId}</td>
                      <td>
                        <button
                          type="button"
                          className="connect-btn disconnect"
                          onClick={() => handleDisconnect(a.accountId)}
                          disabled={loading[a.accountId]}
                        >
                          {loading[a.accountId] ? "..." : "Disconnect"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="platform-section disabled-section">
          <div className="platform-header">
            <span className="account-icon">💼</span>
            <div className="platform-title-wrap">
              <h3>LinkedIn</h3>
              <p>OAuth integration is not enabled yet.</p>
            </div>
            <button type="button" className="connect-btn" disabled>
              Connect LinkedIn
            </button>
          </div>
          <div className="empty-state">
            <p>No LinkedIn accounts connected.</p>
          </div>
        </div>

        <div className="platform-section disabled-section">
          <div className="platform-header">
            <span className="account-icon">📷</span>
            <div className="platform-title-wrap">
              <h3>Instagram</h3>
              <p>OAuth integration is not enabled yet.</p>
            </div>
            <button type="button" className="connect-btn" disabled>
              Connect Instagram
            </button>
          </div>
          <div className="empty-state">
            <p>No Instagram accounts connected.</p>
          </div>
        </div>

        <div className="platform-section disabled-section">
          <div className="platform-header">
            <span className="account-icon">🎵</span>
            <div className="platform-title-wrap">
              <h3>TikTok</h3>
              <p>OAuth integration is not enabled yet.</p>
            </div>
            <button type="button" className="connect-btn" disabled>
              Connect TikTok
            </button>
          </div>
          <div className="empty-state">
            <p>No TikTok accounts connected.</p>
          </div>
        </div>
      </div>
      <style jsx>{`
        .accounts-page {
          max-width: 100%;
        }
        .page-title {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
        }
        .page-desc {
          margin: 0 0 24px;
          color: #64748b;
          font-size: 14px;
        }
        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .error-banner button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #dc2626;
          padding: 0 4px;
        }
        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }
        .platform-section {
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 24px;
          background: #f8fafc;
          min-height: 280px;
        }
        .platform-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .account-icon {
          font-size: 28px;
        }
        .platform-title-wrap {
          flex: 1;
        }
        .platform-title-wrap h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
        }
        .platform-title-wrap p {
          margin: 2px 0 0;
          font-size: 13px;
          color: #64748b;
        }
        .platform-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
        }
        .table-wrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: #fff;
        }
        .accounts-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
        }
        .accounts-table th,
        .accounts-table td {
          text-align: left;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          font-size: 13px;
          color: #334155;
          vertical-align: middle;
        }
        .accounts-table th {
          background: #f8fafc;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
        }
        .accounts-table tbody tr:last-child td {
          border-bottom: none;
        }
        .mono-cell {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
            "Courier New", monospace;
          font-size: 12px;
        }
        .account-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .account-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .account-label {
          flex: 1;
          font-size: 14px;
          color: #0f172a;
        }
        .status-badge {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-badge.connected {
          background: rgba(34, 197, 94, 0.15);
          color: #16a34a;
        }
        .connect-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .connect-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        .connect-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .connect-btn.disconnect {
          background: #fff;
          color: #64748b;
          border-color: rgba(148, 163, 184, 0.5);
        }
        .empty-state {
          text-align: center;
          padding: 20px;
          color: #64748b;
        }
        .empty-state p {
          margin: 0 0 12px;
          font-size: 14px;
        }
        .coming-soon {
          font-size: 12px;
          color: #94a3b8;
        }
        .disabled-section {
          opacity: 0.8;
        }
        @media (max-width: 1400px) {
          .accounts-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 1100px) {
          .accounts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

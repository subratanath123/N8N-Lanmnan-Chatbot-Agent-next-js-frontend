"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface Target {
  targetId: string;
  platform: "facebook" | "twitter";
  displayName: string;
}

interface PostRow {
  postId: string;
  content: string;
  status: string;
  scheduledAt: string | number | Date | null;
  publishedAt: string | number | Date | null;
  createdAt: string | number | Date | null;
  targets: Target[];
}

const STATUS_OPTIONS = [
  "all",
  "scheduled",
  "pending_publish",
  "published",
  "published_with_errors",
  "publish_failed",
] as const;

const toIsoString = (value: string | number | Date | null | undefined): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }
  if (typeof value === "number") {
    if (value <= 0) return "";
    const millis = value < 1_000_000_000_000 ? value * 1000 : value;
    const d = new Date(millis);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return "";
      const millis = n < 1_000_000_000_000 ? n * 1000 : n;
      const d = new Date(millis);
      return Number.isNaN(d.getTime()) ? "" : d.toISOString();
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }
  return "";
};

export default function ScheduledPostsPage() {
  const { getToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "facebook" | "twitter">("all");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const token = await getToken?.();
    if (!token) {
      setError("Please sign in to view scheduled posts.");
      setLoading(false);
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString();
    const query = new URLSearchParams({ startDate, endDate });
    if (statusFilter !== "all") query.set("status", statusFilter);
    if (platformFilter !== "all") query.set("platform", platformFilter);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/v1/api/social-posts?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch scheduled posts.");
      }
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      setPosts([]);
      setError(err instanceof Error ? err.message : "Failed to fetch scheduled posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, platformFilter]);

  const sortedPosts = useMemo(
    () =>
      [...posts].sort((a, b) =>
        toIsoString(a.scheduledAt).localeCompare(toIsoString(b.scheduledAt))
      ),
    [posts]
  );

  const statusClass = (status: string) => {
    if (status === "published") return "published";
    if (status === "publish_failed") return "failed";
    if (status === "published_with_errors") return "warn";
    return "scheduled";
  };

  return (
    <div className="scheduled-page">
      <h2 className="page-title">Scheduled Posts</h2>
      <p className="page-desc">Manage your queued posts and edit or cancel before they go live.</p>
      <div className="filters-row">
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as "all" | "facebook" | "twitter")}>
          <option value="all">All platforms</option>
          <option value="facebook">Facebook</option>
          <option value="twitter">X (Twitter)</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All status" : s}
            </option>
          ))}
        </select>
        <button type="button" className="refresh-btn" onClick={fetchPosts} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="posts-list">
        {loading ? (
          <div className="post-card">Loading scheduled posts...</div>
        ) : sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <div key={post.postId} className="post-card">
              <div className="post-content">{post.content}</div>
              <div className="post-meta">
                <span className="platforms">{post.targets.map((t) => t.displayName).join(" | ")}</span>
                <span className="scheduled-for">
                  📅 {toIsoString(post.scheduledAt) ? new Date(toIsoString(post.scheduledAt)).toLocaleString() : "--"}
                </span>
                <span className={`status-chip ${statusClass(post.status)}`}>{post.status}</span>
              </div>
              {toIsoString(post.publishedAt) && (
                <div className="published-time">
                  Published: {new Date(toIsoString(post.publishedAt)).toLocaleString()}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="post-card">No posts found for selected filters.</div>
        )}
      </div>
      <style jsx>{`
        .scheduled-page {
          max-width: 980px;
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
        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .filters-row {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }
        .filters-row select {
          padding: 8px 10px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          border-radius: 10px;
          font-size: 13px;
          background: #fff;
        }
        .refresh-btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid rgba(37, 99, 235, 0.5);
          background: #fff;
          color: #1d4ed8;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .post-card {
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 20px;
          background: #f8fafc;
        }
        .post-content {
          font-size: 15px;
          color: #0f172a;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .post-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 12px;
        }
        .status-chip {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-chip.scheduled {
          background: rgba(37, 99, 235, 0.15);
          color: #1d4ed8;
        }
        .status-chip.published {
          background: rgba(34, 197, 94, 0.15);
          color: #15803d;
        }
        .status-chip.warn {
          background: rgba(245, 158, 11, 0.15);
          color: #b45309;
        }
        .status-chip.failed {
          background: rgba(239, 68, 68, 0.15);
          color: #b91c1c;
        }
        .published-time {
          color: #64748b;
          font-size: 12px;
        }
        .error-box {
          margin-bottom: 12px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

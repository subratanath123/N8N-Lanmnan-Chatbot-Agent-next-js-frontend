"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface SocialTarget {
  targetId: string;
  platform: string;
  displayName: string;
}

interface PostMedia {
  mediaId?: string;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
}

interface SocialPost {
  postId: string;
  content: string;
  status: string;
  scheduledAt: string | number | Date | null;
  targets: SocialTarget[];
  media?: PostMedia[];
}

const PLATFORM_META: Record<string, { color: string; bg: string; label: string }> = {
  facebook:  { color: "#2563eb", bg: "#dbeafe", label: "FB" },
  twitter:   { color: "#334155", bg: "#f1f5f9", label: "X"  },
  linkedin:  { color: "#0a66c2", bg: "#e0f0ff", label: "LI" },
  instagram: { color: "#c026d3", bg: "#fae8ff", label: "IG" },
  tiktok:    { color: "#7c3aed", bg: "#f5f3ff", label: "TT" },
  default:   { color: "#2563eb", bg: "#eff6ff", label: "•"  },
};

const STATUS_COLOR: Record<string, string> = {
  published:              "#16a34a",
  publish_failed:         "#dc2626",
  published_with_errors:  "#d97706",
  scheduled:              "#2563eb",
  pending_publish:        "#7c3aed",
};

const toIsoString = (v: string | number | Date | null | undefined): string => {
  if (v == null) return "";
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : v.toISOString();
  if (typeof v === "number") {
    if (v <= 0) return "";
    const ms = v < 1_000_000_000_000 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const s = String(v).trim();
  if (!s) return "";
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    const ms = n < 1_000_000_000_000 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString();
};

const toDateKey = (v: string | number | Date | null | undefined): string => {
  const iso = toIsoString(v);
  return iso ? iso.split("T")[0] : "";
};

const fmtTime = (v: string | number | Date | null | undefined) => {
  const iso = toIsoString(v);
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_EVENTS_PER_CELL = 3;

type ViewMode = "month" | "week" | "day";

export default function PostCalendarPage() {
  const { getToken } = useAuth();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [view, setView] = useState<ViewMode>("month");
  const [focusDate, setFocusDate] = useState<Date>(() => new Date());
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<SocialPost | null>(null);
  const [overflowDate, setOverflowDate] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // The "current month" / "current week" pivot
  const currentMonth = useMemo(() => new Date(focusDate.getFullYear(), focusDate.getMonth(), 1), [focusDate]);

  const monthLabel = currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" });

  const weekStart = useMemo(() => {
    const d = new Date(focusDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [focusDate]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(weekStart)} – ${fmt(end)}, ${end.getFullYear()}`;
  }, [weekStart]);

  const dayLabel = useMemo(
    () => focusDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    [focusDate]
  );

  const headerLabel = view === "month" ? monthLabel : view === "week" ? weekLabel : dayLabel;

  const navPrev = () => {
    setFocusDate((d) => {
      const n = new Date(d);
      if (view === "month") n.setMonth(n.getMonth() - 1);
      else if (view === "week") n.setDate(n.getDate() - 7);
      else n.setDate(n.getDate() - 1);
      return n;
    });
  };

  const navNext = () => {
    setFocusDate((d) => {
      const n = new Date(d);
      if (view === "month") n.setMonth(n.getMonth() + 1);
      else if (view === "week") n.setDate(n.getDate() + 7);
      else n.setDate(n.getDate() + 1);
      return n;
    });
  };

  // Fetch posts for a wider window around focus date
  const fetchPosts = useCallback(async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const token = await getToken?.();
    if (!token) { setError("Please sign in to view calendar."); setLoading(false); return; }

    const startDate = new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, 1).toISOString();
    const endDate = new Date(focusDate.getFullYear(), focusDate.getMonth() + 2, 0, 23, 59, 59).toISOString();

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${backendUrl}/v1/api/social-posts?${new URLSearchParams({ startDate, endDate })}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text() || "Failed to fetch posts.");
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      setPosts([]);
      setError(err instanceof Error ? err.message : "Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  }, [focusDate, getToken]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Dismiss overflow list on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOverflowDate(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group posts by date key
  const postsByDate = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const p of posts) {
      const dk = toDateKey(p.scheduledAt);
      if (!dk) continue;
      if (!map.has(dk)) map.set(dk, []);
      map.get(dk)!.push(p);
    }
    // Sort each day's events by time
    map.forEach((arr) => arr.sort((a, b) => toIsoString(a.scheduledAt).localeCompare(toIsoString(b.scheduledAt))));
    return map;
  }, [posts]);

  // ─── Month grid cells ─────────────────────────────────────────────────────
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number | null; dateStr: string | null; thisMonth: boolean }> = [];

    // Padding before month
    for (let i = 0; i < firstWeekday; i++) {
      const d = new Date(year, month, 1 - (firstWeekday - i));
      cells.push({ day: d.getDate(), dateStr: d.toISOString().split("T")[0], thisMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr, thisMonth: true });
    }
    // Padding after
    while (cells.length % 7 !== 0) {
      const d = new Date(year, month + 1, cells.length - (firstWeekday + daysInMonth) + 1);
      cells.push({ day: d.getDate(), dateStr: d.toISOString().split("T")[0], thisMonth: false });
    }
    return cells;
  }, [currentMonth]);

  // ─── Week cells ───────────────────────────────────────────────────────────
  const weekCells = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return { dateStr: d.toISOString().split("T")[0], label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }), day: d.getDate() };
    });
  }, [weekStart]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const firstPlatform = (post: SocialPost) => post.targets?.[0]?.platform?.toLowerCase() || "default";

  const platformMeta = (p: string) => PLATFORM_META[p] || PLATFORM_META.default;

  const openPopup = (e: React.MouseEvent, post: SocialPost) => {
    e.stopPropagation();
    setPopup(post);
    setOverflowDate(null);
  };

  const renderEventPill = (post: SocialPost, key: string) => {
    const plat = firstPlatform(post);
    const meta = platformMeta(plat);
    const statusColor = STATUS_COLOR[post.status] || meta.color;
    const time = fmtTime(post.scheduledAt);
    return (
      <button
        key={key}
        type="button"
        className="cal-event-pill"
        style={{ background: meta.bg, borderLeft: `3px solid ${statusColor}`, color: meta.color }}
        onClick={(e) => openPopup(e, post)}
        title={post.content}
      >
        <span className="cal-event-time">{time}</span>
        <span className="cal-event-text">{post.content}</span>
      </button>
    );
  };

  // ─── Day view posts ───────────────────────────────────────────────────────
  const focusDateStr = focusDate.toISOString().split("T")[0];
  const dayPosts = postsByDate.get(focusDateStr) || [];

  return (
    <div className="gcal-wrap">
      {/* ── Toolbar ── */}
      <div className="gcal-toolbar">
        <div className="gcal-toolbar-left">
          <button type="button" className="gcal-btn-today" onClick={() => setFocusDate(new Date())}>Today</button>
          <button type="button" className="gcal-nav-btn" onClick={navPrev} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button type="button" className="gcal-nav-btn" onClick={navNext} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <span className="gcal-header-label">{headerLabel}</span>
          {loading && <span className="gcal-loading-dot" />}
        </div>
        <div className="gcal-view-toggle">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button key={v} type="button" className={`gcal-view-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="gcal-error">{error}</div>}

      {/* ─────────── MONTH VIEW ─────────── */}
      {view === "month" && (
        <div className="gcal-month">
          <div className="gcal-day-headers">
            {DAYS.map((d) => <div key={d} className="gcal-day-hdr">{d}</div>)}
          </div>
          <div className="gcal-month-grid">
            {calendarCells.map((cell, i) => {
              const isToday = cell.dateStr === todayStr;
              const cellPosts = cell.dateStr ? (postsByDate.get(cell.dateStr) || []) : [];
              const visible = cellPosts.slice(0, MAX_EVENTS_PER_CELL);
              const overflow = cellPosts.length - MAX_EVENTS_PER_CELL;
              const isOverflowOpen = overflowDate === cell.dateStr;

              return (
                <div
                  key={i}
                  className={`gcal-cell ${!cell.thisMonth ? "other-month" : ""} ${isToday ? "today" : ""}`}
                  onClick={() => { if (cell.dateStr) { setFocusDate(new Date(cell.dateStr + "T12:00:00")); } }}
                >
                  <div className="gcal-cell-day">
                    <span className={`gcal-day-num ${isToday ? "today-circle" : ""}`}>{cell.day}</span>
                  </div>
                  <div className="gcal-cell-events">
                    {visible.map((p) => renderEventPill(p, `${cell.dateStr}-${p.postId}`))}
                    {overflow > 0 && (
                      <button
                        type="button"
                        className="gcal-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverflowDate(isOverflowOpen ? null : cell.dateStr);
                          setPopup(null);
                        }}
                      >
                        +{overflow} more
                      </button>
                    )}
                    {isOverflowOpen && (
                      <div className="gcal-overflow-list" ref={popupRef} onClick={(e) => e.stopPropagation()}>
                        <div className="gcal-overflow-header">
                          {cell.dateStr ? fmtDate(cell.dateStr + "T12:00:00") : ""}
                          <button type="button" className="gcal-close-btn" onClick={() => setOverflowDate(null)}>×</button>
                        </div>
                        {cellPosts.map((p) => renderEventPill(p, `ov-${p.postId}`))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────── WEEK VIEW ─────────── */}
      {view === "week" && (
        <div className="gcal-week">
          {weekCells.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const cellPosts = postsByDate.get(cell.dateStr) || [];
            return (
              <div key={cell.dateStr} className={`gcal-week-col ${isToday ? "today" : ""}`}>
                <div className="gcal-week-col-header">
                  <span className="gcal-week-col-day">{new Date(cell.dateStr + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })}</span>
                  <span className={`gcal-week-col-num ${isToday ? "today-circle" : ""}`}>{cell.day}</span>
                </div>
                <div className="gcal-week-events">
                  {cellPosts.length === 0
                    ? <div className="gcal-no-events-hint" />
                    : cellPosts.map((p) => renderEventPill(p, `wk-${p.postId}`))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────── DAY VIEW ─────────── */}
      {view === "day" && (
        <div className="gcal-day-view">
          <div className="gcal-day-view-header">
            <span className={`gcal-day-view-num ${focusDateStr === todayStr ? "today-circle" : ""}`}>
              {focusDate.getDate()}
            </span>
            <span className="gcal-day-view-label">
              {focusDate.toLocaleDateString(undefined, { weekday: "long", month: "long", year: "numeric" })}
            </span>
            <span className="gcal-day-post-count">
              {dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""}
            </span>
          </div>
          {dayPosts.length === 0
            ? <div className="gcal-day-empty">No posts scheduled for this day.</div>
            : (
              <div className="gcal-day-list">
                {dayPosts.map((p) => {
                  const plat = firstPlatform(p);
                  const meta = platformMeta(plat);
                  const statusColor = STATUS_COLOR[p.status] || meta.color;
                  return (
                    <div
                      key={p.postId}
                      className="gcal-day-event-card"
                      style={{ borderLeft: `4px solid ${statusColor}`, cursor: "pointer" }}
                      onClick={() => setPopup(p)}
                    >
                      <div className="gcal-day-event-top">
                        <span className="gcal-day-event-time" style={{ color: statusColor }}>{fmtTime(p.scheduledAt)}</span>
                        <span className="gcal-day-event-platform" style={{ background: meta.bg, color: meta.color }}>
                          {meta.label} {p.targets.map((t) => t.displayName).join(", ")}
                        </span>
                        <span className="gcal-day-event-status" style={{ color: statusColor }}>{p.status}</span>
                      </div>
                      <div className="gcal-day-event-content">{p.content}</div>
                      {p.media && p.media.length > 0 && (
                        <div className="gcal-day-media-row">
                          {p.media.slice(0, 4).map((m, i) => (
                            <div key={i} className="gcal-day-media-thumb">
                              {m.mimeType?.startsWith("image/")
                                ? <img src={m.mediaUrl} alt={m.fileName} />
                                : <span>🎬</span>}
                            </div>
                          ))}
                          {(p.media.length > 4) && <span className="gcal-media-more">+{p.media.length - 4}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* ─── Full Post Preview Modal ─── */}
      {popup && (
        <div className="gcal-modal-backdrop" onClick={() => setPopup(null)}>
          <div className="gcal-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="gcal-modal-header">
              <span className="gcal-modal-title">Post Preview</span>
              <button type="button" className="gcal-close-btn" onClick={() => setPopup(null)}>×</button>
            </div>

            {/* Meta row */}
            <div className="gcal-modal-meta">
              <div className="gcal-modal-meta-left">
                <div className="gcal-modal-platforms">
                  {popup.targets.map((t) => {
                    const m = platformMeta(t.platform.toLowerCase());
                    return (
                      <span key={t.targetId} className="gcal-modal-platform-chip" style={{ background: m.bg, color: m.color }}>
                        {m.label} {t.displayName}
                      </span>
                    );
                  })}
                </div>
                <span className="gcal-modal-datetime">
                  {popup.scheduledAt ? new Date(toIsoString(popup.scheduledAt)).toLocaleString(undefined, {
                    weekday: "short", month: "short", day: "numeric",
                    year: "numeric", hour: "2-digit", minute: "2-digit"
                  }) : "Unscheduled"}
                </span>
              </div>
              <span className="gcal-modal-status-badge" style={{ color: STATUS_COLOR[popup.status] || "#2563eb", borderColor: STATUS_COLOR[popup.status] || "#2563eb" }}>
                {popup.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Social post preview card */}
            <div className="gcal-modal-preview-card">
              {/* Card header — mimic the primary platform */}
              {(() => {
                const plat = firstPlatform(popup);
                const meta = platformMeta(plat);
                const isTwitter = plat === "twitter";
                return (
                  <div className="gcal-preview-card-header">
                    <div className="gcal-preview-avatar" style={{ background: meta.color }}>
                      {meta.label}
                    </div>
                    <div>
                      <div className="gcal-preview-name">{popup.targets[0]?.displayName || "Your Account"}</div>
                      <div className="gcal-preview-handle">{isTwitter ? `@${popup.targets[0]?.displayName || "handle"}` : meta.label + " Page"} · {fmtTime(popup.scheduledAt)}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Post text */}
              {popup.content && (
                <div className="gcal-preview-body"
                  dangerouslySetInnerHTML={{ __html: popup.content.replace(/\n/g, "<br>") }}
                />
              )}

              {/* Media grid */}
              {popup.media && popup.media.length > 0 && (
                <div className={`gcal-preview-media-grid cols-${Math.min(popup.media.length, 2)}`}>
                  {popup.media.map((m, i) => (
                    <div key={i} className="gcal-preview-media-item">
                      {m.mimeType?.startsWith("image/") ? (
                        <img src={m.mediaUrl} alt={m.fileName || `media-${i}`} />
                      ) : m.mimeType?.startsWith("video/") ? (
                        <video src={m.mediaUrl} controls muted />
                      ) : (
                        <div className="gcal-preview-media-doc">📄 {m.fileName}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Engagement actions */}
              <div className="gcal-preview-actions">
                {firstPlatform(popup) === "twitter"
                  ? <><span>💬 Reply</span><span>🔁 Repost</span><span>❤️ Like</span></>
                  : <><span>👍 Like</span><span>💬 Comment</span><span>↗️ Share</span></>
                }
              </div>
            </div>

            {/* All targets */}
            {popup.targets.length > 1 && (
              <div className="gcal-modal-all-targets">
                <span className="gcal-modal-targets-label">Publishing to:</span>
                {popup.targets.map((t) => {
                  const m = platformMeta(t.platform.toLowerCase());
                  return (
                    <span key={t.targetId} className="gcal-modal-platform-chip" style={{ background: m.bg, color: m.color }}>
                      {m.label} {t.displayName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        /* ── Wrap ── */
        .gcal-wrap {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 96px);
          min-height: 600px;
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.05);
          position: relative;
        }

        /* ── Toolbar ── */
        .gcal-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          background: #fff;
          gap: 16px;
          flex-shrink: 0;
        }
        .gcal-toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gcal-btn-today {
          padding: 6px 16px;
          border: 1px solid rgba(148, 163, 184, 0.45);
          border-radius: 6px;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }
        .gcal-btn-today:hover { background: #f8fafc; }
        .gcal-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          color: #334155;
        }
        .gcal-nav-btn:hover { background: #f1f5f9; }
        .gcal-header-label {
          font-size: 17px;
          font-weight: 600;
          color: #0f172a;
          margin-left: 4px;
        }
        .gcal-loading-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          animation: pulse 1s infinite;
          margin-left: 6px;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* ── View toggle ── */
        .gcal-view-toggle {
          display: inline-flex;
          border: 1px solid rgba(148, 163, 184, 0.4);
          border-radius: 8px;
          overflow: hidden;
        }
        .gcal-view-btn {
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          background: #fff;
          color: #475569;
          cursor: pointer;
          border-right: 1px solid rgba(148, 163, 184, 0.3);
        }
        .gcal-view-btn:last-child { border-right: none; }
        .gcal-view-btn:hover { background: #f8fafc; }
        .gcal-view-btn.active { background: #0f172a; color: #fff; }

        /* ── Error ── */
        .gcal-error {
          margin: 12px 20px 0;
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #b91c1c;
          font-size: 13px;
        }

        /* ── Month view ── */
        .gcal-month {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        .gcal-day-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          flex-shrink: 0;
        }
        .gcal-day-hdr {
          padding: 8px 0;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .gcal-month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: 1fr;
          flex: 1;
          overflow-y: auto;
        }
        .gcal-cell {
          border-right: 1px solid rgba(226, 232, 240, 0.6);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          padding: 4px 4px 6px;
          min-height: 110px;
          cursor: pointer;
          position: relative;
          transition: background 0.1s;
        }
        .gcal-cell:nth-child(7n) { border-right: none; }
        .gcal-cell:hover { background: #f8fafc; }
        .gcal-cell.other-month { background: #fafafa; }
        .gcal-cell.today { background: #eff6ff; }

        .gcal-cell-day {
          display: flex;
          justify-content: flex-end;
          padding: 2px 4px 2px;
        }
        .gcal-day-num {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .gcal-cell.other-month .gcal-day-num { color: #cbd5e1; }
        .gcal-day-num.today-circle {
          background: #2563eb;
          color: #fff;
          font-weight: 700;
        }

        .gcal-cell-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
        }

        /* ── Event pill ── */
        .cal-event-pill {
          display: flex;
          align-items: baseline;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          line-height: 1.4;
          cursor: pointer;
          text-align: left;
          border: none;
          width: 100%;
          overflow: hidden;
        }
        .cal-event-pill:hover { filter: brightness(0.95); }
        .cal-event-time {
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
          font-size: 10px;
        }
        .cal-event-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .gcal-more-btn {
          font-size: 11px;
          color: #475569;
          background: none;
          border: none;
          cursor: pointer;
          padding: 1px 6px;
          text-align: left;
          font-weight: 600;
        }
        .gcal-more-btn:hover { color: #2563eb; }

        /* ── Overflow list ── */
        .gcal-overflow-list {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 200;
          width: 230px;
          background: #fff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.15);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .gcal-overflow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          padding: 2px 2px 6px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          margin-bottom: 4px;
        }

        .gcal-close-btn {
          background: none;
          border: none;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          color: #94a3b8;
          padding: 0;
        }
        .gcal-close-btn:hover { color: #0f172a; }

        /* ── Week view ── */
        .gcal-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          flex: 1;
          overflow-y: auto;
          border-top: 1px solid rgba(226, 232, 240, 0.7);
        }
        .gcal-week-col {
          border-right: 1px solid rgba(226, 232, 240, 0.6);
          padding: 8px 6px;
        }
        .gcal-week-col:last-child { border-right: none; }
        .gcal-week-col.today { background: #eff6ff; }

        .gcal-week-col-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 8px;
          gap: 2px;
        }
        .gcal-week-col-day {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .gcal-week-col-num {
          font-size: 20px;
          font-weight: 300;
          color: #334155;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .gcal-week-col-num.today-circle {
          background: #2563eb;
          color: #fff;
          font-weight: 600;
        }
        .gcal-week-events {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .gcal-no-events-hint { height: 24px; }

        /* ── Day view ── */
        .gcal-day-view {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .gcal-day-view-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }
        .gcal-day-view-num {
          font-size: 36px;
          font-weight: 300;
          color: #334155;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .gcal-day-view-num.today-circle {
          background: #2563eb;
          color: #fff;
          font-weight: 600;
        }
        .gcal-day-view-label {
          font-size: 18px;
          font-weight: 500;
          color: #334155;
          flex: 1;
        }
        .gcal-day-post-count {
          font-size: 13px;
          color: #94a3b8;
        }
        .gcal-day-empty {
          color: #94a3b8;
          font-size: 14px;
          text-align: center;
          margin-top: 60px;
        }
        .gcal-day-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .gcal-day-event-card {
          background: #f8fafc;
          border-radius: 10px;
          padding: 14px 16px;
          border: 1px solid rgba(226, 232, 240, 0.7);
        }
        .gcal-day-event-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .gcal-day-event-time {
          font-size: 13px;
          font-weight: 700;
        }
        .gcal-day-event-platform {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .gcal-day-event-status {
          font-size: 11px;
          font-weight: 600;
          margin-left: auto;
        }
        .gcal-day-event-content {
          font-size: 14px;
          color: #334155;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        /* ── Day view media ── */
        .gcal-day-media-row {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .gcal-day-media-thumb {
          width: 56px;
          height: 56px;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(226,232,240,0.9);
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .gcal-day-media-thumb img,
        .gcal-day-media-thumb video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gcal-media-more {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }

        /* ── Post Preview Modal ── */
        .gcal-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .gcal-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 32px 80px rgba(15, 23, 42, 0.25);
          display: flex;
          flex-direction: column;
        }
        .gcal-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          flex-shrink: 0;
        }
        .gcal-modal-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .gcal-modal-meta {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          flex-shrink: 0;
        }
        .gcal-modal-meta-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .gcal-modal-platforms {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .gcal-modal-platform-chip {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 999px;
        }
        .gcal-modal-datetime {
          font-size: 12px;
          color: #64748b;
        }
        .gcal-modal-status-badge {
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1.5px solid;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Preview card */
        .gcal-modal-preview-card {
          margin: 16px 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
        }
        .gcal-preview-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px 10px;
        }
        .gcal-preview-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }
        .gcal-preview-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .gcal-preview-handle {
          font-size: 12px;
          color: #94a3b8;
        }
        .gcal-preview-body {
          padding: 4px 16px 12px;
          font-size: 14px;
          color: #334155;
          line-height: 1.6;
          word-break: break-word;
        }
        .gcal-preview-body b, .gcal-preview-body strong { font-weight: 700; }
        .gcal-preview-body i, .gcal-preview-body em    { font-style: italic; }
        .gcal-preview-body u                            { text-decoration: underline; }

        .gcal-preview-media-grid {
          display: grid;
          gap: 2px;
          margin: 0 0 2px;
        }
        .gcal-preview-media-grid.cols-1 { grid-template-columns: 1fr; }
        .gcal-preview-media-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .gcal-preview-media-item {
          overflow: hidden;
          background: #f1f5f9;
          min-height: 140px;
          max-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gcal-preview-media-item img,
        .gcal-preview-media-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          min-height: 140px;
          display: block;
        }
        .gcal-preview-media-doc {
          padding: 24px;
          font-size: 13px;
          color: #64748b;
        }

        .gcal-preview-actions {
          display: flex;
          gap: 20px;
          padding: 10px 16px 14px;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid rgba(226, 232, 240, 0.7);
        }

        .gcal-modal-all-targets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          padding: 0 20px 18px;
        }
        .gcal-modal-targets-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-right: 2px;
        }
      `}</style>
    </div>
  );
}

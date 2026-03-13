"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface SocialTarget {
  targetId: string;
  platform: "facebook" | "twitter";
  displayName: string;
}

interface SocialPost {
  postId: string;
  content: string;
  status: string;
  scheduledAt: string | number | Date | null;
  targets: SocialTarget[];
}

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

const toDateKey = (value: string | number | Date | null | undefined): string => {
  const iso = toIsoString(value);
  if (!iso) return "";
  return iso.includes("T") ? iso.split("T")[0] : iso;
};

export default function PostCalendarPage() {
  const { getToken } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoJumped, setHasAutoJumped] = useState(false);

  const monthLabel = currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" });

  useEffect(() => {
    const fetchCalendarPosts = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
      const token = await getToken?.();
      if (!token) {
        setError("Please sign in to view calendar posts.");
        setLoading(false);
        return;
      }

      // Pull a broader window so calendar and scheduled tab stay consistent.
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      ).toISOString();
      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 2,
        0,
        23,
        59,
        59
      ).toISOString();

      setLoading(true);
      setError(null);
      try {
        const url =
          `${backendUrl}/v1/api/social-posts?` +
          new URLSearchParams({
            startDate,
            endDate,
          }).toString();
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch calendar posts.");
        }
        const data = await res.json();
        const fetchedPosts: SocialPost[] = Array.isArray(data.posts) ? data.posts : [];
        setPosts(fetchedPosts);

        if (!hasAutoJumped && fetchedPosts.length > 0) {
          const sorted = [...fetchedPosts].sort((a, b) =>
            toIsoString(a.scheduledAt).localeCompare(toIsoString(b.scheduledAt))
          );
          const firstIso = toIsoString(sorted[0]?.scheduledAt);
          if (firstIso) {
            const firstDate = new Date(firstIso);
            setCurrentMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
            setSelectedDate(toDateKey(firstIso));
            setHasAutoJumped(true);
          }
        }
      } catch (err) {
        setPosts([]);
        setError(err instanceof Error ? err.message : "Failed to fetch calendar posts.");
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarPosts();
  }, [currentMonth, getToken, hasAutoJumped]);

  const postCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      const d = toDateKey(post.scheduledAt);
      if (!d) continue;
      map.set(d, (map.get(d) || 0) + 1);
    }
    return map;
  }, [posts]);

  const selectedDatePosts = useMemo(
    () =>
      posts
        .filter((p) => toDateKey(p.scheduledAt) === selectedDate)
        .sort((a, b) => toIsoString(a.scheduledAt).localeCompare(toIsoString(b.scheduledAt))),
    [posts, selectedDate]
  );

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateStr: null });
    }
    return cells;
  }, [currentMonth]);

  return (
    <div className="calendar-page">
      <h2 className="page-title">Post Calendar</h2>
      <p className="page-desc">View and manage your scheduled posts across all platforms.</p>
      {error && <div className="error-box">{error}</div>}
      <div className="calendar-layout">
        <div className="calendar-widget">
          <div className="calendar-header">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
              }
            >
              ←
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
              }
            >
              →
            </button>
          </div>
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}
            {calendarCells.map((cell, i) => {
              const hasPosts = cell.dateStr ? (postCountByDate.get(cell.dateStr) || 0) > 0 : false;
              return (
                <div
                  key={i}
                  className={`calendar-day ${cell.day ? "" : "other-month"} ${selectedDate === cell.dateStr ? "selected" : ""}`}
                  onClick={() => cell.day && cell.dateStr && setSelectedDate(cell.dateStr)}
                >
                  <span>{cell.day || ""}</span>
                  {hasPosts && <em className="dot" />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="events-panel">
          <h3>Scheduled for {selectedDate}</h3>
          <div className="events-list">
            {loading ? (
              <p className="no-events">Loading posts...</p>
            ) : selectedDatePosts.length > 0 ? (
              selectedDatePosts.map((ev) => (
                <div key={ev.postId} className="event-card">
                  <div className="event-time">
                    {(() => {
                      const iso = toIsoString(ev.scheduledAt);
                      return iso
                        ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "--:--";
                    })()}{" "}
                    ·{" "}
                    {ev.targets.map((t) => t.platform).join(", ")}
                  </div>
                  <div className="event-preview">{ev.content}</div>
                  <div className="event-targets">
                    {ev.targets.map((t) => t.displayName).join(" | ")}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-events">No posts scheduled for this date.</p>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .calendar-page {
          max-width: 900px;
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
        .calendar-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }
        .calendar-widget {
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 20px;
          background: #f8fafc;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-weight: 600;
          color: #0f172a;
        }
        .calendar-header button {
          padding: 6px 12px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .calendar-day-header {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-align: center;
          padding: 8px;
        }
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          color: #0f172a;
        }
        .calendar-day.other-month {
          color: #94a3b8;
        }
        .calendar-day.selected {
          background: #2563eb;
          color: #fff;
        }
        .dot {
          margin-top: 4px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.9;
        }
        .calendar-day:not(.other-month):hover {
          background: rgba(37, 99, 235, 0.15);
        }
        .events-panel {
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 20px;
          background: #fff;
        }
        .events-panel h3 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }
        .event-card {
          padding: 12px 16px;
          border-radius: 12px;
          background: #f8fafc;
          margin-bottom: 8px;
          border: 1px solid rgba(226, 232, 240, 0.6);
        }
        .event-time {
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .event-preview {
          font-size: 13px;
          color: #475569;
        }
        .event-targets {
          margin-top: 6px;
          font-size: 12px;
          color: #64748b;
        }
        .error-box {
          margin-bottom: 16px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
        }
        .no-events {
          color: #94a3b8;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

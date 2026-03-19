"use client";

import React, { useState, useRef } from "react";
import LeftSidebar from "@/component/LeftSidebar";
import { useRouter } from "next/navigation";

/* ─── Gauge SVG ─────────────────────────────── */
function GaugeChart({
  percent,
  color,
  label,
}: {
  percent: number;
  color: string;
  label: string;
}) {
  const r = 65;
  const cx = 100;
  const cy = 95;
  const angle = (percent / 100) * Math.PI;
  const fgEndX = cx - r * Math.cos(angle);
  const fgEndY = cy - r * Math.sin(angle);
  const largeArc = percent > 50 ? 1 : 0;

  return (
    <svg viewBox="0 0 200 108" width="200" height="108">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {percent > 0 && (
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${fgEndX} ${fgEndY}`}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
        />
      )}
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fontSize="26"
        fontWeight="bold"
        fill="#111827"
      >
        {percent}%
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fontSize="11"
        fill="#6b7280"
      >
        {label}
      </text>
    </svg>
  );
}

/* ─── Types ─────────────────────────────────── */
interface PlagiarismDetail {
  source?: string;
  similarity?: number;
  excerpt?: string;
  matchedText?: string;
}

interface PlagiarismResult {
  plagiarizedPercent: number;
  uniquePercent: number;
  summary: string;
  details: PlagiarismDetail[];
}

const CREDITS_BALANCE = 30;

export default function PlagiarismPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) setSidebarCollapsed(collapsed);
  };

  const [contentText, setContentText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [rawResponse, setRawResponse] = useState("");
  const [error, setError] = useState("");
  const sessionIdRef = useRef(`plagiarism-${Date.now()}`);

  const handleScan = async () => {
    if (!contentText.trim()) {
      setError("Please enter content to scan.");
      return;
    }
    setError("");
    setResult(null);
    setRawResponse("");
    setIsScanning(true);

    const prompt = `You are a plagiarism detection engine. Analyze the following text for plagiarism and return ONLY a valid JSON object (no extra text, no markdown) with this exact structure:
{
  "plagiarizedPercent": <number 0-100>,
  "uniquePercent": <number 0-100>,
  "summary": "<brief analysis summary>",
  "details": [
    { "source": "<source name or URL if identifiable>", "similarity": <percentage>, "excerpt": "<matched text excerpt>" }
  ]
}

Text to analyze:
${contentText}`;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const response = await fetch(
        `${backendUrl}/v1/api/n8n/anonymous/chat/generic`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "user",
            message: prompt,
            sessionId: sessionIdRef.current,
            model: "gpt-4o",
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const rawText = await response.text();
      let data: Record<string, unknown>;
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = {}; }

      // Extract text — matches generic endpoint response shape
      let text: string =
        (data?.result && typeof data.result === "object" && typeof (data.result as Record<string,unknown>).response === "string"
          ? (data.result as Record<string,unknown>).response as string
          : "") ||
        (typeof data?.result === "string" ? data.result : "") ||
        (typeof data?.output === "string" ? data.output : "") ||
        (typeof data?.message === "string" ? data.message : "") ||
        (typeof data?.response === "string" ? data.response : "") ||
        (typeof data?.answer === "string" ? data.answer : "") ||
        (typeof data?.responseContent === "string" ? data.responseContent : "") ||
        "";

      // Unwrap nested JSON string
      if (text && text.trim().startsWith("{")) {
        try {
          const inner = JSON.parse(text) as Record<string, unknown>;
          text =
            (typeof inner.result === "string" ? inner.result : "") ||
            (typeof inner.output === "string" ? inner.output : "") ||
            (typeof inner.response === "string" ? inner.response : "") ||
            (typeof inner.message === "string" ? inner.message : "") ||
            text;
        } catch { /* keep original */ }
      }

      setRawResponse(text);

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: PlagiarismResult = JSON.parse(jsonMatch[0]);
        // Ensure the two values add up to 100
        if (
          parsed.plagiarizedPercent !== undefined &&
          parsed.uniquePercent === undefined
        ) {
          parsed.uniquePercent = 100 - parsed.plagiarizedPercent;
        }
        setResult(parsed);
      } else {
        // Fallback: show raw response as summary
        setResult({
          plagiarizedPercent: 0,
          uniquePercent: 100,
          summary: text,
          details: [],
        });
      }
    } catch (err) {
      setError(
        `Scan failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsScanning(false);
    }
  };

  const plagiarisedColor = "#ef4444";
  const uniqueColor = "#22c55e";

  return (
    <div className="full-height-layout">
      <LeftSidebar
        onDrawerStateChange={handleDrawerStateChange}
        onNavItemClick={(_, href) => { if (href && href !== "#") router.push(href); }}
      />

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`} style={{ overflowY: "auto" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            padding: "28px 32px 24px",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "6px" }}>
            Home &rsaquo; Plagiarism
          </div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>
            Plagiarism
          </h1>
        </div>

        <div style={{ padding: "28px 32px" }}>
          {/* Credits bar */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <span style={{ fontSize: "16px" }}>⚡</span>
            <strong>Credits Balance:</strong>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>
              {CREDITS_BALANCE} pages left
            </span>
          </div>

          {/* Main two-column area */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* ── Left: Form ── */}
            <div>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "16px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  Content Description *
                </label>
                <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>
                  Briefly, write down the description of the content you want to
                  check.
                </p>
                <textarea
                  rows={10}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Paste or type your content here to check for plagiarism..."
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    padding: "14px",
                    fontSize: "14px",
                    color: "#374151",
                    resize: "vertical",
                    outline: "none",
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {contentText.length} characters ·{" "}
                    {contentText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    onClick={() => setContentText("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#dc2626",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={isScanning || !contentText.trim()}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "999px",
                  background:
                    isScanning || !contentText.trim()
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #1e3a8a, #2563eb)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor:
                    isScanning || !contentText.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "opacity 0.2s",
                }}
              >
                {isScanning ? (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    Scan the Plagiarism
                  </>
                )}
              </button>
            </div>

            {/* ── Right: Report Panel ── */}
            <div
              style={{
                background: "#1e3a8a",
                borderRadius: "16px",
                padding: "24px",
                color: "#fff",
                position: "sticky",
                top: "20px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px",
                  fontSize: "18px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                AI Plagiarism Report
              </h3>

              {/* Gauge */}
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "20px 16px 16px",
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {result ? (
                  <>
                    <GaugeChart
                      percent={result.plagiarizedPercent}
                      color={plagiarisedColor}
                      label="Plagiarized"
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "24px",
                        marginTop: "12px",
                        fontSize: "13px",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: plagiarisedColor,
                            display: "inline-block",
                          }}
                        />
                        Plagiarized {result.plagiarizedPercent}%
                      </div>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: uniqueColor,
                            display: "inline-block",
                          }}
                        />
                        Unique {result.uniquePercent}%
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <GaugeChart percent={0} color={plagiarisedColor} label="Plagiarized" />
                    <div
                      style={{
                        display: "flex",
                        gap: "24px",
                        marginTop: "12px",
                        fontSize: "13px",
                        opacity: 0.6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: plagiarisedColor,
                            display: "inline-block",
                          }}
                        />
                        Plagiarized
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: uniqueColor,
                            display: "inline-block",
                          }}
                        />
                        Unique
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Report Details */}
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  padding: "14px",
                  minHeight: "60px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    opacity: 0.7,
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Report Details
                </div>
                {isScanning && (
                  <p style={{ fontSize: "13px", opacity: 0.8, margin: 0 }}>
                    Analyzing content…
                  </p>
                )}
                {result && !isScanning && (
                  <div>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, margin: "0 0 12px", opacity: 0.9 }}>
                      {result.summary}
                    </p>
                    {result.details && result.details.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {result.details.map((d, i) => (
                          <div
                            key={i}
                            style={{
                              background: "rgba(255,255,255,0.1)",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              fontSize: "12px",
                            }}
                          >
                            {d.source && (
                              <div style={{ fontWeight: 600, marginBottom: "4px", wordBreak: "break-all" }}>
                                🔗 {d.source}
                              </div>
                            )}
                            {d.similarity !== undefined && (
                              <div style={{ color: plagiarisedColor, fontWeight: 600, marginBottom: "4px" }}>
                                {d.similarity}% match
                              </div>
                            )}
                            {(d.excerpt || d.matchedText) && (
                              <div style={{ opacity: 0.75, fontStyle: "italic", lineHeight: 1.5 }}>
                                &ldquo;{d.excerpt || d.matchedText}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {(!result.details || result.details.length === 0) && (
                      <p style={{ fontSize: "12px", opacity: 0.6, margin: 0 }}>
                        No specific source matches identified.
                      </p>
                    )}
                  </div>
                )}
                {!result && !isScanning && (
                  <p style={{ fontSize: "13px", opacity: 0.5, margin: 0 }}>
                    Scan results will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
          min-height: 100vh;
          background-color: #ffffff;
          transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-x: hidden;
          position: relative;
          z-index: 1;
        }
        .main-content.collapsed {
          margin-left: 60px;
        }
        @media (max-width: 768px) {
          .main-content { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}

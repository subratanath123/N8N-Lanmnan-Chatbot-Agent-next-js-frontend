"use client";

import React, { useState, useRef, useEffect } from "react";
import LeftSidebar from "@/component/LeftSidebar";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════════════
   Advanced Animated Gauge
══════════════════════════════════════════════ */
function AdvancedGauge({ targetPercent }: { targetPercent: number }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setPct(0);
    if (targetPercent === 0) return;
    const step = 16;
    const steps = 1500 / step;
    const inc = targetPercent / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + inc, targetPercent);
      setPct(Math.round(cur));
      if (cur >= targetPercent) clearInterval(t);
    }, step);
    return () => clearInterval(t);
  }, [targetPercent]);

  const r = 105;
  const cx = 155;
  const cy = 145;
  const arcLen = Math.PI * r;
  const offset = arcLen * (1 - pct / 100);

  const needleAngle = Math.PI * (1 - pct / 100);
  const nx = cx + 72 * Math.cos(needleAngle);
  const ny = cy - 72 * Math.sin(needleAngle);

  const confidenceLabel = pct >= 70 ? "Likely AI" : pct >= 40 ? "Mixed Content" : "Likely Human";
  const confidenceColor = pct >= 70 ? "#f87171" : pct >= 40 ? "#fbbf24" : "#34d399";

  const majorTicks = [0, 25, 50, 75, 100];
  const minorTicks = [10, 20, 30, 40, 60, 70, 80, 90];

  return (
    <svg viewBox="0 0 310 190" width="100%" style={{ maxWidth: "300px" }}>
      <defs>
        <linearGradient id="gd" x1={cx - r} y1={cy} x2={cx + r} y2={cy} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
        <filter id="gd-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {minorTicks.map((t) => {
        const a = Math.PI * (1 - t / 100);
        return (
          <line key={t}
            x1={cx + (r - 4) * Math.cos(a)} y1={cy - (r - 4) * Math.sin(a)}
            x2={cx + (r + 5) * Math.cos(a)} y2={cy - (r + 5) * Math.sin(a)}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round"
          />
        );
      })}

      {majorTicks.map((t) => {
        const a = Math.PI * (1 - t / 100);
        return (
          <line key={t}
            x1={cx + (r - 8) * Math.cos(a)} y1={cy - (r - 8) * Math.sin(a)}
            x2={cx + (r + 11) * Math.cos(a)} y2={cy - (r + 11) * Math.sin(a)}
            stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round"
          />
        );
      })}

      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="18" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="url(#gd)" strokeWidth="18" strokeLinecap="round" opacity="0.2" />
      {pct > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gd)" strokeWidth="18" strokeLinecap="round"
          strokeDasharray={arcLen} strokeDashoffset={offset} filter="url(#gd-glow)" />
      )}

      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="9" fill="rgba(255,255,255,0.12)" />
      <circle cx={cx} cy={cy} r="5.5" fill="white" />
      <circle cx={cx} cy={cy} r="2.5" fill="#134e4a" />

      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="40" fontWeight="800" fill="white">
        {pct}%
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.55)">
        AI Generated
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={confidenceColor}>
        ● {confidenceLabel}
      </text>
      <text x={cx - r + 8} y={cy + 18} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">0%</text>
      <text x={cx + r - 8} y={cy + 18} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">100%</text>
    </svg>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.12)", borderRadius: "999px", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${pct}%`, background: color, borderRadius: "999px",
        transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   Types
══════════════════════════════════════════════ */
interface AIDetectorResult {
  aiGeneratedPercent: number;
  humanWrittenPercent: number;
  confidence: string;
  summary: string;
  indicators: string[];
}

/* ══════════════════════════════════════════════
   Page
══════════════════════════════════════════════ */
export default function AIDetectorPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleDrawerStateChange = (_: boolean, __: string, c?: boolean) => {
    if (c !== undefined) setSidebarCollapsed(c);
  };

  const [contentText, setContentText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AIDetectorResult | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(`aidtc-${Date.now()}`);
  const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setContentText(text);
  };

  const handleScan = async () => {
    if (!contentText.trim()) { setError("Please enter or upload content to analyze."); return; }
    setError(""); setResult(null); setIsScanning(true);

    const prompt = `You are an AI content detection engine. Analyze whether the following text was written by a human or generated by an AI. Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{"aiGeneratedPercent":<0-100>,"humanWrittenPercent":<0-100>,"confidence":"<high|medium|low>","summary":"<brief summary>","indicators":["<signal 1>","<signal 2>"]}

Text to analyze:
${contentText}`;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/v1/api/n8n/anonymous/chat/generic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", message: prompt, sessionId: sessionIdRef.current, model: "gpt-4o" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawText = await res.text();
      let data: Record<string, unknown>;
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = {}; }

      let text: string =
        (data?.result && typeof data.result === "object" && typeof (data.result as Record<string, unknown>).response === "string"
          ? (data.result as Record<string, unknown>).response as string : "") ||
        (typeof data?.result === "string" ? data.result : "") ||
        (typeof data?.output === "string" ? data.output : "") ||
        (typeof data?.message === "string" ? data.message : "") ||
        (typeof data?.response === "string" ? data.response : "") ||
        (typeof data?.answer === "string" ? data.answer : "") ||
        (typeof data?.responseContent === "string" ? data.responseContent : "") || "";

      if (text?.trim().startsWith("{")) {
        try {
          const inner = JSON.parse(text) as Record<string, unknown>;
          text = (typeof inner.result === "string" ? inner.result : "") ||
            (typeof inner.output === "string" ? inner.output : "") ||
            (typeof inner.response === "string" ? inner.response : "") ||
            (typeof inner.message === "string" ? inner.message : "") || text;
        } catch { /* keep */ }
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: AIDetectorResult = JSON.parse(jsonMatch[0]);
        if (parsed.aiGeneratedPercent !== undefined && parsed.humanWrittenPercent === undefined)
          parsed.humanWrittenPercent = 100 - parsed.aiGeneratedPercent;
        setResult(parsed);
      } else {
        setResult({ aiGeneratedPercent: 0, humanWrittenPercent: 100, confidence: "low", summary: text, indicators: [] });
      }
    } catch (e) {
      setError(`Analysis failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setIsScanning(false); }
  };

  const confBg = result?.confidence === "high" ? "rgba(52,211,153,0.2)" : result?.confidence === "medium" ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)";
  const confColor = result?.confidence === "high" ? "#34d399" : result?.confidence === "medium" ? "#fbbf24" : "#f87171";

  return (
    <div className="full-height-layout">
      <LeftSidebar
        onDrawerStateChange={handleDrawerStateChange}
        onNavItemClick={(_, href) => { if (href && href !== "#") router.push(href); }}
      />

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`} style={{ overflowY: "auto", background: "#f0fdfa" }}>

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #134e4a 0%, #0f766e 55%, #0d9488 100%)",
          padding: "32px 36px 28px", color: "#fff",
          boxShadow: "0 4px 20px rgba(19,78,74,0.35)",
        }}>
          <div style={{ fontSize: "12px", opacity: 0.65, marginBottom: "8px", letterSpacing: "0.04em" }}>
            Home › Content Analysis › AI Detector
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "rgba(255,255,255,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z" />
                <path d="M20 21a8 8 0 1 0-16 0" />
                <path d="M12 11v4M10 15h4" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em" }}>AI Content Detector</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", opacity: 0.7 }}>
                Identify whether text was written by AI or a human
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* Credits bar */}
          <div style={{
            background: "#fff", borderLeft: "4px solid #0d9488",
            borderRadius: "12px", padding: "12px 20px", marginBottom: "24px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 2px 8px rgba(13,148,136,0.1)",
          }}>
            <span style={{ fontSize: "18px" }}>⚡</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>
              <strong>Credits Balance:</strong>{" "}
              <span style={{ color: "#0d9488", fontWeight: 700 }}>30 pages left</span>
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              {[
                { label: "Human", color: "#065f46", bg: "#d1fae5" },
                { label: "Mixed", color: "#92400e", bg: "#fef3c7" },
                { label: "AI Gen", color: "#991b1b", bg: "#fee2e2" },
              ].map(({ label, color, bg }) => (
                <span key={label} style={{
                  fontSize: "11px", padding: "3px 10px", borderRadius: "999px",
                  fontWeight: 600, background: bg, color,
                }}>{label}</span>
              ))}
            </div>
          </div>

          {/* Two columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

            {/* Left */}
            <div>
              <div style={{
                background: "#fff", border: "1.5px solid #99f6e4",
                borderRadius: "20px", padding: "28px",
                boxShadow: "0 4px 24px rgba(13,148,136,0.08)",
              }}>
                {/* File upload */}
                <div style={{ marginBottom: "20px" }}>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf"
                    onChange={handleFileChange} style={{ display: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "9px 18px", borderRadius: "10px",
                        border: "1.5px solid #99f6e4", background: "#f0fdfa",
                        color: "#0f766e", fontSize: "13px", fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload File
                    </button>
                    <span style={{
                      fontSize: "13px", color: "#6b7280",
                      background: "#f3f4f6", padding: "5px 12px", borderRadius: "8px",
                      maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {fileName || "No file chosen"}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: "6px 0 0" }}>
                    .txt · .md · .doc · .docx · .pdf — or paste text below
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0d9488" }} />
                  <label style={{ fontWeight: 700, color: "#134e4a", fontSize: "15px" }}>
                    Content to Analyze *
                  </label>
                </div>
                <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 16px 18px" }}>
                  Paste or type the text you want to check for AI generation.
                </p>
                <textarea
                  rows={11}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Paste your content here to detect AI-generated text…"
                  style={{
                    width: "100%", border: "1.5px solid #ccfbf1",
                    borderRadius: "12px", padding: "16px", fontSize: "14px",
                    color: "#1f2937", resize: "vertical", outline: "none",
                    lineHeight: 1.7, fontFamily: "inherit", boxSizing: "border-box",
                    background: "#f0fdfa", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.target.style.borderColor = "#ccfbf1")}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: "999px" }}>
                      {contentText.length} chars
                    </span>
                    <span style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: "999px" }}>
                      {wordCount} words
                    </span>
                  </div>
                  <button onClick={() => { setContentText(""); setFileName(""); }}
                    style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "12px", cursor: "pointer" }}>
                    ✕ Clear
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "12px", padding: "14px 18px", color: "#dc2626",
                  fontSize: "14px", marginTop: "14px", display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <span style={{ fontSize: "18px" }}>⚠️</span> {error}
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={isScanning || !contentText.trim()}
                style={{
                  width: "100%", padding: "16px", borderRadius: "14px", marginTop: "16px",
                  background: isScanning || !contentText.trim()
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  color: "#fff", border: "none", fontWeight: 800, fontSize: "15px",
                  cursor: isScanning || !contentText.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: isScanning || !contentText.trim() ? "none" : "0 8px 20px rgba(13,148,136,0.35)",
                  transition: "all 0.2s", letterSpacing: "0.02em",
                }}
              >
                {isScanning ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                      style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Detecting Content…
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Detect AI Content
                  </>
                )}
              </button>

              <div style={{
                marginTop: "20px", background: "#f0fdfa", border: "1px dashed #5eead4",
                borderRadius: "12px", padding: "16px 20px",
              }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#134e4a", fontWeight: 600, marginBottom: "8px" }}>
                  💡 Tips for best results
                </p>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#6b7280", lineHeight: 2 }}>
                  <li>Use at least 200 words for reliable detection</li>
                  <li>Works best with essays, articles, and blog posts</li>
                  <li>Heavily edited AI text may register as human</li>
                </ul>
              </div>
            </div>

            {/* Right: Report */}
            <div style={{
              background: "linear-gradient(160deg, #0a2e2e 0%, #134e4a 50%, #115e59 100%)",
              borderRadius: "20px", padding: "24px", color: "#fff",
              position: "sticky", top: "16px",
              boxShadow: "0 16px 40px rgba(19,78,74,0.4)",
            }}>
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, letterSpacing: "0.02em" }}>
                  🤖 AI Detection Report
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "11px", opacity: 0.5 }}>Powered by AI Analysis</p>
              </div>

              <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                <AdvancedGauge targetPercent={result?.aiGeneratedPercent ?? 0} />
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                {[
                  { label: "AI Generated", value: result ? `${result.aiGeneratedPercent}%` : "—", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
                  { label: "Human Written", value: result ? `${result.humanWrittenPercent}%` : "—", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
                ].map((s) => (
                  <div key={s.label} style={{
                    background: s.bg, borderRadius: "10px", padding: "10px 14px",
                    border: `1px solid ${s.color}30`,
                  }}>
                    <div style={{ fontSize: "10px", opacity: 0.65, marginBottom: "4px" }}>{s.label}</div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    {result && (
                      <ProgressBar
                        pct={s.label === "AI Generated" ? result.aiGeneratedPercent : result.humanWrittenPercent}
                        color={s.color}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Confidence badge */}
              {result?.confidence && (
                <div style={{
                  background: confBg, border: `1px solid ${confColor}40`,
                  borderRadius: "10px", padding: "8px 14px", marginBottom: "12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "12px", opacity: 0.7 }}>Detection Confidence</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: confColor }}>
                    {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
                  </span>
                </div>
              )}

              {/* Words */}
              {result && (
                <div style={{
                  background: "rgba(255,255,255,0.07)", borderRadius: "10px",
                  padding: "8px 14px", marginBottom: "12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px",
                }}>
                  <span style={{ opacity: 0.6 }}>Words analyzed</span>
                  <span style={{ fontWeight: 700, color: "#5eead4" }}>{wordCount.toLocaleString()}</span>
                </div>
              )}

              {/* Details */}
              <div style={{
                background: "rgba(255,255,255,0.06)", borderRadius: "12px",
                padding: "14px", minHeight: "80px",
              }}>
                <div style={{
                  fontSize: "10px", fontWeight: 700, opacity: 0.5, marginBottom: "10px",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  Report Details
                </div>

                {isScanning && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", opacity: 0.8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Analyzing writing patterns…
                  </div>
                )}

                {result && !isScanning && (
                  <>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.65, margin: "0 0 12px", opacity: 0.88 }}>
                      {result.summary}
                    </p>
                    {result.indicators?.length > 0 && (
                      <>
                        <div style={{
                          fontSize: "10px", fontWeight: 700, opacity: 0.5, marginBottom: "8px",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>
                          Key Signals
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {result.indicators.map((ind, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "flex-start", gap: "8px",
                              fontSize: "12px", lineHeight: 1.55,
                              background: "rgba(255,255,255,0.07)", borderRadius: "8px",
                              padding: "7px 10px", borderLeft: "3px solid #5eead4",
                            }}>
                              <span style={{ color: "#5eead4", fontWeight: 700, flexShrink: 0 }}>›</span>
                              <span style={{ opacity: 0.85 }}>{ind}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {!result && !isScanning && (
                  <div style={{ textAlign: "center", padding: "16px 0", opacity: 0.4 }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🤖</div>
                    <p style={{ fontSize: "12px", margin: 0 }}>Results will appear here after detection</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .full-height-layout { display: flex; width: 100%; min-height: 100vh; position: relative; }
        .main-content {
          flex: 1; margin-left: 280px; min-height: 100vh;
          transition: margin-left 0.4s cubic-bezier(0.4,0,0.2,1);
          overflow-x: hidden; position: relative; z-index: 1;
        }
        .main-content.collapsed { margin-left: 60px; }
        @media (max-width: 768px) { .main-content { margin-left: 0; } }
      `}</style>
    </div>
  );
}

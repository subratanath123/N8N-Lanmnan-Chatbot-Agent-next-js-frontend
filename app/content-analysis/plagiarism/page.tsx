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

  const riskLabel = pct >= 60 ? "High Risk" : pct >= 30 ? "Moderate Risk" : "Low Risk";
  const riskColor = pct >= 60 ? "#f87171" : pct >= 30 ? "#fbbf24" : "#34d399";

  const majorTicks = [0, 25, 50, 75, 100];
  const minorTicks = [10, 20, 30, 40, 60, 70, 80, 90];

  return (
    <svg viewBox="0 0 310 190" width="100%" style={{ maxWidth: "300px" }}>
      <defs>
        <linearGradient id="gp" x1={cx - r} y1={cy} x2={cx + r} y2={cy} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="48%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
        <filter id="gp-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Minor ticks */}
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

      {/* Major ticks */}
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

      {/* Background track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="18" strokeLinecap="round" />

      {/* Dim full spectrum */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="url(#gp)" strokeWidth="18" strokeLinecap="round" opacity="0.2" />

      {/* Animated fill */}
      {pct > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gp)" strokeWidth="18" strokeLinecap="round"
          strokeDasharray={arcLen} strokeDashoffset={offset}
          filter="url(#gp-glow)"
        />
      )}

      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="9" fill="rgba(255,255,255,0.12)" />
      <circle cx={cx} cy={cy} r="5.5" fill="white" />
      <circle cx={cx} cy={cy} r="2.5" fill="#1e3a8a" />

      {/* Big percentage */}
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="40" fontWeight="800" fill="white">
        {pct}%
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.55)">
        Plagiarized
      </text>

      {/* Risk pill */}
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={riskColor}>
        ● {riskLabel}
      </text>

      {/* Edge labels */}
      <text x={cx - r + 8} y={cy + 18} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">0%</text>
      <text x={cx + r - 8} y={cy + 18} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">100%</text>
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Horizontal progress bar
══════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════
   Page
══════════════════════════════════════════════ */
export default function PlagiarismPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleDrawerStateChange = (_: boolean, __: string, c?: boolean) => {
    if (c !== undefined) setSidebarCollapsed(c);
  };

  const [contentText, setContentText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [error, setError] = useState("");
  const sessionIdRef = useRef(`plag-${Date.now()}`);
  const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;

  const handleScan = async () => {
    if (!contentText.trim()) { setError("Please enter content to scan."); return; }
    setError(""); setResult(null); setIsScanning(true);

    const prompt = `You are a plagiarism detection engine. Analyze the following text for plagiarism and return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{"plagiarizedPercent":<0-100>,"uniquePercent":<0-100>,"summary":"<brief summary>","details":[{"source":"<source>","similarity":<number>,"excerpt":"<matched excerpt>"}]}

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
        const parsed: PlagiarismResult = JSON.parse(jsonMatch[0]);
        if (parsed.plagiarizedPercent !== undefined && parsed.uniquePercent === undefined)
          parsed.uniquePercent = 100 - parsed.plagiarizedPercent;
        setResult(parsed);
      } else {
        setResult({ plagiarizedPercent: 0, uniquePercent: 100, summary: text, details: [] });
      }
    } catch (e) {
      setError(`Scan failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setIsScanning(false); }
  };

  return (
    <div className="full-height-layout">
      <LeftSidebar
        onDrawerStateChange={handleDrawerStateChange}
        onNavItemClick={(_, href) => { if (href && href !== "#") router.push(href); }}
      />

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`} style={{ overflowY: "auto", background: "#eff6ff" }}>

        {/* ── Header ── */}
        <div style={{
          padding: "28px 36px 24px",
          borderBottom: "1px solid #e2e8f0",
        }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px", letterSpacing: "0.04em" }}>
            Home › Content Analysis › Plagiarism
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "#eff6ff", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                <path d="M11 7v8M7 11h8" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" }}>Plagiarism Checker</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                Detect copied or duplicated content in seconds
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* ── Credits bar ── */}
          <div style={{
            background: "#fff", borderLeft: "4px solid #2563eb",
            borderRadius: "12px", padding: "12px 20px", marginBottom: "24px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 2px 8px rgba(37,99,235,0.1)",
          }}>
            <span style={{ fontSize: "18px" }}>⚡</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>
              <strong>Credits Balance:</strong>{" "}
              <span style={{ color: "#2563eb", fontWeight: 700 }}>30 pages left</span>
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              {["Low", "Medium", "High"].map((l, i) => (
                <span key={l} style={{
                  fontSize: "11px", padding: "3px 10px", borderRadius: "999px", fontWeight: 600,
                  background: i === 0 ? "#dbeafe" : i === 1 ? "#fef3c7" : "#fee2e2",
                  color: i === 0 ? "#1e40af" : i === 1 ? "#92400e" : "#991b1b",
                }}>{l} Risk</span>
              ))}
            </div>
          </div>

          {/* ── Two-column ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

            {/* Left: Form */}
            <div>
              <div style={{
                background: "#fff", border: "1.5px solid #bfdbfe",
                borderRadius: "20px", padding: "28px",
                boxShadow: "0 4px 24px rgba(37,99,235,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
                  <label style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "15px" }}>
                    Content to Check *
                  </label>
                </div>
                <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 16px 18px" }}>
                  Paste or type the text you want to scan for plagiarism.
                </p>
                <textarea
                  rows={12}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Paste your essay, article, or any written content here…"
                  style={{
                    width: "100%", border: "1.5px solid #dbeafe",
                    borderRadius: "12px", padding: "16px", fontSize: "14px",
                    color: "#1f2937", resize: "vertical", outline: "none",
                    lineHeight: 1.7, fontFamily: "inherit", boxSizing: "border-box",
                    background: "#f8faff", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#dbeafe")}
                />
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginTop: "10px",
                }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span style={{
                      fontSize: "12px", color: "#6b7280",
                      background: "#f3f4f6", padding: "3px 10px", borderRadius: "999px",
                    }}>
                      {contentText.length} chars
                    </span>
                    <span style={{
                      fontSize: "12px", color: "#6b7280",
                      background: "#f3f4f6", padding: "3px 10px", borderRadius: "999px",
                    }}>
                      {wordCount} words
                    </span>
                  </div>
                  <button onClick={() => setContentText("")}
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
                    : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#fff", border: "none", fontWeight: 800, fontSize: "15px",
                  cursor: isScanning || !contentText.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: isScanning || !contentText.trim() ? "none" : "0 8px 20px rgba(5,150,105,0.35)",
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
                    Scanning Content…
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    Scan for Plagiarism
                  </>
                )}
              </button>

              {/* Tips */}
              <div style={{
                marginTop: "20px", background: "#eff6ff", border: "1px dashed #93c5fd",
                borderRadius: "12px", padding: "16px 20px",
              }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#1e40af", fontWeight: 600, marginBottom: "8px" }}>
                  💡 Tips for best results
                </p>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#6b7280", lineHeight: 2 }}>
                  <li>Use at least 150 words for accurate detection</li>
                  <li>Include the complete original text without edits</li>
                  <li>Works best with academic or professional content</li>
                </ul>
              </div>
            </div>

            {/* Right: Report */}
            <div style={{
              background: "linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)",
              borderRadius: "20px", padding: "24px", color: "#fff",
              position: "sticky", top: "16px",
              boxShadow: "0 16px 40px rgba(30,58,138,0.4)",
            }}>
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, letterSpacing: "0.02em" }}>
                  📋 Plagiarism Report
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "11px", opacity: 0.5 }}>
                  Powered by AI Analysis
                </p>
              </div>

              {/* Gauge */}
              <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                margin: "8px 0",
              }}>
                <AdvancedGauge targetPercent={result?.plagiarizedPercent ?? 0} />
              </div>

              {/* Stats chips */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                {[
                  { label: "Plagiarized", value: result ? `${result.plagiarizedPercent}%` : "—", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
                  { label: "Unique", value: result ? `${result.uniquePercent}%` : "—", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
                ].map((s) => (
                  <div key={s.label} style={{
                    background: s.bg, borderRadius: "10px",
                    padding: "10px 14px", border: `1px solid ${s.color}30`,
                  }}>
                    <div style={{ fontSize: "11px", opacity: 0.65, marginBottom: "4px" }}>{s.label}</div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</div>
                    {result && (
                      <ProgressBar
                        pct={s.label === "Plagiarized" ? result.plagiarizedPercent : result.uniquePercent}
                        color={s.color}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Words scanned */}
              {result && (
                <div style={{
                  background: "rgba(255,255,255,0.07)", borderRadius: "10px",
                  padding: "8px 14px", marginBottom: "12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: "12px",
                }}>
                  <span style={{ opacity: 0.6 }}>Words scanned</span>
                  <span style={{ fontWeight: 700, color: "#34d399" }}>{wordCount.toLocaleString()}</span>
                </div>
              )}

              {/* Report details */}
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
                    Analyzing content for plagiarism…
                  </div>
                )}

                {result && !isScanning && (
                  <>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.65, margin: "0 0 12px", opacity: 0.88 }}>
                      {result.summary}
                    </p>
                    {result.details?.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {result.details.map((d, i) => (
                          <div key={i} style={{
                            background: "rgba(255,255,255,0.09)", borderRadius: "10px",
                            padding: "10px 12px", fontSize: "12px",
                            borderLeft: "3px solid #f87171",
                          }}>
                            {d.source && (
                              <div style={{ fontWeight: 700, marginBottom: "4px", wordBreak: "break-all", opacity: 0.9 }}>
                                🔗 {d.source}
                              </div>
                            )}
                            {d.similarity != null && (
                              <div style={{ color: "#fbbf24", fontWeight: 700, marginBottom: "4px" }}>
                                {d.similarity}% similarity
                              </div>
                            )}
                            {(d.excerpt || d.matchedText) && (
                              <div style={{ opacity: 0.7, fontStyle: "italic", lineHeight: 1.5 }}>
                                "{d.excerpt || d.matchedText}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "12px", opacity: 0.5, margin: 0 }}>No specific sources identified.</p>
                    )}
                  </>
                )}

                {!result && !isScanning && (
                  <div style={{ textAlign: "center", padding: "16px 0", opacity: 0.4 }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                    <p style={{ fontSize: "12px", margin: 0 }}>Results will appear here after scan</p>
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

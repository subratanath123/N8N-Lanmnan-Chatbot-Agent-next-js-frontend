"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import LeftSidebar from "@/component/LeftSidebar";

/* ══════════════════════════════════════════════
   Types
══════════════════════════════════════════════ */
type HttpMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
type AuthType = "none" | "bearer" | "apikey" | "basic";

interface ChatEndpointConfig {
  url: string;
  method: HttpMethod;
  authType: AuthType;
  authValue: string;
  apiKeyHeader: string;
  bodyTemplate: string;
  responsePath: string;
  enabled: boolean;
}

interface ActionEndpoint {
  id: string;
  name: string;
  description: string;
  triggerPhrases: string;
  url: string;
  method: HttpMethod;
  authType: AuthType;
  authValue: string;
  bodyTemplate: string;
  successMessage: string;
  failureMessage: string;
  enabled: boolean;
}

interface WorkflowConfig {
  chatEndpoint: ChatEndpointConfig;
  actions: ActionEndpoint[];
}

interface TestResult {
  status: number | null;
  ok: boolean;
  requestSent: string;
  responseBody: string;
  durationMs: number | null;
  parsedReply: string;
  error: string;
}

/* ══════════════════════════════════════════════
   Default values
══════════════════════════════════════════════ */
const DEFAULT_BODY_TEMPLATE = `{
  "message": "{{message}}",
  "sessionId": "{{sessionId}}",
  "userId": "{{userId}}",
  "chatbotId": "{{chatbotId}}"
}`;

const DEFAULT_ACTION_BODY = `{
  "action": "{{actionName}}",
  "message": "{{message}}",
  "sessionId": "{{sessionId}}",
  "userId": "{{userId}}"
}`;

const DEFAULT_ENDPOINT: ChatEndpointConfig = {
  url: "",
  method: "POST",
  authType: "none",
  authValue: "",
  apiKeyHeader: "X-API-Key",
  bodyTemplate: DEFAULT_BODY_TEMPLATE,
  responsePath: "output",
  enabled: true,
};

const newAction = (): ActionEndpoint => ({
  id: `action-${Date.now()}`,
  name: "",
  description: "",
  triggerPhrases: "",
  url: "",
  method: "POST",
  authType: "none",
  authValue: "",
  bodyTemplate: DEFAULT_ACTION_BODY,
  successMessage: "Done! Your request has been processed.",
  failureMessage: "Sorry, I couldn't complete that action. Please try again.",
  enabled: true,
});

/* ══════════════════════════════════════════════
   Sub-components
══════════════════════════════════════════════ */
function AuthFields({
  authType, authValue, apiKeyHeader,
  onChange,
}: {
  authType: AuthType;
  authValue: string;
  apiKeyHeader: string;
  onChange: (field: string, val: string) => void;
}) {
  if (authType === "none") return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
      {authType === "apikey" && (
        <div>
          <label style={labelStyle}>Header Name</label>
          <input style={inputStyle} value={apiKeyHeader} placeholder="X-API-Key"
            onChange={e => onChange("apiKeyHeader", e.target.value)} />
        </div>
      )}
      <div>
        <label style={labelStyle}>
          {authType === "bearer" ? "Bearer Token" : authType === "basic" ? "Base64 Credentials (user:pass)" : "API Key Value"}
        </label>
        <input style={inputStyle} type="password" value={authValue}
          placeholder={authType === "bearer" ? "eyJ..." : authType === "basic" ? "dXNlcjpwYXNz" : "sk-..."}
          onChange={e => onChange("authValue", e.target.value)} />
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children, badge }: {
  title: string; icon: string; children: React.ReactNode; badge?: string;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
      overflow: "hidden", marginBottom: "20px",
      boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
    }}>
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", gap: "10px",
        background: "#f8fafc",
      }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{title}</span>
        {badge && (
          <span style={{
            marginLeft: "auto", fontSize: "11px", fontWeight: 600,
            padding: "3px 10px", borderRadius: "999px",
            background: "#dbeafe", color: "#1d4ed8",
          }}>{badge}</span>
        )}
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      {hint && <p style={{ margin: "2px 0 6px", fontSize: "12px", color: "#94a3b8" }}>{hint}</p>}
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "#374151", marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
  borderRadius: "10px", fontSize: "14px", color: "#1f2937",
  outline: "none", boxSizing: "border-box", background: "#fff",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
  paddingRight: "36px",
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical", lineHeight: 1.6,
  fontFamily: "ui-monospace, 'Cascadia Code', monospace", fontSize: "13px",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 22px", borderRadius: "10px",
  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
  color: "#fff", border: "none", fontWeight: 700, fontSize: "14px",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
  boxShadow: "0 4px 14px rgba(37,99,235,0.3)", transition: "opacity 0.2s",
};
const btnOutline: React.CSSProperties = {
  padding: "10px 20px", borderRadius: "10px",
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#374151", fontWeight: 600, fontSize: "14px",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
};
const btnDanger: React.CSSProperties = {
  padding: "8px 16px", borderRadius: "8px",
  border: "1.5px solid #fecaca", background: "#fff",
  color: "#dc2626", fontWeight: 600, fontSize: "13px",
  cursor: "pointer",
};

/* ══════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════ */
export default function WorkflowPage() {
  const { id: chatbotId } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ── State ── */
  const [chatbotName, setChatbotName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"chat" | "actions" | "test">("chat");
  const [config, setConfig] = useState<WorkflowConfig>({
    chatEndpoint: { ...DEFAULT_ENDPOINT },
    actions: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  /* ── Test console ── */
  const [testMessage, setTestMessage] = useState("Hello, what products do you offer?");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  /* ── Auth headers helper ── */
  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isSignedIn && getToken) {
      try {
        const t = await getToken();
        if (t) headers["Authorization"] = `Bearer ${t}`;
      } catch { /* skip */ }
    }
    return headers;
  }, [isSignedIn, getToken]);

  /* ── Load chatbot name + workflow config ── */
  useEffect(() => {
    if (!chatbotId) return;
    (async () => {
      setIsLoading(true);
      const headers = await authHeaders();
      try {
        // Load chatbot name
        const cb = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}`, { headers });
        if (cb.ok) {
          const data = await cb.json();
          setChatbotName(data.name || data.chatbotId || chatbotId);
        }
        // Load workflow config
        const wf = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/workflow`, { headers });
        if (wf.ok) {
          const wfData = await wf.json();
          setConfig({
            chatEndpoint: { ...DEFAULT_ENDPOINT, ...(wfData.chatEndpoint || {}) },
            actions: wfData.actions || [],
          });
        }
      } catch { /* first time — no config yet */ }
      setIsLoading(false);
    })();
  }, [chatbotId, backendUrl, authHeaders]);

  /* ── Save ── */
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const headers = await authHeaders();
      const res = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/workflow`, {
        method: "POST",
        headers,
        body: JSON.stringify(config),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch { setSaveStatus("error"); }
    setIsSaving(false);
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  /* ── Test chat endpoint ── */
  const handleTest = async () => {
    if (!config.chatEndpoint.url.trim()) {
      setTestResult({ status: null, ok: false, requestSent: "", responseBody: "", durationMs: null, parsedReply: "", error: "No endpoint URL configured." });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    let body = config.chatEndpoint.bodyTemplate
      .replace(/\{\{message\}\}/g, testMessage)
      .replace(/\{\{sessionId\}\}/g, `test-${Date.now()}`)
      .replace(/\{\{userId\}\}/g, "test-user")
      .replace(/\{\{chatbotId\}\}/g, chatbotId as string);

    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (config.chatEndpoint.authType === "bearer")
      reqHeaders["Authorization"] = `Bearer ${config.chatEndpoint.authValue}`;
    if (config.chatEndpoint.authType === "apikey")
      reqHeaders[config.chatEndpoint.apiKeyHeader || "X-API-Key"] = config.chatEndpoint.authValue;
    if (config.chatEndpoint.authType === "basic")
      reqHeaders["Authorization"] = `Basic ${config.chatEndpoint.authValue}`;

    const t0 = Date.now();
    try {
      const res = await fetch(config.chatEndpoint.url, {
        method: config.chatEndpoint.method,
        headers: reqHeaders,
        body: config.chatEndpoint.method !== "GET" ? body : undefined,
      });
      const durationMs = Date.now() - t0;
      const responseBody = await res.text();

      let parsedReply = "";
      try {
        const parsed = JSON.parse(responseBody);
        const paths = config.chatEndpoint.responsePath.split(".");
        let cur: unknown = parsed;
        for (const p of paths) {
          if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
          else { cur = undefined; break; }
        }
        parsedReply = typeof cur === "string" ? cur : JSON.stringify(cur ?? "(not found)");
      } catch { parsedReply = responseBody.slice(0, 200); }

      setTestResult({ status: res.status, ok: res.ok, requestSent: body, responseBody, durationMs, parsedReply, error: "" });
    } catch (e) {
      setTestResult({ status: null, ok: false, requestSent: body, responseBody: "", durationMs: Date.now() - t0, parsedReply: "", error: e instanceof Error ? e.message : String(e) });
    }
    setIsTesting(false);
  };

  /* ── Action helpers ── */
  const updateAction = (id: string, field: keyof ActionEndpoint, value: string | boolean) => {
    setConfig(c => ({ ...c, actions: c.actions.map(a => a.id === id ? { ...a, [field]: value } : a) }));
  };
  const removeAction = (id: string) => {
    setConfig(c => ({ ...c, actions: c.actions.filter(a => a.id !== id) }));
  };
  const addAction = () => {
    const a = newAction();
    setConfig(c => ({ ...c, actions: [...c.actions, a] }));
    setExpandedAction(a.id);
  };

  /* ── Endpoint shortcut field updater ── */
  const setEp = (field: keyof ChatEndpointConfig, val: string | boolean) => {
    setConfig(c => ({ ...c, chatEndpoint: { ...c.chatEndpoint, [field]: val } }));
  };

  if (isLoading) {
    return (
      <div className="full-height-layout">
        <LeftSidebar
          onDrawerStateChange={(_isOpen, _activeItem, collapsed) => { if (collapsed !== undefined) setSidebarCollapsed(collapsed); }}
          onNavItemClick={(_name, href) => { if (href && href !== "#") router.push(href); }}
        />
        <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "15px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚙️</div>
            Loading workflow configuration…
          </div>
        </div>
        <style jsx>{CSS}</style>
      </div>
    );
  }

  return (
    <div className="full-height-layout">
      <LeftSidebar
        onDrawerStateChange={(_isOpen, _activeItem, collapsed) => { if (collapsed !== undefined) setSidebarCollapsed(collapsed); }}
        onNavItemClick={(_name, href) => { if (href && href !== "#") router.push(href); }}
      />

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`} style={{ background: "#f8fafc", overflowY: "auto" }}>

        {/* ── Page Header ── */}
        <div style={{ padding: "24px 32px 20px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
            <button onClick={() => router.push("/ai-chatbots")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0, fontSize: "12px" }}>
              AI Chatbots
            </button>
            <span>›</span>
            <button onClick={() => router.push(`/ai-chatbots/${chatbotId}`)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0, fontSize: "12px" }}>
              {chatbotName || chatbotId}
            </button>
            <span>›</span>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>Workflow Config</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "14px", background: "#eff6ff",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
                  Workflow Configuration
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  Connect your backend, N8N workflows, or custom APIs to <strong>{chatbotName}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {saveStatus === "saved" && (
                <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  ✅ Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 600 }}>⚠️ Save failed</span>
              )}
              <button onClick={() => router.push(`/ai-chatbots/${chatbotId}`)} style={btnOutline}>
                ← Back to Chatbot
              </button>
              <button onClick={handleSave} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                    style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                )}
                {isSaving ? "Saving…" : "Save Config"}
              </button>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: "4px", marginTop: "20px" }}>
            {([
              { key: "chat", label: "🔗 Chat Endpoint", desc: "AI processing" },
              { key: "actions", label: "⚡ Action Endpoints", desc: `${config.actions.length} configured` },
              { key: "test", label: "🧪 Test Console", desc: "Live testing" },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: "10px 20px", border: "none", borderRadius: "10px 10px 0 0",
                background: activeTab === t.key ? "#fff" : "transparent",
                color: activeTab === t.key ? "#2563eb" : "#64748b",
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: "14px", cursor: "pointer",
                borderBottom: activeTab === t.key ? "2px solid #2563eb" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {t.label}
                <span style={{ fontSize: "11px", marginLeft: "6px", opacity: 0.65 }}>({t.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Chat Endpoint ── */}
        {activeTab === "chat" && (
          <div style={{ padding: "28px 32px", maxWidth: "860px" }}>

            {/* Enable toggle */}
            <div style={{
              background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0",
              padding: "16px 20px", marginBottom: "20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Custom Chat Endpoint</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  When enabled, messages are routed to your endpoint instead of the default AI
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <div
                  onClick={() => setEp("enabled", !config.chatEndpoint.enabled)}
                  style={{
                    width: "44px", height: "24px", borderRadius: "999px",
                    background: config.chatEndpoint.enabled ? "#2563eb" : "#d1d5db",
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: "3px",
                    left: config.chatEndpoint.enabled ? "23px" : "3px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: config.chatEndpoint.enabled ? "#2563eb" : "#9ca3af" }}>
                  {config.chatEndpoint.enabled ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>

            <SectionCard title="Endpoint URL & Method" icon="🌐">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "12px" }}>
                <Row label="Endpoint URL" hint="Your N8N webhook URL or custom API endpoint">
                  <input style={inputStyle} value={config.chatEndpoint.url}
                    placeholder="https://your-n8n.com/webhook/abc123"
                    onChange={e => setEp("url", e.target.value)} />
                </Row>
                <Row label="Method">
                  <select style={selectStyle} value={config.chatEndpoint.method}
                    onChange={e => setEp("method", e.target.value as HttpMethod)}>
                    {["POST", "GET", "PUT"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </Row>
              </div>
            </SectionCard>

            <SectionCard title="Authentication" icon="🔐">
              <Row label="Auth Type">
                <select style={selectStyle} value={config.chatEndpoint.authType}
                  onChange={e => setEp("authType", e.target.value as AuthType)}>
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key (Header)</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </Row>
              <AuthFields
                authType={config.chatEndpoint.authType}
                authValue={config.chatEndpoint.authValue}
                apiKeyHeader={config.chatEndpoint.apiKeyHeader}
                onChange={(f, v) => setEp(f as keyof ChatEndpointConfig, v)}
              />
            </SectionCard>

            <SectionCard title="Request Body Template" icon="📤" badge="JSON">
              <div style={{
                background: "#f8fafc", borderRadius: "8px", padding: "10px 14px",
                marginBottom: "12px", fontSize: "12px", color: "#475569",
                border: "1px dashed #cbd5e1", lineHeight: 1.8,
              }}>
                <strong>Available variables:</strong>{" "}
                {["{{message}}", "{{sessionId}}", "{{userId}}", "{{chatbotId}}"].map(v => (
                  <code key={v} style={{ background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px", margin: "0 3px", fontSize: "11px" }}>{v}</code>
                ))}
              </div>
              <Row label="Body Template" hint="JSON payload sent to your endpoint on each message">
                <textarea rows={8} style={textareaStyle} value={config.chatEndpoint.bodyTemplate}
                  onChange={e => setEp("bodyTemplate", e.target.value)} />
              </Row>
            </SectionCard>

            <SectionCard title="Response Mapping" icon="📥">
              <Row label="Response Path"
                hint='JSON path to extract the reply text. Use dots for nested: "data.output" or just "output"'>
                <input style={inputStyle} value={config.chatEndpoint.responsePath}
                  placeholder="output" onChange={e => setEp("responsePath", e.target.value)} />
              </Row>
              <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "12px 16px", fontSize: "12px", color: "#475569", border: "1px dashed #cbd5e1" }}>
                <strong>Example:</strong> If your API returns <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: "3px" }}>{`{"data": {"output": "Hello!"}}`}</code>,
                set the path to <code style={{ background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px" }}>data.output</code>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Tab: Action Endpoints ── */}
        {activeTab === "actions" && (
          <div style={{ padding: "28px 32px", maxWidth: "860px" }}>

            {/* Intro banner */}
            <div style={{
              background: "linear-gradient(135deg,#eff6ff,#f0f9ff)", borderRadius: "14px",
              padding: "18px 22px", marginBottom: "24px", border: "1px solid #bfdbfe",
              display: "flex", gap: "16px", alignItems: "flex-start",
            }}>
              <span style={{ fontSize: "28px", flexShrink: 0 }}>⚡</span>
              <div>
                <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "4px" }}>Action Endpoints</div>
                <p style={{ margin: 0, fontSize: "13px", color: "#3b82f6", lineHeight: 1.6 }}>
                  Configure actions the chatbot can perform on behalf of users — like placing orders, checking stock, or booking appointments.
                  The AI detects trigger phrases in messages and automatically calls the configured endpoint.
                </p>
              </div>
            </div>

            {config.actions.length === 0 && (
              <div style={{
                textAlign: "center", padding: "48px 24px",
                background: "#fff", borderRadius: "16px", border: "1.5px dashed #e2e8f0", marginBottom: "20px",
              }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                <h3 style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>No actions configured</h3>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0 0" }}>
                  Add your first action endpoint to enable order placement, bookings, and more.
                </p>
              </div>
            )}

            {config.actions.map((action, idx) => (
              <div key={action.id} style={{
                background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
                marginBottom: "14px", overflow: "hidden",
                boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
              }}>
                {/* Action header */}
                <div
                  onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                  style={{
                    padding: "14px 20px", display: "flex", alignItems: "center",
                    gap: "12px", cursor: "pointer", background: "#f8fafc",
                    borderBottom: expandedAction === action.id ? "1px solid #e2e8f0" : "none",
                  }}
                >
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "#dbeafe", color: "#2563eb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "14px", flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                      {action.name || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Untitled Action</span>}
                    </div>
                    {action.url && <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px", fontFamily: "monospace" }}>{action.url}</div>}
                  </div>
                  {/* Enable toggle */}
                  <div
                    onClick={e => { e.stopPropagation(); updateAction(action.id, "enabled", !action.enabled); }}
                    style={{
                      width: "36px", height: "20px", borderRadius: "999px",
                      background: action.enabled ? "#2563eb" : "#d1d5db",
                      position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: "absolute", top: "2px",
                      left: action.enabled ? "18px" : "2px",
                      width: "16px", height: "16px", borderRadius: "50%",
                      background: "#fff", transition: "left 0.2s",
                    }} />
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "16px" }}>
                    {expandedAction === action.id ? "▲" : "▼"}
                  </span>
                </div>

                {/* Action body */}
                {expandedAction === action.id && (
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <Row label="Action Name" hint='e.g. "Place Order", "Book Appointment"'>
                        <input style={inputStyle} value={action.name} placeholder="Place Order"
                          onChange={e => updateAction(action.id, "name", e.target.value)} />
                      </Row>
                      <Row label="HTTP Method">
                        <select style={selectStyle} value={action.method}
                          onChange={e => updateAction(action.id, "method", e.target.value as HttpMethod)}>
                          {["POST", "GET", "PUT", "PATCH"].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </Row>
                    </div>

                    <Row label="Endpoint URL">
                      <input style={inputStyle} value={action.url} placeholder="https://your-store.com/api/orders"
                        onChange={e => updateAction(action.id, "url", e.target.value)} />
                    </Row>

                    <Row label="Trigger Phrases"
                      hint='Comma-separated phrases that activate this action. e.g. "place order, buy now, add to cart"'>
                      <input style={inputStyle} value={action.triggerPhrases}
                        placeholder="place order, buy now, add to cart, purchase"
                        onChange={e => updateAction(action.id, "triggerPhrases", e.target.value)} />
                    </Row>

                    <Row label="Description (optional)" hint="Helps the AI understand when to trigger this action">
                      <input style={inputStyle} value={action.description}
                        placeholder="Triggered when user wants to place an order"
                        onChange={e => updateAction(action.id, "description", e.target.value)} />
                    </Row>

                    {/* Auth */}
                    <Row label="Auth Type">
                      <select style={selectStyle} value={action.authType}
                        onChange={e => updateAction(action.id, "authType", e.target.value as AuthType)}>
                        <option value="none">None</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="apikey">API Key (Header)</option>
                        <option value="basic">Basic Auth</option>
                      </select>
                    </Row>
                    {action.authType !== "none" && (
                      <Row label="Auth Value">
                        <input style={inputStyle} type="password" value={action.authValue}
                          onChange={e => updateAction(action.id, "authValue", e.target.value)} />
                      </Row>
                    )}

                    <Row label="Request Body Template" hint="JSON body sent when action is triggered">
                      <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", marginBottom: "8px", fontSize: "11px", color: "#64748b", border: "1px dashed #cbd5e1" }}>
                        <strong>Variables:</strong>{" "}
                        {["{{message}}", "{{sessionId}}", "{{userId}}", "{{actionName}}"].map(v => (
                          <code key={v} style={{ background: "#dbeafe", color: "#1d4ed8", padding: "1px 5px", borderRadius: "3px", margin: "0 2px" }}>{v}</code>
                        ))}
                      </div>
                      <textarea rows={5} style={textareaStyle} value={action.bodyTemplate}
                        onChange={e => updateAction(action.id, "bodyTemplate", e.target.value)} />
                    </Row>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <Row label="✅ Success Message">
                        <input style={inputStyle} value={action.successMessage}
                          onChange={e => updateAction(action.id, "successMessage", e.target.value)} />
                      </Row>
                      <Row label="❌ Failure Message">
                        <input style={inputStyle} value={action.failureMessage}
                          onChange={e => updateAction(action.id, "failureMessage", e.target.value)} />
                      </Row>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                      <button onClick={() => removeAction(action.id)} style={btnDanger}>
                        🗑 Remove Action
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button onClick={addAction} style={{
              width: "100%", padding: "14px", borderRadius: "14px",
              border: "1.5px dashed #bfdbfe", background: "#f8faff",
              color: "#2563eb", fontWeight: 700, fontSize: "14px",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px",
              transition: "background 0.15s",
            }}>
              + Add Action Endpoint
            </button>
          </div>
        )}

        {/* ── Tab: Test Console ── */}
        {activeTab === "test" && (
          <div style={{ padding: "28px 32px", maxWidth: "900px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

              {/* Left: Request */}
              <div>
                <SectionCard title="Send Test Message" icon="📨">
                  <div style={{
                    background: "#f8fafc", borderRadius: "10px", padding: "12px 16px",
                    marginBottom: "16px", fontSize: "13px", color: "#475569", border: "1px solid #e2e8f0",
                  }}>
                    <strong>Endpoint:</strong>{" "}
                    <code style={{ fontSize: "12px", color: "#2563eb", wordBreak: "break-all" }}>
                      {config.chatEndpoint.url || <em style={{ color: "#94a3b8" }}>Not configured — set URL in Chat Endpoint tab</em>}
                    </code>
                  </div>

                  <Row label="Test Message">
                    <textarea rows={3} style={textareaStyle} value={testMessage}
                      onChange={e => setTestMessage(e.target.value)}
                      placeholder="Type a test message…" />
                  </Row>

                  <button onClick={handleTest} disabled={isTesting || !config.chatEndpoint.url.trim()} style={{
                    ...btnPrimary,
                    width: "100%", justifyContent: "center",
                    opacity: isTesting || !config.chatEndpoint.url.trim() ? 0.6 : 1,
                  }}>
                    {isTesting ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                          style={{ animation: "spin 1s linear infinite" }}>
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        Sending…
                      </>
                    ) : "▶ Send Test Request"}
                  </button>

                  {testResult && (
                    <div style={{ marginTop: "16px" }}>
                      <label style={labelStyle}>Request Sent</label>
                      <pre style={{
                        background: "#0f172a", color: "#e2e8f0", borderRadius: "10px",
                        padding: "14px", fontSize: "11px", overflowX: "auto", margin: 0,
                        lineHeight: 1.6, maxHeight: "200px", overflow: "auto",
                      }}>
                        {testResult.requestSent}
                      </pre>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Right: Response */}
              <div>
                <SectionCard title="Response" icon="📩">
                  {!testResult && !isTesting && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
                      <p style={{ margin: 0, fontSize: "13px" }}>Hit "Send Test Request" to see the response here</p>
                    </div>
                  )}

                  {isTesting && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"
                        style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      <p style={{ margin: 0, fontSize: "13px" }}>Waiting for response…</p>
                    </div>
                  )}

                  {testResult && !isTesting && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {/* Status row */}
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{
                          padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 700,
                          background: testResult.ok ? "#dcfce7" : "#fee2e2",
                          color: testResult.ok ? "#16a34a" : "#dc2626",
                        }}>
                          {testResult.status ? `HTTP ${testResult.status}` : "Network Error"}
                        </div>
                        {testResult.durationMs !== null && (
                          <div style={{ padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, background: "#f1f5f9", color: "#475569" }}>
                            ⏱ {testResult.durationMs}ms
                          </div>
                        )}
                      </div>

                      {testResult.error && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13px" }}>
                          {testResult.error}
                        </div>
                      )}

                      {/* Parsed reply */}
                      {testResult.parsedReply && (
                        <div>
                          <label style={{ ...labelStyle, color: "#16a34a" }}>✅ Parsed Reply</label>
                          <div style={{
                            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px",
                            padding: "12px 16px", fontSize: "14px", color: "#0f172a", lineHeight: 1.6,
                          }}>
                            {testResult.parsedReply}
                          </div>
                        </div>
                      )}

                      {/* Raw response */}
                      {testResult.responseBody && (
                        <div>
                          <label style={labelStyle}>Raw Response</label>
                          <pre style={{
                            background: "#0f172a", color: "#e2e8f0", borderRadius: "10px",
                            padding: "14px", fontSize: "11px", overflow: "auto",
                            margin: 0, lineHeight: 1.6, maxHeight: "240px",
                          }}>
                            {(() => {
                              try { return JSON.stringify(JSON.parse(testResult.responseBody), null, 2); }
                              catch { return testResult.responseBody; }
                            })()}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </SectionCard>

                {/* Variable reference card */}
                <SectionCard title="Variable Reference" icon="📖">
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                    {[
                      { v: "{{message}}", desc: "The user's current message" },
                      { v: "{{sessionId}}", desc: "Unique conversation session ID" },
                      { v: "{{userId}}", desc: "Authenticated user ID (if signed in)" },
                      { v: "{{chatbotId}}", desc: "This chatbot's identifier" },
                      { v: "{{actionName}}", desc: "Name of the triggered action" },
                    ].map(({ v, desc }) => (
                      <div key={v} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <code style={{
                          background: "#dbeafe", color: "#1d4ed8", padding: "3px 8px",
                          borderRadius: "5px", fontSize: "11px", flexShrink: 0, minWidth: "130px",
                        }}>{v}</code>
                        <span style={{ color: "#64748b" }}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{CSS}</style>
    </div>
  );
}

const CSS = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .full-height-layout { display: flex; width: 100%; min-height: 100vh; position: relative; background: #f8fafc; }
  .main-content {
    flex: 1; margin-left: 280px; min-height: 100vh;
    transition: margin-left 0.4s cubic-bezier(0.4,0,0.2,1);
    overflow-x: hidden; position: relative; z-index: 1;
  }
  .main-content.collapsed { margin-left: 60px; }
  @media (max-width: 768px) { .main-content { margin-left: 0; } }
`;

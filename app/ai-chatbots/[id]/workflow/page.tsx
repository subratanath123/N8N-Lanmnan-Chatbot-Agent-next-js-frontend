"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import LeftSidebar from "@/component/LeftSidebar";

/* ══════════════════════════════════════════════
   Types
══════════════════════════════════════════════ */
type HttpMethod    = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
type AuthType      = "none" | "bearer" | "apikey" | "basic";
type ParamType     = "string" | "number" | "boolean" | "array" | "object";
type SubParamType  = "string" | "number" | "boolean" | "array";

/** A leaf-level property inside an object param */
interface SubParam {
  id: string;
  name: string;
  type: SubParamType;
  description: string;
  required: boolean;
  example: string;
}

interface ActionParam {
  id: string;
  name: string;
  type: ParamType;
  description: string;
  required: boolean;
  example: string;
  /** Sub-properties — only used when type === "object" */
  properties?: SubParam[];
}

/**
 * How the chatbot replies after an action fires successfully:
 *  "static"   – always show the fixed successMessage string
 *  "dynamic"  – extract a field from the API response JSON and show that
 *               (falls back to successMessage if path not found)
 */
type ResponseMode = "static" | "dynamic";

interface ActionEndpoint {
  id: string;
  name: string;
  description: string;
  triggerPhrases: string;
  url: string;
  method: HttpMethod;
  authType: AuthType;
  authValue: string;
  apiKeyHeader: string;
  params: ActionParam[];
  bodyTemplate: string;
  /** How to produce the reply shown to the user after success */
  responseMode: ResponseMode;
  /**
   * JSON dot-path into the API response to extract as the reply.
   * Only used when responseMode === "dynamic".
   * e.g. "message", "data.reply", "order.confirmationText"
   */
  responsePath: string;
  successMessage: string;   // used as fallback when responseMode === "dynamic"
  failureMessage: string;
  enabled: boolean;
}

interface WorkflowConfig {
  actions: ActionEndpoint[];
}

interface TestResult {
  status: number | null;
  ok: boolean;
  requestSent: string;
  responseBody: string;
  durationMs: number | null;
  error: string;
}

/* ══════════════════════════════════════════════
   Defaults
══════════════════════════════════════════════ */
const SYSTEM_VARS = ["{{actionName}}", "{{message}}", "{{sessionId}}", "{{userId}}", "{{chatbotId}}", "{{userToken}}"];
const USER_TOKEN_EXPR = "{{userToken}}";

const DEFAULT_BODY = `{
  "action": "{{actionName}}",
  "message": "{{message}}",
  "sessionId": "{{sessionId}}",
  "userToken": "{{userToken}}"
}`;

const newParam = (): ActionParam => ({
  id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: "", type: "string", description: "", required: true, example: "", properties: [],
});

const newSubParam = (): SubParam => ({
  id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: "", type: "string", description: "", required: true, example: "",
});

const newAction = (): ActionEndpoint => ({
  id: `action-${Date.now()}`,
  name: "", description: "", triggerPhrases: "",
  url: "", method: "POST", authType: "none", authValue: "", apiKeyHeader: "X-API-Key",
  params: [],
  bodyTemplate: DEFAULT_BODY,
  responseMode: "static",
  responsePath: "message",
  successMessage: "Done! Your request has been processed.",
  failureMessage: "Sorry, I couldn't complete that action. Please try again.",
  enabled: true,
});

const isUserTokenAuthValue = (value: string) => value.trim() === USER_TOKEN_EXPR;

/* ══════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════ */
/** Build MCP property schema for one param (handles nested objects) */
function buildParamSchema(p: ActionParam | SubParam): Record<string, unknown> {
  if (p.type === "object" && "properties" in p && p.properties?.length) {
    const subProps: Record<string, unknown> = {};
    const subRequired: string[] = [];
    for (const sp of p.properties) {
      if (!sp.name.trim()) continue;
      subProps[sp.name] = { type: sp.type, description: sp.description || `The ${sp.name}`, ...(sp.example ? { example: sp.example } : {}) };
      if (sp.required) subRequired.push(sp.name);
    }
    return {
      type: "object",
      description: p.description || `The ${p.name}`,
      ...(p.example ? { example: p.example } : {}),
      properties: subProps,
      ...(subRequired.length ? { required: subRequired } : {}),
    };
  }
  return {
    type: p.type,
    description: p.description || `The ${p.name}`,
    ...(p.example ? { example: p.example } : {}),
  };
}

/** Builds the MCP tool JSON (preview) from an action — what N8N will receive */
function buildMCPPreview(action: ActionEndpoint): string {
  const props: Record<string, unknown> = {};
  const required: string[] = [];
  for (const p of action.params) {
    if (!p.name.trim()) continue;
    props[p.name] = buildParamSchema(p);
    if (p.required) required.push(p.name);
  }
  return JSON.stringify({
    type: "function",
    function: {
      name: action.name.toLowerCase().replace(/\s+/g, "_") || "action",
      description: action.description || action.name,
      parameters: { type: "object", properties: props, required },
    },
  }, null, 2);
}

/** Interpolate body template with test values.
 *  - Flat params: {{paramName}} → value
 *  - Object params: {{paramName}} → {"field":"value",...}  (full JSON object)
 *                   {{paramName.field}} → individual field value (dot notation)
 */
function interpolate(tpl: string, action: ActionEndpoint, testMessage: string, testParams: Record<string, string>, chatbotId: string): string {
  let out = tpl
    .replace(/\{\{actionName\}\}/g, action.name)
    .replace(/\{\{message\}\}/g, testMessage)
    .replace(/\{\{sessionId\}\}/g, `test-${Date.now()}`)
    .replace(/\{\{userId\}\}/g, "test-user")
    .replace(/\{\{chatbotId\}\}/g, chatbotId);

  // Replace dot-notation first (more specific): {{order.productId}}
  for (const [k, v] of Object.entries(testParams)) {
    if (k.includes(".")) {
      out = out.replace(new RegExp(`\\{\\{${k.replace(".", "\\.")}\\}\\}`, "g"), v);
    }
  }

  // Replace object params {{paramName}} → assembled JSON
  for (const p of action.params) {
    if (p.type === "object" && p.name.trim()) {
      const obj: Record<string, unknown> = {};
      for (const sp of (p.properties ?? [])) {
        if (!sp.name.trim()) continue;
        const raw = testParams[`${p.name}.${sp.name}`] ?? sp.example ?? "";
        obj[sp.name] = sp.type === "number" ? (Number(raw) || 0) : sp.type === "boolean" ? raw === "true" : raw;
      }
      out = out.replace(new RegExp(`\\{\\{${p.name}\\}\\}`, "g"), JSON.stringify(obj));
    }
  }

  // Replace remaining flat params
  for (const [k, v] of Object.entries(testParams)) {
    if (!k.includes(".")) {
      out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
    }
  }
  return out;
}

/* ══════════════════════════════════════════════
   Styles
══════════════════════════════════════════════ */
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 13px", border: "1.5px solid #e2e8f0",
  borderRadius: "9px", fontSize: "13px", color: "#1f2937",
  outline: "none", boxSizing: "border-box", background: "#fff", fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "32px",
};
const monoStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical" as const, lineHeight: 1.6,
  fontFamily: "ui-monospace,'Cascadia Code',monospace", fontSize: "12px",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 22px", borderRadius: "10px",
  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
  color: "#fff", border: "none", fontWeight: 700, fontSize: "14px",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
  boxShadow: "0 4px 14px rgba(37,99,235,0.28)",
};
const btnOutline: React.CSSProperties = {
  padding: "10px 20px", borderRadius: "10px",
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#374151", fontWeight: 600, fontSize: "14px",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
};
const btnDanger: React.CSSProperties = {
  padding: "6px 12px", borderRadius: "7px",
  border: "1.5px solid #fecaca", background: "#fff",
  color: "#dc2626", fontWeight: 600, fontSize: "12px", cursor: "pointer",
};

/* ══════════════════════════════════════════════
   Sub-components
══════════════════════════════════════════════ */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      {hint && <p style={{ margin: "2px 0 6px", fontSize: "11.5px", color: "#94a3b8", lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );
}

function Chip({ label, blue }: { label: string; blue?: boolean }) {
  return (
    <code style={{
      background: blue ? "#dbeafe" : "#f1f5f9",
      color: blue ? "#1d4ed8" : "#475569",
      padding: "2px 8px", borderRadius: "5px",
      margin: "2px 3px", fontSize: "11px", fontFamily: "monospace", display: "inline-block",
    }}>{label}</code>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0 14px" }}>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   Sub-Params Editor (inside an object param)
══════════════════════════════════════════════ */
function SubParamsEditor({ parentName, subs, onChange }: { parentName: string; subs: SubParam[]; onChange: (s: SubParam[]) => void }) {
  const upd = (id: string, f: keyof SubParam, v: string | boolean) =>
    onChange(subs.map(s => s.id === id ? { ...s, [f]: v } : s));
  const rem = (id: string) => onChange(subs.filter(s => s.id !== id));
  const add = () => onChange([...subs, newSubParam()]);

  return (
    <div style={{ marginLeft: "20px", paddingLeft: "14px", borderLeft: "2px solid #dbeafe" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Properties of <code style={{ textTransform: "none", background: "#eff6ff", padding: "1px 6px", borderRadius: 4 }}>{parentName || "…"}</code>
      </div>

      {subs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "160px 90px 1fr 70px 60px 28px", gap: "5px", marginBottom: "5px", padding: "0 2px" }}>
          {["Field name", "Type", "Description", "Example", "Req.", ""].map(h => (
            <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>
      )}

      {subs.map(sp => (
        <div key={sp.id} style={{ display: "grid", gridTemplateColumns: "160px 90px 1fr 70px 60px 28px", gap: "5px", marginBottom: "6px", alignItems: "center" }}>
          <input style={{ ...inputStyle, fontFamily: "monospace", fontSize: "11px", padding: "7px 10px" }}
            value={sp.name} placeholder="productId"
            onChange={e => upd(sp.id, "name", e.target.value.replace(/\s/g, ""))} />
          <select style={{ ...selectStyle, fontSize: "11px", padding: "7px 24px 7px 8px" }} value={sp.type}
            onChange={e => upd(sp.id, "type", e.target.value as SubParamType)}>
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="array">array</option>
          </select>
          <input style={{ ...inputStyle, fontSize: "11px", padding: "7px 10px" }} value={sp.description}
            placeholder='e.g. "Product the user wants"'
            onChange={e => upd(sp.id, "description", e.target.value)} />
          <input style={{ ...inputStyle, fontFamily: "monospace", fontSize: "11px", padding: "7px 10px" }} value={sp.example}
            placeholder="PROD-1" onChange={e => upd(sp.id, "example", e.target.value)} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={() => upd(sp.id, "required", !sp.required)} title={sp.required ? "Required" : "Optional"}
              style={{ width: 30, height: 16, borderRadius: 999, background: sp.required ? "#2563eb" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: sp.required ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>
          <button onClick={() => rem(sp.id)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#fca5a5", fontSize: "15px", padding: "2px", display: "flex", alignItems: "center" }}>×</button>
        </div>
      ))}

      <button onClick={add} style={{ padding: "5px 12px", borderRadius: "7px", border: "1px dashed #93c5fd", background: "#f0f9ff", color: "#2563eb", fontWeight: 600, fontSize: "11px", cursor: "pointer" }}>
        + Add Field
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Params Editor
══════════════════════════════════════════════ */
function ParamsEditor({ params, onChange }: { params: ActionParam[]; onChange: (params: ActionParam[]) => void }) {
  const update = (id: string, field: keyof ActionParam, val: unknown) =>
    onChange(params.map(p => p.id === id ? { ...p, [field]: val } : p));
  const remove = (id: string) => onChange(params.filter(p => p.id !== id));
  const add = () => onChange([...params, newParam()]);

  return (
    <div>
      {/* header row */}
      {params.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "180px 110px 1fr 80px 60px 32px", gap: "6px", marginBottom: "6px", padding: "0 4px" }}>
          {["Name", "Type", "Description (shown to AI)", "Example", "Req.", ""].map(h => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>
      )}

      {params.map(p => (
        <div key={p.id} style={{ marginBottom: "10px" }}>
          {/* main row */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 110px 1fr 80px 60px 32px", gap: "6px", alignItems: "center" }}>
            <input
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
              value={p.name} placeholder="order"
              onChange={e => update(p.id, "name", e.target.value.replace(/\s/g, ""))}
            />
            <select style={{ ...selectStyle, fontSize: "12px", padding: "9px 28px 9px 10px" }} value={p.type}
              onChange={e => {
                const t = e.target.value as ParamType;
                onChange(params.map(p2 => p2.id === p.id
                  ? { ...p2, type: t, properties: t === "object" ? (p2.properties ?? []) : p2.properties }
                  : p2
                ));
              }}>
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="array">array</option>
              <option value="object">object {"{…}"}</option>
            </select>
            <input style={{ ...inputStyle, fontSize: "12px" }} value={p.description}
              placeholder={p.type === "object" ? 'e.g. "Order details collected from user"' : 'e.g. "Product ID the user wants to buy"'}
              onChange={e => update(p.id, "description", e.target.value)} />
            <input style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }} value={p.example}
              placeholder={p.type === "object" ? "" : "PROD-1"}
              onChange={e => update(p.id, "example", e.target.value)}
              disabled={p.type === "object"}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div onClick={() => update(p.id, "required", !p.required)} title={p.required ? "Required" : "Optional"}
                style={{ width: 34, height: 18, borderRadius: 999, background: p.required ? "#2563eb" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: p.required ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </div>
            </div>
            <button onClick={() => remove(p.id)} title="Remove"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#fca5a5", fontSize: "16px", padding: "4px", display: "flex", alignItems: "center" }}>×</button>
          </div>

          {/* sub-properties editor for object type */}
          {p.type === "object" && (
            <div style={{ marginTop: "8px" }}>
              <SubParamsEditor
                parentName={p.name}
                subs={p.properties ?? []}
                onChange={subs => update(p.id, "properties", subs)}
              />
            </div>
          )}
        </div>
      ))}

      <button onClick={add} style={{
        marginTop: "6px", padding: "7px 14px", borderRadius: "8px",
        border: "1.5px dashed #bfdbfe", background: "#f8faff",
        color: "#2563eb", fontWeight: 600, fontSize: "12px", cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: "6px",
      }}>
        + Add Parameter
      </button>

      {params.length > 0 && (
        <p style={{ margin: "10px 0 0", fontSize: "11.5px", color: "#94a3b8", lineHeight: 1.7 }}>
          💡 The AI collects these values, then the backend calls your endpoint.
          Use <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontSize: "11px" }}>{"{{paramName}}"}</code> for flat values,{" "}
          <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontSize: "11px" }}>{"{{objParam}}"}</code> for a full object (auto-assembled),{" "}
          or <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontSize: "11px" }}>{"{{obj.field}}"}</code> for individual fields.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════ */
export default function WorkflowPage() {
  const { id: chatbotId } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [chatbotName, setChatbotName] = useState("");
  /** Only true when GET /chatbot/{id} returns canConfigure: true (owner or team Admin/Editor). */
  const [canConfigure, setCanConfigure] = useState(false);
  const [activeTab, setActiveTab] = useState<"actions" | "test">("actions");
  const [actions, setActions] = useState<ActionEndpoint[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<Record<string, "basic" | "params" | "body" | "messages">>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [authSourceByActionId, setAuthSourceByActionId] = useState<Record<string, "userToken" | "static">>({});
  const [showAuthValueByActionId, setShowAuthValueByActionId] = useState<Record<string, boolean>>({});

  /* test console */
  const [testActionId, setTestActionId] = useState("");
  const [testMessage, setTestMessage] = useState("I want to place an order");
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [mcpPreviewOpen, setMcpPreviewOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (isSignedIn && getToken) {
      try { const t = await getToken(); if (t) h["Authorization"] = `Bearer ${t}`; } catch { /* skip */ }
    }
    return h;
  }, [isSignedIn, getToken]);

  /* load */
  useEffect(() => {
    if (!chatbotId) return;
    (async () => {
      setIsLoading(true);
      const h = await authHeaders();
      try {
        const cb = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}`, { headers: h });
        if (cb.ok) {
          const d = await cb.json();
          setChatbotName(d.name || d.chatbotId || chatbotId);
          setCanConfigure(d.canConfigure === true);
        } else {
          setCanConfigure(false);
        }
        const wf = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/workflow`, { headers: h });
        if (wf.ok) {
          const d = await wf.json();
          const loadedActions = (d.actions || []).map((a: ActionEndpoint) => ({
            ...newAction(), ...a,
            params: a.params ?? [],
            responseMode: a.responseMode ?? "static",
            responsePath: a.responsePath ?? "message",
          }));
          setActions(loadedActions);
          const authSourceMap: Record<string, "userToken" | "static"> = {};
          for (const action of loadedActions) {
            authSourceMap[action.id] = isUserTokenAuthValue(action.authValue || "") ? "userToken" : "static";
          }
          setAuthSourceByActionId(authSourceMap);
        }
      } catch { /* first time */ }
      setIsLoading(false);
    })();
  }, [chatbotId, backendUrl, authHeaders]);

  /* sync test param values when action selection changes */
  useEffect(() => {
    const a = actions.find(x => x.id === testActionId);
    if (!a) { setTestParams({}); return; }
    setTestParams(prev => {
      const next: Record<string, string> = {};
      for (const p of a.params) next[p.name] = prev[p.name] ?? (p.example || "");
      return next;
    });
    setTestResult(null);
  }, [testActionId, actions]);

  /* save */
  const handleSave = async () => {
    if (!canConfigure) return;
    setIsSaving(true); setSaveStatus("idle");
    try {
      const h = await authHeaders();
      const res = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/workflow`, {
        method: "POST", headers: h, body: JSON.stringify({ actions }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch { setSaveStatus("error"); }
    setIsSaving(false);
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  /* action CRUD */
  const updateAction = (id: string, field: keyof ActionEndpoint, val: unknown) => {
    if (!canConfigure) return;
    setActions(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
  };
  const removeAction = (id: string) => {
    if (!canConfigure) return;
    setActions(prev => prev.filter(a => a.id !== id));
    setAuthSourceByActionId(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const addAction = () => {
    if (!canConfigure) return;
    const a = newAction();
    setActions(prev => [...prev, a]);
    setAuthSourceByActionId(prev => ({ ...prev, [a.id]: "userToken" }));
    setExpandedId(a.id);
    setExpandedSection(prev => ({ ...prev, [a.id]: "basic" }));
    setActiveTab("actions");
  };

  /* section accordion per action */
  const toggleSection = (actionId: string, sec: "basic" | "params" | "body" | "messages") =>
    setExpandedSection(prev => ({ ...prev, [actionId]: prev[actionId] === sec ? "basic" : sec }));

  /* test */
  const handleTest = async () => {
    if (!canConfigure) return;
    const action = actions.find(a => a.id === testActionId);
    if (!action?.url?.trim()) {
      setTestResult({ status: null, ok: false, requestSent: "", responseBody: "", durationMs: null, error: !action ? "Select an action." : "This action has no URL configured." });
      return;
    }
    setIsTesting(true); setTestResult(null);
    const body = interpolate(action.bodyTemplate, action, testMessage, testParams, chatbotId as string);
    const t0 = Date.now();
    try {
      const h = await authHeaders();
      const userTokenForTest = (isSignedIn && getToken) ? (await getToken()) || "" : "";
      const res = await fetch(`${backendUrl}/v1/api/chatbot/${chatbotId}/workflow/test`, {
        method: "POST",
        headers: {
          ...h,
          ...(userTokenForTest ? { userToken: userTokenForTest } : {}),
        },
        body: JSON.stringify({
          url: action.url,
          method: action.method,
          authType: action.authType,
          authValue: action.authValue,
          apiKeyHeader: action.apiKeyHeader,
          body,
          userToken: userTokenForTest,
        }),
      });

      const text = await res.text();
      let proxyResult: { status?: number; ok?: boolean; responseBody?: string; error?: string } = {};
      try { proxyResult = text ? JSON.parse(text) : {}; } catch { proxyResult = { error: text || "Invalid proxy response" }; }

      setTestResult({
        status: typeof proxyResult.status === "number" ? proxyResult.status : (res.ok ? 200 : null),
        ok: Boolean(proxyResult.ok),
        requestSent: body,
        responseBody: proxyResult.responseBody ?? "",
        durationMs: Date.now() - t0,
        error: proxyResult.error || "",
      });
    } catch (e) {
      setTestResult({ status: null, ok: false, requestSent: body, responseBody: "", durationMs: Date.now() - t0, error: e instanceof Error ? e.message : String(e) });
    }
    setIsTesting(false);
  };

  const selectedAction = actions.find(a => a.id === testActionId);

  if (isLoading) return (
    <div className="full-height-layout">
      <LeftSidebar onDrawerStateChange={(_o, _a, c) => { if (c !== undefined) setSidebarCollapsed(c); }} onNavItemClick={(_n, h) => { if (h && h !== "#") router.push(h); }} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}><div style={{ fontSize: "32px", marginBottom: "12px" }}>⚙️</div>Loading workflow…</div>
      </div>
      <style jsx>{CSS}</style>
    </div>
  );

  return (
    <div className="full-height-layout">
      <LeftSidebar
        onDrawerStateChange={(_o, _a, c) => { if (c !== undefined) setSidebarCollapsed(c); }}
        onNavItemClick={(_n, h) => { if (h && h !== "#") router.push(h); }}
      />

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`} style={{ background: "#f8fafc", overflowY: "auto" }}>

        {/* ── Page Header ── */}
        <div style={{ padding: "24px 32px 0", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8", marginBottom: "14px" }}>
            <button onClick={() => router.push("/ai-chatbots")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0, fontSize: "12px" }}>AI Chatbots</button>
            <span>›</span>
            <button onClick={() => router.push(`/ai-chatbots/${chatbotId}`)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0, fontSize: "12px" }}>{chatbotName || chatbotId}</button>
            <span>›</span>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>Workflow Config</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a" }}>Workflow Actions</h1>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  Define actions <strong>{chatbotName}</strong> can trigger — the AI collects required data from users, then calls your endpoint.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {saveStatus === "saved" && <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>✅ Saved</span>}
              {saveStatus === "error" && <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 600 }}>⚠️ Save failed</span>}
              {!canConfigure && (
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>View only (shared as Viewer)</span>
              )}
              <button onClick={() => router.push(`/ai-chatbots/${chatbotId}`)} style={btnOutline}>← Back</button>
              <button onClick={handleSave} disabled={isSaving || !canConfigure} style={{ ...btnPrimary, opacity: isSaving || !canConfigure ? 0.6 : 1 }}>
                {isSaving ? <><SpinIcon /> Saving…</> : <><SaveIcon /> Save Config</>}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            {([
              { key: "actions", label: "⚡ Action Endpoints", desc: `${actions.length} configured` },
              { key: "test",    label: "🧪 Test Console",     desc: "fire a live request" },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: "10px 20px", border: "none", borderRadius: "10px 10px 0 0",
                background: activeTab === t.key ? "#f8fafc" : "transparent",
                color: activeTab === t.key ? "#2563eb" : "#64748b",
                fontWeight: activeTab === t.key ? 700 : 500, fontSize: "14px", cursor: "pointer",
                borderBottom: activeTab === t.key ? "2px solid #2563eb" : "2px solid transparent",
              }}>
                {t.label}
                <span style={{ fontSize: "11px", marginLeft: "6px", opacity: 0.6 }}>({t.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            TAB: Action Endpoints
        ═══════════════════════════════════════ */}
        {activeTab === "actions" && (
          <div style={{ padding: "28px 32px", maxWidth: "900px" }}>

            {/* how-it-works */}
            <div style={{ background: "linear-gradient(135deg,#eff6ff,#f0f9ff)", borderRadius: "14px", padding: "16px 20px", marginBottom: "14px", border: "1px solid #bfdbfe", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "24px", flexShrink: 0 }}>⚡</span>
              <div style={{ fontSize: "13px", color: "#3b82f6", lineHeight: 1.65 }}>
                <strong style={{ color: "#1e3a8a" }}>How it works:</strong> Each action becomes an <strong>MCP tool</strong> — you define what data it needs (parameters), the AI collects those from the user or knowledge base, then the backend securely calls your endpoint with the filled payload. Credentials never leave the server.
              </div>
            </div>

            {/* userToken info card */}
            <div style={{ background: "linear-gradient(135deg,#fefce8,#fffbeb)", borderRadius: "14px", padding: "16px 20px", marginBottom: "24px", border: "1px solid #fde68a", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>🔑</span>
              <div style={{ fontSize: "13px", color: "#78350f", lineHeight: 1.7, flex: 1 }}>
                <strong style={{ color: "#92400e" }}>Identifying the user — </strong>
                Your website can pass the logged-in user&apos;s auth token when the chat widget loads. Use{" "}
                <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontSize: "11px", fontFamily: "monospace" }}>{"{{userToken}}"}</code>{" "}
                in your body template so your backend API knows <em>who</em> is triggering the action (placing an order, booking, etc.).
                <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "#fffbeb", borderRadius: "8px", padding: "10px 14px", border: "1px dashed #fcd34d" }}>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#b45309", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Static token (server-rendered page)</div>
                    <pre style={{ margin: 0, fontSize: "10.5px", color: "#78350f", lineHeight: 1.8, overflowX: "auto" }}>{`window.ChatWidgetConfig = {
  chatbotId: "${chatbotId}",
  userToken: "<?php echo $userJWT ?>"
};`}</pre>
                  </div>
                  <div style={{ background: "#fffbeb", borderRadius: "8px", padding: "10px 14px", border: "1px dashed #fcd34d" }}>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#b45309", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dynamic token (React / SPA)</div>
                    <pre style={{ margin: 0, fontSize: "10.5px", color: "#78350f", lineHeight: 1.8, overflowX: "auto" }}>{`window.ChatWidgetConfig = {
  chatbotId: "${chatbotId}",
  userToken: getAuthToken()
};`}</pre>
                  </div>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "11.5px", color: "#92400e" }}>
                  The token can be forwarded in request body (<code style={{ background: "#fef3c7", padding: "1px 5px", borderRadius: 3 }}>{"{{userToken}}"}</code>)
                  and now also in auth credentials (set Bearer/API key value to <code style={{ background: "#fef3c7", padding: "1px 5px", borderRadius: 3 }}>{"{{userToken}}"}</code>).
                </p>
              </div>
            </div>

            {/* empty state */}
            {actions.length === 0 && (
              <div style={{ textAlign: "center", padding: "52px 24px", background: "#fff", borderRadius: "16px", border: "1.5px dashed #e2e8f0", marginBottom: "20px" }}>
                <div style={{ fontSize: "44px", marginBottom: "12px" }}>🔌</div>
                <h3 style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>No actions yet</h3>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0 20px" }}>Add your first action — e.g. "Place Order", "Check Stock", "Book Appointment".</p>
                <button onClick={addAction} disabled={!canConfigure} style={{ ...btnPrimary, opacity: !canConfigure ? 0.6 : 1 }}>+ Add First Action</button>
              </div>
            )}

            {/* action cards */}
            {actions.map((action, idx) => {
              const paramVars = action.params.filter(p => p.name.trim()).map(p => `{{${p.name}}}`);
              const allVars = [...SYSTEM_VARS, ...paramVars];
              const sec = expandedSection[action.id] ?? "basic";
              const authSource = authSourceByActionId[action.id] ?? (isUserTokenAuthValue(action.authValue || "") ? "userToken" : "static");

              return (
                <div key={action.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px", overflow: "hidden", boxShadow: "0 1px 6px rgba(15,23,42,0.05)" }}>

                  {/* card header */}
                  <div
                    onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
                    style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: "#f8fafc", borderBottom: expandedId === action.id ? "1px solid #e2e8f0" : "none" }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                        {action.name || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Untitled Action</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
                        {action.url && <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>{action.url}</span>}
                        {action.params.length > 0 && (
                          <span style={{ fontSize: "11px", background: "#f0f9ff", color: "#0284c7", padding: "1px 8px", borderRadius: 999, fontWeight: 600 }}>
                            {action.params.length} param{action.params.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      onClick={e => { e.stopPropagation(); updateAction(action.id, "enabled", !action.enabled); }}
                      title={action.enabled ? "Enabled" : "Disabled"}
                      style={{ width: 36, height: 20, borderRadius: 999, background: action.enabled ? "#2563eb" : "#d1d5db", position: "relative", cursor: canConfigure ? "pointer" : "not-allowed", transition: "background 0.2s", flexShrink: 0, opacity: canConfigure ? 1 : 0.55 }}
                    >
                      <div style={{ position: "absolute", top: 2, left: action.enabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>{expandedId === action.id ? "▲" : "▼"}</span>
                  </div>

                  {/* expanded body */}
                  {expandedId === action.id && (
                    <div>
                      {/* inner tab pills */}
                      <div style={{ display: "flex", gap: "6px", padding: "14px 20px 0", borderBottom: "1px solid #f1f5f9" }}>
                        {([
                          { key: "basic",    label: "Basic",        icon: "⚙️" },
                          { key: "params",   label: "Parameters",   icon: "🔧", badge: action.params.length || undefined },
                          { key: "body",     label: "Body Template",icon: "📤" },
                          { key: "messages", label: "Messages",     icon: "💬" },
                        ] as const).map(s => (
                          <button key={s.key}
                            onClick={() => toggleSection(action.id, s.key)}
                            style={{
                              padding: "6px 14px", border: "none", borderRadius: "8px 8px 0 0",
                              background: sec === s.key ? "#fff" : "transparent",
                              color: sec === s.key ? "#2563eb" : "#64748b",
                              fontWeight: sec === s.key ? 700 : 500, fontSize: "12px", cursor: "pointer",
                              borderBottom: sec === s.key ? "2px solid #2563eb" : "2px solid transparent",
                              display: "inline-flex", alignItems: "center", gap: "5px",
                            }}
                          >
                            <span>{s.icon}</span>
                            {s.label}
                            {"badge" in s && s.badge !== undefined && (
                              <span style={{ background: "#dbeafe", color: "#2563eb", borderRadius: 999, fontSize: "10px", fontWeight: 700, padding: "0 6px" }}>{s.badge}</span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div style={{ padding: "20px 24px" }}>

                        {/* ── Section: Basic ── */}
                        {sec === "basic" && (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: "12px" }}>
                              <Row label="Action Name" hint='Short, clear name. e.g. "Place Order", "Book Appointment"'>
                                <input style={inputStyle} value={action.name} placeholder="Place Order"
                                  onChange={e => updateAction(action.id, "name", e.target.value)} />
                              </Row>
                              <Row label="Method">
                                <select style={selectStyle} value={action.method}
                                  onChange={e => updateAction(action.id, "method", e.target.value as HttpMethod)}>
                                  {["POST", "GET", "PUT", "PATCH", "DELETE"].map(m => <option key={m}>{m}</option>)}
                                </select>
                              </Row>
                            </div>

                            <Row label="Endpoint URL" hint="Your API endpoint that will be called when this action fires">
                              <input style={inputStyle} value={action.url} placeholder="https://your-store.com/api/orders"
                                onChange={e => updateAction(action.id, "url", e.target.value)} />
                            </Row>

                            <Row label="Trigger Phrases"
                              hint='Comma-separated phrases. The AI activates this action when it detects matching intent. e.g. "place order, buy now, checkout"'>
                              <input style={inputStyle} value={action.triggerPhrases}
                                placeholder="place order, buy now, add to cart, checkout"
                                onChange={e => updateAction(action.id, "triggerPhrases", e.target.value)} />
                            </Row>

                            <Row label="Description" hint="Helps the AI understand when and why to use this action. Be specific.">
                              <input style={inputStyle} value={action.description}
                                placeholder="Triggered when the user wants to purchase a product or place an order. Requires product name and quantity."
                                onChange={e => updateAction(action.id, "description", e.target.value)} />
                            </Row>

                            <SectionDivider label="Authentication" />
                            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "12px", alignItems: "start" }}>
                              <Row label="Auth Type">
                                <select style={selectStyle} value={action.authType}
                                  disabled={!canConfigure}
                                  onChange={e => {
                                    if (!canConfigure) return;
                                    const nextType = e.target.value as AuthType;
                                    updateAction(action.id, "authType", nextType);
                                    if (nextType === "none") {
                                      updateAction(action.id, "authValue", "");
                                      return;
                                    }
                                    // Default to userToken expression for bearer/apikey unless user already set static.
                                    if ((nextType === "bearer" || nextType === "apikey") && (!action.authValue || action.authValue === "••••••")) {
                                      setAuthSourceByActionId(prev => ({ ...prev, [action.id]: "userToken" }));
                                      updateAction(action.id, "authValue", USER_TOKEN_EXPR);
                                    }
                                    if (nextType === "basic") {
                                      setAuthSourceByActionId(prev => ({ ...prev, [action.id]: "static" }));
                                    }
                                  }}>
                                  <option value="none">None</option>
                                  <option value="bearer">Bearer Token</option>
                                  <option value="apikey">API Key Header</option>
                                  <option value="basic">Basic Auth</option>
                                </select>
                              </Row>
                              {action.authType !== "none" && (
                                <div>
                                  {(action.authType === "bearer" || action.authType === "apikey") && (
                                    <div style={{ marginBottom: "10px" }}>
                                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Credential Source</div>
                                      <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "8px", padding: "3px", gap: "2px", width: "fit-content" }}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!canConfigure) return;
                                            setAuthSourceByActionId(prev => ({ ...prev, [action.id]: "userToken" }));
                                            updateAction(action.id, "authValue", USER_TOKEN_EXPR);
                                          }}
                                          style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            background: authSource === "userToken" ? "#fff" : "transparent",
                                            color: authSource === "userToken" ? "#2563eb" : "#64748b",
                                            boxShadow: authSource === "userToken" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                          }}
                                        >
                                          Use Chat User Token
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!canConfigure) return;
                                            setAuthSourceByActionId(prev => ({ ...prev, [action.id]: "static" }));
                                            if (isUserTokenAuthValue(action.authValue || "")) {
                                              updateAction(action.id, "authValue", "");
                                            }
                                          }}
                                          style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            background: authSource === "static" ? "#fff" : "transparent",
                                            color: authSource === "static" ? "#2563eb" : "#64748b",
                                            boxShadow: authSource === "static" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                          }}
                                        >
                                          Use Static Credential
                                        </button>
                                      </div>
                                      {authSource === "userToken" && (
                                        <div style={{ marginTop: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#1d4ed8" }}>
                                          Per-user auth mode enabled. Credential expression: <code style={{ background: "#dbeafe", padding: "1px 5px", borderRadius: 4 }}>{USER_TOKEN_EXPR}</code>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {action.authType === "apikey" && (
                                    <Row label="Header Name">
                                      <input style={inputStyle} value={action.apiKeyHeader} placeholder="X-API-Key"
                                        onChange={e => updateAction(action.id, "apiKeyHeader", e.target.value)} />
                                    </Row>
                                  )}
                                  <Row label={action.authType === "bearer" ? "Bearer Token" : action.authType === "basic" ? "Base64 Credentials (user:pass)" : "API Key Value"}>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                      <input
                                        style={inputStyle}
                                        type={
                                          authSource === "userToken"
                                            ? "text"
                                            : (showAuthValueByActionId[action.id] ? "text" : "password")
                                        }
                                        value={action.authValue}
                                        readOnly={(action.authType === "bearer" || action.authType === "apikey") && authSource === "userToken"}
                                        placeholder={action.authType === "bearer" ? "{{userToken}} or static token" : "••••••••"}
                                        onChange={e => updateAction(action.id, "authValue", e.target.value)}
                                      />
                                      {authSource !== "userToken" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setShowAuthValueByActionId(prev => ({ ...prev, [action.id]: !prev[action.id] }))
                                          }
                                          style={{
                                            border: "1.5px solid #e2e8f0",
                                            background: "#fff",
                                            borderRadius: "9px",
                                            height: "38px",
                                            minWidth: "38px",
                                            cursor: "pointer",
                                            color: "#64748b",
                                            fontSize: "14px",
                                          }}
                                          title={showAuthValueByActionId[action.id] ? "Hide credential" : "Show credential"}
                                          aria-label={showAuthValueByActionId[action.id] ? "Hide credential" : "Show credential"}
                                        >
                                          {showAuthValueByActionId[action.id] ? "🙈" : "👁️"}
                                        </button>
                                      )}
                                    </div>
                                  </Row>
                                  {(action.authType === "bearer" || action.authType === "apikey") && authSource === "static" && (
                                    <div style={{ marginTop: "-4px", fontSize: "11px", color: "#94a3b8" }}>
                                      Static mode: one shared credential for all users.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* ── Section: Parameters ── */}
                        {sec === "params" && (
                          <>
                            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "14px 18px", marginBottom: "18px", fontSize: "13px", color: "#92400e", lineHeight: 1.65 }}>
                              <strong>🔧 What are parameters?</strong> These are the data fields your endpoint needs — like <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontSize: "12px" }}>productId</code>, <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontSize: "12px" }}>quantity</code>, or <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontSize: "12px" }}>deliveryAddress</code>.
                              The AI will collect them from the user during conversation (or extract from context), then pass them as <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontSize: "12px" }}>{"{{paramName}}"}</code> in your body template.
                            </div>

                            <ParamsEditor
                              params={action.params}
                              onChange={params => updateAction(action.id, "params", params)}
                            />

                            {action.params.filter(p => p.name.trim()).length > 0 && (
                              <>
                                <SectionDivider label="MCP Tool Schema Preview" />
                                <div style={{ background: "#0f172a", borderRadius: "12px", padding: "16px", overflow: "auto", maxHeight: "280px" }}>
                                  <pre style={{ margin: 0, color: "#e2e8f0", fontSize: "11px", lineHeight: 1.7 }}>
                                    {buildMCPPreview(action)}
                                  </pre>
                                </div>
                                <p style={{ margin: "8px 0 0", fontSize: "11.5px", color: "#94a3b8" }}>
                                  ↑ This JSON is what the backend sends to N8N as the tool definition. The AI uses it to know what to collect.
                                </p>
                              </>
                            )}
                          </>
                        )}

                        {/* ── Section: Body Template ── */}
                        {sec === "body" && (
                          <>
                            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 16px", marginBottom: "14px", border: "1px dashed #cbd5e1", lineHeight: 2.2 }}>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Available variables:</div>
                              <div>
                                <span style={{ fontSize: "11px", color: "#94a3b8", marginRight: "6px" }}>System:</span>
                                {SYSTEM_VARS.filter(v => v !== "{{userToken}}").map(v => <Chip key={v} label={v} blue />)}
                                <code style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "5px", margin: "2px 3px", fontSize: "11px", fontFamily: "monospace", display: "inline-block" }}>{"{{userToken}}"}</code>
                              </div>
                              {paramVars.length > 0 && (
                                <div style={{ marginTop: "4px" }}>
                                  <span style={{ fontSize: "11px", color: "#94a3b8", marginRight: "6px" }}>Your params:</span>
                                  {paramVars.map(v => <Chip key={v} label={v} />)}
                                </div>
                              )}
                              {paramVars.length === 0 && (
                                <div style={{ marginTop: "4px", fontSize: "11px", color: "#cbd5e1" }}>
                                  No custom params yet —{" "}
                                  <button onClick={() => toggleSection(action.id, "params")} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "11px", padding: 0, fontWeight: 600 }}>
                                    add some in Parameters tab →
                                  </button>
                                </div>
                              )}
                            </div>

                            <Row label="JSON Body Template" hint="Write any JSON structure you need. Mix system variables and your custom params.">
                              <textarea
                                rows={12} style={monoStyle}
                                value={action.bodyTemplate}
                                onChange={e => updateAction(action.id, "bodyTemplate", e.target.value)}
                              />
                            </Row>

                            <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "12px 16px", border: "1px solid #bbf7d0", fontSize: "12px", color: "#166534" }}>
                              <strong>Examples:</strong>
                              <pre style={{ margin: "8px 0 0", fontSize: "11px", color: "#166534", lineHeight: 1.8 }}>{`// Flat params (productId: string, quantity: number)
{
  "action": "{{actionName}}",
  "productId": "{{productId}}",
  "quantity": {{quantity}}
}

// Object param named "order" with sub-fields productId, quantity, address
{
  "action": "{{actionName}}",
  "order": {{order}}          ← inserts full JSON object
}

// Or access sub-fields individually via dot notation
{
  "product": "{{order.productId}}",
  "qty": {{order.quantity}},
  "street": "{{order.address}}"
}`}</pre>
                            </div>
                          </>
                        )}

                        {/* ── Section: Messages ── */}
                        {sec === "messages" && (
                          <>
                            {/* Response mode toggle */}
                            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px 18px", marginBottom: "18px", border: "1px solid #e2e8f0" }}>
                              <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a", marginBottom: "10px" }}>
                                ✅ Success Reply
                              </div>
                              {/* pill toggle */}
                              <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "8px", padding: "3px", gap: "2px", marginBottom: "14px", width: "fit-content" }}>
                                {(["static", "dynamic"] as ResponseMode[]).map(mode => (
                                  <button key={mode}
                                    onClick={() => updateAction(action.id, "responseMode", mode)}
                                    style={{
                                      padding: "6px 18px", borderRadius: "6px", border: "none", cursor: "pointer",
                                      fontSize: "12px", fontWeight: 600,
                                      background: action.responseMode === mode ? "#fff" : "transparent",
                                      color: action.responseMode === mode ? "#2563eb" : "#64748b",
                                      boxShadow: action.responseMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                      transition: "all 0.15s",
                                    }}>
                                    {mode === "static" ? "📝 Static message" : "⚡ From API response"}
                                  </button>
                                ))}
                              </div>

                              {action.responseMode === "static" ? (
                                <Row label="Message shown to user" hint="Always shown verbatim when the action succeeds">
                                  <input style={inputStyle} value={action.successMessage}
                                    onChange={e => updateAction(action.id, "successMessage", e.target.value)} />
                                </Row>
                              ) : (
                                <>
                                  <div style={{ background: "#eff6ff", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", fontSize: "12px", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                                    <strong>How it works:</strong> The backend extracts a value from your API&apos;s JSON response using the path below and shows it directly to the user — e.g. <code style={{ background: "#dbeafe", padding: "1px 5px", borderRadius: 3 }}>&quot;Order #1234 confirmed. Delivery: March 25&quot;</code>.
                                  </div>
                                  <Row label="Response path"
                                    hint='Dot-notation path into the JSON response. e.g. "message", "data.reply", "order.confirmationText"'>
                                    <input style={{ ...inputStyle, fontFamily: "monospace" }}
                                      value={action.responsePath}
                                      placeholder="message"
                                      onChange={e => updateAction(action.id, "responsePath", e.target.value)} />
                                  </Row>
                                  <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", fontSize: "12px", color: "#166534", border: "1px solid #bbf7d0" }}>
                                    <strong>Example:</strong> if your API returns{" "}
                                    <code style={{ background: "#dcfce7", padding: "1px 5px", borderRadius: 3 }}>{`{"status":"ok","message":"Order #1234 placed!"}`}</code>{" "}
                                    → set path to <code style={{ background: "#dcfce7", padding: "1px 5px", borderRadius: 3 }}>message</code> → user sees <em>&quot;Order #1234 placed!&quot;</em>
                                  </div>
                                  <Row label="Fallback message" hint="Shown if the response path is missing or empty">
                                    <input style={inputStyle} value={action.successMessage}
                                      onChange={e => updateAction(action.id, "successMessage", e.target.value)} />
                                  </Row>
                                </>
                              )}
                            </div>

                            <Row label="❌ Failure Message" hint="Shown when the action endpoint returns an error">
                              <input style={inputStyle} value={action.failureMessage}
                                onChange={e => updateAction(action.id, "failureMessage", e.target.value)} />
                            </Row>
                          </>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px", marginTop: "4px", borderTop: "1px solid #f1f5f9" }}>
                          <button type="button" onClick={() => removeAction(action.id)} disabled={!canConfigure} style={{ ...btnDanger, opacity: !canConfigure ? 0.6 : 1 }}>🗑 Remove Action</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {actions.length > 0 && (
              <button type="button" onClick={addAction} disabled={!canConfigure} style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "1.5px dashed #bfdbfe", background: "#f8faff", color: "#2563eb", fontWeight: 700, fontSize: "14px", cursor: !canConfigure ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: !canConfigure ? 0.6 : 1 }}>
                + Add Another Action
              </button>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            TAB: Test Console
        ═══════════════════════════════════════ */}
        {activeTab === "test" && (
          <div style={{ padding: "28px 32px", maxWidth: "960px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

              {/* Left */}
              <div>
                <Card title="Fire a Test Request" icon="🧪">
                  {actions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: "13px" }}>
                      No actions yet.{" "}
                      <button onClick={() => setActiveTab("actions")} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: "13px", padding: 0 }}>Add one →</button>
                    </div>
                  ) : (
                    <>
                      <Row label="Select Action">
                        <select style={selectStyle} value={testActionId}
                          onChange={e => setTestActionId(e.target.value)}>
                          <option value="">— pick an action —</option>
                          {actions.map(a => <option key={a.id} value={a.id}>{a.name || "Untitled"}</option>)}
                        </select>
                      </Row>

                      {selectedAction && (
                        <>
                          <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#475569", border: "1px solid #e2e8f0" }}>
                            <div><strong>URL:</strong> <code style={{ color: "#2563eb", wordBreak: "break-all", fontSize: "11px" }}>{selectedAction.url || <em style={{ color: "#94a3b8" }}>not set</em>}</code></div>
                            <div style={{ marginTop: "3px" }}><strong>Method:</strong> {selectedAction.method} · <strong>Auth:</strong> {selectedAction.authType}</div>
                          </div>

                          {/* Simulate user message */}
                          <Row label="Simulated User Message" hint="Fills {{message}} in the body template">
                            <textarea rows={2} style={monoStyle} value={testMessage} onChange={e => setTestMessage(e.target.value)} placeholder="I want to order 2 Blue Widgets" />
                          </Row>

                          {/* Fill custom params */}
                          {selectedAction.params.filter(p => p.name.trim()).length > 0 && (
                            <>
                              <SectionDivider label="Fill Custom Parameters" />
                              {selectedAction.params.filter(p => p.name.trim()).map(p => (
                                <div key={p.id} style={{ marginBottom: "12px" }}>
                                  {p.type === "object" ? (
                                    /* Object param → show sub-field inputs */
                                    <div>
                                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <code style={{ fontFamily: "monospace", background: "#eff6ff", color: "#2563eb", padding: "1px 7px", borderRadius: 4 }}>{p.name}</code>
                                        <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "11px" }}>(object{p.required ? "" : " · optional"})</span>
                                        {p.description && <span style={{ color: "#64748b", fontSize: "11px" }}>— {p.description}</span>}
                                      </div>
                                      <div style={{ paddingLeft: "12px", borderLeft: "2px solid #dbeafe" }}>
                                        {(p.properties ?? []).filter(sp => sp.name.trim()).map(sp => (
                                          <div key={sp.id} style={{ marginBottom: "8px" }}>
                                            <label style={{ ...labelStyle, fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                                              <code style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "1px 5px", borderRadius: 3, fontSize: "11px" }}>{p.name}.{sp.name}</code>
                                              <span style={{ color: "#94a3b8", fontWeight: 400 }}>({sp.type}){sp.required ? "" : " optional"}</span>
                                            </label>
                                            {sp.description && <p style={{ margin: "1px 0 4px", fontSize: "11px", color: "#94a3b8" }}>{sp.description}</p>}
                                            <input style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
                                              value={testParams[`${p.name}.${sp.name}`] ?? ""}
                                              placeholder={sp.example || `Enter ${sp.name}…`}
                                              onChange={e => setTestParams(prev => ({ ...prev, [`${p.name}.${sp.name}`]: e.target.value }))} />
                                          </div>
                                        ))}
                                        {!(p.properties ?? []).filter(sp => sp.name.trim()).length && (
                                          <div style={{ fontSize: "11px", color: "#cbd5e1", fontStyle: "italic" }}>No sub-fields defined yet</div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    /* Flat param */
                                    <Row label={<><code style={{ fontFamily: "monospace", fontSize: "12px", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{p.name}</code>{" "}<span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "11px" }}>({p.type}){p.required ? "" : " optional"}</span></>} hint={p.description}>
                                      <input style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px" }}
                                        value={testParams[p.name] ?? ""}
                                        placeholder={p.example || `Enter ${p.name}…`}
                                        onChange={e => setTestParams(prev => ({ ...prev, [p.name]: e.target.value }))} />
                                    </Row>
                                  )}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Body preview */}
                          <SectionDivider label="Body Preview" />
                          <pre style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: "10px", padding: "12px 14px", fontSize: "11px", margin: "0 0 14px", lineHeight: 1.6, overflow: "auto", maxHeight: "160px" }}>
                            {interpolate(selectedAction.bodyTemplate, selectedAction, testMessage, testParams, chatbotId as string)}
                          </pre>

                          {/* MCP tool preview toggle */}
                          <button onClick={() => setMcpPreviewOpen(x => !x)} style={{ ...btnOutline, fontSize: "12px", padding: "6px 14px", width: "100%", justifyContent: "center", marginBottom: "12px" }}>
                            {mcpPreviewOpen ? "▲ Hide" : "▼ Show"} MCP Tool Schema
                          </button>
                          {mcpPreviewOpen && (
                            <pre style={{ background: "#0f172a", color: "#a5f3fc", borderRadius: "10px", padding: "12px 14px", fontSize: "11px", margin: "0 0 14px", lineHeight: 1.6, overflow: "auto", maxHeight: "200px" }}>
                              {buildMCPPreview(selectedAction)}
                            </pre>
                          )}
                        </>
                      )}

                      <button onClick={handleTest} disabled={isTesting || !testActionId || !canConfigure}
                        style={{ ...btnPrimary, width: "100%", justifyContent: "center", opacity: isTesting || !testActionId || !canConfigure ? 0.6 : 1 }}>
                        {isTesting ? <><SpinIcon /> Sending…</> : "▶ Send Request"}
                      </button>
                    </>
                  )}
                </Card>
              </div>

              {/* Right */}
              <div>
                <Card title="Response" icon="📩">
                  {!testResult && !isTesting && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                      <div style={{ fontSize: "34px", marginBottom: "10px" }}>📭</div>
                      <p style={{ margin: 0, fontSize: "13px" }}>Fill in the values and hit Send</p>
                    </div>
                  )}
                  {isTesting && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      <p style={{ margin: 0, fontSize: "13px" }}>Waiting…</p>
                    </div>
                  )}
                  {testResult && !isTesting && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ padding: "5px 14px", borderRadius: 999, fontSize: "13px", fontWeight: 700, background: testResult.ok ? "#dcfce7" : "#fee2e2", color: testResult.ok ? "#16a34a" : "#dc2626" }}>
                          {testResult.status ? `HTTP ${testResult.status}` : "Network Error"}
                        </span>
                        {testResult.durationMs !== null && (
                          <span style={{ padding: "5px 14px", borderRadius: 999, fontSize: "13px", fontWeight: 700, background: "#f1f5f9", color: "#475569" }}>⏱ {testResult.durationMs}ms</span>
                        )}
                      </div>
                      {testResult.error && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 14px", color: "#dc2626", fontSize: "13px" }}>
                          {testResult.error}
                        </div>
                      )}
                      {testResult.requestSent && (
                        <>
                          <label style={{ ...labelStyle, color: "#94a3b8" }}>Sent Payload</label>
                          <pre style={{ background: "#0f172a", color: "#94a3b8", borderRadius: "10px", padding: "12px 14px", fontSize: "11px", overflow: "auto", margin: 0, lineHeight: 1.6, maxHeight: "120px" }}>
                            {(() => { try { return JSON.stringify(JSON.parse(testResult.requestSent), null, 2); } catch { return testResult.requestSent; } })()}
                          </pre>
                        </>
                      )}
                      {/* If dynamic mode — show the extracted reply */}
                      {testResult.responseBody && selectedAction?.responseMode === "dynamic" && (() => {
                        try {
                          const parsed = JSON.parse(testResult.responseBody);
                          const paths = (selectedAction.responsePath || "message").split(".");
                          let cur: unknown = parsed;
                          for (const p of paths) {
                            if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
                            else { cur = undefined; break; }
                          }
                          const extracted = typeof cur === "string" ? cur : cur !== undefined ? JSON.stringify(cur) : null;
                          if (extracted) return (
                            <div>
                              <label style={{ ...labelStyle, color: "#16a34a" }}>
                                ⚡ Extracted reply <span style={{ fontWeight: 400, color: "#94a3b8" }}>({selectedAction.responsePath})</span>
                              </label>
                              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#0f172a", lineHeight: 1.6 }}>
                                {extracted}
                              </div>
                            </div>
                          );
                          return (
                            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#dc2626" }}>
                              ⚠️ Path <code style={{ background: "#fee2e2", padding: "1px 5px", borderRadius: 3 }}>{selectedAction.responsePath}</code> not found — fallback message would be shown.
                            </div>
                          );
                        } catch { return null; }
                      })()}

                      {testResult.responseBody && (
                        <>
                          <label style={labelStyle}>Raw Response Body</label>
                          <pre style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: "10px", padding: "12px 14px", fontSize: "11px", overflow: "auto", margin: 0, lineHeight: 1.6, maxHeight: "240px" }}>
                            {(() => { try { return JSON.stringify(JSON.parse(testResult.responseBody), null, 2); } catch { return testResult.responseBody; } })()}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </Card>

                <Card title="Variable Reference" icon="📖">
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>System</div>
                    {[
                      ["{{actionName}}",  "Name of this action"],
                      ["{{message}}",     "User's last message"],
                      ["{{sessionId}}",   "Conversation session ID"],
                      ["{{userId}}",      "Platform user ID or email (Clerk)"],
                      ["{{chatbotId}}",   "This chatbot's identifier"],
                      ["{{userToken}}",   "Token from your website — identifies the visitor"],
                    ].map(([v, d]) => (
                      <div key={v} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <code style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontFamily: "monospace", flexShrink: 0, minWidth: "130px" }}>{v}</code>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{d}</span>
                      </div>
                    ))}
                    {selectedAction && selectedAction.params.filter(p => p.name.trim()).length > 0 && (
                      <>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "10px", marginBottom: "4px" }}>This action's params</div>
                        {selectedAction.params.filter(p => p.name.trim()).map(p => (
                          <React.Fragment key={p.id}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <code style={{ background: p.type === "object" ? "#eff6ff" : "#f1f5f9", color: p.type === "object" ? "#2563eb" : "#475569", padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontFamily: "monospace", flexShrink: 0, minWidth: "130px" }}>
                                {`{{${p.name}}}`}
                              </code>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                {p.type === "object" ? "→ full object (JSON)" : p.description || p.type}
                              </span>
                            </div>
                            {/* show dot-notation sub-fields for objects */}
                            {p.type === "object" && (p.properties ?? []).filter(sp => sp.name.trim()).map(sp => (
                              <div key={sp.id} style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "16px" }}>
                                <code style={{ background: "#f8fafc", color: "#64748b", padding: "2px 8px", borderRadius: "5px", fontSize: "10px", fontFamily: "monospace", flexShrink: 0, minWidth: "130px", border: "1px dashed #e2e8f0" }}>
                                  {`{{${p.name}.${sp.name}}}`}
                                </code>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{sp.description || sp.type}</span>
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{CSS}</style>
    </div>
  );
}

/* ── small card ── */
function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 6px rgba(15,23,42,0.05)", marginBottom: "16px" }}>
      <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "15px" }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{title}</span>
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

/* ── icons ── */
function SpinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

const CSS = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .full-height-layout { display: flex; width: 100%; min-height: 100vh; position: relative; background: #f8fafc; }
  .main-content { flex: 1; margin-left: 280px; min-height: 100vh; transition: margin-left 0.4s cubic-bezier(0.4,0,0.2,1); overflow-x: hidden; }
  .main-content.collapsed { margin-left: 60px; }
  @media (max-width: 768px) { .main-content { margin-left: 0; } }
`;

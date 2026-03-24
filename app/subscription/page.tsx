"use client";

import React, { useState } from "react";
import LeftSidebar from "@/component/LeftSidebar";
import { useAuth } from "@clerk/nextjs";
import PageHeader from "@/component/PageHeader";

/* ─────────────────────────────────────────────
   Plan definitions
───────────────────────────────────────────── */
interface PlanFeature {
  label: string;
  included: boolean | string;
}

interface Plan {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  priceNote?: string;
  cta: string;
  ctaVariant: "outline" | "primary" | "gradient" | "dark";
  highlight: boolean;
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Try the platform with no credit card required.",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Get Started",
    ctaVariant: "outline",
    highlight: false,
    features: [
      { label: "AI Chatbots", included: "1 chatbot" },
      { label: "Messages / month", included: "500" },
      { label: "Knowledge base pages", included: "10" },
      { label: "Social media accounts", included: false },
      { label: "AI Content Assistant", included: false },
      { label: "Post scheduling", included: false },
      { label: "Analytics & stats", included: "Basic" },
      { label: "API access", included: false },
      { label: "Priority support", included: false },
      { label: "Custom branding", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small teams and growing projects.",
    monthlyPrice: 29,
    annualPrice: 23,
    cta: "Start Free Trial",
    ctaVariant: "outline",
    highlight: false,
    features: [
      { label: "AI Chatbots", included: "5 chatbots" },
      { label: "Messages / month", included: "10,000" },
      { label: "Knowledge base pages", included: "100" },
      { label: "Social media accounts", included: "2 accounts" },
      { label: "AI Content Assistant", included: true },
      { label: "Post scheduling", included: "30 posts/mo" },
      { label: "Analytics & stats", included: "Standard" },
      { label: "API access", included: false },
      { label: "Priority support", included: false },
      { label: "Custom branding", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    badgeColor: "#f59e0b",
    description: "Everything you need to scale AI-powered engagement.",
    monthlyPrice: 79,
    annualPrice: 63,
    cta: "Start Free Trial",
    ctaVariant: "gradient",
    highlight: true,
    features: [
      { label: "AI Chatbots", included: "25 chatbots" },
      { label: "Messages / month", included: "100,000" },
      { label: "Knowledge base pages", included: "1,000" },
      { label: "Social media accounts", included: "10 accounts" },
      { label: "AI Content Assistant", included: true },
      { label: "Post scheduling", included: "Unlimited" },
      { label: "Analytics & stats", included: "Advanced" },
      { label: "API access", included: true },
      { label: "Priority support", included: false },
      { label: "Custom branding", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Custom",
    badgeColor: "#8b5cf6",
    description: "Unlimited scale with dedicated support and SLA.",
    monthlyPrice: null,
    annualPrice: null,
    priceNote: "Custom pricing",
    cta: "Contact Sales",
    ctaVariant: "dark",
    highlight: false,
    features: [
      { label: "AI Chatbots", included: "Unlimited" },
      { label: "Messages / month", included: "Unlimited" },
      { label: "Knowledge base pages", included: "Unlimited" },
      { label: "Social media accounts", included: "Unlimited" },
      { label: "AI Content Assistant", included: true },
      { label: "Post scheduling", included: "Unlimited" },
      { label: "Analytics & stats", included: "Full + Export" },
      { label: "API access", included: true },
      { label: "Priority support", included: "Dedicated CSM" },
      { label: "Custom branding", included: true },
    ],
  },
];

/* ─────────────────────────────────────────────
   Feature comparison rows
───────────────────────────────────────────── */
const COMPARISON_CATEGORIES = [
  {
    category: "Chatbots",
    rows: [
      { label: "Number of chatbots", values: ["1", "5", "25", "Unlimited"] },
      { label: "Messages per month", values: ["500", "10,000", "100,000", "Unlimited"] },
      { label: "Knowledge base pages", values: ["10", "100", "1,000", "Unlimited"] },
      { label: "Custom chatbot avatar", values: [true, true, true, true] },
      { label: "Widget embed (any site)", values: [true, true, true, true] },
    ],
  },
  {
    category: "Social Media",
    rows: [
      { label: "Connected accounts", values: [false, "2", "10", "Unlimited"] },
      { label: "Platforms (FB, X, LinkedIn)", values: [false, true, true, true] },
      { label: "Post scheduling", values: [false, "30/mo", "Unlimited", "Unlimited"] },
      { label: "AI Content Assistant", values: [false, true, true, true] },
      { label: "File attachments in AI prompts", values: [false, false, true, true] },
      { label: "Post calendar", values: [false, true, true, true] },
    ],
  },
  {
    category: "Analytics",
    rows: [
      { label: "Conversation stats", values: ["Basic", "Standard", "Advanced", "Full + Export"] },
      { label: "Per-chatbot stats", values: [false, true, true, true] },
      { label: "Usage reports", values: [false, false, true, true] },
      { label: "CSV / JSON export", values: [false, false, false, true] },
    ],
  },
  {
    category: "Platform",
    rows: [
      { label: "API access", values: [false, false, true, true] },
      { label: "Custom branding (remove logo)", values: [false, false, true, true] },
      { label: "Priority support", values: [false, false, false, "Dedicated CSM"] },
      { label: "SLA guarantee", values: [false, false, false, true] },
      { label: "SSO / SAML", values: [false, false, false, true] },
    ],
  },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function CheckIcon({ color = "#22c55e" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill={color} fillOpacity={0.15} />
      <path d="M5 9l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#94a3b8" fillOpacity={0.12} />
      <path d="M6 6l6 6M12 6l-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CellValue({ val, highlight }: { val: boolean | string; highlight: boolean }) {
  if (val === false) return <CrossIcon />;
  if (val === true) return <CheckIcon color={highlight ? "#a78bfa" : "#22c55e"} />;
  return (
    <span style={{ fontSize: 13, fontWeight: 500, color: highlight ? "#7c3aed" : "#334155" }}>
      {val}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function SubscriptionPage() {
  const [annual, setAnnual] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isSignedIn } = useAuth();

  const handleDrawerStateChange = (_: boolean, __: string, collapsed?: boolean) => {
    if (collapsed !== undefined) setSidebarCollapsed(collapsed);
  };

  const price = (plan: Plan) => {
    if (plan.priceNote) return plan.priceNote;
    const p = annual ? plan.annualPrice : plan.monthlyPrice;
    if (p === 0) return "Free";
    return `$${p}`;
  };

  const priceSub = (plan: Plan) => {
    if (plan.priceNote || (plan.monthlyPrice === 0 && plan.annualPrice === 0)) return "";
    return annual ? "/mo, billed annually" : "/month";
  };

  return (
    <div className="full-height-layout" style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <LeftSidebar
        onDrawerStateChange={handleDrawerStateChange}
        onNavItemClick={() => {}}
      />

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`} style={{ flex: 1, marginLeft: sidebarCollapsed ? "60px" : "280px", overflowY: "auto", background: "#f8fafc", transition: "margin-left 0.3s ease" }}>
        <PageHeader
          breadcrumb={["Home", "Subscription"]}
          title="Subscription Plans"
          subtitle="Scale your AI chatbots and social media automation. Cancel or change plans any time."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          }
          actions={
            <div style={{ display: "inline-flex", alignItems: "center", background: "#f1f5f9", borderRadius: 40, padding: "4px", gap: 2, border: "1px solid #e2e8f0" }}>
              <button onClick={() => setAnnual(false)} style={{ background: !annual ? "#fff" : "transparent", color: !annual ? "#1e3a8a" : "#64748b", border: "none", borderRadius: 32, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: !annual ? "0 2px 8px rgba(15,23,42,0.08)" : "none" }}>Monthly</button>
              <button onClick={() => setAnnual(true)} style={{ background: annual ? "#fff" : "transparent", color: annual ? "#1e3a8a" : "#64748b", border: "none", borderRadius: 32, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6, boxShadow: annual ? "0 2px 8px rgba(15,23,42,0.08)" : "none" }}>
                Annual
                <span style={{ background: "#f59e0b", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>SAVE 20%</span>
              </button>
            </div>
          }
        />

        {/* ── Plan cards ─────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            padding: "40px 40px 0",
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.highlight
                  ? "linear-gradient(160deg, #2563eb 0%, #7c3aed 100%)"
                  : "#ffffff",
                borderRadius: 20,
                padding: "32px 28px",
                boxShadow: plan.highlight
                  ? "0 20px 60px rgba(124, 58, 237, 0.35)"
                  : "0 4px 24px rgba(15,23,42,0.08)",
                border: plan.highlight ? "none" : "1px solid #e2e8f0",
                position: "relative",
                transform: plan.highlight ? "translateY(-8px)" : "none",
                transition: "box-shadow 0.2s",
                color: plan.highlight ? "#fff" : "#1e293b",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: plan.badgeColor ?? "#2563eb",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    padding: "4px 14px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                {plan.name}
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>
                  {price(plan)}
                </span>
                {priceSub(plan) && (
                  <span style={{ fontSize: 13, opacity: 0.65, paddingBottom: 6 }}>
                    {priceSub(plan)}
                  </span>
                )}
              </div>

              {/* Annual savings note */}
              {annual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  Save ${(plan.monthlyPrice - (plan.annualPrice ?? 0)) * 12}/yr
                </div>
              )}

              <p style={{ fontSize: 14, opacity: 0.72, margin: "12px 0 24px", lineHeight: 1.55 }}>
                {plan.description}
              </p>

              {/* CTA button */}
              <button
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: plan.highlight
                    ? "2px solid rgba(255,255,255,0.7)"
                    : plan.ctaVariant === "outline"
                    ? "2px solid #2563eb"
                    : plan.ctaVariant === "dark"
                    ? "none"
                    : "none",
                  background: plan.highlight
                    ? "rgba(255,255,255,0.18)"
                    : plan.ctaVariant === "outline"
                    ? "transparent"
                    : plan.ctaVariant === "gradient"
                    ? "linear-gradient(135deg,#2563eb,#7c3aed)"
                    : "#0f172a",
                  color: plan.highlight
                    ? "#fff"
                    : plan.ctaVariant === "outline"
                    ? "#2563eb"
                    : "#fff",
                  transition: "opacity 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {plan.cta}
              </button>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: plan.highlight ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                  margin: "24px 0",
                }}
              />

              {/* Feature list */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                    {f.included === false ? (
                      <CrossIcon />
                    ) : (
                      <CheckIcon color={plan.highlight ? "#a5f3fc" : "#22c55e"} />
                    )}
                    <span style={{ opacity: f.included === false ? 0.45 : 1 }}>
                      {typeof f.included === "string" && f.included !== "true"
                        ? <><strong>{f.included}</strong> {f.label.toLowerCase()}</>
                        : f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── FAQ strip ──────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: "48px auto 0", padding: "0 40px" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: "28px 32px",
              display: "flex",
              flexWrap: "wrap",
              gap: 32,
            }}
          >
            {[
              { q: "Can I change plans later?", a: "Yes — upgrade or downgrade at any time. Changes take effect immediately." },
              { q: "Is there a free trial?", a: "Starter and Pro include a 14-day free trial, no credit card required." },
              { q: "What payment methods do you accept?", a: "All major credit cards, PayPal, and bank transfer for annual Enterprise plans." },
              { q: "What happens if I exceed my limits?", a: "You'll receive an in-app warning. No overage charges — we'll prompt you to upgrade." },
            ].map((item) => (
              <div key={item.q} style={{ flex: "1 1 220px", minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 6 }}>{item.q}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Full comparison table ──────────────────────── */}
        <div style={{ maxWidth: 1280, margin: "48px auto", padding: "0 40px 60px" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 8, textAlign: "center" }}>
            Compare all features
          </h2>
          <p style={{ textAlign: "center", color: "#64748b", fontSize: 15, marginBottom: 32 }}>
            Everything across every plan, side by side.
          </p>

          <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              {/* Header */}
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "18px 24px", textAlign: "left", fontWeight: 700, fontSize: 14, color: "#64748b", width: "35%" }}>
                    Feature
                  </th>
                  {PLANS.map((p) => (
                    <th
                      key={p.id}
                      style={{
                        padding: "18px 16px",
                        textAlign: "center",
                        fontWeight: 800,
                        fontSize: 14,
                        color: p.highlight ? "#7c3aed" : "#0f172a",
                        background: p.highlight ? "#f5f3ff" : "transparent",
                        borderLeft: "1px solid #e2e8f0",
                      }}
                    >
                      {p.name}
                      {p.highlight && (
                        <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, opacity: 0.7, marginTop: 2 }}>
                          Most Popular
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {COMPARISON_CATEGORIES.map((cat, ci) => (
                  <React.Fragment key={cat.category}>
                    {/* Category header row */}
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: "12px 24px 8px",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#94a3b8",
                          background: "#f8fafc",
                          borderTop: ci > 0 ? "2px solid #e2e8f0" : "none",
                        }}
                      >
                        {cat.category}
                      </td>
                    </tr>

                    {cat.rows.map((row, ri) => (
                      <tr
                        key={row.label}
                        style={{ borderTop: "1px solid #f1f5f9", background: ri % 2 === 0 ? "#fff" : "#fafbfc" }}
                      >
                        <td style={{ padding: "13px 24px", fontSize: 14, color: "#334155", fontWeight: 500 }}>
                          {row.label}
                        </td>
                        {row.values.map((val, vi) => (
                          <td
                            key={vi}
                            style={{
                              padding: "13px 16px",
                              textAlign: "center",
                              borderLeft: "1px solid #f1f5f9",
                              background: PLANS[vi].highlight ? "#faf9ff" : "transparent",
                            }}
                          >
                            <CellValue val={val} highlight={PLANS[vi].highlight} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Enterprise CTA */}
          <div
            style={{
              marginTop: 32,
              background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)",
              borderRadius: 16,
              padding: "36px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
              color: "#fff",
            }}
          >
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Need a custom plan?</h3>
              <p style={{ margin: 0, opacity: 0.8, fontSize: 15 }}>
                Talk to our team for volume discounts, on-premise deployments, and dedicated SLAs.
              </p>
            </div>
            <button
              style={{
                background: "#fff",
                color: "#1e3a8a",
                border: "none",
                borderRadius: 12,
                padding: "13px 32px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Contact Sales →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

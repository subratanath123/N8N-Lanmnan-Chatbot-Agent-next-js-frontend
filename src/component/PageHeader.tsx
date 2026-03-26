"use client";

import React from "react";
import { MDBIcon } from "mdb-react-ui-kit";

interface PageHeaderProps {
  /** e.g. ["Home", "AI Chatbots"] — joined with › */
  breadcrumb: string[];
  title: string;
  subtitle?: string;
  /** SVG or emoji element, or Font Awesome name (e.g. "user-circle") rendered inside the icon box */
  icon?: React.ReactNode | string;
  /** Buttons / controls rendered on the right side */
  actions?: React.ReactNode;
}

/**
 * Consistent page-level header used across all sidebar pages.
 * Matches the style of the Plagiarism Checker page.
 */
export default function PageHeader({
  breadcrumb,
  title,
  subtitle,
  icon,
  actions,
}: PageHeaderProps) {
  const iconEl =
    icon == null ? null : typeof icon === "string" ? (
      <MDBIcon fas icon={icon} style={{ color: "#2563eb", fontSize: "18px" }} />
    ) : (
      icon
    );

  return (
    <div
      style={{
        padding: "18px 36px 16px",
        paddingTop: "60px",
        borderBottom: "1px solid #e2e8f0",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      {/* Left: breadcrumb + icon + title */}
      <div>
        {breadcrumb.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              marginBottom: "6px",
              letterSpacing: "0.04em",
              fontWeight: 500,
            }}
          >
            {breadcrumb.join(" › ")}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          {iconEl && (
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1px solid #dbeafe",
                marginTop: "2px",
              }}
            >
              {iconEl}
            </div>
          )}
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

"use client";

import React from 'react';

export default function SupportOverviewPage() {
  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
      {[
        { label: 'Open Conversations', value: '128', trend: '+12%', tone: '#2563eb' },
        { label: 'Avg. First Response', value: '2m 14s', trend: '-8%', tone: '#16a34a' },
        { label: 'Customer Satisfaction', value: '92%', trend: '+4%', tone: '#7c3aed' },
        { label: 'Resolved Today', value: '54', trend: '+18%', tone: '#f97316' },
      ].map((stat) => (
        <div
          key={stat.label}
          style={{
            borderRadius: '18px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            background: '#f8fafc',
            padding: '22px',
            boxShadow: '0 16px 28px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{stat.label}</span>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a' }}>{stat.value}</div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: stat.tone }}>{stat.trend} vs last week</span>
        </div>
      ))}
    </div>
  );
}


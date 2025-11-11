"use client";

import React from 'react';

export default function SupportAnalyticsPage() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <section
        style={{
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}
      >
        {[
          { label: 'Resolution Rate', value: '88%', sub: '+6% vs last month' },
          { label: 'Escalations', value: '12', sub: '-3 vs last month' },
          { label: 'Agent Utilization', value: '74%', sub: '+2% vs last month' },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              borderRadius: '18px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: '#ffffff',
              padding: '22px',
              boxShadow: '0 14px 26px rgba(15, 23, 42, 0.05)',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>{card.label}</span>
            <div style={{ fontSize: '30px', fontWeight: 700, color: '#0f172a', marginTop: '10px' }}>{card.value}</div>
            <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>{card.sub}</span>
          </div>
        ))}
      </section>

      <section
        style={{
          borderRadius: '20px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          background: '#f8fafc',
          padding: '24px',
          boxShadow: '0 16px 32px rgba(15, 23, 42, 0.05)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Response Time Breakdown
        </h2>
        <div style={{ display: 'grid', gap: '14px', fontSize: '14px', color: '#475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>0 - 5 minutes</span>
            <strong>58%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>5 - 15 minutes</span>
            <strong>28%</strong>
          </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>15 - 30 minutes</span>
            <strong>9%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>30+ minutes</span>
            <strong>5%</strong>
          </div>
        </div>
      </section>
    </div>
  );
}


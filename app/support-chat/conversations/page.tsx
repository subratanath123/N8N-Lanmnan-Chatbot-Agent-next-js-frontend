"use client";

import React from 'react';

const conversations = [
  {
    id: 'CNV-1024',
    customer: 'Emily Carter',
    channel: 'Website widget',
    priority: 'High',
    lastMessage: 'I need help resetting my password.',
    updatedAt: '2 mins ago',
    assignedTo: 'Alex Martin',
  },
  {
    id: 'CNV-1023',
    customer: 'James Wilson',
    channel: 'WhatsApp',
    priority: 'Medium',
    lastMessage: 'Thanks! That resolved my issue.',
    updatedAt: '6 mins ago',
    assignedTo: 'Taylor Smith',
  },
  {
    id: 'CNV-1022',
    customer: 'Olivia Patel',
    channel: 'Messenger',
    priority: 'Low',
    lastMessage: 'Is there an update on my request?',
    updatedAt: '12 mins ago',
    assignedTo: 'Casey Lee',
  },
  {
    id: 'CNV-1021',
    customer: 'Michael Chen',
    channel: 'Email',
    priority: 'High',
    lastMessage: 'Can you check order status #2187?',
    updatedAt: '18 mins ago',
    assignedTo: 'Jordan Torres',
  },
];

export default function SupportConversationsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            background: '#ffffff',
            padding: '18px 22px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 14px 32px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {conversation.customer}
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>{conversation.lastMessage}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#64748b', fontSize: '13px' }}>
            <span>#{conversation.id}</span>
            <span>{conversation.channel}</span>
            <span>
              Assigned to <strong style={{ color: '#0f172a' }}>{conversation.assignedTo}</strong>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                background: conversation.priority === 'High' ? 'rgba(248, 113, 113, 0.16)' : 'rgba(96, 165, 250, 0.12)',
                color: conversation.priority === 'High' ? '#dc2626' : '#2563eb',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {conversation.priority}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{conversation.updatedAt}</span>
            <button
              type="button"
              style={{
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: '#ffffff',
                color: '#2563eb',
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View Thread
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


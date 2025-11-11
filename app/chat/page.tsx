"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardLayout from '@/component/DashboardLayout';
import { redirect } from 'next/navigation';
import AIAssistantsShowcase from '@/component/AIAssistantsShowcase';

export default function ChatPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 120px)',
            color: '#6b7280',
            fontSize: '15px',
          }}
        >
          Loading chat assistants…
        </div>
      </DashboardLayout>
    );
  }

  if (!isSignedIn) {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          padding: '24px',
        }}
      >
        <section
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.08em' }}>
              AI CHAT ASSISTANTS
            </span>
            <h1 style={{ fontSize: '34px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Choose Your Assistant
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0, maxWidth: '640px' }}>
              Browse our curated collection of AI companions. Click any assistant to launch the chat widget instantly
              and start a conversation without leaving this page.
            </p>
          </div>
        </section>

        <AIAssistantsShowcase />
      </div>
    </DashboardLayout>
  );
}

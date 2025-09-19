"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardLayout from '@/component/DashboardLayout';
import { redirect } from 'next/navigation';

export default function ChatPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <DashboardLayout showNav={false}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <div>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isSignedIn) {
    redirect('/');
  }

  // Redirect to the main chat interface
  redirect('/');
}

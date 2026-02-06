"use client";
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OAuthSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const chatbotId = searchParams.get('chatbotId');

  useEffect(() => {
    // Notify parent window (widget) about OAuth success
    if (window.opener) {
      window.opener.postMessage(
        { type: 'GOOGLE_OAUTH_SUCCESS', sessionId, chatbotId },
        window.location.origin
      );
      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // If not in popup, redirect back or show success message
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, [sessionId, chatbotId]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        borderRadius: '50%',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <span style={{ fontSize: '32px' }}>✓</span>
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px', color: '#0f172a' }}>
        Successfully Connected!
      </h1>
      <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>
        Your Google Calendar has been connected. You can now create calendar events through the chatbot.
      </p>
      <p style={{ fontSize: '14px', color: '#94a3b8' }}>
        This window will close automatically...
      </p>
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        Loading...
      </div>
    }>
      <OAuthSuccessContent />
    </Suspense>
  );
}


"use client";
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // Close popup after showing error
    if (window.opener) {
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, []);

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
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        borderRadius: '50%',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <span style={{ fontSize: '32px', color: 'white' }}>✕</span>
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px', color: '#0f172a' }}>
        Connection Failed
      </h1>
      <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>
        {error || 'An error occurred while connecting to Google Calendar. Please try again.'}
      </p>
      <p style={{ fontSize: '14px', color: '#94a3b8' }}>
        This window will close automatically...
      </p>
    </div>
  );
}

export default function OAuthErrorPage() {
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
      <OAuthErrorContent />
    </Suspense>
  );
}


'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OAuthSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    const chatbotId = searchParams.get('chatbotId');
    
    if (success === 'true') {
      setStatus('success');
      setMessage('Google Calendar connected successfully!');
      
      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_CALENDAR_OAUTH_SUCCESS',
          chatbotId,
          success: true
        }, '*');
      }
      
      // Auto-close popup after delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } else if (error === 'true') {
      setStatus('error');
      setMessage(errorMessage || 'Failed to connect Google Calendar');
      
      // Notify parent window of error
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_CALENDAR_OAUTH_SUCCESS',
          chatbotId,
          success: false,
          error: errorMessage
        }, '*');
      }
      
      // Auto-close popup after longer delay for error
      setTimeout(() => {
        window.close();
      }, 5000);
    } else {
      setStatus('loading');
      setMessage('Processing...');
    }
  }, [searchParams]);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: status === 'success' ? '#f0fdf4' : status === 'error' ? '#fef2f2' : '#f9fafb'
    }}>
      {status === 'loading' && (
        <>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>{message}</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ color: '#166534', marginBottom: '8px' }}>Success!</h2>
          <p style={{ color: '#16a34a' }}>{message}</p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '16px' }}>
            This window will close automatically...
          </p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2 style={{ color: '#991b1b', marginBottom: '8px' }}>Connection Failed</h2>
          <p style={{ color: '#dc2626' }}>{message}</p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '16px' }}>
            This window will close automatically...
          </p>
          <button
            onClick={() => window.close()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close Window
          </button>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function OAuthSuccessChatbotPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb'
      }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    }>
      <OAuthSuccessContent />
    </Suspense>
  );
}


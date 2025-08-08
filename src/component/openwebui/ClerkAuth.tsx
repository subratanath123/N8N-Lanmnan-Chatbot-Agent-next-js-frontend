import React from 'react';
import { useUser, useClerk, SignInButton, SignOutButton } from '@clerk/nextjs';
import { User } from './types';

interface ClerkAuthProps {
  onViewHistory: () => void;
}

export default function ClerkAuth({ onViewHistory }: ClerkAuthProps) {
  const { user, isSignedIn, isLoaded } = useUser();
  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'fadeInRight 0.6s ease-out 0.6s both'
      }}>
        <div style={{
          padding: '6px 12px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#6c757d'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'fadeInRight 0.6s ease-out 0.6s both'
    }}>
      {isSignedIn && user ? (
        // Logged in user
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#1976d2',
            fontFamily: 'monospace'
          }}>
            <span>👤</span>
            <span>{user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}</span>
          </div>
          
          <button
            onClick={onViewHistory}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4caf50',
              border: '1px solid #4caf50',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049';
              e.currentTarget.style.borderColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4caf50';
              e.currentTarget.style.borderColor = '#4caf50';
            }}
          >
            📚 History
          </button>
          
          <SignOutButton>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                color: '#333',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e9ecef';
              }}
            >
              Sign out
            </button>
          </SignOutButton>
        </>
      ) : (
        // Anonymous user
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#856404',
            fontFamily: 'monospace'
          }}>
            <span>👤</span>
            <span>Anonymous User</span>
          </div>
          
          <SignInButton>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                border: '1px solid #007bff',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0056b3';
                e.currentTarget.style.borderColor = '#0056b3';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff';
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
              }}
            >
              Sign in
            </button>
          </SignInButton>
        </>
      )}
    </div>
  );
}

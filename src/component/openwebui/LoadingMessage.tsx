import React from 'react';

export default function LoadingMessage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '16px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '14px 18px',
        borderRadius: '16px',
        backgroundColor: '#f8f9fa',
        color: '#333',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img 
            src="/favicon.png" 
            alt="Lanmnan" 
            style={{ 
              width: '24px', 
              height: '24px',
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#6c757d',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite ease-in-out'
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#6c757d',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: '0.1s'
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#6c757d',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: '0.2s'
            }}></div>
            <span style={{ 
              marginLeft: '8px',
              fontSize: '14px',
              color: '#6c757d'
            }}>
              Thinking...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 
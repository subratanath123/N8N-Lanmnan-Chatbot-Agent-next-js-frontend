import React from 'react';
import { Message } from './types';

interface ChatMessageProps {
  message: Message;
  index: number;
  copyToClipboard: (text: string) => void;
}

export default function ChatMessage({ message, index, copyToClipboard }: ChatMessageProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        animation: `slideIn${message.role === 'user' ? 'Right' : 'Left'} 0.5s ease-out ${1.6 + index * 0.1}s both`
      }}
    >
      <div style={{
        maxWidth: '85%',
        padding: '14px 18px',
        borderRadius: '16px',
        backgroundColor: message.role === 'user' ? '#007bff' : '#f8f9fa',
        color: message.role === 'user' ? 'white' : '#333',
        position: 'relative',
        boxShadow: message.role === 'user' 
          ? '0 4px 12px rgba(0, 123, 255, 0.2)' 
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: message.role === 'user' 
          ? 'none' 
          : '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        {message.role === 'assistant' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#ffd700',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(255, 215, 0, 0.3)'
            }}>
              AI
            </div>
            <span style={{ 
              fontWeight: '600', 
              color: '#ffd700',
              fontSize: '14px'
            }}>
              🤖
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: '#6c757d',
              backgroundColor: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              Thinking process
            </span>
          </div>
        )}
        
        <div style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          marginBottom: '8px'
        }}>
          {message.content}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          opacity: 0.7
        }}>
          <span>{message.createdAt.toLocaleDateString('en-US', {
            month: 'long', 
            day: 'numeric' 
          })}</span>
          {message.role === 'assistant' && (
            <button
              onClick={() => copyToClipboard(message.content)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: 0.7,
                color: 'inherit'
              }}
            >
              📋 Copy
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 
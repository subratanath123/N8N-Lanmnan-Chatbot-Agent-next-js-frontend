import React from 'react';
import { Message, FileAttachment } from './types';

interface ChatMessageProps {
  message: Message;
  index: number;
  copyToClipboard: (text: string) => void;
  attachments?: FileAttachment[];
}

export default function ChatMessage({ message, index, copyToClipboard, attachments = [] }: ChatMessageProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        animation: `slideIn${message.role === 'user' ? 'Right' : 'Left'} 0.5s ease-out ${1.6 + index * 0.1}s both`
      }}
    >
      <div 
        className="responsive-message"
        style={{
          maxWidth: '85%',
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
        }}
      >
        <div style={{ padding: '14px 18px' }}>
          {message.role === 'assistant' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <img 
                src="/favicon.png" 
                alt="JadeAIBot" 
                style={{ 
                  width: '20px', 
                  height: '20px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
            </div>
          )}
          
          <div style={{ 
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            marginBottom: attachments && attachments.length > 0 ? '12px' : '8px'
          }}>
            {message.content}
          </div>

          {/* Display file attachments if present */}
          {attachments && attachments.length > 0 && (
            <div style={{
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: `1px solid ${message.role === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '6px',
                opacity: 0.8,
              }}>
                📎 Attachments
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}>
                {attachments.map((file) => (
                  <a
                    key={file.fileId}
                    href={file.downloadUrl}
                    download={file.fileName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      backgroundColor: message.role === 'user' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: message.role === 'user' ? 'white' : '#333',
                      textDecoration: 'none',
                      border: `1px solid ${message.role === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = message.role === 'user' 
                        ? 'rgba(255, 255, 255, 0.25)' 
                        : 'rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = message.role === 'user' 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <span>⬇️</span>
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.fileName}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          opacity: 0.7,
          padding: '0 18px 14px 18px',
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
import React from 'react';
import { ChatSession } from './types';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (session: ChatSession) => void;
  onClose: () => void;
  isVisible: boolean;
}

export default function ChatHistory({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onClose, 
  isVisible 
}: ChatHistoryProps) {
  if (!isVisible) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSessionPreview = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    
    const content = lastMessage.content;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Chat History</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6c757d'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>No chat history yet</h4>
            <p style={{ margin: 0 }}>Start a conversation to see your chat history here.</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                style={{
                  padding: '16px',
                  border: session.id === currentSessionId ? '2px solid #007bff' : '1px solid #e9ecef',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: session.id === currentSessionId ? '#f8f9ff' : 'white',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (session.id !== currentSessionId) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (session.id !== currentSessionId) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {session.title}
                  </h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#6c757d'
                  }}>
                    <span>{session.isAnonymous ? '👤' : '👤'}</span>
                    <span>{session.isAnonymous ? 'Anonymous' : 'User'}</span>
                  </div>
                </div>
                
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  color: '#6c757d',
                  lineHeight: '1.4'
                }}>
                  {getSessionPreview(session)}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  <span>{session.messages.length} messages</span>
                  <span>{formatDate(session.updatedAt)}</span>
                </div>
                
                {session.id === currentSessionId && (
                  <div style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Current Session
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

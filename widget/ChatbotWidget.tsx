"use client";
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

interface ChatbotWidgetConfig {
  chatbotId: string;
  apiUrl: string;
}

interface ChatbotWidgetProps {
  config: ChatbotWidgetConfig;
  onClose?: () => void;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ config, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const getSessionId = (): string => {
    try {
      let sessionId = localStorage.getItem(`chatbot_session_${config.chatbotId}`);
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(`chatbot_session_${config.chatbotId}`, sessionId);
      }
      return sessionId;
    } catch (error) {
      // If localStorage is not available, generate a session ID without storing it
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  };
  
  const sessionIdRef = useRef<string>(getSessionId());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/v1/api/chatbot/${config.chatbotId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: getSessionId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || data.message || 'Sorry, I could not process your request.',
        role: 'assistant',
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        role: 'assistant',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
      }}>
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '16px 24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '500',
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            flexShrink: 0,
          }}>
            💬
          </div>
          <span>Chat with us</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '380px',
      height: '600px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            flexShrink: 0,
          }}>
            💬
          </div>
          <span style={{ fontWeight: '600', fontSize: '16px' }}>Chat Support</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            lineHeight: '1',
          }}
          aria-label="Minimize"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#6c757d',
            padding: '40px 20px',
            fontSize: '14px',
          }}>
            <p>Hello! How can I help you today?</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: message.role === 'user' ? '#007bff' : '#f1f3f5',
              color: message.role === 'user' ? 'white' : '#333',
              fontSize: '14px',
              lineHeight: '1.5',
              wordWrap: 'break-word',
            }}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#f1f3f5',
              display: 'flex',
              gap: '4px',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6c757d',
                animation: 'bounce 1.4s infinite ease-in-out both',
              }}></span>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6c757d',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0.2s',
              }}></span>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6c757d',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0.4s',
              }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: '16px',
        borderTop: '1px solid #e9ecef',
        display: 'flex',
        gap: '8px',
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #e9ecef',
            borderRadius: '24px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 24px',
            cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Send
        </button>
      </form>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotWidget;


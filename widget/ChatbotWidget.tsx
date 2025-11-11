"use client";
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  sessionId?: string;
  chatbotId?: string;
}

interface ChatbotWidgetConfig {
  chatbotId: string;
  apiUrl: string;
}

interface ChatbotWidgetProps {
  config: ChatbotWidgetConfig;
  onClose?: () => void;
  startOpen?: boolean;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ config, onClose, startOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!(startOpen ?? false));
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
    setIsMinimized(!(startOpen ?? false));
    setMessages([]);
    setInputValue('');
  }, [startOpen, config.chatbotId]);

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
      sessionId: sessionIdRef.current,
      chatbotId: config.chatbotId,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const payload = {
        role: 'user',
        message: userMessage.content,
        attachments: [],
        sessionId: sessionIdRef.current,
        chatbotId: config.chatbotId,
      };

      const response = await fetch(`${config.apiUrl}/v1/api/n8n/anonymous/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const n8nPayload = data?.data || data;
      const assistantReply =
        n8nPayload?.response ||
        n8nPayload?.message ||
        n8nPayload?.answer ||
        data?.message ||
        'Thanks for your message! Our team will follow up shortly.';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantReply,
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

  const handleClose = () => {
    setIsMinimized(true);
    onClose?.();
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
            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            padding: '16px 26px',
            cursor: 'pointer',
            boxShadow: '0 18px 36px rgba(79, 70, 229, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '12px',
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
      background: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)',
      borderRadius: '22px',
      boxShadow: '0 32px 60px rgba(15, 23, 42, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      border: '1px solid rgba(148, 163, 184, 0.35)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '22px 22px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', fontSize: '16px' }}>Chat Support</span>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>Live widget</span>
          </div>
        </div>
        <button
          onClick={handleClose}
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
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: 'rgba(255,255,255,0.85)',
      }}>
        {messages.length === 0 && (
          <div style={{
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            borderRadius: '18px',
            padding: '18px',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.25)',
            fontSize: '14px',
            lineHeight: 1.7,
          }}>
            <strong style={{ color: '#60a5fa' }}>Hello!</strong> Ask anything about your automation. Adjust the widget size to preview how it will appear on your site.
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
              background: message.role === 'user'
                ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                : '#f1f3f5',
              color: message.role === 'user' ? '#ffffff' : '#1f2937',
              fontSize: '14px',
              lineHeight: '1.5',
              wordWrap: 'break-word',
              boxShadow: message.role === 'user'
                ? '0 14px 28px rgba(37, 99, 235, 0.25)'
                : '0 8px 18px rgba(148, 163, 184, 0.18)',
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
              boxShadow: '0 8px 18px rgba(148, 163, 184, 0.18)',
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
        borderTop: '1px solid rgba(148, 163, 184, 0.3)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        backgroundColor: '#ffffff',
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
            border: '1px solid rgba(148, 163, 184, 0.35)',
            borderRadius: '24px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 24px',
            cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 14px 28px rgba(37, 99, 235, 0.28)',
            transition: 'transform 0.2s ease',
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


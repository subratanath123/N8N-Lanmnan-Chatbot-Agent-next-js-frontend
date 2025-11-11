"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

interface AssistantChatWindowProps {
  chatbotId: string;
  apiUrl: string;
  assistantName: string;
  assistantTitle?: string;
  assistantAvatar?: string;
  accentColor?: string;
  backgroundGradient?: string;
}

const DEFAULT_BACKGROUND = '#ffffff';
const DEFAULT_ACCENT = '#2563eb';

const AssistantChatWindow: React.FC<AssistantChatWindowProps> = ({
  chatbotId,
  apiUrl,
  assistantName,
  assistantTitle,
  assistantAvatar,
  accentColor = DEFAULT_ACCENT,
  backgroundGradient = DEFAULT_BACKGROUND,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'intro',
      role: 'assistant',
      content: `Hello! I'm ${assistantName.split(' ')[0]}. Ask me anything, and I'll do my best to help.`,
      createdAt: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionKey = useMemo(() => `chatbot_session_${chatbotId}`, [chatbotId]);

  const getSessionId = (): string => {
    try {
      let sessionId = localStorage.getItem(sessionKey);
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        localStorage.setItem(sessionKey, sessionId);
      }
      return sessionId;
    } catch {
      return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
  };

  const sessionIdRef = useRef<string>(getSessionId());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const payload = {
        role: 'user' as const,
        message: userMessage.content,
        attachments: [],
        sessionId: sessionIdRef.current,
        chatbotId,
      };

      const response = await fetch(`${apiUrl}/v1/api/n8n/anonymous/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const payloadData = data?.data || data;
      const assistantReply =
        payloadData?.response ||
        payloadData?.message ||
        payloadData?.answer ||
        data?.message ||
        `Thanks for the message! I'm ${assistantName} and I'm here to help.`;

      const assistantMessage: Message = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        content: assistantReply,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Assistant chat error:', error);
      const errorMessage: Message = {
        id: `${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again in a moment.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '28px',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.6)',
        boxShadow: '0 20px 32px rgba(15, 23, 42, 0.06)',
        background: backgroundGradient,
      }}
    >
      <header
        style={{
          padding: '28px 36px',
          background: '#f9fafb',
          color: '#0f172a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 18px 32px rgba(15, 23, 42, 0.12)',
              border: '2px solid rgba(226, 232, 240, 0.8)',
            }}
          >
            {assistantAvatar ? (
              <img
                src={assistantAvatar}
                alt={assistantName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '24px',
                  background: '#e2e8f0',
                  color: '#0f172a',
                }}
              >
                {assistantName
                  .split(' ')
                  .map((part) => part.charAt(0))
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>{assistantName}</h2>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(22, 163, 74, 0.12)',
                  color: '#15803d',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Online
              </span>
            </div>
            {assistantTitle && (
              <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '15px' }}>
                {assistantTitle}
              </p>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#64748b',
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
            <>
              Live conversation
              <span style={{ width: '6px', height: '6px', background: '#a5f3fc', borderRadius: '999px' }} />
            </>
        </div>
      </header>

      <div
        style={{
          flex: 1,
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          gap: '18px',
          overflowY: 'auto',
          background: '#f8fafc',
        }}
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '16px 20px',
                  borderRadius: isUser ? '20px 20px 8px 20px' : '20px 20px 20px 8px',
                  background: isUser ? `linear-gradient(135deg, ${accentColor}, #3b82f6)` : '#ffffff',
                  color: isUser ? '#ffffff' : '#1f2937',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  letterSpacing: '0.01em',
                  boxShadow: isUser
                    ? '0 16px 28px rgba(37, 99, 235, 0.2)'
                    : '0 16px 28px rgba(15, 23, 42, 0.05)',
                  whiteSpace: 'pre-wrap',
                  border: isUser ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#64748b',
              padding: '12px 16px',
              borderRadius: '18px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 10px 22px rgba(15, 23, 42, 0.05)',
            }}
          >
            <span className="typing-dot" />
            <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
            <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>

      <form
        onSubmit={handleSendMessage}
        style={{
        padding: '22px 30px',
        background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div
          style={{
            flex: 1,
            background: '#f8fafc',
            borderRadius: '999px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Type your message…"
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#1f2937',
              fontSize: '15px',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
          background: isLoading || !inputValue.trim() ? 'rgba(59, 130, 246, 0.28)' : `linear-gradient(135deg, ${accentColor}, #2563eb)`,
            color: '#f8fafc',
            border: 'none',
            borderRadius: '999px',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            boxShadow: isLoading || !inputValue.trim() ? 'none' : '0 16px 30px rgba(37, 99, 235, 0.18)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
            opacity: isLoading || !inputValue.trim() ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>

      <style jsx>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #94a3b8;
          animation: typingBounce 1.4s infinite ease-in-out both;
        }

        @keyframes typingBounce {
          0%,
          80%,
          100% {
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

export default AssistantChatWindow;


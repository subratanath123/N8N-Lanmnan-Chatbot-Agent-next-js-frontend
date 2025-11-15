"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

interface UserChatHistory {
  id: string;
  email: string;
  conversationid: string;
  userMessage: string;
  createdAt: string; // ISO string from Instant
  aiMessage: string;
  mode: string;
  isAnonymous: boolean;
}

interface AssistantChatWindowProps {
  chatbotId: string;
  apiUrl: string;
  assistantName: string;
  assistantTitle?: string;
  assistantAvatar?: string;
  accentColor?: string;
  backgroundGradient?: string;
  conversationId?: string; // Optional conversation ID to load history
  getToken?: () => Promise<string | null>; // Function to get bearer token for authenticated requests
  isSignedIn?: boolean; // Whether user is signed in
}

const DEFAULT_BACKGROUND = '#ffffff';
const DEFAULT_ACCENT = '#2563eb';

// Helper function to detect if content contains HTML
const containsHTML = (text: string): boolean => {
  if (!text) return false;
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(text);
};

const AssistantChatWindow: React.FC<AssistantChatWindowProps> = ({
  chatbotId,
  apiUrl,
  assistantName,
  assistantTitle,
  assistantAvatar,
  accentColor = DEFAULT_ACCENT,
  backgroundGradient = DEFAULT_BACKGROUND,
  conversationId,
  getToken,
  isSignedIn,
}) => {
  // Debug: Log props on mount
  useEffect(() => {
    console.log('AssistantChatWindow - Props received:', {
      isSignedIn,
      hasGetToken: !!getToken,
      conversationId,
      chatbotId,
    });
  }, [isSignedIn, getToken, conversationId, chatbotId]);

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadHistoryRef = useRef<string | null>(null);
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

  // Generate new sessionId when starting a new conversation, or use conversationId for existing ones
  useEffect(() => {
    if (!conversationId) {
      // New conversation - generate a new sessionId
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionIdRef.current = newSessionId;
      
      // Update localStorage for new conversations
      try {
        localStorage.setItem(sessionKey, newSessionId);
      } catch (error) {
        console.warn('Failed to update sessionId in localStorage:', error);
      }
      
      console.log('AssistantChatWindow - New conversation, generated new sessionId:', newSessionId);
    } else {
      // Existing conversation - use the conversationId as sessionId to maintain continuity
      sessionIdRef.current = conversationId;
      console.log('AssistantChatWindow - Using conversationId as sessionId:', conversationId);
    }
  }, [conversationId, sessionKey]);

  // Function to get chat history for a specific conversation
  const getChatHistory = async (conversationId: string): Promise<UserChatHistory[]> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Always try to get token if getToken function is available
      // The endpoint requires authentication, so we must have a token
      if (getToken) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('AssistantChatWindow getChatHistory - Authorization header added with token');
          } else {
            console.warn('AssistantChatWindow getChatHistory - getToken returned null/undefined');
          }
        } catch (error) {
          console.error('AssistantChatWindow getChatHistory - Failed to get auth token:', error);
          throw new Error('Authentication required but token could not be retrieved');
        }
      } else {
        console.warn('AssistantChatWindow getChatHistory - No getToken function provided, request may fail');
      }

      console.log('AssistantChatWindow getChatHistory - Request headers:', Object.keys(headers));
      const response = await fetch(`${apiUrl}/v1/api/n8n/authenticated/chatHistory/${chatbotId}/${conversationId}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserChatHistory[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  };

  // Function to load chat history and populate messages
  const loadChatHistory = async (conversationId: string) => {
    // Prevent duplicate calls for the same conversation
    if (loadHistoryRef.current === conversationId && isLoadingHistory) {
      console.log('loadChatHistory - Already loading this conversation, skipping duplicate call');
      return;
    }
    
    loadHistoryRef.current = conversationId;
    setIsLoadingHistory(true);
    try {
      const history = await getChatHistory(conversationId);
      
      // Convert UserChatHistory to Message format
      const loadedMessages: Message[] = [];
      
      history.forEach((item) => {
        // Add user message
        if (item.userMessage) {
          loadedMessages.push({
            id: `${item.id}_user`,
            role: 'user',
            content: item.userMessage,
            createdAt: new Date(item.createdAt),
          });
        }
        
        // Add AI message
        if (item.aiMessage) {
          loadedMessages.push({
            id: `${item.id}_ai`,
            role: 'assistant',
            content: item.aiMessage,
            createdAt: new Date(item.createdAt),
          });
        }
      });
      
      // Sort by createdAt to maintain chronological order
      loadedMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      // If we have loaded messages, replace the intro message
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
      if (loadHistoryRef.current === conversationId) {
        loadHistoryRef.current = null;
      }
    }
  };

  // Load chat history when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadChatHistory(conversationId);
    } else {
      // Reset to intro message if no conversationId
      setMessages([
        {
          id: 'intro',
          role: 'assistant',
          content: `Hello! I'm ${assistantName.split(' ')[0]}. Ask me anything, and I'll do my best to help.`,
          createdAt: new Date(),
        },
      ]);
      loadHistoryRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, chatbotId, apiUrl, assistantName]);

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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add bearer token if user is signed in
      if (isSignedIn && getToken) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch(`${apiUrl}/v1/api/n8n/authenticated/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        data = responseText;
      }
      
      // The response has nested JSON strings - need to parse twice
      // Response structure: { "output": "{\"output\":\"message\"}", "data": "{\"output\":\"message\"}", ... }
      let assistantReply: string = '';
      
      // Try to extract from various fields that might contain the JSON string
      const jsonString = 
        (typeof data.output === 'string' ? data.output : '') ||
        (typeof data.data === 'string' ? data.data : '') ||
        (typeof data.message === 'string' ? data.message : '') ||
        (typeof data.responseContent === 'string' ? data.responseContent : '') ||
        (typeof data.result === 'string' ? data.result : '') ||
        '';
      
      // If we found a JSON string, parse it to get the actual message
      if (jsonString && jsonString.trim().startsWith('{')) {
        try {
          const innerData = JSON.parse(jsonString);
          assistantReply = 
            (typeof innerData.output === 'string' ? innerData.output : '') ||
            (typeof innerData.response === 'string' ? innerData.response : '') ||
            (typeof innerData.message === 'string' ? innerData.message : '') ||
            (typeof innerData.answer === 'string' ? innerData.answer : '') ||
            '';
        } catch (e) {
          console.error('Failed to parse inner JSON:', e);
        }
      }
      
      // Fallback: try direct extraction if the structure is different
      if (!assistantReply && typeof data === 'object' && data !== null) {
        // Check if output/data/message are already the final strings (not JSON)
        assistantReply = 
          (typeof data.output === 'string' && !data.output.trim().startsWith('{') ? data.output : '') ||
          (typeof data.data === 'string' && !data.data.trim().startsWith('{') ? data.data : '') ||
          (typeof data.message === 'string' && !data.message.trim().startsWith('{') ? data.message : '') ||
          (typeof data.response === 'string' ? data.response : '') ||
          (typeof data.answer === 'string' ? data.answer : '') ||
          '';
      }

      // Ensure we have a valid string
      if (!assistantReply || typeof assistantReply !== 'string' || assistantReply.trim().length === 0) {
        assistantReply = `Thanks for the message! I'm ${assistantName} and I'm here to help.`;
      }

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
                className={containsHTML(message.content) ? 'chatbot-html-content' : ''}
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
                  whiteSpace: containsHTML(message.content) ? 'normal' : 'pre-wrap',
                  border: isUser ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                }}
                {...(containsHTML(message.content) ? {
                  dangerouslySetInnerHTML: { __html: message.content }
                } : {})}
              >
                {!containsHTML(message.content) && message.content}
              </div>
            </div>
          );
        })}

        {isLoadingHistory && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              color: '#64748b',
              padding: '12px 16px',
              borderRadius: '18px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 10px 22px rgba(15, 23, 42, 0.05)',
              fontSize: '14px',
            }}
          >
            <span className="typing-dot" />
            <span>Loading conversation...</span>
          </div>
        )}
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
        .chatbot-html-content h1, .chatbot-html-content h2, .chatbot-html-content h3 {
          margin: 0.5em 0;
          font-weight: 600;
          line-height: 1.3;
        }
        .chatbot-html-content h1 { font-size: 1.5em; }
        .chatbot-html-content h2 { font-size: 1.3em; }
        .chatbot-html-content h3 { font-size: 1.1em; }
        .chatbot-html-content ul, .chatbot-html-content ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .chatbot-html-content li {
          margin: 0.3em 0;
          line-height: 1.5;
        }
        .chatbot-html-content p {
          margin: 0.5em 0;
          line-height: 1.6;
        }
        .chatbot-html-content a {
          color: inherit;
          text-decoration: underline;
        }
        .chatbot-html-content code {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
        }
        .chatbot-html-content pre {
          background: rgba(0, 0, 0, 0.05);
          padding: 0.8em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .chatbot-html-content blockquote {
          border-left: 3px solid rgba(0, 0, 0, 0.2);
          padding-left: 1em;
          margin: 0.5em 0;
          font-style: italic;
        }
        .chatbot-html-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5em 0;
        }
        .chatbot-html-content th, .chatbot-html-content td {
          padding: 0.5em;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .chatbot-html-content th {
          background: rgba(0, 0, 0, 0.05);
          font-weight: 600;
        }
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


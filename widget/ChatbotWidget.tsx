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

interface ChatbotWidgetConfig {
  chatbotId: string;
  apiUrl: string;
  authToken?: string; // Optional bearer token for authenticated requests
  width?: number; // Optional widget width in pixels (default: 380)
  height?: number; // Optional widget height in pixels (default: 600)
}

interface ChatbotWidgetProps {
  config: ChatbotWidgetConfig;
  onClose?: () => void;
  startOpen?: boolean;
}

// Helper function to detect if content contains HTML
const containsHTML = (text: string): boolean => {
  if (!text) return false;
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(text);
};

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

  // Function to get conversation list (first chat from every conversation)
  const getConversationList = async (): Promise<UserChatHistory[]> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Determine endpoint based on whether token is provided
      const endpoint = config.authToken 
        ? `/v1/api/n8n/authenticated/chatHistory/${config.chatbotId}`
        : `/v1/api/n8n/anonymous/chatHistory/${config.chatbotId}`;

      // Add bearer token if provided
      if (config.authToken) {
        headers['Authorization'] = `Bearer ${config.authToken}`;
      }

      const response = await fetch(`${config.apiUrl}${endpoint}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserChatHistory[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversation list:', error);
      throw error;
    }
  };

  // Function to get chat history for a specific conversation
  const getChatHistory = async (conversationId: string): Promise<UserChatHistory[]> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Determine endpoint based on whether token is provided
      const endpoint = config.authToken 
        ? `/v1/api/n8n/authenticated/chatHistory/${config.chatbotId}/${conversationId}`
        : `/v1/api/n8n/anonymous/chatHistory/${config.chatbotId}/${conversationId}`;

      // Add bearer token if provided
      if (config.authToken) {
        headers['Authorization'] = `Bearer ${config.authToken}`;
      }

      const response = await fetch(`${config.apiUrl}${endpoint}`, {
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
    try {
      const history = await getChatHistory(conversationId);
      
      // Convert UserChatHistory to Message format
      const loadedMessages: Message[] = [];
      
      history.forEach((item) => {
        // Add user message
        if (item.userMessage) {
          loadedMessages.push({
            id: `${item.id}_user`,
            content: item.userMessage,
            role: 'user',
            createdAt: new Date(item.createdAt),
            sessionId: item.conversationid,
            chatbotId: config.chatbotId,
          });
        }
        
        // Add AI message
        if (item.aiMessage) {
          loadedMessages.push({
            id: `${item.id}_ai`,
            content: item.aiMessage,
            role: 'assistant',
            createdAt: new Date(item.createdAt),
            sessionId: item.conversationid,
            chatbotId: config.chatbotId,
          });
        }
      });
      
      // Sort by createdAt to maintain chronological order
      loadedMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
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

      // Determine endpoint and headers based on whether token is provided
      const endpoint = config.authToken 
        ? `/v1/api/n8n/authenticated/chat`
        : `/v1/api/n8n/anonymous/chat`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add bearer token if provided
      if (config.authToken) {
        headers['Authorization'] = `Bearer ${config.authToken}`;
      }

      const response = await fetch(`${config.apiUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
        assistantReply = 'Thanks for your message! Our team will follow up shortly.';
      }
      
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
    <>
      <style>{`
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
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: `${config.width || 380}px`,
        height: `${config.height || 600}px`,
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
            <div 
              className={containsHTML(message.content) ? 'chatbot-html-content' : ''}
              style={{
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
                whiteSpace: containsHTML(message.content) ? 'normal' : 'pre-wrap',
                boxShadow: message.role === 'user'
                  ? '0 14px 28px rgba(37, 99, 235, 0.25)'
                  : '0 8px 18px rgba(148, 163, 184, 0.18)',
              }}
              {...(containsHTML(message.content) ? {
                dangerouslySetInnerHTML: { __html: message.content }
              } : {})}
            >
              {!containsHTML(message.content) && message.content}
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
    </>
  );
};

export default ChatbotWidget;


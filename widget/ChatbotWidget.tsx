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
  id: string | null;
  email: string | null;
  conversationid: string;
  userMessage: string;
  createdAt: number | string; // Can be timestamp in seconds (number) or ISO string
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
  const [chatbotName, setChatbotName] = useState<string>('Chat Support');
  const [greetingMessage, setGreetingMessage] = useState<string>('');
  const [chatbotWidth, setChatbotWidth] = useState<number | undefined>(config.width);
  const [chatbotHeight, setChatbotHeight] = useState<number | undefined>(config.height);
  const [isLoadingChatbot, setIsLoadingChatbot] = useState(true);
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

  // Function to get chat history for a specific conversation
  const getChatHistory = async (conversationId: string): Promise<UserChatHistory[]> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use public endpoint for chat history
      const endpoint = `/v1/api/public/chatHistory/${config.chatbotId}/${conversationId}`;

      // Add bearer token if provided (optional for public endpoint)
      if (config.authToken) {
        headers['Authorization'] = `Bearer ${config.authToken}`;
      }

      const response = await fetch(`${config.apiUrl}${endpoint}`, {
        method: 'GET',
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
        // Handle timestamp in seconds (multiply by 1000 to convert to milliseconds)
        const createdAtTimestamp = typeof item.createdAt === 'number' 
          ? item.createdAt * 1000 
          : new Date(item.createdAt).getTime();
        const createdAtDate = new Date(createdAtTimestamp);
        
        // Add user message
        if (item.userMessage) {
          loadedMessages.push({
            id: `${item.id}_user`,
            content: item.userMessage,
            role: 'user',
            createdAt: createdAtDate,
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
            createdAt: createdAtDate,
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

  // Fetch chatbot details from server
  useEffect(() => {
    const fetchChatbotDetails = async () => {
      if (!config.chatbotId || !config.apiUrl) {
        setIsLoadingChatbot(false);
        return;
      }

      setIsLoadingChatbot(true);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Public endpoint doesn't require authentication, but include token if provided
        if (config.authToken) {
          headers['Authorization'] = `Bearer ${config.authToken}`;
        }

        const response = await fetch(`${config.apiUrl}/v1/api/public/chatbot/${config.chatbotId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          // If 404 or other error, keep default values
          if (response.status === 404) {
            console.warn(`Chatbot ${config.chatbotId} not found, using default values`);
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return;
        }

        const result = await response.json();
        // Handle different response formats: { data: {...} } or direct object
        const chatbotData = result.data || result;
        
        // Use name or title field for chatbot name
        if (chatbotData.name) {
          setChatbotName(chatbotData.name);
        } else if (chatbotData.title) {
          setChatbotName(chatbotData.title);
        }
        
        // Set greeting message if available
        if (chatbotData.greetingMessage) {
          setGreetingMessage(chatbotData.greetingMessage);
        }
        
        // Set width and height if available (use config as fallback)
        if (chatbotData.width !== undefined && chatbotData.width !== null) {
          setChatbotWidth(chatbotData.width);
        }
        if (chatbotData.height !== undefined && chatbotData.height !== null) {
          setChatbotHeight(chatbotData.height);
        }
      } catch (error) {
        console.error('Error fetching chatbot details:', error);
        // Keep default values on error - widget will still work with defaults
      } finally {
        setIsLoadingChatbot(false);
      }
    };

    fetchChatbotDetails();
  }, [config.chatbotId, config.apiUrl, config.authToken]);

  useEffect(() => {
    setIsMinimized(!(startOpen ?? false));
    setMessages([]);
    setInputValue('');
  }, [startOpen, config.chatbotId]);

  // Load chat history for current session on mount
  useEffect(() => {
    const loadSessionHistory = async () => {
      if (!config.chatbotId || !config.apiUrl || isLoadingChatbot) {
        return;
      }

      try {
        // Use the current sessionId from ref (which is stored in localStorage)
        const currentSessionId = sessionIdRef.current;
        
        // Load history for the current session
        if (currentSessionId) {
          await loadChatHistory(currentSessionId);
        }
      } catch (error) {
        console.error('Error loading session history:', error);
        // Don't show error to user, just continue with empty messages
        // If there's no history, the API might return 404 or empty array, which is fine
      }
    };

    // Load history after chatbot details are loaded
    if (!isLoadingChatbot) {
      loadSessionHistory();
    }
  }, [config.chatbotId, config.apiUrl, isLoadingChatbot]);

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
            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #10B981 100%)',
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
          <span>{chatbotName}</span>
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
        width: `${chatbotWidth || config.width || 380}px`,
        height: `${chatbotHeight || config.height || 600}px`,
        background: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '22px',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.35)',
      }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #10B981 100%)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '22px 22px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 600,
          }}>
            {chatbotName?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>{chatbotName}</div>
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
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'rgba(255,255,255,0.85)',
      }}>
        {messages.length === 0 && !isLoadingChatbot && (
          <div style={{
            backgroundColor: '#e0f2fe',
            color: '#0f172a',
            borderRadius: '18px',
            padding: '12px 16px',
            maxWidth: '80%',
            boxShadow: '0 8px 20px rgba(14, 116, 144, 0.18)',
            fontSize: '14px',
            lineHeight: 1.6,
            alignSelf: 'flex-start',
          }}>
            {greetingMessage ? (
              <div className={containsHTML(greetingMessage) ? 'chatbot-html-content' : ''}
                {...(containsHTML(greetingMessage) ? {
                  dangerouslySetInnerHTML: { __html: greetingMessage }
                } : {})}
              >
                {!containsHTML(greetingMessage) && greetingMessage}
              </div>
            ) : (
              <>
                <strong style={{ color: '#60a5fa' }}>Hello!</strong> Ask anything about your automation. Adjust the widget size to preview how it will appear on your site.
              </>
            )}
          </div>
        )}
        {messages.length === 0 && isLoadingChatbot && (
          <div style={{
            backgroundColor: '#e0f2fe',
            color: '#0f172a',
            borderRadius: '18px',
            padding: '12px 16px',
            maxWidth: '80%',
            boxShadow: '0 8px 20px rgba(14, 116, 144, 0.18)',
            fontSize: '14px',
            lineHeight: 1.6,
            textAlign: 'center',
            alignSelf: 'flex-start',
          }}>
            Loading...
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
                  : '#e0f2fe',
                color: message.role === 'user' ? '#ffffff' : '#0f172a',
                fontSize: '14px',
                lineHeight: '1.5',
                wordWrap: 'break-word',
                whiteSpace: containsHTML(message.content) ? 'normal' : 'pre-wrap',
                boxShadow: message.role === 'user'
                  ? '0 12px 24px rgba(37, 99, 235, 0.22)'
                  : '0 8px 20px rgba(14, 116, 144, 0.18)',
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
              backgroundColor: '#e0f2fe',
              display: 'flex',
              gap: '6px',
              boxShadow: '0 8px 20px rgba(14, 116, 144, 0.18)',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#0ea5e9',
                animation: 'bounce 1.4s infinite ease-in-out both',
              }}></span>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#0ea5e9',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0.2s',
              }}></span>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#0ea5e9',
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
        padding: '14px 18px',
        borderTop: '1px solid rgba(148, 163, 184, 0.25)',
        backgroundColor: '#f1f5f9',
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '8px 14px',
            boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.2)',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: '#0f172a',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            style={{
              background: isLoading || !inputValue.trim() 
                ? 'transparent' 
                : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            Send
          </button>
        </div>
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


"use client";
import React, {useEffect, useRef, useState} from 'react';
import sanitizeHtml from "sanitize-html";

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
  frontendUrl?: string; // Optional frontend URL for OAuth endpoints (defaults to window.location.origin)
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

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

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
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isCheckingGoogleAuth, setIsCheckingGoogleAuth] = useState(false);
  const [isAuthenticatingGoogle, setIsAuthenticatingGoogle] = useState(false);
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

  // Get frontend URL for OAuth endpoints
  const getFrontendUrl = () => {
    if (config.frontendUrl) {
      return config.frontendUrl;
    }
    // Try to detect from script source
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes('chat-widget.iife.js')) {
        try {
          const url = new URL(src);
          return url.origin;
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }
    // Fallback to current origin
    return typeof window !== 'undefined' ? window.location.origin : '';
  };

  // Check for existing Google OAuth tokens
  const checkGoogleAuth = async () => {
    setIsCheckingGoogleAuth(true);
    try {
      const frontendUrl = getFrontendUrl();
      const response = await fetch(
        `${frontendUrl}/api/google-oauth/get-tokens?sessionId=${encodeURIComponent(sessionIdRef.current)}&chatbotId=${encodeURIComponent(config.chatbotId)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasTokens) {
          // Check if token is expired
          const expiresAt = data.expiresAt || (data.expiresIn ? Date.now() + data.expiresIn * 1000 : null);
          if (expiresAt && Date.now() < expiresAt) {
            setGoogleTokens({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresAt: expiresAt,
            });
          } else if (data.refreshToken) {
            // Token expired, try to refresh
            await refreshGoogleToken(data.refreshToken);
          }
        }
      }
    } catch (error) {
      console.error('Error checking Google auth:', error);
    } finally {
      setIsCheckingGoogleAuth(false);
    }
  };

  // Refresh Google access token
  const refreshGoogleToken = async (refreshToken: string) => {
    try {
      const frontendUrl = getFrontendUrl();
      const response = await fetch(`${frontendUrl}/api/google-oauth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          chatbotId: config.chatbotId,
          refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGoogleTokens({
            accessToken: data.accessToken,
            refreshToken: refreshToken,
            expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing Google token:', error);
      setGoogleTokens(null);
    }
  };

  // Get Google OAuth URL (for direct link)
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string | null>(null);

  // Fetch auth URL on mount if not authenticated
  useEffect(() => {
    if (!googleTokens && !isCheckingGoogleAuth) {
      const fetchAuthUrl = async () => {
        try {
          const frontendUrl = getFrontendUrl();
          const response = await fetch(
            `${frontendUrl}/api/google-oauth/authorize?sessionId=${encodeURIComponent(sessionIdRef.current)}&chatbotId=${encodeURIComponent(config.chatbotId)}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.authUrl) {
              setGoogleAuthUrl(data.authUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching auth URL:', error);
        }
      };
      fetchAuthUrl();
    }
  }, [googleTokens, isCheckingGoogleAuth, config.chatbotId]);

  // Initiate Google OAuth flow
  const initiateGoogleAuth = async () => {
    setIsAuthenticatingGoogle(true);
    try {
      const frontendUrl = getFrontendUrl();
      const response = await fetch(
        `${frontendUrl}/api/google-oauth/authorize?sessionId=${encodeURIComponent(sessionIdRef.current)}&chatbotId=${encodeURIComponent(config.chatbotId)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.authUrl) {
          // Open OAuth in popup window
          const popup = window.open(
            data.authUrl,
            'Google OAuth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );

          // Listen for OAuth success
          const checkPopup = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkPopup);
              setIsAuthenticatingGoogle(false);
              // Check for tokens after popup closes
              setTimeout(() => {
                checkGoogleAuth();
              }, 1000);
            }
          }, 500);

          // Also listen for message from popup (if using postMessage)
          const messageHandler = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
              clearInterval(checkPopup);
              window.removeEventListener('message', messageHandler);
              setIsAuthenticatingGoogle(false);
              checkGoogleAuth();
            }
          };
          window.addEventListener('message', messageHandler);
        }
      }
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      setIsAuthenticatingGoogle(false);
    }
  };

  // Check for OAuth success on mount and URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth-success');
    const sessionIdParam = urlParams.get('sessionId');
    const chatbotIdParam = urlParams.get('chatbotId');

    if (oauthSuccess === 'true' && sessionIdParam === sessionIdRef.current && chatbotIdParam === config.chatbotId) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Check for tokens
      checkGoogleAuth();
    } else {
      // Check for existing tokens on mount
      checkGoogleAuth();
    }

    // Timeout to ensure button shows even if check takes too long or fails
    const timeout = setTimeout(() => {
      setIsCheckingGoogleAuth(false);
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [config.chatbotId]);

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
        // Include Google OAuth tokens if available
        googleTokens: googleTokens ? {
          accessToken: googleTokens.accessToken,
          refreshToken: googleTokens.refreshToken,
        } : undefined,
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

      // Add Google OAuth token header if available
      if (googleTokens?.accessToken) {
        headers['X-Google-Access-Token'] = googleTokens.accessToken;
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

  const MessageContent = ({ content }: { content: string }) => {
    const hasHTML = /<\/?[a-z][\s\S]*>/i.test(content);

    if (hasHTML) {
      const clean = sanitizeHtml(content, {
        allowedTags: [
          "p", "br", "strong", "em", "code", "pre",
          "ul", "ol", "li",
          "h1", "h2", "h3",
          "blockquote", "table", "thead", "tbody", "tr", "th", "td",
          "a"
        ],
        allowedAttributes: {
          a: ["href", "target", "rel"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
          a: sanitizeHtml.simpleTransform("a", {
            target: "_blank",
            rel: "noopener noreferrer",
          }),
        },
      });

      return (
          <div
              className="chatbot-html-content"
              dangerouslySetInnerHTML={{ __html: clean }}
          />
      );
    }

    return <span className="chatbot-text">{content}</span>;
  };

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
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: 18,
                    background:
                        message.role === 'user'
                            ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                            : '#e0f2fe',
                    color: message.role === 'user' ? '#fff' : '#0f172a',
                    boxShadow:
                        message.role === 'user'
                            ? '0 12px 24px rgba(37,99,235,0.22)'
                            : '0 8px 20px rgba(14,116,144,0.18)',
                  }}
              >
                <MessageContent content={message.content} />
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

      {/* Google OAuth Status */}
      {!googleTokens && !isCheckingGoogleAuth && (
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid rgba(148, 163, 184, 0.25)',
          backgroundColor: '#fff7ed',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '12px', color: '#9a3412', flex: 1 }}>
            Connect Google Calendar to create events
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={initiateGoogleAuth}
              disabled={isAuthenticatingGoogle}
              style={{
                background: isAuthenticatingGoogle 
                  ? '#cbd5e1' 
                  : 'linear-gradient(135deg, #ea4335, #c5221f)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '6px 12px',
                cursor: isAuthenticatingGoogle ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isAuthenticatingGoogle ? 0.6 : 1,
              }}
            >
              {isAuthenticatingGoogle ? 'Connecting...' : '🔗 Connect Google'}
            </button>
            {googleAuthUrl && (
              <a
                href={googleAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  // Also check for tokens after redirect
                  setTimeout(() => {
                    checkGoogleAuth();
                  }, 2000);
                }}
                style={{
                  fontSize: '11px',
                  color: '#ea4335',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Or open link directly
              </a>
            )}
          </div>
        </div>
      )}

      {googleTokens && (
        <div style={{
          padding: '8px 18px',
          borderTop: '1px solid rgba(148, 163, 184, 0.25)',
          backgroundColor: '#f0fdf4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <div style={{ fontSize: '11px', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ✓ Google Calendar connected
          </div>
          <button
            onClick={() => setGoogleTokens(null)}
            style={{
              background: 'transparent',
              color: '#166534',
              border: '1px solid #166534',
              borderRadius: '12px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500',
            }}
          >
            Disconnect
          </button>
        </div>
      )}

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


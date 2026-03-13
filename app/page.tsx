'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SignInButton } from '@clerk/nextjs';

interface LandingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    downloadUrl: string;
  }>;
}

interface Conversation {
  conversationId: string;
  sessionId: string;
  title: string;
  createdAt: number;
  messages: LandingMessage[];
}

const createSessionId = () =>
  `landing_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

const createConversationId = () =>
  `conv_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

const STORAGE_KEY = 'landing_conversations';
const CURRENT_CONV_KEY = 'landing_current_conversation';

const loadConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveConversations = (conversations: Conversation[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // ignore storage errors
  }
};

const loadCurrentConversationId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CURRENT_CONV_KEY);
  } catch {
    return null;
  }
};

const saveCurrentConversationId = (conversationId: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_CONV_KEY, conversationId);
  } catch {
    // ignore
  }
};

export default function HomePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [chatbotName, setChatbotName] = useState(
    process.env.NEXT_PUBLIC_CHATBOT_NAME || 'JadeAIBot'
  );
  const [greeting, setGreeting] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LandingMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        greeting ||
        `Hey, I'm your ${chatbotName} assistant. Ask me anything about AI chatbots, social media automation, or this platform.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    downloadUrl: string;
  }>>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = loadConversations();
    setConversations(stored);
    const currentId = loadCurrentConversationId();
    if (currentId && stored.find((c) => c.conversationId === currentId)) {
      setCurrentConversationId(currentId);
      const conv = stored.find((c) => c.conversationId === currentId);
      if (conv) {
        setMessages(conv.messages);
      }
    }
  }, []);

  // Persist current conversation whenever messages change
  useEffect(() => {
    if (!currentConversationId || conversations.length === 0) return;
    const updatedConversations = conversations.map((c) =>
      c.conversationId === currentConversationId
        ? { ...c, messages }
        : c
    );
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentConversationId]); // Intentionally excluding conversations to avoid infinite loop

  const sessionId = useMemo(() => {
    const conv = conversations.find((c) => c.conversationId === currentConversationId);
    return conv?.sessionId || createSessionId();
  }, [currentConversationId, conversations]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch chatbot meta using the same public endpoint the widget uses
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const landingChatbotId =
      process.env.NEXT_PUBLIC_LANDING_CHATBOT_ID || 'public-landing-chatbot';
    if (!backendUrl || !landingChatbotId) return;

    const fetchMeta = async () => {
      try {
        const res = await fetch(
          `${backendUrl}/v1/api/public/chatbot/${landingChatbotId}`
        );
        if (!res.ok) return;
        const result = await res.json();
        const data = result.data || result;
        if (data?.name || data?.title) {
          setChatbotName(data.name || data.title);
        }
        if (typeof data?.greetingMessage === 'string' && data.greetingMessage.trim()) {
          setGreeting(data.greetingMessage);
        }
      } catch {
        // ignore meta errors; UI falls back to defaults
      }
    };

    fetchMeta();
  }, []);

  const disabled = useMemo(() => sending || !input.trim(), [sending, input]);

  // Get file icon based on file type
  const getFileIcon = (mimeType: string): string => {
    const type = mimeType.toLowerCase();
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
    if (type.includes('text')) return '📄';
    return '📎';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachments(files);
      // Auto-upload files
      uploadFiles(files);
    }
  };

  // Upload files to backend
  const uploadFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;
    
    setIsUploadingFiles(true);
    const uploaded: typeof uploadedFiles = [];

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://subratapc.net';
      const landingChatbotId = process.env.NEXT_PUBLIC_LANDING_CHATBOT_ID || 'public-landing-chatbot';
      
      for (const file of filesToUpload) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chatbotId', landingChatbotId);
          formData.append('sessionId', sessionId);

          const response = await fetch(`${backendUrl}/api/attachments/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            console.error(`Failed to upload file ${file.name}`);
            continue;
          }

          const result = await response.json();
          uploaded.push({
            fileId: result.fileId,
            fileName: result.fileName,
            mimeType: result.mimeType,
            fileSize: result.fileSize,
            downloadUrl: result.downloadUrl,
          });
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
        }
      }

      setUploadedFiles(uploaded);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startNewConversation = () => {
    const newConvId = createConversationId();
    const newSessionId = createSessionId();
    const defaultGreeting: LandingMessage = {
      id: 'welcome',
      role: 'assistant',
      content:
        greeting ||
        `Hey, I'm your ${chatbotName} assistant. Ask me anything about AI chatbots, social media automation, or this platform.`,
    };
    const newConversation: Conversation = {
      conversationId: newConvId,
      sessionId: newSessionId,
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [defaultGreeting],
    };
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    setCurrentConversationId(newConvId);
    saveCurrentConversationId(newConvId);
    setMessages([defaultGreeting]);
  };

  const switchConversation = (conversationId: string) => {
    const conv = conversations.find((c) => c.conversationId === conversationId);
    if (conv) {
      setCurrentConversationId(conversationId);
      saveCurrentConversationId(conversationId);
      setMessages(conv.messages);
    }
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter((c) => c.conversationId !== conversationId);
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    if (currentConversationId === conversationId) {
      if (updatedConversations.length > 0) {
        switchConversation(updatedConversations[0].conversationId);
      } else {
        startNewConversation();
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // If no current conversation, create one
    if (!currentConversationId) {
      const newConvId = createConversationId();
      const newSessionId = createSessionId();
      const defaultGreeting: LandingMessage = {
        id: 'welcome',
        role: 'assistant',
        content:
          greeting ||
          `Hey, I'm your ${chatbotName} assistant. Ask me anything about AI chatbots, social media automation, or this platform.`,
      };
      const newConversation: Conversation = {
        conversationId: newConvId,
        sessionId: newSessionId,
        title: text.length > 40 ? `${text.slice(0, 40)}…` : text,
        createdAt: Date.now(),
        messages: [defaultGreeting],
      };
      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
      setCurrentConversationId(newConvId);
      saveCurrentConversationId(newConvId);
      setMessages([defaultGreeting]);
    } else {
      // Update conversation title from first user message if it's still "New Chat"
      const conv = conversations.find((c) => c.conversationId === currentConversationId);
      if (conv && conv.title === 'New Chat' && conv.messages.filter((m) => m.role === 'user').length === 0) {
        const updatedTitle = text.length > 40 ? `${text.slice(0, 40)}…` : text;
        const updatedConversations = conversations.map((c) =>
          c.conversationId === currentConversationId ? { ...c, title: updatedTitle } : c
        );
        setConversations(updatedConversations);
        saveConversations(updatedConversations);
      }
    }

    setSending(true);
    setInput('');
    const userMsg: LandingMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Clear attachments after sending
    const filesForRequest = uploadedFiles;
    setAttachments([]);
    setUploadedFiles([]);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error(
          'NEXT_PUBLIC_BACKEND_URL is not configured. Please set it in your env for the landing chatbot.'
        );
      }

      const payload: Record<string, unknown> = {
        role: 'user',
        message: text,
        sessionId,
      };

      // Add file attachments if any
      if (filesForRequest.length > 0) {
        payload.fileAttachments = filesForRequest.map((file) => ({
          fileId: file.fileId,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          downloadUrl: file.downloadUrl,
        }));
      }

      const res = await fetch(`${backendUrl}/v1/api/n8n/anonymous/chat/generic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data: any;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = rawText;
      }

      if (!res.ok || (data && data.success === false)) {
        throw new Error(
          (data && (data.errorMessage || data.message)) ||
            `Chat API error: ${res.status}`
        );
      }

      let reply: string =
        (data?.result && typeof data.result === 'object' && typeof data.result.response === 'string'
          ? data.result.response
          : '') ||
        (typeof data?.result === 'string' ? data.result : '') ||
        (typeof data?.output === 'string' ? data.output : '') ||
        (typeof data?.message === 'string' ? data.message : '') ||
        (typeof data?.response === 'string' ? data.response : '') ||
        (typeof data?.answer === 'string' ? data.answer : '') ||
        (typeof data?.responseContent === 'string' ? data.responseContent : '');

      // Handle nested JSON as string
      if (reply && reply.trim().startsWith('{')) {
        try {
          const inner = JSON.parse(reply);
          reply =
            (typeof inner.result === 'string' ? inner.result : '') ||
            (typeof inner.output === 'string' ? inner.output : '') ||
            (typeof inner.response === 'string' ? inner.response : '') ||
            (typeof inner.message === 'string' ? inner.message : '') ||
            (typeof inner.answer === 'string' ? inner.answer : '') ||
            '';
        } catch {
          // keep original reply
        }
      }

      if (!reply || typeof reply !== 'string' || !reply.trim()) {
        reply =
          'Thanks for your message! The landing assistant is online, but the backend did not return a detailed reply.';
      }

      const botMsg: LandingMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const botMsg: LandingMessage = {
        id: `e_${Date.now()}`,
        role: 'assistant',
        content:
          'I could not reach the chat service right now. Please check your connection or try again in a moment.',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded && !isSignedIn) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0b1120',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      </div>
    );
  }

  if (isSignedIn) {
    // brief placeholder while redirecting
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0b1120',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <p style={{ color: '#9ca3af' }}>Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ecfdf5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0f172a',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(209,213,219,0.9)',
          background:
            'linear-gradient(to right, #ffffff, #ecfdf5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/favicon.png"
            alt={chatbotName}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
            }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#065f46',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {chatbotName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SignInButton mode="modal" redirectUrl="/dashboard">
            <button
              type="button"
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(16,185,129,0.5)',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(37,99,235,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(37,99,235,0.25)';
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign In to Platform
            </button>
          </SignInButton>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          padding: '12px 20px 20px',
          gap: 0,
        }}
      >
        {/* Left sidebar - conversation list */}
        <aside
          style={{
            width: 260,
            minWidth: 240,
            backgroundColor: '#ffffff',
            borderRight: '1px solid rgba(209,213,219,0.9)',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#047857',
              }}
            >
              Conversations
            </h2>
            <button
              type="button"
              onClick={startNewConversation}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(16,185,129,0.5)',
                background: 'linear-gradient(135deg,#22c55e,#10b981)',
                color: '#ecfdf5',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
              }}
            >
              + New
            </button>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {conversations.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  lineHeight: 1.5,
                }}
              >
                Start your first conversation by sending a message on the right.
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.conversationId}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 10,
                    border:
                      conv.conversationId === currentConversationId
                        ? '2px solid #16a34a'
                        : '1px solid rgba(209,213,219,0.9)',
                    backgroundColor:
                      conv.conversationId === currentConversationId
                        ? '#ecfdf5'
                        : '#f9fafb',
                    fontSize: 13,
                    color: '#065f46',
                    marginBottom: 8,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onClick={() => switchConversation(conv.conversationId)}
                >
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {conv.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {new Date(conv.createdAt).toLocaleDateString()} •{' '}
                      {conv.messages.filter((m) => m.role === 'user').length} messages
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.conversationId);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(239,68,68,0.5)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#dc2626',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
          <div
            style={{
              paddingTop: 10,
              borderTop: '1px solid rgba(209,213,219,0.9)',
              marginTop: 10,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 4,
              }}
            >
              Try asking:
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: 12,
                color: '#047857',
              }}
            >
              <li>• "What can {chatbotName} build for me?"</li>
              <li>• "Explain the social media suite."</li>
              <li>• "How do I connect Facebook pages?"</li>
            </ul>
          </div>
        </aside>

        {/* Right - main chat panel */}
        <div
          style={{
            width: '100%',
            maxWidth: 1180,
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: 20,
            border: '1px solid rgba(209,213,219,0.9)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 24px',
              borderBottom: '1px solid rgba(209,213,219,0.9)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#064e3b',
                  letterSpacing: '0.08em',
                }}
              >
                {chatbotName.toUpperCase()}
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 13,
                  color: '#6b7280',
                }}
              >
                Ask anything about {chatbotName}, social media suite, or automation.
              </p>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: '16px 24px 80px',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 160px)',
              background:
                'linear-gradient(to bottom, #f9fafb, #ecfdf5)',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 10,
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                {m.role === 'assistant' && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                      <circle cx="12" cy="5" r="2" />
                      <path d="M12 7v4" />
                      <line x1="8" y1="16" x2="8" y2="16" />
                      <line x1="16" y1="16" x2="16" y2="16" />
                    </svg>
                  </div>
                )}
                {m.role === 'assistant' ? (
                  <div
                    className="assistant-message-content"
                    style={{
                      maxWidth: '720px',
                      padding: '10px 14px',
                      borderRadius: 16,
                      fontSize: 14,
                      lineHeight: 1.5,
                      backgroundColor: '#e5e7eb',
                      color: '#111827',
                      border: '1px solid rgba(209,213,219,0.9)',
                      backgroundImage: 'linear-gradient(to right, #f9fafb, #ecfdf5)',
                    }}
                    dangerouslySetInnerHTML={{ __html: m.content }}
                  />
                ) : (
                  <div>
                    <div
                      style={{
                        maxWidth: '720px',
                        padding: '10px 14px',
                        borderRadius: 16,
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        backgroundColor: '#16a34a',
                        color: '#ecfdf5',
                        border: '1px solid rgba(22,163,74,0.8)',
                        backgroundImage: 'linear-gradient(to right, #16a34a, #22c55e)',
                      }}
                    >
                      {m.content}
                    </div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div style={{ marginTop: 8, maxWidth: '720px' }}>
                        {m.attachments.map((file, idx) => {
                          const isImage = file.mimeType.startsWith('image/');
                          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://subratapc.net';
                          const downloadUrl = file.downloadUrl || `${backendUrl}/api/attachments/download/${file.fileId}`;
                          
                          return (
                            <div key={idx} style={{ marginBottom: 8 }}>
                              {isImage ? (
                                // Image preview with download link
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'block',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    maxWidth: '400px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  <img
                                    src={downloadUrl}
                                    alt={file.fileName}
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      maxHeight: '300px',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                  <div
                                    style={{
                                      padding: '8px 12px',
                                      backgroundColor: 'rgba(255,255,255,0.15)',
                                      fontSize: 12,
                                      color: '#ecfdf5',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    <span>📥</span>
                                    <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {file.fileName}
                                    </span>
                                    <span style={{ opacity: 0.8 }}>{formatFileSize(file.fileSize)}</span>
                                  </div>
                                </a>
                              ) : (
                                // File download link
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '12px 14px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    color: '#ecfdf5',
                                    textDecoration: 'none',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                  }}
                                >
                                  <span style={{ fontSize: 32 }}>{getFileIcon(file.mimeType)}</span>
                                  <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: 2 }}>
                                      {file.fileName}
                                    </div>
                                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                                      {formatFileSize(file.fileSize)} • Click to download
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 24 }}>📥</div>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '12px 24px 16px',
              borderTop: '1px solid rgba(209,213,219,0.9)',
              background:
                'linear-gradient(to top, #ffffff, #ecfdf5)',
            }}
          >
            {/* Attachment preview */}
            {(attachments.length > 0 || uploadedFiles.length > 0) && (
              <div style={{ marginBottom: 12 }}>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: 8,
                      marginBottom: 6,
                      border: '1px solid rgba(209,213,219,0.9)',
                    }}
                  >
                    {isUploadingFiles ? (
                      <div style={{ fontSize: 16 }}>⏳</div>
                    ) : (
                      <span style={{ fontSize: 18 }}>{getFileIcon(file.type)}</span>
                    )}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {formatFileSize(file.size)}
                        {isUploadingFiles && ' • Uploading...'}
                      </div>
                    </div>
                    {!isUploadingFiles && (
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid rgba(239,68,68,0.5)',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#dc2626',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFiles}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: '1px solid rgba(16,185,129,0.5)',
                  background: isUploadingFiles ? 'rgba(148,163,184,0.3)' : 'rgba(16,185,129,0.1)',
                  color: isUploadingFiles ? '#94a3b8' : '#10b981',
                  fontSize: 20,
                  cursor: isUploadingFiles ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Attach file"
              >
                📎
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your question here..."
                rows={2}
                style={{
                  flex: 1,
                  resize: 'none',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.9)',
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#0f172a',
                  backgroundColor: '#f9fafb',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!disabled) handleSend();
                  }
                }}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={handleSend}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: disabled
                    ? 'rgba(148,163,184,0.9)'
                    : 'linear-gradient(135deg,#22c55e,#2563eb)',
                  color: '#f9fafb',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  boxShadow: disabled
                    ? 'none'
                    : '0 10px 26px rgba(16,185,129,0.35)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {sending ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        animation: 'spin 1s linear infinite',
                      }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="60"
                        strokeDashoffset="20"
                        opacity="0.3"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="15 45"
                      />
                    </svg>
                    <span>AI is responding</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                    <span>Send</span>
                  </>
                )}
              </button>
              <style jsx>{`
                @keyframes spin {
                  from {
                    transform: rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}</style>
              <style jsx global>{`
                .assistant-message-content h1,
                .assistant-message-content h2,
                .assistant-message-content h3,
                .assistant-message-content h4 {
                  font-weight: 600;
                  margin-top: 1em;
                  margin-bottom: 0.5em;
                }
                .assistant-message-content h1 {
                  font-size: 1.5em;
                }
                .assistant-message-content h2 {
                  font-size: 1.3em;
                }
                .assistant-message-content h3 {
                  font-size: 1.1em;
                }
                .assistant-message-content p {
                  margin-bottom: 0.75em;
                }
                .assistant-message-content ul,
                .assistant-message-content ol {
                  margin-left: 1.5em;
                  margin-bottom: 0.75em;
                }
                .assistant-message-content li {
                  margin-bottom: 0.25em;
                }
                .assistant-message-content code {
                  background-color: rgba(0, 0, 0, 0.05);
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-family: 'Courier New', monospace;
                  font-size: 0.9em;
                }
                .assistant-message-content pre {
                  background-color: rgba(0, 0, 0, 0.05);
                  padding: 12px;
                  border-radius: 8px;
                  overflow-x: auto;
                  margin-bottom: 0.75em;
                }
                .assistant-message-content pre code {
                  background-color: transparent;
                  padding: 0;
                }
                .assistant-message-content a {
                  color: #16a34a;
                  text-decoration: underline;
                }
                .assistant-message-content a:hover {
                  color: #22c55e;
                }
                .assistant-message-content strong {
                  font-weight: 600;
                }
                .assistant-message-content em {
                  font-style: italic;
                }
                .assistant-message-content blockquote {
                  border-left: 3px solid #16a34a;
                  padding-left: 12px;
                  margin-left: 0;
                  margin-bottom: 0.75em;
                  color: #6b7280;
                }
                .assistant-message-content table {
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 0.75em;
                }
                .assistant-message-content th,
                .assistant-message-content td {
                  border: 1px solid #d1d5db;
                  padding: 8px;
                  text-align: left;
                }
                .assistant-message-content th {
                  background-color: rgba(0, 0, 0, 0.05);
                  font-weight: 600;
                }
              `}</style>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

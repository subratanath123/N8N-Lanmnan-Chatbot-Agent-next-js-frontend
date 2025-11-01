'use client';

import React, {useEffect, useRef, useState} from 'react';
import ChatMessage from '@/component/openwebui/ChatMessage';
import LoadingMessage from '@/component/openwebui/LoadingMessage';
import ChatInput from '@/component/openwebui/ChatInput';
import SettingsModal from '@/component/openwebui/SettingsModal';
import N8NSettings from '@/component/openwebui/N8NSettings';
import ClerkAuth from '@/component/openwebui/ClerkAuth';
import ChatHistory from '@/component/openwebui/ChatHistory';
import {
  availableModels,
  ChatSession,
  generateSessionId,
  getFileIcon,
  getSessionId,
  Message,
  Model,
  N8NConfig,
  N8NResponse,
  Attachment
} from '@/component/openwebui/types';
import {useAuth, useUser} from '@clerk/nextjs';
import '@/component/openwebui/styles.css';
import '@/component/openwebui/responsive.css';

export default function OpenWebUIPage() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. How can I help you today? I can help you with various tasks like writing, analysis, coding, and more. Feel free to ask me anything!',
      role: 'assistant',
      createdAt: new Date()
    }
  ]);
  const [selectedModel, setSelectedModel] = useState<Model>(availableModels[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [showSettings, setShowSettings] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isProcessingAttachments, setIsProcessingAttachments] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [n8nConfig, setN8nConfig] = useState<N8NConfig>({
    enabled: false,
    workflowId: '',
    webhookUrl: '',
    additionalParams: {}
  });
  const [showN8NSettings, setShowN8NSettings] = useState(false);
  
  // Clerk Authentication State
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [chatHistoryError, setChatHistoryError] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Utility function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix if present
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Utility function to convert multiple files to base64
  const convertFilesToBase64 = async (files: File[]): Promise<Attachment[]> => {
    const attachments: Attachment[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    
    for (const file of files) {
      try {
        // Check file size
        if (file.size > maxFileSize) {
          console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Skipping.`);
          continue;
        }
        
        const base64 = await convertFileToBase64(file);
        attachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          base64: base64
        });
      } catch (error) {
        console.error(`Failed to convert file ${file.name} to base64:`, error);
        // Continue with other files even if one fails
      }
    }
    
    return attachments;
  };

  // Initialize session ID and N8N config on component mount
  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    
    // Load N8N config from localStorage
    const savedN8NConfig = localStorage.getItem('openwebui_n8n_config');
    if (savedN8NConfig) {
      try {
        setN8nConfig(JSON.parse(savedN8NConfig));
      } catch (error) {
        console.error('Failed to load N8N config:', error);
      }
    }
  }, []);

  // Auto-load chat history when user signs in
  useEffect(() => {
    if (isSignedIn && isLoaded && user) {
      loadUserChatSessions(user.id);
    }
  }, [isSignedIn, isLoaded, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    // Function to upload file to backend first
  const uploadFileToBackend = async (file: File, message?: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workflowId', n8nConfig.workflowId || 'default-workflow');
      formData.append('webhookUrl', n8nConfig.webhookUrl || 'http://143.198.58.6:5678/webhook/beab6fcf-f27a-4d26-8923-5f95e8190fea');
      formData.append('sessionId', sessionId);
      
      // Add message if provided
      if (message) {
        formData.append('message', message);
      }

      // Prepare headers with authentication if user is signed in
      const headers: Record<string, string> = {};

      // Add bearer token if user is signed in
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch(`${backendUrl}/api/n8n/file-upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`File upload failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.errorMessage || 'File upload failed');
      }

      return data.fileId  || 'file_uploaded'; // Return file reference
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Function to make API call to get AI response
  const getAIResponse = async (userMessage: string, modelId: string, temp: number, systemPrompt: string, files: File[]): Promise<string> => {
    try {
      let fileIdList: string[] = [];

      // If there are files, upload them first
      if (files.length > 0) {
        console.log(`Uploading ${files.length} file(s) to backend...`);
        
        for (const file of files) {
          try {
            
            const fileId = await uploadFileToBackend(file, userMessage);
            fileIdList.push(fileId);
            console.log(`File ${file.name} uploaded successfully with fileId: ${fileId}`);

          } catch (error) {
            console.error(`Failed to upload file ${file.name}:`, error);
            throw new Error(`File upload failed: ${file.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Now send the message with file references
      const n8nRequestBody = {
        message: userMessage,
        workflowId: n8nConfig.workflowId || 'default-workflow',
        webhookUrl: n8nConfig.webhookUrl || 'http://143.198.58.6:5678/webhook/beab6fcf-f27a-4d26-8923-5f95e8190fea',
        sessionId: sessionId,
        fileReferences: fileReferences, // Send file references instead of base64
        additionalParams: {
          ...n8nConfig.additionalParams,
          temperature: temp,
          systemPrompt: systemPrompt,
          model: modelId
        }
      };

      // Prepare headers with authentication if user is signed in
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add bearer token if user is signed in
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch('/api/n8n', {
        method: 'POST',
        headers,
        body: JSON.stringify(n8nRequestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: N8NResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.errorMessage || 'N8N workflow failed');
      }

      // Extract response from N8N response format
      // Priority: responseContent > output > data
      const responseText = data.responseContent || data.output || data.data?.toString() || 'No response from N8N workflow';
      return responseText;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() && attachments.length === 0) return;

    // Clear any previous errors
    setError('');

    // Create message content with attachment
    let messageContent = inputValue.trim();
    if (attachments.length > 0) {
      const file = attachments[0]; // Only one attachment
      const sizeInMB = file.size / 1024 / 1024;
      const isLarge = sizeInMB > 10;
      // const status = isLarge ? '⚠️ File too large (>10MB)' : '✅ Ready for base64 conversion';
      const attachmentInfo = `${getFileIcon(file)} ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      messageContent = messageContent + (messageContent ? '\n\n' : '') + `📎 Attachment:\n${attachmentInfo}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]); // Clear attachments
    setShowAttachments(false); // Hide attachment preview
    setIsLoading(true);
    setIsProcessingAttachments(true);

    try {
      // Get AI response from API
      const aiResponse = await getAIResponse(
        messageContent,
        selectedModel.id,
        temperature,
        systemPrompt,
        attachments
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        createdAt: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsProcessingAttachments(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleNewChat = () => {
    setMessages([{
      id: Date.now().toString(),
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      role: 'assistant',
      createdAt: new Date()
    }]);
    setError(''); // Clear any errors
  };

  const handleNewSession = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    localStorage.setItem('openwebui_session_id', newSessionId);
    setMessages([{
      id: Date.now().toString(),
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      role: 'assistant',
      createdAt: new Date()
    }]);
    setError(''); // Clear any errors
  };

  const clearError = () => {
    setError('');
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleN8NConfigChange = (config: N8NConfig) => {
    setN8nConfig(config);
    localStorage.setItem('openwebui_n8n_config', JSON.stringify(config));
  };

  const handleN8NSettingsClose = () => {
    setShowN8NSettings(false);
  };

  // Clerk Authentication Functions
  const handleViewHistory = () => {
    if (isSignedIn && user) {
      loadUserChatSessions(user.id);
      setShowChatHistory(true);
    }
  };

  const loadUserChatSessions = async (userId: string) => {
    setLoadingChatHistory(true);
    setChatHistoryError('');
    
    try {
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
      }

      const response = await fetch('/api/chat-history?limit=50&offset=0', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.errorMessage || 'Failed to load chat history');
      }

      // Handle nested data structure - check if data.data exists and has data property
      const chatHistoryArray = data.data?.data || data.data || [];
      
      // Ensure we have an array to work with
      if (!Array.isArray(chatHistoryArray)) {
        console.warn('Chat history data is not an array:', chatHistoryArray);
        setChatSessions([]);
        return;
      }
      
      // Transform backend data to ChatSession format
      const sessions: ChatSession[] = chatHistoryArray.map((session: any) => {
        // Safely handle date fields - createdAt might be a Unix timestamp
        const createdAtValue = session.createdAt ? 
          (typeof session.createdAt === 'number' ? new Date(session.createdAt * 1000) : new Date(session.createdAt)) : 
          new Date();
        const updatedAt = session.updatedAt ? new Date(session.updatedAt) : createdAtValue;
        
        // Ensure dates are valid
        const safeCreatedAt = isNaN(createdAtValue.getTime()) ? new Date() : createdAtValue;
        const safeUpdatedAt = isNaN(updatedAt.getTime()) ? new Date() : updatedAt;

        // Create messages array from userMessage and aiMessage
        const messages: Message[] = [];
        if (session.userMessage) {
          messages.push({
            id: `${session.id}_user`,
            content: session.userMessage,
            role: 'user',
            createdAt: safeCreatedAt
          });
        }
        if (session.aiMessage) {
          messages.push({
            id: `${session.id}_ai`,
            content: session.aiMessage,
            role: 'assistant',
            createdAt: safeCreatedAt
          });
        }

        // Generate title from userMessage
        const title = session.title || 
                     (session.userMessage ? session.userMessage.substring(0, 50) + (session.userMessage.length > 50 ? '...' : '') : 'Untitled Chat');

        return {
          id: session.conversationid || session.sessionId || session.id,
          userId: session.email || session.userId,
          title: title,
          messages: messages,
          createdAt: safeCreatedAt,
          updatedAt: safeUpdatedAt,
          isAnonymous: session.anonymous || false
        };
      });
      
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setChatHistoryError(error instanceof Error ? error.message : 'Failed to load chat history');
    } finally {
      setLoadingChatHistory(false);
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setSessionId(session.id);
    setLoadingChatHistory(true);
    setChatHistoryError('');
    
    try {
      // Load full conversation messages from the specific endpoint
      await loadConversationMessages(session.id);
      setShowChatHistory(false);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      setChatHistoryError(error instanceof Error ? error.message : 'Failed to load conversation');
      // Fallback to using the preview messages from the session list
      setMessages(session.messages);
      setShowChatHistory(false);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (!isSignedIn) return;

    try {
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/chat-history/${conversationId}/messages`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation messages: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.errorMessage || 'Failed to load conversation messages');
      }

      // Handle the response data structure
      const responseData = data.data?.data || data.data || data.messages || [];
      
      // Ensure we have an array
      if (!Array.isArray(responseData)) {
        console.warn('Messages data is not an array:', responseData);
        throw new Error('Invalid messages format received');
      }

      // Transform the conversation records into individual messages
      const transformedMessages: Message[] = [];
      
      responseData.forEach((record: any, recordIndex: number) => {
        const createdAt = record.createdAt ? 
          (typeof record.createdAt === 'number' ? new Date(record.createdAt * 1000) : new Date(record.createdAt)) : 
          new Date();

        // Add user message if it exists
        if (record.userMessage) {
          transformedMessages.push({
            id: `${record.id}_user_${recordIndex}`,
            content: record.userMessage,
            role: 'user',
            createdAt: createdAt
          });
        }

        // Add AI message if it exists (with slightly later timestamp)
        if (record.aiMessage) {
          const aiTimestamp = new Date(createdAt.getTime() + 1000); // Add 1 second
          transformedMessages.push({
            id: `${record.id}_ai_${recordIndex}`,
            content: record.aiMessage,
            role: 'assistant',
            createdAt: aiTimestamp
          });
        }

        // Handle standard message format (fallback)
        if (record.content || record.message) {
          transformedMessages.push({
            id: record.id || `msg_${recordIndex}`,
            content: record.content || record.message || '',
            role: record.role || (record.sender === 'user' ? 'user' : 'assistant'),
            createdAt: createdAt
          });
        }
      });

      // Sort messages by creation time to ensure proper order
      transformedMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      setMessages(transformedMessages);
      
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      throw error;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 40px)',
        width: 'calc(100vw - 40px)',
        maxWidth: '1400px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        animation: 'fadeInUp 0.6s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          animation: 'slideDown 0.5s ease-out'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeInLeft 0.6s ease-out 0.2s both'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <img 
                src="/favicon.png" 
                alt="Lanmnan" 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              />
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Lanmnan
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            animation: 'fadeIn 0.6s ease-out 0.4s both'
          }}>
            <a href="#" style={{
              textDecoration: 'none',
              color: '#6c757d',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}>
              Features
            </a>
            <a href="#" style={{
              textDecoration: 'none',
              color: '#6c757d',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}>
              Pricing
            </a>
            {isSignedIn && (
              <a href="/dashboard" style={{
                textDecoration: 'none',
                color: '#007bff',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0056b3';
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#007bff';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                🏠 Dashboard
              </a>
            )}
            <a href="#" style={{
              textDecoration: 'none',
              color: '#6c757d',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}>
              Help
            </a>
          </div>

          {/* Session Info, Error Display, and Auth */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeInRight 0.6s ease-out 0.6s both'
          }}>
            {/* Session ID Display */}
            {/*{sessionId && (*/}
            {/*  <div style={{*/}
            {/*    display: 'flex',*/}
            {/*    alignItems: 'center',*/}
            {/*    gap: '8px',*/}
            {/*    padding: '6px 12px',*/}
            {/*    backgroundColor: '#f8f9fa',*/}
            {/*    border: '1px solid #e9ecef',*/}
            {/*    borderRadius: '8px',*/}
            {/*    fontSize: '12px',*/}
            {/*    color: '#6c757d',*/}
            {/*    fontFamily: 'monospace'*/}
            {/*  }}>*/}
            {/*    <span>🔑</span>*/}
            {/*    <span>Session: {sessionId.substring(0, 8)}...</span>*/}
            {/*  </div>*/}
            {/*)}*/}
            
            {/* Error Display */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#721c24'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
                <button
                  onClick={clearError}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#721c24',
                    fontSize: '12px',
                    padding: '2px',
                    marginLeft: '4px'
                  }}
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Clerk Authentication */}
            <ClerkAuth
              onViewHistory={handleViewHistory}
            />
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          animation: 'fadeIn 0.8s ease-out 0.8s both'
        }}>
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="responsive-sidebar-toggle"
            style={{
              display: 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          
          {/* Mobile Backdrop */}
          {!sidebarCollapsed && (
            <div 
              className="responsive-backdrop"
              onClick={() => setSidebarCollapsed(true)}
              style={{
                display: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999
              }}
            />
          )}
          
          {/* Sidebar */}
          <div 
            className={`responsive-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
            style={{ 
              width: sidebarCollapsed ? '60px' : '280px', 
              backgroundColor: '#fafbfc', 
              borderRight: '1px solid #e9ecef',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
              animation: 'slideInLeft 0.6s ease-out 1s both',
              transition: 'width 0.3s ease'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between'
            }}>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#6c757d',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#333';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6c757d';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
              )}
            </div>
            
            {/* Search */}
            {!sidebarCollapsed && (
              <div style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  color: '#6c757d',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}>
                  <span>🔍</span>
                  <span style={{ fontSize: '14px' }}>Search</span>
                </div>
              </div>
            )}
            
            {/* Navigation */}
            {!sidebarCollapsed && (
              <div style={{ padding: '0 16px', flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleNewChat}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }}>
                  <span>💬</span>
                  <span style={{ fontSize: '14px', color: '#333' }}>New Chat</span>
                </div>
                
                {/* New Session - Only for authenticated users */}
                {isSignedIn && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    border: '1px solid #e9ecef',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={handleNewSession}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}>
                    <span>🔄</span>
                    <span style={{ fontSize: '14px', color: '#333' }}>New Session</span>
                  </div>
                )}

                {/* Dashboard - Only for authenticated users */}
                {isSignedIn && (
                  <a href="/dashboard" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    border: '1px solid #dee2e6',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}>
                    <span>🏠</span>
                    <span style={{ fontSize: '14px', color: '#007bff', fontWeight: '500' }}>Dashboard</span>
                  </a>
                )}
                
                {/* Memory - Only for authenticated users */}
                {/*{isSignedIn && (*/}
                {/*  <div style={{*/}
                {/*    display: 'flex',*/}
                {/*    alignItems: 'center',*/}
                {/*    gap: '8px',*/}
                {/*    padding: '10px 14px',*/}
                {/*    backgroundColor: 'white',*/}
                {/*    borderRadius: '10px',*/}
                {/*    marginBottom: '8px',*/}
                {/*    cursor: 'pointer',*/}
                {/*    border: '1px solid #e9ecef',*/}
                {/*    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',*/}
                {/*    transition: 'all 0.2s ease'*/}
                {/*  }}*/}
                {/*  onMouseEnter={(e) => {*/}
                {/*    e.currentTarget.style.transform = 'translateY(-1px)';*/}
                {/*    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';*/}
                {/*  }}*/}
                {/*  onMouseLeave={(e) => {*/}
                {/*    e.currentTarget.style.transform = 'translateY(0)';*/}
                {/*    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';*/}
                {/*  }}>*/}
                {/*    <span>🧠</span>*/}
                {/*    <span style={{ fontSize: '14px', color: '#333' }}>Memory</span>*/}
                {/*  </div>*/}
                {/*)}*/}
                
                {/*<div style={{*/}
                {/*  display: 'flex',*/}
                {/*  alignItems: 'center',*/}
                {/*  gap: '8px',*/}
                {/*  padding: '10px 14px',*/}
                {/*  backgroundColor: '#f8f9fa',*/}
                {/*  borderRadius: '10px',*/}
                {/*  cursor: 'pointer',*/}
                {/*  border: '1px solid #dee2e6',*/}
                {/*  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',*/}
                {/*  transition: 'all 0.2s ease'*/}
                {/*}}*/}
                {/*onMouseEnter={(e) => {*/}
                {/*  e.currentTarget.style.transform = 'translateY(-1px)';*/}
                {/*  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';*/}
                {/*}}*/}
                {/*onMouseLeave={(e) => {*/}
                {/*  e.currentTarget.style.transform = 'translateY(0)';*/}
                {/*  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';*/}
                {/*}}>*/}
                {/*  <span>🔍</span>*/}
                {/*  <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>Search</span>*/}
                {/*</div>*/}

                {/* Chat History Section */}
                {isSignedIn && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingLeft: '4px'
                    }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Recent Chats
                      </span>
                      <button
                        onClick={() => loadUserChatSessions(user?.id || '')}
                        disabled={loadingChatHistory}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: loadingChatHistory ? 'not-allowed' : 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          color: '#6c757d',
                          fontSize: '12px',
                          opacity: loadingChatHistory ? 0.5 : 1
                        }}
                      >
                        {loadingChatHistory ? '⟳' : '↻'}
                      </button>
                    </div>

                    {/* Loading State */}
                    {loadingChatHistory && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        color: '#6c757d',
                        fontSize: '12px'
                      }}>
                        <span>Loading chat history...</span>
                      </div>
                    )}

                    {/* Error State */}
                    {chatHistoryError && !loadingChatHistory && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#721c24',
                        marginBottom: '8px'
                      }}>
                        {chatHistoryError}
                      </div>
                    )}

                    {/* Chat History List */}
                    {!loadingChatHistory && !chatHistoryError && (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {chatSessions.length === 0 ? (
                          <div style={{
                            padding: '20px 8px',
                            textAlign: 'center',
                            color: '#6c757d',
                            fontSize: '12px'
                          }}>
                            No chat history found
                          </div>
                        ) : (
                          chatSessions.map((session) => (
                            <div
                              key={session.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: session.id === currentSessionId ? '#e3f2fd' : 'white',
                                border: session.id === currentSessionId ? '1px solid #2196f3' : '1px solid #e9ecef',
                                borderRadius: '8px',
                                marginBottom: '6px',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                              }}
                              onMouseEnter={(e) => {
                                if (session.id !== currentSessionId) {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (session.id !== currentSessionId) {
                                  e.currentTarget.style.backgroundColor = 'white';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                }
                              }}
                            >
                              <div
                                onClick={() => handleSelectSession(session)}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#333',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {session.title}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  color: '#6c757d',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <span>💬</span>
                                  <span>
                                    {session.updatedAt ? 
                                      new Date(session.updatedAt).toLocaleDateString() : 
                                      'Recent'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Settings */}
            {!sidebarCollapsed ? (
              <div style={{ padding: '16px', borderTop: '1px solid #e9ecef', backgroundColor: 'white' }}>
                <button 
                  onClick={() => setShowSettings(true)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'white',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#6c757d',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
                
                {/*<button */}
                {/*  onClick={() => setShowN8NSettings(true)}*/}
                {/*  style={{*/}
                {/*    width: '100%',*/}
                {/*    padding: '10px 14px',*/}
                {/*    backgroundColor: n8nConfig.enabled ? '#e3f2fd' : 'white',*/}
                {/*    border: n8nConfig.enabled ? '1px solid #2196f3' : '1px solid #e9ecef',*/}
                {/*    borderRadius: '10px',*/}
                {/*    cursor: 'pointer',*/}
                {/*    display: 'flex',*/}
                {/*    alignItems: 'center',*/}
                {/*    gap: '8px',*/}
                {/*    fontSize: '14px',*/}
                {/*    color: n8nConfig.enabled ? '#1976d2' : '#6c757d',*/}
                {/*    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',*/}
                {/*    transition: 'all 0.2s ease'*/}
                {/*  }}*/}
                {/*  onMouseEnter={(e) => {*/}
                {/*    e.currentTarget.style.transform = 'translateY(-1px)';*/}
                {/*    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';*/}
                {/*  }}*/}
                {/*  onMouseLeave={(e) => {*/}
                {/*    e.currentTarget.style.transform = 'translateY(0)';*/}
                {/*    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';*/}
                {/*  }}*/}
                {/*>*/}
                {/*  <span>🔗</span>*/}
                {/*  <span>N8N Workflow {n8nConfig.enabled && '✓'}</span>*/}
                {/*</button>*/}
              </div>
            ) : (
              <div style={{ 
                padding: '16px', 
                borderTop: sidebarCollapsed ? 'none' : '1px solid #e9ecef', 
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#6c757d',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#333';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6c757d';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div 
            className="responsive-chat-area"
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: 'white',
              boxShadow: 'inset 1px 0 3px rgba(0, 0, 0, 0.02)',
              animation: 'slideInRight 0.6s ease-out 1.2s both'
            }}
          >
            {/* Model Indicator */}
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#6c757d'
            }}>
              {/*<span>🔗</span>*/}
              <span style={{ color: '#2196f3', fontWeight: '500' }}>
                Lanmnan AI
              </span>
              <span>•</span>
              <span>
                {isSignedIn ? 'GPT-5' : 'GPT-4o-mini'}
              </span>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              animation: 'fadeIn 0.8s ease-out 1.4s both'
            }}>
              {loadingChatHistory && messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  <span>Loading conversation...</span>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                    copyToClipboard={copyToClipboard}
                  />
                ))
              )}
              
              {isLoading && <LoadingMessage />}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
              attachments={attachments}
              setAttachments={setAttachments}
              showAttachments={showAttachments}
              setShowAttachments={setShowAttachments}
              getFileIcon={getFileIcon}
              removeAttachment={removeAttachment}
              isProcessingAttachments={isProcessingAttachments}
            />
          </div>
        </div>

        {/* Settings Modal */}
        <SettingsModal
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          temperature={temperature}
          setTemperature={setTemperature}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          availableModels={availableModels}
        />

        {/* N8N Settings Modal */}
        <N8NSettings
          config={n8nConfig}
          onConfigChange={handleN8NConfigChange}
          onClose={handleN8NSettingsClose}
          isVisible={showN8NSettings}
        />

        {/* Chat History Modal */}
        <ChatHistory
          sessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onClose={() => setShowChatHistory(false)}
          isVisible={showChatHistory}
        />
      </div>
    </div>
  );
} 
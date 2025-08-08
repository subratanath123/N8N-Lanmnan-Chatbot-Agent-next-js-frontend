'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from '../../src/component/openwebui/ChatMessage';
import LoadingMessage from '../../src/component/openwebui/LoadingMessage';
import ChatInput from '../../src/component/openwebui/ChatInput';
import SettingsModal from '../../src/component/openwebui/SettingsModal';
import N8NSettings from '../../src/component/openwebui/N8NSettings';
import ClerkAuth from '../../src/component/openwebui/ClerkAuth';
import ChatHistory from '../../src/component/openwebui/ChatHistory';
import { 
  Message, 
  Model, 
  ApiResponse, 
  N8NConfig,
  N8NResponse,
  ChatSession,
  User,
  availableModels, 
  generateSessionId, 
  getSessionId, 
  getFileIcon 
} from '../../src/component/openwebui/types';
import { useUser, useAuth } from '@clerk/nextjs';
import '../../src/component/openwebui/styles.css';

export default function OpenWebUIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. How can I help you today? I can help you with various tasks like writing, analysis, coding, and more. Feel free to ask me anything!',
      role: 'assistant',
      timestamp: new Date()
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to make API call to get AI response
  const getAIResponse = async (userMessage: string, modelId: string, temp: number, systemPrompt: string): Promise<string> => {
    try {
      // Always use N8N API for openwebui
      const n8nRequestBody = {
        message: userMessage,
        workflowId: n8nConfig.workflowId || 'default-workflow',
        webhookUrl: n8nConfig.webhookUrl || 'http://localhost:5678/webhook/beab6fcf-f27a-4d26-8923-5f95e8190fea',
        sessionId: sessionId,
        additionalParams: {
          ...n8nConfig.additionalParams,
          temperature: temp,
          systemPrompt: systemPrompt,
          model: modelId,
          attachments: attachments.length > 0 ? attachments.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })) : []
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

    // Create message content with attachments
    let messageContent = inputValue.trim();
    if (attachments.length > 0) {
      const attachmentList = attachments.map(file => 
        `${getFileIcon(file)} ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      ).join('\n');
      messageContent = messageContent + (messageContent ? '\n\n' : '') + `📎 Attachments:\n${attachmentList}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]); // Clear attachments
    setShowAttachments(false); // Hide attachment preview
    setIsLoading(true);

    try {
      // Get AI response from API
      const aiResponse = await getAIResponse(
        messageContent,
        selectedModel.id,
        temperature,
        systemPrompt
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save session for logged-in users
      if (isSignedIn && user) {
        await saveCurrentSession();
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      timestamp: new Date()
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
      timestamp: new Date()
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
    try {
      // This would fetch from your backend API
      // For now, we'll simulate loading sessions
      const mockSessions: ChatSession[] = [
        {
          id: 'session_1',
          userId: userId,
          title: 'Previous Chat Session',
          messages: [
            {
              id: '1',
              content: 'Hello! How can I help you?',
              role: 'assistant',
              timestamp: new Date(Date.now() - 86400000) // 1 day ago
            },
            {
              id: '2',
              content: 'I need help with my project',
              role: 'user',
              timestamp: new Date(Date.now() - 86400000)
            }
          ],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
          isAnonymous: false
        }
      ];
      
      setChatSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setSessionId(session.id);
    setMessages(session.messages);
    setShowChatHistory(false);
  };

  const saveCurrentSession = async () => {
    if (!isSignedIn || !user) return; // Only save for logged-in users
    
    const currentSession: ChatSession = {
      id: currentSessionId || sessionId,
      userId: user.id,
      title: messages.length > 1 ? messages[1].content.substring(0, 50) + '...' : 'New Chat',
      messages: messages,
      createdAt: new Date(),
      updatedAt: new Date(),
      isAnonymous: false
    };

    try {
      // This would save to your backend API
      // For now, we'll update local state
      setChatSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === currentSession.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = currentSession;
          return updated;
        } else {
          return [...prev, currentSession];
        }
      });
    } catch (error) {
      console.error('Failed to save session:', error);
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
              width: '32px',
              height: '32px',
              backgroundColor: '#ffd700',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              AI
            </div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#333',
              margin: 0
            }}>
              Lanmnan
            </h1>
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
            {sessionId && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#6c757d',
                fontFamily: 'monospace'
              }}>
                <span>🔑</span>
                <span>Session: {sessionId.substring(0, 8)}...</span>
              </div>
            )}
            
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
          {/* Sidebar */}
          <div style={{ 
            width: sidebarCollapsed ? '60px' : '280px', 
            backgroundColor: '#fafbfc', 
            borderRight: '1px solid #e9ecef',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
            animation: 'slideInLeft 0.6s ease-out 1s both',
            transition: 'width 0.3s ease'
          }}>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }}>
                  <span>🧠</span>
                  <span style={{ fontSize: '14px', color: '#333' }}>Memory</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
                }}>
                  <span>🔍</span>
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>Search</span>
                </div>
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
                
                <button 
                  onClick={() => setShowN8NSettings(true)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: n8nConfig.enabled ? '#e3f2fd' : 'white',
                    border: n8nConfig.enabled ? '1px solid #2196f3' : '1px solid #e9ecef',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: n8nConfig.enabled ? '#1976d2' : '#6c757d',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
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
                  <span>🔗</span>
                  <span>N8N Workflow {n8nConfig.enabled && '✓'}</span>
                </button>
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
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: 'white',
            boxShadow: 'inset 1px 0 3px rgba(0, 0, 0, 0.02)',
            animation: 'slideInRight 0.6s ease-out 1.2s both'
          }}>
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
              <span>🔗</span>
              <span style={{ color: '#2196f3', fontWeight: '500' }}>
                N8N Workflow: {n8nConfig.workflowId || 'default-workflow'}
              </span>
              <span>•</span>
              <span>{selectedModel.name} ({selectedModel.provider})</span>
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
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  index={index}
                  copyToClipboard={copyToClipboard}
                />
              ))}
              
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
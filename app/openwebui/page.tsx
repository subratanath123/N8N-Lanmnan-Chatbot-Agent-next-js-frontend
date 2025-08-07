'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Model {
  id: string;
  name: string;
  provider: string;
}

const availableModels: Model[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'llama-2', name: 'Llama 2', provider: 'Meta' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() && attachments.length === 0) return;

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

    // Simulate AI response with different responses based on the model
    setTimeout(() => {
      const responses = {
        'gpt-4': `I understand you said: "${userMessage.content}". As GPT-4, I can provide detailed and nuanced responses. This is a simulated response, but in a real implementation, this would connect to the OpenAI API.`,
        'gpt-3.5-turbo': `You mentioned: "${userMessage.content}". As GPT-3.5 Turbo, I can help with a wide range of tasks efficiently. This is a simulated response for demonstration purposes.`,
        'claude-3': `Regarding "${userMessage.content}": As Claude 3, I aim to be helpful, harmless, and honest. This is a simulated response showing how the interface would work with different models.`,
        'llama-2': `You asked about: "${userMessage.content}". As Llama 2, I can assist with various tasks. This is a simulated response demonstrating the multi-model interface.`,
        'gemini-pro': `About "${userMessage.content}": As Gemini Pro, I can help with creative and analytical tasks. This is a simulated response showing the interface capabilities.`
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[selectedModel.id as keyof typeof responses] || responses['gpt-4'],
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
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
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    setShowAttachments(true);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('document') || file.type.includes('text')) return '📝';
    if (file.type.includes('video')) return '🎥';
    if (file.type.includes('audio')) return '🎵';
    return '📎';
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

          {/* Auth Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeInRight 0.6s ease-out 0.6s both'
          }}>
            <button style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              color: '#333',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.borderColor = '#dee2e6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#e9ecef';
            }}>
              Log in
            </button>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3';
              e.currentTarget.style.borderColor = '#0056b3';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff';
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
            }}>
              Sign up
            </button>
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
            <span>⚙️</span>
            <span>Settings</span>
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
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '16px',
                  animation: `slideIn${message.role === 'user' ? 'Right' : 'Left'} 0.5s ease-out ${1.6 + index * 0.1}s both`
                }}
              >
                             <div style={{
                 maxWidth: '85%',
                 padding: '14px 18px',
                 borderRadius: '16px',
                 backgroundColor: message.role === 'user' ? '#007bff' : '#f8f9fa',
                 color: message.role === 'user' ? 'white' : '#333',
                 position: 'relative',
                 boxShadow: message.role === 'user' 
                   ? '0 4px 12px rgba(0, 123, 255, 0.2)' 
                   : '0 2px 8px rgba(0, 0, 0, 0.06)',
                 border: message.role === 'user' 
                   ? 'none' 
                   : '1px solid rgba(0, 0, 0, 0.05)'
               }}>
                {message.role === 'assistant' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#ffd700',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(255, 215, 0, 0.3)'
                    }}>
                      AI
                    </div>
                                         <span style={{ 
                       fontWeight: '600', 
                       color: '#ffd700',
                       fontSize: '14px'
                     }}>
                       Lanmnan
                     </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#6c757d',
                      backgroundColor: '#e9ecef',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Thinking process
                    </span>
                  </div>
                )}
                
                <div style={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5',
                  marginBottom: '8px'
                }}>
                  {message.content}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  opacity: 0.7
                }}>
                  <span>{message.timestamp.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        opacity: 0.7,
                        color: 'inherit'
                      }}
                    >
                      📋 Copy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '16px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '14px 18px',
                borderRadius: '16px',
                backgroundColor: '#f8f9fa',
                color: '#333',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#ffd700',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(255, 215, 0, 0.3)'
                  }}>
                    AI
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#6c757d',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#6c757d',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.1s'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#6c757d',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.2s'
                    }}></div>
                    <span style={{ 
                      marginLeft: '8px',
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

                 {/* Input Area */}
         <div style={{ 
           padding: '20px', 
           borderTop: '1px solid #e9ecef',
           backgroundColor: 'white',
           boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
           animation: 'slideInUp 0.6s ease-out 1.8s both'
         }}>
           {/* Hidden file input */}
           <input
             ref={fileInputRef}
             type="file"
             multiple
             onChange={handleFileUpload}
             style={{ display: 'none' }}
           />
           
           {/* Attachments Preview */}
           {showAttachments && attachments.length > 0 && (
             <div style={{
               marginBottom: '12px',
               padding: '12px',
               backgroundColor: '#f8f9fa',
               borderRadius: '12px',
               border: '1px solid #e9ecef'
             }}>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 marginBottom: '8px',
                 fontSize: '14px',
                 fontWeight: '500',
                 color: '#333'
               }}>
                 📎 Attachments ({attachments.length})
               </div>
               <div style={{
                 display: 'flex',
                 flexWrap: 'wrap',
                 gap: '8px'
               }}>
                 {attachments.map((file, index) => (
                   <div key={index} style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px',
                     padding: '6px 10px',
                     backgroundColor: 'white',
                     borderRadius: '8px',
                     border: '1px solid #dee2e6',
                     fontSize: '12px'
                   }}>
                     <span>{getFileIcon(file)}</span>
                     <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                       {file.name}
                     </span>
                     <button
                       onClick={() => removeAttachment(index)}
                       style={{
                         background: 'none',
                         border: 'none',
                         cursor: 'pointer',
                         color: '#dc3545',
                         fontSize: '12px',
                         padding: '2px'
                       }}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
             </div>
           )}
          <form onSubmit={handleSendMessage} style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#6c757d',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                height: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#dee2e6';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.color = '#6c757d';
              }}
            >
              📎
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
                             <textarea
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 placeholder="Message Lanmnan..."
                 style={{
                   width: '100%',
                   padding: '14px 18px',
                   border: '1px solid #e9ecef',
                   borderRadius: '16px',
                   resize: 'none',
                   fontSize: '14px',
                   fontFamily: 'inherit',
                   minHeight: '44px',
                   maxHeight: '120px',
                   outline: 'none',
                   boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                   transition: 'all 0.2s ease'
                 }}
                rows={1}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e as any);
                  }
                }}
              />
            </div>
                         <button
               type="submit"
               disabled={!inputValue.trim() || isLoading}
               style={{
                 padding: '14px 18px',
                 backgroundColor: '#007bff',
                 color: 'white',
                 border: 'none',
                 borderRadius: '16px',
                 cursor: 'pointer',
                 fontSize: '16px',
                 opacity: (!inputValue.trim() || isLoading) ? 0.5 : 1,
                 transition: 'all 0.2s ease',
                 boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
               }}
               onMouseEnter={(e) => {
                 if (!e.currentTarget.disabled) {
                   e.currentTarget.style.transform = 'translateY(-1px)';
                   e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
                 }
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
               }}
             >
              ➤
            </button>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
                     <div style={{
             backgroundColor: 'white',
             borderRadius: '16px',
             padding: '24px',
             width: '400px',
             maxWidth: '90vw',
             boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
             border: '1px solid rgba(0, 0, 0, 0.05)'
           }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '8px' 
              }}>
                Default Model
              </label>
              <select 
                value={selectedModel.id}
                onChange={(e) => {
                  const model = availableModels.find(m => m.id === e.target.value);
                  if (model) setSelectedModel(model);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '8px' 
              }}>
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '12px', 
                color: '#6c757d',
                marginTop: '4px'
              }}>
                <span>Focused</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '8px' 
              }}>
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

               </div>
       </div>
       <style jsx>{`
         @keyframes bounce {
           0%, 80%, 100% {
             transform: scale(0);
           }
           40% {
             transform: scale(1);
           }
         }

         @keyframes fadeInUp {
           from {
             opacity: 0;
             transform: translateY(30px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }

         @keyframes slideDown {
           from {
             opacity: 0;
             transform: translateY(-20px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }

         @keyframes fadeInLeft {
           from {
             opacity: 0;
             transform: translateX(-30px);
           }
           to {
             opacity: 1;
             transform: translateX(0);
           }
         }

         @keyframes fadeInRight {
           from {
             opacity: 0;
             transform: translateX(30px);
           }
           to {
             opacity: 1;
             transform: translateX(0);
           }
         }

         @keyframes fadeIn {
           from {
             opacity: 0;
           }
           to {
             opacity: 1;
           }
         }

         @keyframes slideInLeft {
           from {
             opacity: 0;
             transform: translateX(-50px);
           }
           to {
             opacity: 1;
             transform: translateX(0);
           }
         }

         @keyframes slideInRight {
           from {
             opacity: 0;
             transform: translateX(50px);
           }
           to {
             opacity: 1;
             transform: translateX(0);
           }
         }

         @keyframes slideInUp {
           from {
             opacity: 0;
             transform: translateY(20px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }

         @keyframes pulse {
           0%, 100% {
             transform: scale(1);
             box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
           }
           50% {
             transform: scale(1.05);
             box-shadow: 0 4px 16px rgba(255, 215, 0, 0.5);
           }
         }
       `}</style>
     </div>
   );
 } 
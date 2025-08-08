export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export interface ApiResponse {
  response: string;
  sessionId?: string;
  error?: string;
}

export interface N8NConfig {
  enabled: boolean;
  workflowId: string;
  webhookUrl: string;
  additionalParams?: Record<string, any>;
}

export interface N8NRequest {
  message: string;
  workflowId: string;
  webhookUrl: string;
  sessionId?: string;
  additionalParams?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    isAuthenticated: boolean;
  };
}

export interface N8NResponse {
  success: boolean;
  message: string | null;
  data: any | null;
  choices: any | null;
  metadata: any | null;
  workflowId: string;
  timestamp: number;
  errorCode: string | null;
  errorMessage: string | null;
  output: string | null;
  body: any | null;
  result: any | null;
  status: any | null;
  headers: any | null;
  responseContent: string | null;
}

export interface ChatSession {
  id: string;
  userId?: string; // null for anonymous users
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  imageUrl?: string;
}

export const availableModels: Model[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'llama-2', name: 'Llama 2', provider: 'Meta' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'n8n-workflow', name: 'N8N Workflow', provider: 'N8N' },
];

// Function to generate a unique session ID
export const generateSessionId = (): string => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Function to get or create session ID from localStorage
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('openwebui_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('openwebui_session_id', sessionId);
  }
  return sessionId;
};

// Function to get file icon based on file type
export const getFileIcon = (file: File): string => {
  if (file.type.startsWith('image/')) return '🖼️';
  if (file.type.includes('pdf')) return '📄';
  if (file.type.includes('document') || file.type.includes('text')) return '📝';
  if (file.type.includes('video')) return '🎥';
  if (file.type.includes('audio')) return '🎵';
  return '📎';
}; 
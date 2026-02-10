/**
 * Multimodal Chat Widget - Integration Examples
 * Practical implementations using the multimodal API
 */

// ============= EXAMPLE 1: Basic Chat Widget Setup =============

import ChatbotWidget from '@/widget/ChatbotWidget';

export const BasicChatWidgetExample = () => {
  return (
    <ChatbotWidget
      config={{
        chatbotId: 'support-bot-v1',
        apiUrl: 'https://api.example.com',
        width: 380,
        height: 600,
      }}
      startOpen={true}
    />
  );
};

// ============= EXAMPLE 2: Authenticated Widget =============

export const AuthenticatedChatWidgetExample = () => {
  const getAuthToken = async (): Promise<string> => {
    const response = await fetch('/api/auth/get-token');
    const data = await response.json();
    return data.token;
  };

  return (
    <ChatbotWidget
      config={{
        chatbotId: 'premium-bot-v1',
        apiUrl: 'https://api.example.com',
        authToken: 'user-jwt-token', // From your auth system
        width: 420,
        height: 700,
      }}
      startOpen={true}
    />
  );
};

// ============= EXAMPLE 3: React Hook for Multimodal Chat =============

import { useState } from 'react';
import {
  sendMultimodalMessage,
  validateFile,
  fileToBase64,
  MultimodalChatWidgetRequest,
  MultimodalChatSuccessResponse,
} from '@/widget/multimodalApiHelper';

export function useMultimodalChat(apiUrl: string, chatbotId: string, authToken?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<MultimodalChatSuccessResponse | null>(null);

  const sendMessage = async (
    message: string,
    files: File[] = []
  ): Promise<MultimodalChatSuccessResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      // Validate files
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // Convert files to base64
      const attachments = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await fileToBase64(file),
        }))
      );

      // Create request
      const request: MultimodalChatWidgetRequest = {
        message,
        attachments,
        chatbotId,
        sessionId: `sess-${Math.random().toString(36).substr(2, 9)}`,
      };

      // Send message
      const response = await sendMultimodalMessage(
        apiUrl,
        request,
        authToken
      );

      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
    error,
    lastResponse,
  };
}

// ============= EXAMPLE 4: Chat Component with File Upload =============

import React, { useState, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: string[];
  vectorIds?: string[];
}

export function MultimodalChatComponent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const chat = useMultimodalChat(
    'https://api.example.com',
    'chat-bot-id',
    'optional-auth-token'
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() && selectedFiles.length === 0) {
      return;
    }

    setLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      attachments: selectedFiles.map((f) => f.name),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      // Send multimodal message
      const response = await chat.sendMessage(inputValue, selectedFiles);

      if (response) {
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response.result,
          vectorIds: Object.values(response.vectorIdMap),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Log vector attachments
        console.log('Uploaded attachments:', response.vectorAttachments);
      } else if (chat.error) {
        // Show error
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `Error: ${chat.error}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setSelectedFiles([]);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '12px',
              padding: '12px',
              backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}</strong>
            <p>{msg.content}</p>
            {msg.attachments && msg.attachments.length > 0 && (
              <div>
                <em>Attachments: {msg.attachments.join(', ')}</em>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            📎 Attach
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type message..."
            disabled={loading}
            style={{ flex: 1, padding: '8px' }}
          />

          <button type="submit" disabled={loading || (!inputValue.trim() && selectedFiles.length === 0)}>
            Send
          </button>
        </div>

        {selectedFiles.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <strong>Files:</strong> {selectedFiles.map((f) => f.name).join(', ')}
          </div>
        )}
      </form>
    </div>
  );
}

// ============= EXAMPLE 5: Batch Processing Multiple Files =============

export async function processMultipleFilesInBatch(
  apiUrl: string,
  chatbotId: string,
  files: File[],
  message: string,
  authToken?: string
) {
  const {
    sendMultimodalMessage,
    validateFile,
    fileToBase64,
    validateTotalAttachmentSize,
  } = await import('@/widget/multimodalApiHelper');

  // Validate all files
  for (const file of files) {
    const error = validateFile(file);
    if (error) throw new Error(`File "${file.name}": ${error}`);
  }

  // Validate total size
  const totalError = validateTotalAttachmentSize(files);
  if (totalError) throw new Error(totalError);

  // Convert to base64
  const attachments = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      data: await fileToBase64(file),
    }))
  );

  // Send request
  const response = await sendMultimodalMessage(
    apiUrl,
    {
      message,
      attachments,
      chatbotId,
      sessionId: `sess-${Date.now()}`,
    },
    authToken
  );

  return {
    result: response.result,
    filesProcessed: files.length,
    vectorIdMap: response.vectorIdMap,
    vectorAttachments: response.vectorAttachments,
  };
}

// ============= EXAMPLE 6: Advanced Error Handling =============

import {
  isMultimodalErrorResponse,
  isMultimodalSuccessResponse,
  MultimodalApiErrorCode,
  formatErrorMessage,
} from '@/widget/multimodalApiHelper';

export async function sendMessageWithErrorHandling(
  apiUrl: string,
  request: MultimodalChatWidgetRequest,
  authToken?: string,
  maxRetries: number = 3
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `${apiUrl}/v1/api/n8n/multimodal/anonymous/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();

      if (isMultimodalSuccessResponse(data)) {
        return data;
      }

      if (isMultimodalErrorResponse(data)) {
        // Handle specific error codes
        switch (data.errorCode) {
          case MultimodalApiErrorCode.FILE_TOO_LARGE:
            throw new Error('File is too large. Maximum 100 MB per file.');

          case MultimodalApiErrorCode.INVALID_ATTACHMENT_TYPE:
            throw new Error(
              'File type not supported. Please use PDF, images, or documents.'
            );

          case MultimodalApiErrorCode.UNAUTHORIZED:
            throw new Error('Authentication failed. Please login again.');

          case MultimodalApiErrorCode.VECTOR_STORE_ERROR:
            // Retry on vector store errors
            if (attempt < maxRetries) {
              console.log(`Attempt ${attempt}/${maxRetries} failed, retrying...`);
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, attempt) * 1000)
              );
              continue;
            }
            throw new Error(
              'Service temporarily unavailable. Please try again later.'
            );

          default:
            throw new Error(data.errorMessage);
        }
      }

      throw new Error('Invalid response from API');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError;
      }

      // Retry on server errors (5xx) or network errors
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Failed to send message after maximum retries');
}

// ============= EXAMPLE 7: Session Management =============

class MultimodalChatSession {
  private sessionId: string;
  private apiUrl: string;
  private chatbotId: string;
  private authToken?: string;
  private messageHistory: Array<{
    role: 'user' | 'assistant';
    message: string;
    attachments: string[];
    timestamp: number;
  }> = [];

  constructor(apiUrl: string, chatbotId: string, authToken?: string) {
    this.apiUrl = apiUrl;
    this.chatbotId = chatbotId;
    this.authToken = authToken;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendMessage(message: string, files: File[] = []) {
    const { sendMultimodalMessage, fileToBase64 } = await import('@/widget/multimodalApiHelper');

    const attachments = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await fileToBase64(file),
      }))
    );

    const response = await sendMultimodalMessage(
      this.apiUrl,
      {
        message,
        attachments,
        chatbotId: this.chatbotId,
        sessionId: this.sessionId,
      },
      this.authToken
    );

    // Store in history
    this.messageHistory.push({
      role: 'user',
      message,
      attachments: files.map((f) => f.name),
      timestamp: Date.now(),
    });

    this.messageHistory.push({
      role: 'assistant',
      message: response.result,
      attachments: Object.values(response.vectorIdMap),
      timestamp: Date.now(),
    });

    return response;
  }

  getHistory() {
    return this.messageHistory;
  }

  getSessionId() {
    return this.sessionId;
  }
}

// Usage:
// const session = new MultimodalChatSession('https://api.example.com', 'bot-1');
// const response = await session.sendMessage('Hello', []);
// console.log(session.getHistory());

// ============= EXPORT ALL EXAMPLES =============

export {
  BasicChatWidgetExample,
  AuthenticatedChatWidgetExample,
  useMultimodalChat,
  MultimodalChatComponent,
  processMultipleFilesInBatch,
  sendMessageWithErrorHandling,
  MultimodalChatSession,
};






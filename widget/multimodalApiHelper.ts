/**
 * Multimodal Chat API Helper Functions
 * Per API_QUICK_REFERENCE.md v1.0 (Feb 8, 2026)
 * 
 * Handles communication with the N8N multimodal chat endpoints using multipart/form-data:
 * - POST /v1/api/n8n/multimodal/anonymous/multipart/chat
 * - POST /v1/api/n8n/multimodal/authenticated/multipart/chat
 * - GET /v1/api/n8n/multimodal/attachments/{chatbotId}
 * - GET /v1/api/n8n/multimodal/attachments/{chatbotId}/{vectorId}
 * - DELETE /v1/api/n8n/multimodal/attachments/{chatbotId}/{vectorId}
 */

/**
 * Attachment data structure sent to API (Base64 encoded)
 */
export interface MultimodalAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded
}

/**
 * Request payload for multimodal chat endpoints (JSON format)
 */
export interface MultimodalChatRequest {
  message: string;
  attachments: MultimodalAttachment[];
  chatbotId: string;
  sessionId: string;
  googleTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Vector attachment metadata from API response
 */
export interface VectorAttachment {
  vectorId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: number; // Unix timestamp in milliseconds
}

/**
 * Success response from multimodal chat endpoint
 */
export interface MultimodalChatResponse {
  success: true;
  result: {
    response: string; // AI response
  };
  vectorIdMap: Record<string, string>; // filename -> vectorId mapping
  vectorAttachments: VectorAttachment[]; // attachment metadata
  timestamp: number;
}

/**
 * Error response from multimodal chat endpoint
 */
export interface MultimodalErrorResponse {
  success: false;
  errorCode: string;
  errorMessage: string;
  timestamp: number;
}

/**
 * Type guard to check if response is error
 */
export function isErrorResponse(
  response: any
): response is MultimodalErrorResponse {
  return response.success === false && response.errorCode && response.errorMessage;
}

/**
 * Type guard to check if response is success
 */
export function isSuccessResponse(
  response: any
): response is MultimodalChatResponse {
  return (
    response.success === true &&
    response.result &&
    typeof response.result.response === 'string' &&
    typeof response.vectorIdMap === 'object' &&
    Array.isArray(response.vectorAttachments) &&
    typeof response.timestamp === 'number'
  );
}

/**
 * Send message to multimodal chat endpoint using multipart/form-data
 * This is the recommended approach per API_QUICK_REFERENCE.md
 */
export async function sendMultimodalMessageFormData(
  apiUrl: string,
  message: string,
  files: File[],
  chatbotId: string,
  sessionId: string,
  authToken?: string,
  googleTokens?: { accessToken: string; refreshToken: string }
): Promise<MultimodalChatResponse> {
  const endpoint = authToken
    ? `/v1/api/n8n/multimodal/authenticated/multipart/chat`
    : `/v1/api/n8n/multimodal/anonymous/multipart/chat`;

  const formData = new FormData();
  
  // Add form fields
  formData.append('message', message);
  formData.append('chatbotId', chatbotId);
  formData.append('sessionId', sessionId);
  
  // Add Google OAuth tokens if available
  if (googleTokens?.accessToken) {
    formData.append('googleAccessToken', googleTokens.accessToken);
  }
  if (googleTokens?.refreshToken) {
    formData.append('googleRefreshToken', googleTokens.refreshToken);
  }
  
  // Add files
  for (const file of files) {
    formData.append('files', file);
  }

  const headers: Record<string, string> = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Don't set Content-Type - browser will set it with boundary
  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (isErrorResponse(data)) {
    throw new Error(`API Error [${data.errorCode}]: ${data.errorMessage}`);
  }

  if (!isSuccessResponse(data)) {
    throw new Error('Invalid response format from API');
  }

  return data;
}

/**
 * Send message to multimodal chat endpoint using JSON (legacy approach)
 * This is an alternative to the FormData approach
 */
export async function sendMultimodalMessage(
  apiUrl: string,
  request: MultimodalChatRequest,
  authToken?: string
): Promise<MultimodalChatResponse> {
  const endpoint = authToken
    ? `/v1/api/n8n/multimodal/authenticated/chat`
    : `/v1/api/n8n/multimodal/anonymous/chat`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (isErrorResponse(data)) {
    throw new Error(`API Error [${data.errorCode}]: ${data.errorMessage}`);
  }

  if (!isSuccessResponse(data)) {
    throw new Error('Invalid response format from API');
  }

  return data;
}

/**
 * List all attachments for a chatbot
 */
export async function listAttachments(
  apiUrl: string,
  chatbotId: string,
  authToken?: string
): Promise<VectorAttachment[]> {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(
    `${apiUrl}/v1/api/n8n/multimodal/attachments/${encodeURIComponent(chatbotId)}`,
    {
      method: 'GET',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get specific attachment metadata
 */
export async function getAttachment(
  apiUrl: string,
  chatbotId: string,
  vectorId: string,
  authToken?: string
): Promise<VectorAttachment> {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(
    `${apiUrl}/v1/api/n8n/multimodal/attachments/${encodeURIComponent(
      chatbotId
    )}/${encodeURIComponent(vectorId)}`,
    {
      method: 'GET',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(
  apiUrl: string,
  chatbotId: string,
  vectorId: string,
  authToken?: string
): Promise<void> {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(
    `${apiUrl}/v1/api/n8n/multimodal/attachments/${encodeURIComponent(
      chatbotId
    )}/${encodeURIComponent(vectorId)}`,
    {
      method: 'DELETE',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

/**
 * Validate file before upload
 * Per API spec: Max 100 MB per file, 500 MB total
 */
export function validateFile(file: File): string | null {
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB (max 100 MB)`;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type not supported: ${file.type}`;
  }

  return null;
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/**
 * Validate total attachment size
 */
export function validateTotalAttachmentSize(files: File[]): string | null {
  const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500 MB
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > MAX_TOTAL_SIZE) {
    return `Total attachment size too large: ${(totalSize / 1024 / 1024).toFixed(2)} MB (max 500 MB)`;
  }

  return null;
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('HTTP error')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('API Error')) {
      return error.message;
    }
    return `Error: ${error.message}`;
  }
  return 'An unknown error occurred. Please try again.';
}

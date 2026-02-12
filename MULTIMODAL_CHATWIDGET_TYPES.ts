/**
 * Multimodal Chat Widget API Types
 * Updated for v1.0 with multimodal endpoint support
 * Per API_QUICK_REFERENCE.md (Feb 7, 2026)
 */

// ============= REQUEST TYPES =============

/**
 * File attachment sent from chat widget (Base64 encoded)
 */
export interface MultimodalChatWidgetAttachment {
  /** Original filename (e.g., "document.pdf") */
  name: string;

  /** MIME type (e.g., "application/pdf", "image/png") */
  type: string;

  /** File size in bytes */
  size: number;

  /** Base64 encoded file content */
  data: string;
}

/**
 * Optional Google OAuth tokens if user authenticated
 */
export interface GoogleOAuthTokens {
  /** Google access token */
  accessToken: string;

  /** Google refresh token */
  refreshToken: string;
}

/**
 * Main multimodal chat message request payload from widget
 */
export interface MultimodalChatWidgetRequest {
  /** User's text message (can be empty if only sending files) */
  message: string;

  /** Array of file attachments (empty array if no files) */
  attachments: MultimodalChatWidgetAttachment[];

  /** The chatbot identifier */
  chatbotId: string;

  /** Unique session ID for tracking conversation */
  sessionId: string;

  /** Optional Google OAuth tokens if user authenticated */
  googleTokens?: GoogleOAuthTokens;
}

// ============= RESPONSE TYPES =============

/**
 * Vector attachment metadata returned from API
 */
export interface VectorAttachmentMetadata {
  /** Unique vector ID for the attachment in vector store */
  vectorId: string;

  /** Original filename */
  fileName: string;

  /** MIME type of the file */
  mimeType: string;

  /** File size in bytes */
  fileSize: number;

  /** Unix timestamp when uploaded (milliseconds) */
  uploadedAt: number;
}

/**
 * Success response from multimodal chat endpoint
 */
export interface MultimodalChatSuccessResponse {
  /** Always true for success */
  success: true;

  /** AI response message */
  result: string;

  /** Mapping of filename to vectorId for uploaded attachments */
  vectorIdMap: Record<string, string>;

  /** Detailed metadata for each processed attachment */
  vectorAttachments: VectorAttachmentMetadata[];

  /** Server timestamp (milliseconds) */
  timestamp: number;
}

/**
 * Error response from multimodal chat endpoint
 */
export interface MultimodalChatErrorResponse {
  /** Always false for errors */
  success: false;

  /** Error code (e.g., "FILE_TOO_LARGE", "INVALID_REQUEST") */
  errorCode: string;

  /** Human-readable error message */
  errorMessage: string;

  /** Server timestamp (milliseconds) */
  timestamp: number;
}

/**
 * Chat widget response (union of success/error)
 */
export type MultimodalChatWidgetResponse =
  | MultimodalChatSuccessResponse
  | MultimodalChatErrorResponse;

// ============= LEGACY COMPATIBILITY TYPES =============

/**
 * Legacy chat message format (deprecated, kept for backwards compatibility)
 */
export interface ChatWidgetRequest {
  /** Always "user" for user messages */
  role: 'user';

  /** User's text message */
  message: string;

  /** File attachments */
  attachments: MultimodalChatWidgetAttachment[];

  /** Session ID */
  sessionId: string;

  /** Chatbot ID */
  chatbotId: string;

  /** Optional Google tokens */
  googleTokens?: GoogleOAuthTokens;
}

/**
 * Legacy response format (deprecated)
 */
export interface ChatWidgetResponse {
  output?: string;
  data?: string;
  message?: string;
  response?: string;
  answer?: string;
  responseContent?: string;
  result?: string;
  [key: string]: any;
}

// ============= ATTACHMENT MANAGEMENT TYPES =============

/**
 * List attachments response
 */
export interface ListAttachmentsResponse {
  attachments: VectorAttachmentMetadata[];
  total: number;
  chatbotId: string;
  timestamp: number;
}

/**
 * Delete attachment request response
 */
export interface DeleteAttachmentResponse {
  success: true;
  vectorId: string;
  message: string;
  timestamp: number;
}

// ============= VALIDATION & HELPER TYPES =============

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Processed attachment for internal use
 */
export interface ProcessedMultimodalAttachment {
  name: string;
  type: string;
  size: number;
  base64: string;
  vectorId?: string; // Set after upload
}

/**
 * Chat history entry with attachments
 */
export interface MultimodalChatHistoryEntry {
  id: string;
  sessionId: string;
  chatbotId: string;
  role: 'user' | 'assistant';
  message: string;
  attachments: VectorAttachmentMetadata[];
  createdAt: Date;
  updatedAt: Date;
}

// ============= API CONFIGURATION TYPES =============

/**
 * Multimodal chat widget configuration
 */
export interface MultimodalChatWidgetConfig {
  /** Chatbot identifier */
  chatbotId: string;

  /** API base URL (e.g., https://api.example.com) */
  apiBaseUrl: string;

  /** Optional JWT auth token for authenticated endpoint */
  authToken?: string;

  /** Optional frontend URL for OAuth flow */
  frontendUrl?: string;

  /** Widget width in pixels (default: 380) */
  width?: number;

  /** Widget height in pixels (default: 600) */
  height?: number;

  /** Enable file upload (default: true) */
  enableFileUpload?: boolean;

  /** Max file size in MB (default: 100) */
  maxFileSize?: number;

  /** Max total attachments size in MB (default: 500) */
  maxTotalSize?: number;

  /** Allowed file MIME types */
  allowedMimeTypes?: string[];
}

// ============= ERROR TYPES =============

/**
 * Possible API error codes
 */
export enum MultimodalApiErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  CHATBOT_NOT_FOUND = 'CHATBOT_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_ATTACHMENT_TYPE = 'INVALID_ATTACHMENT_TYPE',
  TOTAL_SIZE_EXCEEDED = 'TOTAL_SIZE_EXCEEDED',
  VECTOR_STORE_ERROR = 'VECTOR_STORE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

// ============= TYPE GUARDS =============

/**
 * Check if response is success
 */
export function isMultimodalSuccessResponse(
  response: any
): response is MultimodalChatSuccessResponse {
  return (
    response &&
    response.success === true &&
    typeof response.result === 'string' &&
    typeof response.vectorIdMap === 'object' &&
    Array.isArray(response.vectorAttachments) &&
    typeof response.timestamp === 'number'
  );
}

/**
 * Check if response is error
 */
export function isMultimodalErrorResponse(
  response: any
): response is MultimodalChatErrorResponse {
  return (
    response &&
    response.success === false &&
    typeof response.errorCode === 'string' &&
    typeof response.errorMessage === 'string' &&
    typeof response.timestamp === 'number'
  );
}

/**
 * Check if response is legacy format
 */
export function isLegacyChatWidgetResponse(
  response: any
): response is ChatWidgetResponse {
  return (
    response &&
    (typeof response.output === 'string' ||
      typeof response.data === 'string' ||
      typeof response.message === 'string' ||
      typeof response.response === 'string' ||
      typeof response.answer === 'string')
  );
}

// ============= USAGE EXAMPLES =============

/**
 * Example 1: Send multimodal message with attachments
 */
export const exampleSendMultimodalMessage = async () => {
  const request: MultimodalChatWidgetRequest = {
    message: 'Please analyze these documents',
    attachments: [
      {
        name: 'report.pdf',
        type: 'application/pdf',
        size: 256000,
        data: 'JVBERi0xLjQK...', // Base64 encoded
      },
      {
        name: 'chart.png',
        type: 'image/png',
        size: 125000,
        data: 'iVBORw0KGgoAAAA...', // Base64 encoded
      },
    ],
    chatbotId: 'bot-123',
    sessionId: 'sess-456',
  };

  const response: MultimodalChatSuccessResponse = {
    success: true,
    result: 'Analysis complete. Report shows...',
    vectorIdMap: {
      'report.pdf': 'attachment_bot_123_abc...',
      'chart.png': 'attachment_bot_123_def...',
    },
    vectorAttachments: [
      {
        vectorId: 'attachment_bot_123_abc...',
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        fileSize: 256000,
        uploadedAt: 1707385649123,
      },
      {
        vectorId: 'attachment_bot_123_def...',
        fileName: 'chart.png',
        mimeType: 'image/png',
        fileSize: 125000,
        uploadedAt: 1707385649124,
      },
    ],
    timestamp: 1707385650000,
  };
};

/**
 * Example 2: Handle validation error
 */
export const exampleHandleValidationError = () => {
  const errorResponse: MultimodalChatErrorResponse = {
    success: false,
    errorCode: MultimodalApiErrorCode.FILE_TOO_LARGE,
    errorMessage: 'File size exceeds 100 MB limit',
    timestamp: 1707385650000,
  };

  if (isMultimodalErrorResponse(errorResponse)) {
    console.error(`API Error [${errorResponse.errorCode}]: ${errorResponse.errorMessage}`);
  }
};

/**
 * Example 3: Process vector attachments
 */
export const exampleProcessVectorAttachments = (
  response: MultimodalChatSuccessResponse
) => {
  // Map filename to vector ID for future reference
  Object.entries(response.vectorIdMap).forEach(([fileName, vectorId]) => {
    console.log(`File "${fileName}" stored with vector ID: ${vectorId}`);
  });

  // Store attachment metadata
  response.vectorAttachments.forEach((attachment) => {
    const date = new Date(attachment.uploadedAt);
    console.log(
      `Attachment: ${attachment.fileName} (${(attachment.fileSize / 1024).toFixed(2)} KB, uploaded ${date.toLocaleString()})`
    );
  });
};








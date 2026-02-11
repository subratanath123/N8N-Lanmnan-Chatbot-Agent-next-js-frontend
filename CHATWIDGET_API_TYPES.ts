/**
 * Chat Widget API Request/Response Types
 * Use these TypeScript interfaces when implementing the backend API
 */

// ============= REQUEST TYPES =============

/**
 * File attachment sent from chat widget
 */
export interface ChatWidgetAttachment {
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
export interface GoogleTokens {
  /** Google access token */
  accessToken: string;
  
  /** Google refresh token */
  refreshToken: string;
}

/**
 * Main chat message request payload from widget
 */
export interface ChatWidgetRequest {
  /** Always "user" for user messages */
  role: 'user';
  
  /** User's text message (can be empty if only sending files) */
  message: string;
  
  /** Array of file attachments (empty array if no files) */
  attachments: ChatWidgetAttachment[];
  
  /** Unique session ID for tracking conversation */
  sessionId: string;
  
  /** The chatbot identifier */
  chatbotId: string;
  
  /** Optional Google OAuth tokens if user authenticated */
  googleTokens?: GoogleTokens;
}

// ============= RESPONSE TYPES =============

/**
 * Chat widget expects one of these fields in the response
 * containing the AI's text response
 */
export interface ChatWidgetResponse {
  /** AI response message */
  output?: string;
  
  /** Alternative response field */
  data?: string;
  
  /** Alternative response field */
  message?: string;
  
  /** Alternative response field */
  response?: string;
  
  /** Alternative response field */
  answer?: string;
  
  /** Alternative response field */
  responseContent?: string;
  
  /** Alternative response field */
  result?: string;
  
  /** Any other fields can be present */
  [key: string]: any;
}

// ============= HELPER TYPES =============

/**
 * Parsed attachment after Base64 decoding
 */
export interface ProcessedAttachment {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
  base64: string;
}

/**
 * Chat message for database storage
 */
export interface StoredChatMessage {
  id: string;
  sessionId: string;
  chatbotId: string;
  role: 'user' | 'assistant';
  message: string;
  attachments: ChatWidgetAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

// ============= USAGE EXAMPLES =============

/**
 * Example 1: Handle incoming chat widget request with file
 */
export const handleChatWidgetRequest = async (
  request: ChatWidgetRequest
): Promise<ChatWidgetResponse> => {
  const { message, attachments, sessionId, chatbotId } = request;

  // Process attachments if present
  if (attachments.length > 0) {
    for (const attachment of attachments) {
      // Decode Base64
      const buffer = Buffer.from(attachment.data, 'base64');
      console.log(`Processing file: ${attachment.name} (${attachment.type}, ${attachment.size} bytes)`);
      
      // Store or process file as needed
      // Example: Save to disk, scan for viruses, extract content, etc.
    }
  }

  // Generate AI response based on message and attachments
  const aiResponse = await generateAIResponse(message, attachments);

  // Return response with one of the expected fields
  return {
    output: aiResponse, // or use 'message', 'response', etc.
  };
};

/**
 * Example 2: Decode attachment and save to disk
 */
export const decodeAndSaveAttachment = async (
  attachment: ChatWidgetAttachment,
  outputDir: string
): Promise<string> => {
  const buffer = Buffer.from(attachment.data, 'base64');
  const filePath = `${outputDir}/${attachment.name}`;
  
  // In real implementation: fs.writeFileSync(filePath, buffer);
  
  return filePath;
};

/**
 * Example 3: Extract text from file for AI processing
 */
export const extractFileContent = async (
  attachment: ChatWidgetAttachment
): Promise<string> => {
  const buffer = Buffer.from(attachment.data, 'base64');
  
  switch (attachment.type) {
    case 'text/plain':
      return buffer.toString('utf-8');
    
    case 'application/pdf':
      // Use pdf-parse or similar library
      // return await parsePDF(buffer);
      return '';
    
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
      // Use OCR library or vision API
      // return await extractTextFromImage(buffer);
      return '';
    
    default:
      return '';
  }
};

/**
 * Example 4: Store chat message with attachments
 */
export const storeChatMessage = async (
  request: ChatWidgetRequest,
  response: ChatWidgetResponse
): Promise<void> => {
  const userMessage: StoredChatMessage = {
    id: `msg_${Date.now()}_user`,
    sessionId: request.sessionId,
    chatbotId: request.chatbotId,
    role: 'user',
    message: request.message,
    attachments: request.attachments,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const assistantMessage: StoredChatMessage = {
    id: `msg_${Date.now()}_assistant`,
    sessionId: request.sessionId,
    chatbotId: request.chatbotId,
    role: 'assistant',
    message: response.output || response.message || '',
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // In real implementation: await db.save([userMessage, assistantMessage]);
};

/**
 * Example 5: Validate incoming request
 */
export const validateChatWidgetRequest = (
  request: any
): request is ChatWidgetRequest => {
  return (
    typeof request.role === 'string' &&
    request.role === 'user' &&
    typeof request.message === 'string' &&
    Array.isArray(request.attachments) &&
    typeof request.sessionId === 'string' &&
    typeof request.chatbotId === 'string' &&
    request.attachments.every(
      (att: any) =>
        typeof att.name === 'string' &&
        typeof att.type === 'string' &&
        typeof att.size === 'number' &&
        typeof att.data === 'string'
    )
  );
};








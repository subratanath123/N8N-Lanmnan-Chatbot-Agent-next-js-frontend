# Chat Widget Backend Implementation Example

This document provides example implementations for handling chat widget requests with file attachments.

## Node.js/Express Implementation

### Basic Setup

```typescript
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 files

// ============= TYPE DEFINITIONS =============

interface ChatWidgetAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded
}

interface ChatWidgetRequest {
  role: 'user';
  message: string;
  attachments: ChatWidgetAttachment[];
  sessionId: string;
  chatbotId: string;
  googleTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

interface ChatWidgetResponse {
  output?: string;
  data?: string;
  message?: string;
  response?: string;
  answer?: string;
  [key: string]: any;
}

// ============= ENDPOINTS =============

/**
 * Authenticated chat endpoint
 * POST /v1/api/n8n/authenticated/chat
 */
app.post('/v1/api/n8n/authenticated/chat', async (req: Request, res: Response) => {
  try {
    const request: ChatWidgetRequest = req.body;
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    // Validate request
    if (!validateRequest(request)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Verify authentication token
    if (!authToken || !verifyToken(authToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Process the request
    const response = await processChatRequest(request);

    return res.json(response);
  } catch (error) {
    console.error('Error in authenticated chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Anonymous chat endpoint
 * POST /v1/api/n8n/anonymous/chat
 */
app.post('/v1/api/n8n/anonymous/chat', async (req: Request, res: Response) => {
  try {
    const request: ChatWidgetRequest = req.body;

    // Validate request
    if (!validateRequest(request)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Process the request
    const response = await processChatRequest(request);

    return res.json(response);
  } catch (error) {
    console.error('Error in anonymous chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= HELPER FUNCTIONS =============

/**
 * Validate incoming chat widget request
 */
function validateRequest(request: any): request is ChatWidgetRequest {
  return (
    request &&
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
}

/**
 * Verify authentication token (implement based on your auth system)
 */
function verifyToken(token: string): boolean {
  // TODO: Implement your token verification logic
  // Example: verify JWT, check against database, etc.
  return true;
}

/**
 * Main chat request processing function
 */
async function processChatRequest(request: ChatWidgetRequest): Promise<ChatWidgetResponse> {
  const { message, attachments, sessionId, chatbotId } = request;

  // 1. Process attachments
  const processedFiles: ProcessedFile[] = [];
  if (attachments.length > 0) {
    for (const attachment of attachments) {
      const processedFile = await processAttachment(attachment, sessionId, chatbotId);
      processedFiles.push(processedFile);
    }
  }

  // 2. Store message in database
  await storeMessage({
    sessionId,
    chatbotId,
    role: 'user',
    message,
    attachments,
  });

  // 3. Generate AI response
  const aiResponse = await generateAIResponse({
    message,
    attachments: processedFiles,
    sessionId,
    chatbotId,
  });

  // 4. Store AI response in database
  await storeMessage({
    sessionId,
    chatbotId,
    role: 'assistant',
    message: aiResponse,
    attachments: [],
  });

  // 5. Return response
  return {
    output: aiResponse,
  };
}

/**
 * Process individual attachment
 */
interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  path?: string;
  content?: string;
}

async function processAttachment(
  attachment: ChatWidgetAttachment,
  sessionId: string,
  chatbotId: string
): Promise<ProcessedFile> {
  const { name, type, size, data } = attachment;

  // Decode base64
  const buffer = Buffer.from(data, 'base64');

  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads', chatbotId, sessionId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Save file to disk
  const filePath = path.join(uploadDir, name);
  fs.writeFileSync(filePath, buffer);

  // Extract content if needed (for text files, PDFs, images)
  let content: string | undefined;
  try {
    content = await extractFileContent(type, buffer);
  } catch (error) {
    console.warn(`Failed to extract content from ${name}:`, error);
  }

  return {
    name,
    type,
    size,
    path: filePath,
    content,
  };
}

/**
 * Extract text content from files
 */
async function extractFileContent(mimeType: string, buffer: Buffer): Promise<string> {
  switch (mimeType) {
    case 'text/plain':
    case 'text/csv':
      return buffer.toString('utf-8');

    case 'application/json':
      return buffer.toString('utf-8');

    case 'application/pdf':
      // TODO: Implement PDF parsing
      // Example using pdf-parse:
      // const pdfParse = require('pdf-parse');
      // const data = await pdfParse(buffer);
      // return data.text;
      return 'PDF content extraction not implemented';

    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
    case 'image/webp':
      // TODO: Implement OCR or image analysis
      // Example using tesseract.js:
      // const { createWorker } = require('tesseract.js');
      // const worker = await createWorker();
      // const { data: { text } } = await worker.recognize(buffer);
      // await worker.terminate();
      // return text;
      return 'Image OCR not implemented';

    default:
      return '';
  }
}

/**
 * Generate AI response
 */
interface GenerateAIResponseParams {
  message: string;
  attachments: ProcessedFile[];
  sessionId: string;
  chatbotId: string;
}

async function generateAIResponse(params: GenerateAIResponseParams): Promise<string> {
  const { message, attachments, sessionId, chatbotId } = params;

  // Build context from attachments
  let context = message;
  if (attachments.length > 0) {
    context += '\n\nAttached files:\n';
    for (const file of attachments) {
      context += `- ${file.name} (${file.type})\n`;
      if (file.content) {
        context += `  Content: ${file.content.substring(0, 500)}...\n`;
      }
    }
  }

  // TODO: Call your AI service (OpenAI, Anthropic, N8N, etc.)
  // Example with OpenAI:
  // const response = await openai.createChatCompletion({
  //   model: 'gpt-4',
  //   messages: [
  //     { role: 'system', content: 'You are a helpful assistant.' },
  //     { role: 'user', content: context }
  //   ],
  // });
  // return response.choices[0].message.content;

  // Placeholder response
  return `I received your message: "${message}" with ${attachments.length} file(s). AI response generation not implemented.`;
}

/**
 * Store message in database
 */
interface MessageToStore {
  sessionId: string;
  chatbotId: string;
  role: 'user' | 'assistant';
  message: string;
  attachments: ChatWidgetAttachment[];
}

async function storeMessage(msg: MessageToStore): Promise<void> {
  // TODO: Implement database storage
  // Example with MongoDB:
  // await ChatMessage.create({
  //   sessionId: msg.sessionId,
  //   chatbotId: msg.chatbotId,
  //   role: msg.role,
  //   message: msg.message,
  //   attachments: msg.attachments.map(att => ({
  //     name: att.name,
  //     type: att.type,
  //     size: att.size,
  //     // Don't store large base64 data, store file path instead
  //   })),
  //   createdAt: new Date(),
  // });

  console.log(`Storing ${msg.role} message for session ${msg.sessionId}`);
}

// ============= ERROR HANDLING =============

app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// ============= START SERVER =============

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Chat endpoints:`);
  console.log(`  POST /v1/api/n8n/authenticated/chat`);
  console.log(`  POST /v1/api/n8n/anonymous/chat`);
});
```

## Python/Flask Implementation

```python
from flask import Flask, request, jsonify
from datetime import datetime
import base64
import os
import json

app = Flask(__name__)

# ============= CONFIGURATION =============

UPLOAD_DIR = 'uploads'
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# ============= TYPE DEFINITIONS =============

class ChatWidgetRequest:
    def __init__(self, data):
        self.role = data.get('role')
        self.message = data.get('message', '')
        self.attachments = data.get('attachments', [])
        self.session_id = data.get('sessionId')
        self.chatbot_id = data.get('chatbotId')
        self.google_tokens = data.get('googleTokens')

    def is_valid(self):
        return (
            self.role == 'user' and
            isinstance(self.message, str) and
            isinstance(self.attachments, list) and
            isinstance(self.session_id, str) and
            isinstance(self.chatbot_id, str) and
            all(
                isinstance(att.get('name'), str) and
                isinstance(att.get('type'), str) and
                isinstance(att.get('size'), int) and
                isinstance(att.get('data'), str)
                for att in self.attachments
            )
        )

# ============= ENDPOINTS =============

@app.route('/v1/api/n8n/authenticated/chat', methods=['POST'])
def authenticated_chat():
    try:
        request_data = ChatWidgetRequest(request.json)
        auth_header = request.headers.get('Authorization')

        if not request_data.is_valid():
            return jsonify({'error': 'Invalid request format'}), 400

        if not auth_header or not verify_token(auth_header.replace('Bearer ', '')):
            return jsonify({'error': 'Unauthorized'}), 401

        response = process_chat_request(request_data)
        return jsonify(response), 200

    except Exception as e:
        print(f'Error in authenticated chat: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/v1/api/n8n/anonymous/chat', methods=['POST'])
def anonymous_chat():
    try:
        request_data = ChatWidgetRequest(request.json)

        if not request_data.is_valid():
            return jsonify({'error': 'Invalid request format'}), 400

        response = process_chat_request(request_data)
        return jsonify(response), 200

    except Exception as e:
        print(f'Error in anonymous chat: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

# ============= HELPER FUNCTIONS =============

def verify_token(token: str) -> bool:
    # TODO: Implement token verification
    return True

def process_chat_request(request_data: ChatWidgetRequest) -> dict:
    # Process attachments
    processed_files = []
    for attachment in request_data.attachments:
        processed_file = process_attachment(
            attachment,
            request_data.session_id,
            request_data.chatbot_id
        )
        processed_files.append(processed_file)

    # Generate AI response
    ai_response = generate_ai_response(
        request_data.message,
        processed_files,
        request_data.session_id,
        request_data.chatbot_id
    )

    return {'output': ai_response}

def process_attachment(attachment: dict, session_id: str, chatbot_id: str) -> dict:
    name = attachment['name']
    mime_type = attachment['type']
    size = attachment['size']
    data = attachment['data']

    # Decode base64
    file_bytes = base64.b64decode(data)

    # Create upload directory
    upload_path = os.path.join(UPLOAD_DIR, chatbot_id, session_id)
    os.makedirs(upload_path, exist_ok=True)

    # Save file
    file_path = os.path.join(upload_path, name)
    with open(file_path, 'wb') as f:
        f.write(file_bytes)

    # Extract content if needed
    content = extract_file_content(mime_type, file_bytes)

    return {
        'name': name,
        'type': mime_type,
        'size': size,
        'path': file_path,
        'content': content
    }

def extract_file_content(mime_type: str, file_bytes: bytes) -> str:
    if mime_type in ['text/plain', 'text/csv', 'application/json']:
        return file_bytes.decode('utf-8')
    
    # TODO: Implement PDF, image OCR, etc.
    return ''

def generate_ai_response(message: str, attachments: list, session_id: str, chatbot_id: str) -> str:
    # TODO: Call your AI service
    return f'Received: {message} with {len(attachments)} file(s)'

# ============= ERROR HANDLERS =============

@app.errorhandler(Exception)
def handle_error(error):
    print(f'Unhandled error: {str(error)}')
    return jsonify({'error': 'Internal server error'}), 500

# ============= START SERVER =============

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

## Key Implementation Points

### 1. **Base64 Decoding**
```typescript
const buffer = Buffer.from(attachment.data, 'base64');
// Use buffer for file operations
```

### 2. **File Storage**
- Store files in organized directories: `uploads/{chatbotId}/{sessionId}/{filename}`
- Consider virus scanning before storing
- Implement cleanup for old files

### 3. **Content Extraction**
- **Text files:** Direct decode from UTF-8
- **PDFs:** Use libraries like `pdf-parse` (Node.js) or `PyPDF2` (Python)
- **Images:** Use OCR libraries like `tesseract.js` or `pytesseract`
- **Office docs:** Use libraries like `docx`, `xlsx-parse`

### 4. **Security Considerations**
- Validate file MIME types
- Implement file size limits
- Scan for malware/viruses
- Sanitize filenames
- Store files outside web root
- Implement access controls

### 5. **Database Schema**
```sql
CREATE TABLE chat_messages (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  chatbot_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(session_id),
  INDEX(chatbot_id)
);

CREATE TABLE message_attachments (
  id VARCHAR(255) PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(message_id) REFERENCES chat_messages(id)
);
```

---

**Implementation Status Checklist:**
- [ ] Endpoints set up (authenticated + anonymous)
- [ ] Request validation
- [ ] Authentication/Token verification
- [ ] File processing and storage
- [ ] Content extraction
- [ ] AI response generation
- [ ] Message storage
- [ ] Error handling
- [ ] Security measures
- [ ] Testing









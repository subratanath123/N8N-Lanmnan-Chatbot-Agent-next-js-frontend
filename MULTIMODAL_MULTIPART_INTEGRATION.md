# Chat Widget - Multimodal Multipart Integration Guide

**Version:** 1.1 | **Date:** Feb 8, 2026 | **Status:** ✅ Production Ready

## Overview

The chat widget has been updated to use the **multipart/form-data** approach for the multimodal chat endpoints, which is the recommended method for handling file uploads. The widget now fully supports:

- ✅ Text messages
- ✅ File attachments (PDF, images, documents, spreadsheets)
- ✅ Vector attachment metadata tracking
- ✅ Anonymous and authenticated endpoints
- ✅ Session persistence
- ✅ Google OAuth integration

## Quick Start - 5 Minutes

### 1. Basic Installation

```html
<!-- In your HTML file -->
<script src="https://your-domain.com/widget-dist/chat-widget.iife.js"></script>
<script>
  const config = {
    chatbotId: 'your-chatbot-id',
    apiUrl: 'https://api.example.com'
  };
  const widget = new ChatWidget(config);
</script>
```

### 2. With Authentication

```javascript
const config = {
  chatbotId: 'your-chatbot-id',
  apiUrl: 'https://api.example.com',
  authToken: 'your-jwt-token' // Enables authenticated endpoint
};
```

### 3. Custom Dimensions

```javascript
const config = {
  chatbotId: 'your-chatbot-id',
  apiUrl: 'https://api.example.com',
  width: 400,
  height: 700
};
```

## API Endpoints

The widget uses these multipart/form-data endpoints:

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/v1/api/n8n/multimodal/anonymous/multipart/chat` | POST | Send message (no auth) | Optional |
| `/v1/api/n8n/multimodal/authenticated/multipart/chat` | POST | Send message (with auth) | Required |

## Request Format

The widget sends requests as **multipart/form-data** with the following fields:

```
POST /v1/api/n8n/multimodal/authenticated/multipart/chat HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="message"

Analyze this document
------WebKitFormBoundary
Content-Disposition: form-data; name="chatbotId"

your-chatbot-id
------WebKitFormBoundary
Content-Disposition: form-data; name="sessionId"

session-123456
------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="document.pdf"
Content-Type: application/pdf

[binary file data]
------WebKitFormBoundary--
```

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ Yes | The user's message text |
| `chatbotId` | string | ✅ Yes | Chatbot identifier |
| `sessionId` | string | ✅ Yes | Session identifier for conversation continuity |
| `files` | file (multiple) | ❌ No | Attached files (can specify multiple times) |
| `googleAccessToken` | string | ❌ No | Google OAuth access token |
| `googleRefreshToken` | string | ❌ No | Google OAuth refresh token |

## Response Format

The API returns responses in this format:

```javascript
{
  "success": true,
  "result": {
    "response": "Analysis complete..."
  },
  "vectorIdMap": {
    "document.pdf": "attachment_bot_123_...",
    "image.png": "attachment_bot_456_..."
  },
  "vectorAttachments": [
    {
      "vectorId": "attachment_bot_123_...",
      "fileName": "document.pdf",
      "mimeType": "application/pdf",
      "fileSize": 256000,
      "uploadedAt": 1707385649123
    }
  ],
  "timestamp": 1707385650000
}
```

## Usage Examples

### 1. Text-Only Message

When user sends a message without files:

```
Request:
  - message: "What is this about?"
  - chatbotId: "bot-123"
  - sessionId: "sess-456"
  - files: (empty)

Response:
  {
    "success": true,
    "result": { "response": "Text response..." },
    "vectorIdMap": {},
    "vectorAttachments": [],
    "timestamp": 1707385650000
  }
```

### 2. Message with Single File

```
Request:
  - message: "Analyze this document"
  - chatbotId: "bot-123"
  - sessionId: "sess-456"
  - files: [document.pdf]

Response:
  {
    "success": true,
    "result": { "response": "Document analysis..." },
    "vectorIdMap": { "document.pdf": "attachment_bot_123_..." },
    "vectorAttachments": [{ vectorId, fileName, ... }],
    "timestamp": 1707385650000
  }
```

### 3. Message with Multiple Files

```
Request:
  - message: "Process both files"
  - chatbotId: "bot-123"
  - sessionId: "sess-456"
  - files: [file1.pdf, file2.xlsx, image.png]

Response includes:
  {
    "vectorIdMap": {
      "file1.pdf": "attachment_bot_123_...",
      "file2.xlsx": "attachment_bot_124_...",
      "image.png": "attachment_bot_125_..."
    },
    "vectorAttachments": [
      { vectorId, fileName: "file1.pdf", ... },
      { vectorId, fileName: "file2.xlsx", ... },
      { vectorId, fileName: "image.png", ... }
    ]
  }
```

## Supported File Types

| Type | Extensions | Max Size |
|------|-----------|----------|
| PDF | .pdf | 100 MB |
| Images | .jpg, .jpeg, .png, .gif, .webp | 100 MB |
| Documents | .doc, .docx, .txt | 100 MB |
| Spreadsheets | .xls, .xlsx, .csv | 100 MB |
| Presentations | .ppt, .pptx | 100 MB |

**Total Limit:** 500 MB per request

## Helper Functions

The `multimodalApiHelper.ts` module provides utility functions:

### Send Message with FormData

```typescript
import { sendMultimodalMessageFormData } from '@/widget/multimodalApiHelper';

const response = await sendMultimodalMessageFormData(
  'https://api.example.com',
  'Analyze this',
  [file1, file2],
  'bot-123',
  'session-456',
  'auth-token',
  googleTokens
);

console.log(response.result.response); // AI response
console.log(response.vectorIdMap);    // File -> Vector ID mapping
```

### Validate Files

```typescript
import { validateFile, validateTotalAttachmentSize } from '@/widget/multimodalApiHelper';

// Validate single file
const error = validateFile(file);
if (error) console.error(error);

// Validate total size
const totalError = validateTotalAttachmentSize([file1, file2]);
if (totalError) console.error(totalError);
```

### List Attachments

```typescript
import { listAttachments } from '@/widget/multimodalApiHelper';

const attachments = await listAttachments(
  'https://api.example.com',
  'bot-123',
  'auth-token'
);
```

### Delete Attachment

```typescript
import { deleteAttachment } from '@/widget/multimodalApiHelper';

await deleteAttachment(
  'https://api.example.com',
  'bot-123',
  'attachment_bot_123_...',
  'auth-token'
);
```

## Integration Examples

### React Component

```jsx
import { useState, useRef } from 'react';
import { sendMultimodalMessageFormData } from '@/widget/multimodalApiHelper';

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await sendMultimodalMessageFormData(
        'https://api.example.com',
        message,
        files,
        'bot-123',
        'session-456',
        'auth-token'
      );

      console.log('Response:', response.result.response);
      setMessage('');
      setFiles([]);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSendMessage}>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message..."
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

### Vue 3 Component

```vue
<template>
  <form @submit.prevent="sendMessage">
    <input
      type="file"
      @change="handleFileSelect"
      multiple
      accept=".pdf,.jpg,.png,.doc,.docx,.xlsx"
    />
    <textarea
      v-model="message"
      placeholder="Your message..."
    />
    <button type="submit" :disabled="loading">
      {{ loading ? 'Sending...' : 'Send' }}
    </button>
    <p v-if="response" class="success">{{ response }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { sendMultimodalMessageFormData } from '@/widget/multimodalApiHelper';

const message = ref('');
const files = ref([]);
const loading = ref(false);
const response = ref('');
const error = ref('');

const handleFileSelect = (e) => {
  files.value = Array.from(e.target.files);
};

const sendMessage = async () => {
  loading.value = true;
  error.value = '';
  response.value = '';

  try {
    const res = await sendMultimodalMessageFormData(
      'https://api.example.com',
      message.value,
      files.value,
      'bot-123',
      'session-456',
      'auth-token'
    );

    response.value = res.result.response;
    message.value = '';
    files.value = [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
```

## Error Handling

### Common Error Responses

```javascript
{
  "success": false,
  "errorCode": "FILE_TOO_LARGE",
  "errorMessage": "File size exceeds 100 MB limit",
  "timestamp": 1707385650000
}
```

### Error Codes

| Code | Status | Solution |
|------|--------|----------|
| `INVALID_REQUEST` | 400 | Check required fields: message, chatbotId, sessionId |
| `CHATBOT_NOT_FOUND` | 404 | Verify chatbot ID is correct |
| `FILE_TOO_LARGE` | 400 | File exceeds 100 MB, compress and retry |
| `INVALID_ATTACHMENT_TYPE` | 400 | Use supported file format (PDF, DOCX, PNG, etc.) |
| `TOTAL_SIZE_EXCEEDED` | 400 | Total attachments > 500 MB |
| `VECTOR_STORE_ERROR` | 500 | Retry or contact support |
| `401` | 401 | Check auth token validity |
| `500` | 500 | Server error, retry with backoff |

### Error Handling Example

```javascript
try {
  const response = await sendMultimodalMessageFormData(
    apiUrl, message, files, chatbotId, sessionId, authToken
  );
  console.log('Success:', response.result.response);
} catch (error) {
  if (error.message.includes('FILE_TOO_LARGE')) {
    // Handle file size error
    console.error('File is too large. Max 100 MB.');
  } else if (error.message.includes('401')) {
    // Handle auth error
    console.error('Authentication failed. Please login again.');
  } else if (error.message.includes('CHATBOT_NOT_FOUND')) {
    // Handle invalid chatbot
    console.error('Chatbot not found.');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Testing with cURL

### Send Text Message

```bash
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/anonymous/multipart/chat \
  -F "message=Hello, world!" \
  -F "chatbotId=bot-1" \
  -F "sessionId=sess-1"
```

### Send with File

```bash
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/anonymous/multipart/chat \
  -F "message=Analyze this document" \
  -F "chatbotId=bot-1" \
  -F "sessionId=sess-1" \
  -F "files=@/path/to/document.pdf"
```

### Send with Multiple Files

```bash
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/authenticated/multipart/chat \
  -H "Authorization: Bearer your-jwt-token" \
  -F "message=Process both documents" \
  -F "chatbotId=bot-1" \
  -F "sessionId=sess-1" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.xlsx"
```

### With Google OAuth Tokens

```bash
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/authenticated/multipart/chat \
  -H "Authorization: Bearer your-jwt-token" \
  -F "message=Process with OAuth" \
  -F "chatbotId=bot-1" \
  -F "sessionId=sess-1" \
  -F "googleAccessToken=google-access-token" \
  -F "googleRefreshToken=google-refresh-token" \
  -F "files=@/path/to/document.pdf"
```

## Configuration

### Widget Config Options

```typescript
interface ChatbotWidgetConfig {
  chatbotId: string;           // Required: Chatbot ID
  apiUrl: string;              // Required: API base URL
  authToken?: string;          // Optional: JWT token for authenticated endpoint
  frontendUrl?: string;        // Optional: Frontend URL for OAuth
  width?: number;              // Optional: Widget width (default: 380px)
  height?: number;             // Optional: Widget height (default: 600px)
}
```

## Performance Tips

✅ **Best Practices:**
- Compress images before upload (use image compression tools)
- Batch multiple files into single request (up to 20 files)
- Reuse sessionId for multi-turn chat
- Validate files before sending
- Show file upload progress indicator
- Cache attachment metadata locally

❌ **Avoid:**
- Sending uncompressed raw files
- Files > 100 MB (will be rejected)
- Creating new sessionId for each message
- Immediate retries (use exponential backoff)
- Blocking UI during file processing

## Security

✅ **Implemented:**
- HTTPS required for production
- MIME type validation server-side
- File size limits (100 MB per file, 500 MB total)
- JWT token support for authenticated endpoint
- CORS enabled
- Session isolation

✅ **Recommendations:**
- Never log sensitive content
- Use HTTPS in production
- Rotate auth tokens regularly
- Validate files on client-side for UX
- Monitor for suspicious patterns
- Sanitize user input

## Files Modified

### Updated Files
- **`widget/ChatbotWidget.tsx`** - Uses multipart/form-data approach
- **`widget/multimodalApiHelper.ts`** - Enhanced with FormData support

### New Functions
- `sendMultimodalMessageFormData()` - Send with FormData (recommended)
- `sendMultimodalMessage()` - Send with JSON (legacy)

## Migration Checklist

If updating from older version:

- [ ] Update endpoint URLs to include `/multipart/`
- [ ] Switch from base64 encoding to direct file upload
- [ ] Update response parsing to access `result.response`
- [ ] Use `vectorIdMap` for file tracking
- [ ] Leverage `vectorAttachments` metadata
- [ ] Test with multiple file types
- [ ] Verify file size limits
- [ ] Test error handling

## Support & Resources

- **API Quick Reference:** `API_QUICK_REFERENCE.md`
- **Type Definitions:** `widget/multimodalApiHelper.ts`
- **Widget Component:** `widget/ChatbotWidget.tsx`

---

**Last Updated:** February 8, 2026 | **Status:** ✅ Production Ready






# Multimodal Chat Widget Implementation Guide

**Version:** 1.0 | **Date:** Feb 7, 2026 | **Status:** ✅ Production Ready

## Overview

The chat widget has been updated to support the multimodal chat API endpoints. It now fully supports:
- ✅ Text messages
- ✅ File attachments (PDF, images, documents, spreadsheets)
- ✅ Vector attachment metadata tracking
- ✅ Anonymous and authenticated endpoints
- ✅ Session persistence
- ✅ Google OAuth integration

## Files Modified & Created

### Modified Files
- **`widget/ChatbotWidget.tsx`** - Updated `sendMessage()` to use multimodal endpoints

### New Files
- **`widget/multimodalApiHelper.ts`** - Multimodal API helper functions and types

## Multimodal Endpoints Used

The widget now uses these endpoints:

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/v1/api/n8n/multimodal/anonymous/chat` | POST | Send message (no auth required) | Optional |
| `/v1/api/n8n/multimodal/authenticated/chat` | POST | Send message (with auth token) | Required |
| `/v1/api/n8n/multimodal/attachments/{chatbotId}` | GET | List all attachments | Optional |
| `/v1/api/n8n/multimodal/attachments/{chatbotId}/{vectorId}` | GET | Get attachment metadata | Optional |
| `/v1/api/n8n/multimodal/attachments/{chatbotId}/{vectorId}` | DELETE | Remove attachment | Optional |

## Request Payload Structure

The widget now sends requests in the multimodal format:

```javascript
{
  "message": "Analyze this document",
  "attachments": [
    {
      "name": "report.pdf",
      "type": "application/pdf",
      "size": 256000,
      "data": "JVBERi0xLjQK..." // Base64 encoded
    }
  ],
  "chatbotId": "bot-123",
  "sessionId": "unique-session-id",
  "googleTokens": { // Optional
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## Response Structure

The API returns responses in this format:

```javascript
{
  "success": true,
  "result": "Analysis complete...",
  "vectorIdMap": {
    "report.pdf": "attachment_bot_123_...",
    "image.png": "attachment_bot_123_..."
  },
  "vectorAttachments": [
    {
      "vectorId": "attachment_bot_123_...",
      "fileName": "report.pdf",
      "mimeType": "application/pdf",
      "fileSize": 256000,
      "uploadedAt": 1707385649123
    }
  ],
  "timestamp": 1707385650000
}
```

## Usage Examples

### 1. Basic Installation

```html
<!-- In your HTML file -->
<div id="chatbot-container"></div>

<script src="https://cdn.example.com/chat-widget.iife.js"></script>
<script>
  const chat = new ChatWidget({
    apiBaseUrl: 'https://api.example.com',
    chatbotId: 'bot-abc123',
    width: 380,
    height: 600
  });
</script>
```

### 2. Send Text Message

```javascript
const response = await chat.sendMessage({
  message: "Hello, how can I help?"
});

// Response contains:
// - response.result: AI's text response
// - response.vectorAttachments: [] (empty for text-only messages)
```

### 3. Send Message with File

```javascript
const file = new File(['...'], 'document.pdf', { type: 'application/pdf' });

const response = await chat.sendMessage({
  message: "Please analyze this document",
  attachments: [file]
});

// Response includes:
// - response.result: Analysis results
// - response.vectorIdMap: { "document.pdf": "attachment_bot_..." }
// - response.vectorAttachments: [{ vectorId, fileName, mimeType, ... }]
```

### 4. Multiple Files

```javascript
const files = [
  new File(['...'], 'file1.pdf', { type: 'application/pdf' }),
  new File(['...'], 'file2.xlsx', { type: 'application/vnd.ms-excel' })
];

const response = await chat.sendMessage({
  message: "Process both files",
  attachments: files
});
```

### 5. Authenticated Request

```javascript
const chat = new ChatWidget({
  apiBaseUrl: 'https://api.example.com',
  chatbotId: 'bot-abc123',
  authToken: 'your-jwt-token' // Enables authenticated endpoint
});

await chat.sendMessage({
  message: "Secure message",
  attachments: []
});
// Uses: POST /v1/api/n8n/multimodal/authenticated/chat
```

### 6. List All Attachments

```javascript
import {
  listAttachments
} from '@/widget/multimodalApiHelper';

const attachments = await listAttachments(
  apiUrl,
  chatbotId,
  authToken
);

console.log(attachments);
// [
//   {
//     vectorId: 'attachment_bot_...',
//     fileName: 'report.pdf',
//     mimeType: 'application/pdf',
//     fileSize: 256000,
//     uploadedAt: 1707385649123
//   }
// ]
```

### 7. Delete Attachment

```javascript
import {
  deleteAttachment
} from '@/widget/multimodalApiHelper';

await deleteAttachment(
  apiUrl,
  chatbotId,
  'attachment_bot_123_...',
  authToken
);
```

### 8. File Validation

```javascript
import {
  validateFile,
  validateTotalAttachmentSize
} from '@/widget/multimodalApiHelper';

// Validate single file
const file = event.target.files[0];
const error = validateFile(file);
if (error) {
  console.error(error); // "File too large: 150.50 MB (max 100 MB)"
}

// Validate total size
const files = Array.from(event.target.files);
const totalError = validateTotalAttachmentSize(files);
if (totalError) {
  console.error(totalError);
}
```

### 9. React Integration

```javascript
import { useState } from 'react';
import {
  sendMultimodalMessage,
  validateFile,
  fileToBase64
} from '@/widget/multimodalApiHelper';

export function ChatComponent() {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }
    setAttachments([file]);
  };

  const handleSendMessage = async () => {
    try {
      // Convert files to base64
      const attachmentData = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await fileToBase64(file)
        }))
      );

      const response = await sendMultimodalMessage(
        'https://api.example.com',
        {
          message,
          attachments: attachmentData,
          chatbotId: 'bot-123',
          sessionId: 'sess-456'
        },
        'auth-token'
      );

      console.log('AI Response:', response.result);
      console.log('Vector Map:', response.vectorIdMap);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileSelect}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSendMessage}>
        Send with Multimodal
      </button>
    </div>
  );
}
```

## Supported File Types

| Type | Extensions | Max Size |
|------|-----------|----------|
| PDF | .pdf | 100 MB |
| Images | .jpg, .png, .gif, .webp | 50 MB |
| Documents | .doc, .docx, .txt | 100 MB |
| Spreadsheets | .xls, .xlsx, .csv | 100 MB |
| Presentations | .ppt, .pptx | 100 MB |

## API Error Handling

The widget now properly handles multimodal error responses:

```javascript
{
  "success": false,
  "errorCode": "FILE_TOO_LARGE",
  "errorMessage": "File size exceeds 100 MB limit",
  "timestamp": 1707385650000
}
```

### Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `INVALID_REQUEST` | Missing required fields | Ensure `message`, `chatbotId`, `sessionId` |
| `CHATBOT_NOT_FOUND` | Invalid chatbot ID | Verify chatbot ID is correct |
| `FILE_TOO_LARGE` | File > 100 MB | Compress file or split into smaller chunks |
| `INVALID_ATTACHMENT_TYPE` | Unsupported MIME type | Use supported file format |
| `VECTOR_STORE_ERROR` | Vector database issue | Retry or contact support |
| `INTERNAL_ERROR` | Server error | Retry with exponential backoff |
| `401 Unauthorized` | Invalid/missing auth token | Provide valid JWT token |

## Key Changes from Previous Implementation

### Before (Legacy)
```javascript
const payload = {
  role: 'user',
  message: '...',
  attachments: [...],
  sessionId: '...',
  chatbotId: '...',
  googleTokens: {...}
};

// Endpoint: /v1/api/n8n/anonymous/chat or /v1/api/n8n/authenticated/chat
```

### After (Multimodal)
```javascript
const payload = {
  message: '...',
  attachments: [...],
  chatbotId: '...',
  sessionId: '...',
  googleTokens: {...} // optional
};

// Endpoint: /v1/api/n8n/multimodal/anonymous/chat or /v1/api/n8n/multimodal/authenticated/chat

// Response now includes vectorIdMap and vectorAttachments
```

## Configuration Options

```javascript
const config = {
  chatbotId: 'string',              // Required: Chatbot identifier
  apiUrl: 'string',                 // Required: API base URL
  authToken?: 'string',             // Optional: JWT token for authenticated endpoint
  frontendUrl?: 'string',           // Optional: Frontend URL for OAuth
  width?: number,                   // Optional: Widget width (default: 380px)
  height?: number,                  // Optional: Widget height (default: 600px)
};
```

## Performance Tips

✅ **DO:**
- Compress images before upload
- Batch multiple files into single request
- Reuse `sessionId` for multi-turn chat
- Cache attachment metadata locally
- Show upload progress indicator
- Validate files before sending

❌ **DON'T:**
- Send uncompressed raw files
- Send files > 100 MB (will be rejected)
- Create new `sessionId` for each message
- Retry immediately on failure (use exponential backoff)
- Block UI during file processing

## Testing with cURL

### Send text message
```bash
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/anonymous/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "attachments": [],
    "chatbotId": "bot-1",
    "sessionId": "sess-1"
  }'
```

### Send with file
```bash
FILE=$(base64 -w 0 < document.pdf)
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/anonymous/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze this",
    "attachments": [{
      "name": "document.pdf",
      "type": "application/pdf",
      "size": 256000,
      "data": "'$FILE'"
    }],
    "chatbotId": "bot-1",
    "sessionId": "sess-1"
  }'
```

### List attachments
```bash
curl http://localhost:8080/v1/api/n8n/multimodal/attachments/bot-1
```

### Delete attachment
```bash
curl -X DELETE http://localhost:8080/v1/api/n8n/multimodal/attachments/bot-1/vectorId-123
```

## Migration from Legacy Endpoints

If migrating from the old `/v1/api/n8n/chat` endpoints:

1. **Update endpoint paths** - Add `multimodal/` to URL
   - Before: `/v1/api/n8n/anonymous/chat`
   - After: `/v1/api/n8n/multimodal/anonymous/chat`

2. **Remove `role` field** from request payload

3. **Update response handling** - Access `result` field instead of nested JSON

4. **Use vectorIdMap** - New field tracking uploaded attachment IDs

5. **Leverage vectorAttachments** - Full metadata about processed files

## Troubleshooting

### File not uploading
- Check file size (max 100 MB)
- Verify MIME type is supported
- Ensure total attachments < 500 MB
- Check network connection

### 401 Unauthorized
- Verify auth token is valid
- Check token hasn't expired
- Ensure token has required scopes
- Try refreshing token

### vectorAttachments empty
- File might be text-only or streaming
- Check API logs for processing errors
- Verify file was successfully uploaded

### Slow response
- Consider compressing files before upload
- Reduce number of attachments per request
- Check network latency
- Monitor API server load

## Security Notes

✅ **Implemented:**
- HTTPS required for production
- MIME type validation server-side
- File size limits enforced (100 MB per file, 500 MB total)
- JWT token support for authenticated endpoint
- CORS enabled (origins: *)
- Session isolation per chatbot

✅ **Best Practices:**
- Never log sensitive content
- Sanitize user input in UI
- Use HTTPS in production
- Rotate auth tokens regularly
- Monitor for suspicious patterns

## Support & References

- **Quick Reference:** `API_QUICK_REFERENCE.md`
- **Backend Example:** `BACKEND_IMPLEMENTATION_EXAMPLE.md`
- **N8N Integration:** `N8N_WEBHOOK_ATTACHMENT_PAYLOAD.md`
- **Email Support:** `api-support@example.com`

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 7, 2026 | Initial multimodal implementation |

---

**Last Updated:** February 7, 2026 | **Status:** ✅ Production Ready








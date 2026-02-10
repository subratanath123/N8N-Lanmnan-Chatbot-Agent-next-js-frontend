# Chat Widget Integration Guide - File Upload Support

## Quick Reference

### Files Documentation Created

1. **API_REQUEST_STRUCTURE.md** - Complete API request/response format with examples
2. **CHATWIDGET_API_TYPES.ts** - TypeScript interfaces for type-safe implementation
3. **BACKEND_IMPLEMENTATION_EXAMPLE.md** - Full backend implementation examples (Node.js/Express & Python/Flask)
4. **This file** - Integration guide and quick reference

## API Endpoints

```
POST /v1/api/n8n/authenticated/chat    (requires Authorization header)
POST /v1/api/n8n/anonymous/chat        (no auth required)
```

## Request Payload Structure

```json
{
  "role": "user",
  "message": "User message text",
  "attachments": [
    {
      "name": "filename.pdf",
      "type": "application/pdf",
      "size": 102400,
      "data": "JVBERi0xLjQKJeLjz9MNCjEgMCBvYmoK..."
    }
  ],
  "sessionId": "session_1707385649123_abc123xyz",
  "chatbotId": "chatbot_12345",
  "googleTokens": {  // optional
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## Response Format

The widget expects **at least one** of these fields:

```json
{
  "output": "AI response text",
  "data": "AI response text",
  "message": "AI response text",
  "response": "AI response text",
  "answer": "AI response text",
  "responseContent": "AI response text",
  "result": "AI response text"
}
```

## Key Features

### File Attachment Support

- ✅ Single file per message
- ✅ Base64 encoded
- ✅ File metadata included (name, type, size)
- ✅ All common file types supported
- ✅ File preview in UI before sending

### Supported MIME Types

| Category | Types |
|----------|-------|
| Images | jpeg, png, gif, webp |
| Documents | pdf, txt, csv, json |
| Office | docx, xlsx, pptx, doc, xls, ppt |
| Archives | zip, rar, 7z |
| Media | mp4, mp3, wav, ogg, mpeg, mov |

## Backend Implementation Checklist

- [ ] **Endpoint Setup**
  - [ ] Create POST endpoint at `/v1/api/n8n/authenticated/chat`
  - [ ] Create POST endpoint at `/v1/api/n8n/anonymous/chat`

- [ ] **Request Validation**
  - [ ] Validate all required fields present
  - [ ] Validate attachment format
  - [ ] Check Base64 encoding

- [ ] **Authentication**
  - [ ] Verify Bearer token (authenticated endpoint)
  - [ ] Extract user/chatbot context

- [ ] **File Processing**
  - [ ] Decode Base64 data
  - [ ] Validate file type/size
  - [ ] Create storage directory
  - [ ] Save file to disk/storage
  - [ ] (Optional) Scan for malware
  - [ ] (Optional) Extract file content

- [ ] **Message Processing**
  - [ ] Parse message text
  - [ ] Combine message + file context
  - [ ] Generate AI response
  - [ ] (Optional) File-specific analysis

- [ ] **Data Storage**
  - [ ] Store user message in database
  - [ ] Store file metadata
  - [ ] Store AI response
  - [ ] Index by sessionId/chatbotId

- [ ] **Response**
  - [ ] Return AI response in expected format
  - [ ] Include one of required response fields
  - [ ] Handle errors gracefully

- [ ] **Security**
  - [ ] Validate MIME types
  - [ ] Enforce file size limits
  - [ ] Sanitize filenames
  - [ ] Store outside web root
  - [ ] Implement access controls

## Testing

### Test Case 1: Text Message Only
```bash
curl -X POST http://localhost:3000/v1/api/n8n/anonymous/chat \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "message": "Hello!",
    "attachments": [],
    "sessionId": "test_session",
    "chatbotId": "test_bot"
  }'
```

### Test Case 2: Message with File
```bash
# First, create Base64 of a test file:
# base64 < test.txt > test.txt.b64

curl -X POST http://localhost:3000/v1/api/n8n/anonymous/chat \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "message": "Review this file",
    "attachments": [
      {
        "name": "test.txt",
        "type": "text/plain",
        "size": 1024,
        "data": "VGhpcyBpcyBhIHRlc3QgZmlsZQ=="
      }
    ],
    "sessionId": "test_session",
    "chatbotId": "test_bot"
  }'
```

### Test Case 3: File Only (No Text)
```bash
curl -X POST http://localhost:3000/v1/api/n8n/anonymous/chat \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "message": "Shared 1 file(s)",
    "attachments": [
      {
        "name": "image.jpg",
        "type": "image/jpeg",
        "size": 204800,
        "data": "/9j/4AAQSkZJRgABAQEAYABg..."
      }
    ],
    "sessionId": "test_session",
    "chatbotId": "test_bot"
  }'
```

## Integration Steps

### Step 1: Implement Endpoints
Using the examples from `BACKEND_IMPLEMENTATION_EXAMPLE.md`, create the two endpoints in your backend.

### Step 2: Handle File Attachments
- Decode Base64 data
- Save to storage
- Extract content if needed
- Store file metadata

### Step 3: Generate AI Response
- Combine user message with file context
- Call your AI service/N8N workflow
- Return response in expected format

### Step 4: Store in Database
- Save user message with attachments
- Save AI response
- Use sessionId for conversation tracking

### Step 5: Test
Use the test cases above to verify functionality.

## Common Patterns

### Pattern 1: File Analysis
```
User uploads PDF → Extract text → Summarize → Return summary
```

### Pattern 2: Image Recognition
```
User uploads image → Run OCR/Vision API → Analyze content → Return findings
```

### Pattern 3: Document Review
```
User uploads document + question → Extract content → Use AI to answer → Return answer
```

### Pattern 4: Multi-file Processing
```
User uploads files → Extract all content → Combine context → Generate response
```

## Performance Considerations

1. **File Size Limits**
   - Currently limited by request body size
   - Consider 10-50MB per file
   - Implement chunked upload for larger files

2. **Base64 Overhead**
   - Base64 increases file size by ~33%
   - Plan storage accordingly

3. **Processing Time**
   - File decoding: <10ms
   - Content extraction: Variable (10ms-5s depending on file)
   - AI processing: Depends on service (1s-30s)
   - Total user experience: Spinner shown during processing

4. **Concurrent Requests**
   - Each user has separate session
   - File storage organized by sessionId/chatbotId
   - Implement rate limiting if needed

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Invalid payload format | Check JSON structure |
| 401 Unauthorized | Invalid/missing token | Verify Bearer token |
| 413 Payload Too Large | File too large | Increase server limit or reduce file size |
| 500 Internal Error | Processing failure | Check server logs, validate file content |

### Recommended Error Responses

```json
{
  "error": "File size exceeds limit",
  "maxSize": 52428800,
  "providedSize": 102428800
}
```

## Database Schema Reference

### Users/Sessions
```sql
-- Track user sessions
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  chatbot_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP
);
```

### Messages
```sql
-- Store all messages
CREATE TABLE messages (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  chatbot_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'assistant'),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);
```

### Attachments
```sql
-- Store file attachments
CREATE TABLE attachments (
  id VARCHAR(255) PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INT,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(message_id) REFERENCES messages(id)
);
```

## Troubleshooting

### Widget Shows Loading Forever
- Check backend endpoint is accessible
- Verify CORS if cross-origin
- Check browser console for errors
- Verify apiUrl is correct in widget config

### Files Not Being Received
- Check Content-Type header is application/json
- Verify Base64 encoding is valid
- Check file size isn't too large
- Verify attachments array is present

### Response Not Showing
- Ensure response includes one of expected fields (output, message, data, etc.)
- Check response is valid JSON
- Verify response text is not empty

## Next Steps

1. Read `API_REQUEST_STRUCTURE.md` for detailed API specs
2. Review `CHATWIDGET_API_TYPES.ts` for TypeScript types
3. Choose Node.js or Python example from `BACKEND_IMPLEMENTATION_EXAMPLE.md`
4. Implement endpoints step by step
5. Test with provided test cases
6. Deploy and monitor

## Support

For issues or questions:
1. Check the documentation files in order
2. Review the backend examples
3. Verify request/response format matches spec
4. Check browser console and server logs
5. Test with curl commands to isolate issues

---

**Last Updated:** February 6, 2026
**Version:** 1.0
**Widget Version:** With file attachment support







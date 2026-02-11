# Chat Widget API - Quick Reference Card

## Endpoints
```
POST /v1/api/n8n/authenticated/chat
POST /v1/api/n8n/anonymous/chat
```

## Headers
```
Content-Type: application/json
Authorization: Bearer {token}  // Only for authenticated endpoint
```

## Complete Request Example
```json
{
  "role": "user",
  "message": "Please analyze this document",
  "attachments": [
    {
      "name": "report.pdf",
      "type": "application/pdf",
      "size": 102400,
      "data": "JVBERi0xLjQKJeLjz9MNCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iag=="
    }
  ],
  "sessionId": "session_1707385649123_abc123xyz",
  "chatbotId": "chatbot_12345"
}
```

## Complete Response Example
```json
{
  "output": "I've analyzed your PDF. Here are the key findings..."
}
```

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `role` | string | ✓ | Must be `"user"` |
| `message` | string | ✓ | Can be empty if only sending files |
| `attachments` | array | ✓ | Array of file objects (empty if no files) |
| `attachments[].name` | string | ✓ | Original filename |
| `attachments[].type` | string | ✓ | MIME type (e.g., "application/pdf") |
| `attachments[].size` | number | ✓ | File size in bytes |
| `attachments[].data` | string | ✓ | Base64 encoded content |
| `sessionId` | string | ✓ | Session identifier |
| `chatbotId` | string | ✓ | Chatbot identifier |
| `googleTokens` | object | ✗ | Optional OAuth tokens |

## Response Fields (One Required)
```
- output
- message
- data
- response
- answer
- responseContent
- result
```

## Common MIME Types
| Type | Extension |
|------|-----------|
| `application/pdf` | .pdf |
| `text/plain` | .txt |
| `text/csv` | .csv |
| `application/json` | .json |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | .xlsx |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | .pptx |
| `image/jpeg` | .jpg |
| `image/png` | .png |
| `image/gif` | .gif |
| `image/webp` | .webp |

## cURL Examples

### Text Only
```bash
curl -X POST http://api.example.com/v1/api/n8n/anonymous/chat \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "message": "Hello!",
    "attachments": [],
    "sessionId": "session_123",
    "chatbotId": "bot_456"
  }'
```

### With File
```bash
curl -X POST http://api.example.com/v1/api/n8n/anonymous/chat \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "message": "Review this",
    "attachments": [
      {
        "name": "doc.txt",
        "type": "text/plain",
        "size": 100,
        "data": "VGhpcyBpcyBhIHRlc3Q="
      }
    ],
    "sessionId": "session_123",
    "chatbotId": "bot_456"
  }'
```

### With Auth
```bash
curl -X POST http://api.example.com/v1/api/n8n/authenticated/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...payload...}'
```

## Node.js Implementation
```typescript
const response = await fetch(
  'http://api.example.com/v1/api/n8n/anonymous/chat',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'user',
      message: 'Text here',
      attachments: [],
      sessionId: 'session_123',
      chatbotId: 'bot_456'
    })
  }
);
const data = await response.json();
console.log(data.output);
```

## Python Implementation
```python
import requests
import json

payload = {
  "role": "user",
  "message": "Text here",
  "attachments": [],
  "sessionId": "session_123",
  "chatbotId": "bot_456"
}

response = requests.post(
  'http://api.example.com/v1/api/n8n/anonymous/chat',
  json=payload
)

print(response.json()['output'])
```

## Base64 Encoding Tips

### Command Line
```bash
# Encode file
base64 < file.txt > file.txt.b64

# Decode file
base64 -d < file.txt.b64 > file.txt
```

### Node.js
```javascript
// Encode
const base64 = Buffer.from(fileBuffer).toString('base64');

// Decode
const buffer = Buffer.from(base64String, 'base64');
```

### Python
```python
import base64

# Encode
encoded = base64.b64encode(file_bytes).decode('utf-8')

# Decode
decoded = base64.b64decode(encoded_string)
```

## File Size Calculations
```
Original Size × 1.33 ≈ Base64 Size
Example: 100KB file ≈ 133KB when base64 encoded
```

## Validation Checklist
- [ ] `role` is exactly `"user"`
- [ ] `message` is a string (can be empty)
- [ ] `attachments` is an array
- [ ] Each attachment has: name, type, size, data
- [ ] `sessionId` is a string
- [ ] `chatbotId` is a string
- [ ] Base64 `data` is valid
- [ ] Response includes one of expected fields

## Error Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid format) |
| 401 | Unauthorized (invalid token) |
| 413 | Payload Too Large |
| 500 | Server Error |

## Performance Targets
| Operation | Target Time |
|-----------|------------|
| Request parsing | <10ms |
| Base64 decoding | <10ms |
| File storage | <100ms |
| Text processing | <1s |
| File analysis | <5s |
| Total response | <10s |

## Storage Paths
```
uploads/
  {chatbotId}/
    {sessionId}/
      file1.pdf
      file2.txt
      ...
```

## Database Query Examples

### Get conversation
```sql
SELECT * FROM messages 
WHERE sessionId = 'session_123' 
  AND chatbotId = 'bot_456'
ORDER BY createdAt;
```

### Get attachments for message
```sql
SELECT * FROM attachments 
WHERE messageId = 'msg_789';
```

### Count files by user
```sql
SELECT sessionId, COUNT(*) as file_count
FROM attachments
GROUP BY sessionId;
```

## Security Headers
```
Content-Type: application/json
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## Rate Limiting (Recommended)
```
10 requests per second per session
100MB total files per session per day
5 concurrent uploads per session
```

## Documentation Links
- 📖 Full specs: `API_REQUEST_STRUCTURE.md`
- 💻 Examples: `BACKEND_IMPLEMENTATION_EXAMPLE.md`
- 🔧 Guide: `CHATWIDGET_INTEGRATION_GUIDE.md`
- 📑 Index: `DOCUMENTATION_INDEX.md`

---

**Print this page for quick reference! 📋**

Last Updated: February 6, 2026








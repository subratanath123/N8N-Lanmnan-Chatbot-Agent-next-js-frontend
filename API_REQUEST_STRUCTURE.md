# Chat Widget API Request Structure

## Overview
The chat widget sends POST requests to your backend API with chat messages and optional file attachments.

## Endpoint

**URL:** `{apiUrl}/v1/api/n8n/authenticated/chat` or `{apiUrl}/v1/api/n8n/anonymous/chat`

- Use **authenticated** endpoint if `authToken` is provided in widget config
- Use **anonymous** endpoint if no auth token

## HTTP Method
```
POST
```

## Headers

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {authToken}"  // Only if authToken is provided
}
```

## Request Body Structure

```json
{
  "role": "user",
  "message": "User's text message",
  "attachments": [
    {
      "name": "filename.pdf",
      "type": "application/pdf",
      "size": 102400,
      "data": "base64_encoded_file_content"
    }
  ],
  "sessionId": "session_1707385649123_abc123xyz",
  "chatbotId": "chatbot_12345",
  "googleTokens": {
    "accessToken": "optional_google_token",
    "refreshToken": "optional_google_refresh_token"
  }
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | ✅ Yes | Always `"user"` |
| `message` | string | ✅ Yes | User's text message (can be empty if only files) |
| `attachments` | array | ✅ Yes | Array of files (empty array `[]` if no files) |
| `attachments[].name` | string | ✅ Yes | Original filename (e.g., "document.pdf") |
| `attachments[].type` | string | ✅ Yes | MIME type (e.g., "application/pdf", "image/png", "text/plain") |
| `attachments[].size` | number | ✅ Yes | File size in bytes |
| `attachments[].data` | string | ✅ Yes | Base64 encoded file content |
| `sessionId` | string | ✅ Yes | Unique session ID for tracking conversation |
| `chatbotId` | string | ✅ Yes | The chatbot identifier |
| `googleTokens` | object | ❌ No | Optional Google OAuth tokens (only if user authenticated) |
| `googleTokens.accessToken` | string | No | Google access token |
| `googleTokens.refreshToken` | string | No | Google refresh token |

## Example Requests

### 1. Simple Text Message
```json
{
  "role": "user",
  "message": "Hello! How can I help?",
  "attachments": [],
  "sessionId": "session_1707385649123_abc123xyz",
  "chatbotId": "chatbot_12345"
}
```

### 2. Message with File Attachment
```json
{
  "role": "user",
  "message": "Please review this document",
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

### 3. File Only (No Text Message)
```json
{
  "role": "user",
  "message": "Shared 1 file(s)",
  "attachments": [
    {
      "name": "image.jpg",
      "type": "image/jpeg",
      "size": 204800,
      "data": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgIC..."
    }
  ],
  "sessionId": "session_1707385649123_abc123xyz",
  "chatbotId": "chatbot_12345"
}
```

### 4. Message with Multiple Attachments
```json
{
  "role": "user",
  "message": "Here are the documents I mentioned",
  "attachments": [
    {
      "name": "report.pdf",
      "type": "application/pdf",
      "size": 102400,
      "data": "JVBERi0xLjQKJeLjz9MNCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iag=="
    },
    {
      "name": "spreadsheet.xlsx",
      "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "size": 51200,
      "data": "PK3QDgAAAAAAAAAAAA..."
    }
  ],
  "sessionId": "session_1707385649123_abc123xyz",
  "chatbotId": "chatbot_12345"
}
```

## File Upload Implementation Notes

### Base64 Encoding
Files are converted to Base64 format in the widget before sending. The file data is the entire file encoded as Base64 string.

### Supported MIME Types
- **Images:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Documents:** `application/pdf`, `text/plain`, `text/csv`
- **Office:** `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx)
- **Spreadsheets:** `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx)
- **Presentations:** `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` (pptx)
- **Archives:** `application/zip`, `application/x-rar-compressed`
- **Video:** `video/mp4`, `video/mpeg`, `video/quicktime`
- **Audio:** `audio/mpeg`, `audio/wav`, `audio/ogg`

### File Size Limits
- Currently **1 file per message** is supported
- Maximum file size depends on your backend configuration

## Response Expected

The backend should return a response with the AI's reply:

```json
{
  "output": "AI response message",
  "data": "AI response message",
  "message": "AI response message",
  "response": "AI response message",
  "answer": "AI response message"
}
```

**Note:** The widget expects the response to have one of these fields containing the AI's text response. The fields can be:
- Direct string values: `"output": "Your response"`
- JSON string (will be parsed): `"output": "{\"output\": \"Your response\"}"`

## Session Management

- `sessionId`: Unique identifier generated per user session
- Stored in browser localStorage as `chatbot_session_{chatbotId}`
- Persists across page reloads for the same chatbot
- Allows backend to track conversation history per session

## Backend Implementation Checklist

- [ ] Accept POST requests at `/v1/api/n8n/authenticated/chat` and `/v1/api/n8n/anonymous/chat`
- [ ] Parse the JSON payload with all fields above
- [ ] Handle file attachments (decode Base64 if needed)
- [ ] Process user message with optional file context
- [ ] Generate AI response
- [ ] Return response with one of the expected response fields
- [ ] Store message and file data for conversation history
- [ ] Handle sessionId for conversation persistence

---

**Last Updated:** February 6, 2026







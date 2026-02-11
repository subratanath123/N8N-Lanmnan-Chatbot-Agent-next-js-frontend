# Chatbot Reply API - REST Endpoint Expectation

**Version:** 1.0  
**Date:** February 11, 2026  
**Status:** Production Ready

---

## Overview

The **Chatbot Reply API** allows you to send replies on behalf of a chatbot to an existing conversation. This is used in the conversation history admin panel to respond to user messages.

---

## Endpoint Specification

### Send Chatbot Reply

#### POST /v1/api/n8n/authenticated/chatbot-reply

Send a reply message on behalf of the chatbot in an existing conversation.

**Authentication:** Required (Bearer Token)

**Content-Type:** `application/json`

### Request

#### URL
```
POST /v1/api/n8n/authenticated/chatbot-reply
```

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

#### Body
```json
{
  "conversationId": "string",
  "chatbotId": "string",
  "message": "string",
  "role": "assistant"
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | string | ✅ Yes | ID of the conversation to reply to |
| `chatbotId` | string | ✅ Yes | ID of the chatbot sending the reply |
| `message` | string | ✅ Yes | The reply message content |
| `role` | string | ✅ Yes | Should always be "assistant" |

### Response

#### Success Response (HTTP 200)

```json
{
  "success": true,
  "messageId": "msg_1707385649123",
  "conversationId": "conv_123",
  "chatbotId": "chatbot_123",
  "message": "This is the chatbot's reply",
  "role": "assistant",
  "timestamp": 1707385649000,
  "savedToDatabase": true
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation was successful |
| `messageId` | string | Unique ID for the saved message |
| `conversationId` | string | The conversation ID |
| `chatbotId` | string | The chatbot ID |
| `message` | string | The message that was sent |
| `role` | string | Message role ("assistant") |
| `timestamp` | number | When the message was created (milliseconds) |
| `savedToDatabase` | boolean | Whether message was persisted to database |

#### Error Response (HTTP 400/401/500)

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": 1707385649000,
  "error": "INVALID_CONVERSATION_ID" | "UNAUTHORIZED" | "SERVER_ERROR"
}
```

---

## Example Requests

### Using cURL

```bash
curl -X POST "http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_123",
    "chatbotId": "chatbot_123",
    "message": "Thank you for your inquiry. How can I help you further?",
    "role": "assistant"
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch(
  'http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      conversationId: 'conv_123',
      chatbotId: 'chatbot_123',
      message: 'Thank you for your inquiry. How can I help you further?',
      role: 'assistant'
    })
  }
);

const result = await response.json();
console.log('Message sent:', result.messageId);
```

### Using Python

```python
import requests
import json

url = 'http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply'
headers = {
    'Authorization': f'Bearer {auth_token}',
    'Content-Type': 'application/json'
}
payload = {
    'conversationId': 'conv_123',
    'chatbotId': 'chatbot_123',
    'message': 'Thank you for your inquiry. How can I help you further?',
    'role': 'assistant'
}

response = requests.post(url, headers=headers, json=payload)
result = response.json()
print(f"Message saved with ID: {result['messageId']}")
```

---

## Implementation Requirements

### 1. Database Storage

The reply must be stored in the conversation history/chat database with:
- **conversationId** - Linked to the specific conversation
- **message** - The reply content
- **role** - Set to "assistant"
- **timestamp** - Current server timestamp
- **chatbotId** - The chatbot that sent the reply

### 2. Validation

Required validations:
- ✅ Verify JWT token is valid
- ✅ Verify user has permission to reply on behalf of chatbot
- ✅ Verify conversationId exists and belongs to the chatbotId
- ✅ Verify message is not empty
- ✅ Verify role is "assistant"

### 3. Response Format

Must return:
- ✅ `success` boolean
- ✅ `messageId` - Unique ID for the saved message
- ✅ `conversationId` and `chatbotId` - For confirmation
- ✅ `timestamp` - When message was created
- ✅ `savedToDatabase` - Confirmation of persistence

---

## Integration in Frontend

The frontend calls this endpoint when:

1. **User opens conversation history** in the admin panel
2. **User types a reply** in the reply text area
3. **User clicks "Reply" button**
4. **Frontend sends request** with:
   - Authorization header (Bearer token)
   - conversation ID
   - chatbot ID
   - Message content
5. **Frontend receives response** and:
   - Adds message to UI immediately
   - Clears input field
   - Shows success feedback

---

## Security Considerations

### 1. Authentication
- Must verify JWT token is valid
- Token should contain user/admin identity

### 2. Authorization
- Verify user is admin or manager
- Verify user has permission for this chatbot
- Verify user has permission to manage this conversation

### 3. Data Validation
- Message should not be empty
- Message should have reasonable length limit (e.g., 10,000 chars)
- ConversationId and chatbotId should be validated

### 4. Rate Limiting
- Consider rate limiting to prevent abuse
- Suggest: 100 replies per minute per user

---

## Error Scenarios

### 1. Invalid Conversation ID
```json
{
  "success": false,
  "message": "Conversation not found",
  "error": "INVALID_CONVERSATION_ID"
}
```
**HTTP Status:** 404

### 2. Unauthorized User
```json
{
  "success": false,
  "message": "You don't have permission to reply in this conversation",
  "error": "UNAUTHORIZED"
}
```
**HTTP Status:** 401

### 3. Chatbot Mismatch
```json
{
  "success": false,
  "message": "Conversation does not belong to this chatbot",
  "error": "CHATBOT_MISMATCH"
}
```
**HTTP Status:** 400

### 4. Empty Message
```json
{
  "success": false,
  "message": "Message cannot be empty",
  "error": "EMPTY_MESSAGE"
}
```
**HTTP Status:** 400

### 5. Server Error
```json
{
  "success": false,
  "message": "Failed to save message to database",
  "error": "SERVER_ERROR"
}
```
**HTTP Status:** 500

---

## Database Schema Requirement

The backend should store the reply with this structure:

```javascript
{
  messageId: "msg_1707385649123",          // Unique ID
  conversationId: "conv_123",              // Link to conversation
  chatbotId: "chatbot_123",                // Chatbot identifier
  message: "Reply content",                // Message text
  role: "assistant",                       // Always "assistant"
  timestamp: 1707385649000,                // Milliseconds since epoch
  createdAt: new Date(),                   // Server date object
  senderType: "admin_reply",               // Indicates admin/manual reply
  adminUserId: "user_456"                  // Optional: ID of admin who sent
}
```

---

## Frontend Integration Code

The frontend uses this endpoint in the conversation history panel:

```typescript
const handleSendChatbotReply = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!replyMessage.trim() || !selectedConversationId || !chatbotId) return;

  setIsSendingReply(true);
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(
      `${backendUrl}/v1/api/n8n/authenticated/chatbot-reply`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId: selectedConversationId,
          chatbotId: chatbotId,
          message: replyMessage,
          role: 'assistant'
        })
      }
    );

    const result = await response.json();
    
    // Add to UI
    const newMessage = {
      id: result.messageId,
      role: 'assistant',
      content: replyMessage,
      createdAt: new Date()
    };
    
    setConversationMessages((prev) => [...prev, newMessage]);
    setReplyMessage('');
  } finally {
    setIsSendingReply(false);
  }
};
```

---

## Testing Checklist

- [ ] Test with valid token and conversation ID
- [ ] Test with invalid conversation ID (should return 404)
- [ ] Test with invalid token (should return 401)
- [ ] Test with empty message (should return 400)
- [ ] Test with chatbotId mismatch
- [ ] Verify message saved to database
- [ ] Verify message appears in conversation history
- [ ] Test concurrent replies
- [ ] Test rate limiting

---

## Deployment Notes

1. Ensure endpoint is accessible from frontend URL
2. Configure CORS if frontend and backend on different origins
3. Ensure JWT token validation is working
4. Test database connectivity before deploying
5. Monitor endpoint for errors in production

---

**Status**: 🟢 **READY FOR IMPLEMENTATION**  
**Date Created**: February 11, 2026  
**Maintenance**: This API should be maintained as part of the conversation history feature


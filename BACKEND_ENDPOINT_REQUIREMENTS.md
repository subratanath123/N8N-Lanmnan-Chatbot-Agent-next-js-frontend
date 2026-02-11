# Backend Endpoint Requirements - Chatbot Reply API

**Date:** February 11, 2026  
**Version:** 1.0  
**Status:** For Implementation  
**Priority:** High

---

## 🎯 Objective

Implement a REST API endpoint that allows authenticated admins/managers to send replies on behalf of a chatbot in existing conversations. This is used in the conversation history admin panel.

---

## 📌 Endpoint Details

### Endpoint URL
```
POST /v1/api/n8n/authenticated/chatbot-reply
```

### Base URL
```
http://localhost:8080
```

### Full URL
```
POST http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply
```

---

## 🔐 Authentication

### Method
**Bearer Token (JWT)**

### Header
```
Authorization: Bearer {JWT_TOKEN}
```

### Token Source
- Issued by Clerk authentication system
- Verify token is valid and not expired
- Extract user information from token

### Example
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📤 Request Specification

### Content-Type
```
application/json
```

### HTTP Method
```
POST
```

### Request Body

```json
{
  "conversationId": "string",
  "chatbotId": "string",
  "message": "string",
  "role": "assistant"
}
```

### Request Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `conversationId` | string | ✅ Yes | Non-empty, exists in DB | Unique conversation identifier |
| `chatbotId` | string | ✅ Yes | Non-empty, matches conversation | Chatbot that owns the conversation |
| `message` | string | ✅ Yes | Non-empty, max 10000 chars | Reply message content |
| `role` | string | ✅ Yes | Must be "assistant" | Sender role (always "assistant") |

### Validation Rules

```
conversationId:
  - Must not be empty
  - Must exist in conversation collection
  - Must belong to the provided chatbotId
  - Format: string (any length acceptable)

chatbotId:
  - Must not be empty
  - Must match the chatbot owning the conversation
  - Format: string (any length acceptable)

message:
  - Must not be empty (trim whitespace)
  - Must not exceed 10000 characters
  - Allow any Unicode characters
  - Allow newlines and special characters

role:
  - Must be exactly "assistant" (case-sensitive)
  - Cannot be "user" or any other value
```

---

## 📥 Response Specification

### Success Response

#### HTTP Status
```
200 OK
```

#### Content-Type
```
application/json
```

#### Response Body

```json
{
  "success": true,
  "messageId": "msg_1707385649123",
  "conversationId": "conv_123",
  "chatbotId": "chatbot_123",
  "message": "Reply message content",
  "role": "assistant",
  "timestamp": 1707385649000,
  "savedToDatabase": true
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` on success |
| `messageId` | string | Unique ID for the saved message |
| `conversationId` | string | Echo back the conversation ID |
| `chatbotId` | string | Echo back the chatbot ID |
| `message` | string | Echo back the message sent |
| `role` | string | Echo back "assistant" |
| `timestamp` | number | Server time in milliseconds since epoch |
| `savedToDatabase` | boolean | Confirmation that message was persisted |

---

## ❌ Error Responses

### 1. Invalid Token / Unauthorized

#### HTTP Status
```
401 Unauthorized
```

#### Response Body
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "UNAUTHORIZED",
  "timestamp": 1707385649000
}
```

### 2. Missing Required Field

#### HTTP Status
```
400 Bad Request
```

#### Response Body
```json
{
  "success": false,
  "message": "conversationId is required",
  "error": "MISSING_FIELD",
  "timestamp": 1707385649000
}
```

### 3. Empty Message

#### HTTP Status
```
400 Bad Request
```

#### Response Body
```json
{
  "success": false,
  "message": "Message cannot be empty",
  "error": "EMPTY_MESSAGE",
  "timestamp": 1707385649000
}
```

### 4. Conversation Not Found

#### HTTP Status
```
404 Not Found
```

#### Response Body
```json
{
  "success": false,
  "message": "Conversation not found: conv_123",
  "error": "CONVERSATION_NOT_FOUND",
  "timestamp": 1707385649000
}
```

### 5. Chatbot ID Mismatch

#### HTTP Status
```
400 Bad Request
```

#### Response Body
```json
{
  "success": false,
  "message": "Conversation does not belong to this chatbot",
  "error": "CHATBOT_MISMATCH",
  "timestamp": 1707385649000
}
```

### 6. Insufficient Permissions

#### HTTP Status
```
403 Forbidden
```

#### Response Body
```json
{
  "success": false,
  "message": "You do not have permission to reply in this conversation",
  "error": "INSUFFICIENT_PERMISSIONS",
  "timestamp": 1707385649000
}
```

### 7. Message Too Long

#### HTTP Status
```
400 Bad Request
```

#### Response Body
```json
{
  "success": false,
  "message": "Message exceeds maximum length of 10000 characters",
  "error": "MESSAGE_TOO_LONG",
  "timestamp": 1707385649000
}
```

### 8. Invalid Role

#### HTTP Status
```
400 Bad Request
```

#### Response Body
```json
{
  "success": false,
  "message": "Role must be 'assistant'",
  "error": "INVALID_ROLE",
  "timestamp": 1707385649000
}
```

### 9. Database Error

#### HTTP Status
```
500 Internal Server Error
```

#### Response Body
```json
{
  "success": false,
  "message": "Failed to save message to database",
  "error": "DATABASE_ERROR",
  "timestamp": 1707385649000
}
```

---

## 🗄️ Database Requirements

### Collection/Table Name
```
conversations  (or appropriate collection name)
```

### Document Schema to Save

When saving the message, store it with this structure:

```javascript
{
  messageId: "msg_1707385649123",           // Unique ID (generate)
  conversationId: "conv_123",               // From request
  chatbotId: "chatbot_123",                 // From request
  message: "Reply message content",         // From request
  role: "assistant",                        // Always "assistant"
  timestamp: 1707385649000,                 // Current time in ms
  createdAt: new Date(),                    // Server date object
  senderType: "admin_reply",                // To distinguish from bot replies
  adminUserId: "user_456",                  // Optional: from JWT token
  status: "sent"                            // Optional: message status
}
```

### Where to Store
- Add as new document/record in the conversation's messages array/collection
- Or if you have a separate messages collection, link it to the conversation

---

## 🔍 Implementation Checklist

### Authentication & Authorization
- [ ] Verify JWT token is valid
- [ ] Verify token is not expired
- [ ] Extract user ID from token
- [ ] Check user has admin/manager role
- [ ] Check user has permission for this chatbot (optional but recommended)

### Input Validation
- [ ] Check all required fields are present
- [ ] Check no fields are null/undefined
- [ ] Trim and validate message is not empty
- [ ] Validate message length ≤ 10000 chars
- [ ] Validate role is exactly "assistant"
- [ ] Check conversationId format is valid

### Business Logic
- [ ] Verify conversation exists in database
- [ ] Verify conversation belongs to the chatbotId
- [ ] Check if user has permission to reply (authorization)
- [ ] Generate unique messageId (use timestamp + random or UUID)
- [ ] Get current server timestamp

### Database Operations
- [ ] Save message to database
- [ ] Ensure save is successful
- [ ] Return messageId to frontend

### Response
- [ ] Return HTTP 200 with success response
- [ ] Include all required fields
- [ ] Include correct timestamp

### Error Handling
- [ ] Return appropriate HTTP status codes
- [ ] Return error messages that help debugging
- [ ] Log errors for monitoring
- [ ] Never expose sensitive data in errors

---

## 📝 Implementation Example (Node.js/Express)

```typescript
// POST /v1/api/n8n/authenticated/chatbot-reply
app.post('/v1/api/n8n/authenticated/chatbot-reply', async (req, res) => {
  try {
    // 1. Verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Missing authorization token',
        error: 'UNAUTHORIZED',
        timestamp: Date.now()
      });
    }

    // Verify token (using your auth library)
    const user = verifyJWT(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'UNAUTHORIZED',
        timestamp: Date.now()
      });
    }

    // 2. Validate request body
    const { conversationId, chatbotId, message, role } = req.body;

    if (!conversationId || !chatbotId || !message || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'MISSING_FIELD',
        timestamp: Date.now()
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
        error: 'EMPTY_MESSAGE',
        timestamp: Date.now()
      });
    }

    if (message.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum length of 10000 characters',
        error: 'MESSAGE_TOO_LONG',
        timestamp: Date.now()
      });
    }

    if (role !== 'assistant') {
      return res.status(400).json({
        success: false,
        message: "Role must be 'assistant'",
        error: 'INVALID_ROLE',
        timestamp: Date.now()
      });
    }

    // 3. Check permissions
    // Verify user is admin/manager and has permission for this chatbot

    // 4. Check conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: `Conversation not found: ${conversationId}`,
        error: 'CONVERSATION_NOT_FOUND',
        timestamp: Date.now()
      });
    }

    // 5. Verify chatbot ID matches
    if (conversation.chatbotId !== chatbotId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation does not belong to this chatbot',
        error: 'CHATBOT_MISMATCH',
        timestamp: Date.now()
      });
    }

    // 6. Generate message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    // 7. Save message to database
    const newMessage = {
      messageId,
      conversationId,
      chatbotId,
      message: message.trim(),
      role: 'assistant',
      timestamp,
      createdAt: new Date(),
      senderType: 'admin_reply',
      adminUserId: user.id
    };

    await Conversation.findByIdAndUpdate(
      conversationId,
      { $push: { messages: newMessage } }
    );

    // 8. Return success response
    return res.status(200).json({
      success: true,
      messageId,
      conversationId,
      chatbotId,
      message: message.trim(),
      role: 'assistant',
      timestamp,
      savedToDatabase: true
    });

  } catch (error) {
    console.error('Error in chatbot-reply endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save message to database',
      error: 'DATABASE_ERROR',
      timestamp: Date.now()
    });
  }
});
```

---

## 🧪 Test Cases

### Test 1: Valid Request
```bash
curl -X POST "http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply" \
  -H "Authorization: Bearer valid_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_123",
    "chatbotId": "chatbot_123",
    "message": "Thank you for your inquiry!",
    "role": "assistant"
  }'
```
**Expected:** HTTP 200 with messageId

### Test 2: Missing Token
```bash
curl -X POST "http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply" \
  -H "Content-Type: application/json" \
  -d '{...}'
```
**Expected:** HTTP 401 Unauthorized

### Test 3: Empty Message
```bash
curl -X POST "http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply" \
  -H "Authorization: Bearer valid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_123",
    "chatbotId": "chatbot_123",
    "message": "",
    "role": "assistant"
  }'
```
**Expected:** HTTP 400 - EMPTY_MESSAGE

### Test 4: Invalid Conversation ID
```bash
curl -X POST "http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply" \
  -H "Authorization: Bearer valid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "invalid_id",
    "chatbotId": "chatbot_123",
    "message": "Reply",
    "role": "assistant"
  }'
```
**Expected:** HTTP 404 - CONVERSATION_NOT_FOUND

### Test 5: Chatbot ID Mismatch
```bash
curl -X POST "http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply" \
  -H "Authorization: Bearer valid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_123",
    "chatbotId": "different_chatbot",
    "message": "Reply",
    "role": "assistant"
  }'
```
**Expected:** HTTP 400 - CHATBOT_MISMATCH

---

## 📊 Response Time Requirement

- **Target:** < 500ms for successful requests
- **Database Save:** Should complete within 200ms
- **Token Verification:** Should complete within 50ms

---

## 🔗 Related Information

- **Frontend Calling Code:** See `app/ai-chatbots/[id]/page.tsx`
- **Full API Documentation:** See `CHATBOT_REPLY_API.md`
- **Feature Overview:** See `CHATBOT_REPLY_FEATURE.md`

---

## 📋 Acceptance Criteria

- [ ] Endpoint accepts POST requests at correct URL
- [ ] Requires and validates JWT token
- [ ] Validates all input parameters
- [ ] Saves message to database with correct structure
- [ ] Returns HTTP 200 with messageId on success
- [ ] Returns appropriate error codes (400, 401, 403, 404, 500)
- [ ] Error messages are descriptive
- [ ] All test cases pass
- [ ] Response time < 500ms
- [ ] Message persists after save (can be retrieved in conversation history)
- [ ] Message ID is unique
- [ ] Timestamp is server time (not client time)

---

## 📞 Questions for Clarification

If any requirements are unclear, please ask:

1. Should we validate user permissions (admin-only)?
2. Should we log who sent the reply?
3. Should we validate the chatbotId format?
4. Should we have a rate limit?
5. Should reply messages go to a separate collection or same conversation array?

---

**Status:** Ready for Implementation  
**Created:** February 11, 2026  
**Version:** 1.0


# Endpoint Quick Reference - For Backend Developer

**Quick Start Guide - Copy & Paste Ready**

---

## 🚀 The Endpoint

```
POST /v1/api/n8n/authenticated/chatbot-reply
```

---

## 📨 Request (What Frontend Sends)

```json
{
  "conversationId": "conv_123",
  "chatbotId": "chatbot_123",
  "message": "Thank you for your inquiry!",
  "role": "assistant"
}
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## ✅ Response (What Backend Should Return)

**HTTP Status: 200 OK**

```json
{
  "success": true,
  "messageId": "msg_1707385649123",
  "conversationId": "conv_123",
  "chatbotId": "chatbot_123",
  "message": "Thank you for your inquiry!",
  "role": "assistant",
  "timestamp": 1707385649000,
  "savedToDatabase": true
}
```

---

## ⚠️ Errors (What Backend Should Return on Failure)

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "UNAUTHORIZED",
  "timestamp": 1707385649000
}
```

### 400 - Bad Request (Various)
```json
{
  "success": false,
  "message": "Message cannot be empty",
  "error": "EMPTY_MESSAGE",
  "timestamp": 1707385649000
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Conversation not found: conv_123",
  "error": "CONVERSATION_NOT_FOUND",
  "timestamp": 1707385649000
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Failed to save message to database",
  "error": "DATABASE_ERROR",
  "timestamp": 1707385649000
}
```

---

## 🔍 Validation Checklist

- [ ] conversationId exists in database
- [ ] chatbotId matches the conversation
- [ ] message is not empty
- [ ] message is not longer than 10,000 characters
- [ ] role is exactly "assistant"
- [ ] JWT token is valid
- [ ] User is authenticated

---

## 💾 What to Save in Database

```javascript
{
  messageId: "msg_1707385649123",           // Generate: unique ID
  conversationId: "conv_123",               // From request
  chatbotId: "chatbot_123",                 // From request
  message: "Thank you for your inquiry!",   // From request
  role: "assistant",                        // Always "assistant"
  timestamp: 1707385649000,                 // Current time in milliseconds
  createdAt: new Date(),                    // Current date object
  senderType: "admin_reply",                // To mark as admin reply
  adminUserId: "user_456"                   // Optional: from JWT token
}
```

---

## 📝 Minimal Implementation (Node.js)

```typescript
app.post('/v1/api/n8n/authenticated/chatbot-reply', async (req, res) => {
  const { conversationId, chatbotId, message, role } = req.body;
  
  // Validate
  if (!message?.trim()) return res.status(400).json({ error: 'EMPTY_MESSAGE' });
  if (role !== 'assistant') return res.status(400).json({ error: 'INVALID_ROLE' });
  
  // Check conversation
  const conv = await Conversation.findById(conversationId);
  if (!conv) return res.status(404).json({ error: 'CONVERSATION_NOT_FOUND' });
  if (conv.chatbotId !== chatbotId) return res.status(400).json({ error: 'CHATBOT_MISMATCH' });
  
  // Save
  const messageId = `msg_${Date.now()}`;
  const timestamp = Date.now();
  
  await Conversation.findByIdAndUpdate(
    conversationId,
    { $push: { messages: { messageId, conversationId, chatbotId, message, role, timestamp } } }
  );
  
  // Return
  return res.status(200).json({
    success: true,
    messageId,
    conversationId,
    chatbotId,
    message,
    role,
    timestamp,
    savedToDatabase: true
  });
});
```

---

## 🧪 Test with cURL

```bash
curl -X POST "http://localhost:8080/v1/api/n8n/authenticated/chatbot-reply" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_123",
    "chatbotId": "chatbot_123",
    "message": "Thank you for contacting us!",
    "role": "assistant"
  }'
```

---

## 🎯 Key Points

1. **Always return `success` field** (true/false)
2. **Always return `timestamp`** (in milliseconds)
3. **Return correct HTTP status codes** (200, 400, 401, 404, 500)
4. **Save to database before responding**
5. **Generate unique messageId** 
6. **Verify conversation exists**
7. **Check chatbotId matches conversation**
8. **Validate message is not empty**

---

## 🔗 Where Frontend Calls This

File: `app/ai-chatbots/[id]/page.tsx`

```typescript
const response = await fetch(
  `${backendUrl}/v1/api/n8n/authenticated/chatbot-reply`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      conversationId: selectedConversationId,
      chatbotId: chatbotId,
      message: replyMessage,
      role: 'assistant'
    })
  }
);
```

---

## 📚 Full Documentation

For complete details, see: `BACKEND_ENDPOINT_REQUIREMENTS.md`

This file has all error scenarios, examples, test cases, and implementation guidance.

---

**Created:** February 11, 2026  
**Status:** Ready for Implementation


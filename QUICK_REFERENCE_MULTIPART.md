# Chat Widget - Quick Integration Card

## Endpoints

### Send Message (Multipart)
```
POST /v1/api/n8n/multimodal/authenticated/multipart/chat
POST /v1/api/n8n/multimodal/anonymous/multipart/chat
```

**Content-Type:** `multipart/form-data` (automatic)

## Form Fields

```
message          (string, required)  - User message text
chatbotId        (string, required)  - Chatbot identifier
sessionId        (string, required)  - Session identifier
files            (file, optional)    - Attached files (repeatable)
googleAccessToken    (string, optional) - Google OAuth token
googleRefreshToken   (string, optional) - Google OAuth refresh token
```

## JavaScript (Vanilla)

```javascript
const formData = new FormData();
formData.append('message', 'Your message');
formData.append('chatbotId', 'bot-123');
formData.append('sessionId', `session-${Date.now()}`);

// Add files
for (let file of fileInput.files) {
  formData.append('files', file);
}

const response = await fetch(
  '/v1/api/n8n/multimodal/authenticated/multipart/chat',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  }
);

const data = await response.json();
console.log(data.result.response); // AI response
```

## React Hooks

```jsx
import { useState } from 'react';

export function ChatComponent() {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [response, setResponse] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('message', message);
    formData.append('chatbotId', 'bot-123');
    formData.append('sessionId', `session-${Date.now()}`);
    
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch(
        '/v1/api/n8n/multimodal/authenticated/multipart/chat',
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        }
      );
      const data = await res.json();
      setResponse(data.result.response);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSend}>
      <input type="file" onChange={(e) => setFiles(Array.from(e.target.files))} multiple />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
      <button type="submit">Send</button>
      {response && <p>{response}</p>}
    </form>
  );
}
```

## Vue 3

```vue
<script setup>
import { ref } from 'vue';

const message = ref('');
const files = ref([]);
const response = ref('');

const handleSend = async () => {
  const formData = new FormData();
  formData.append('message', message.value);
  formData.append('chatbotId', 'bot-123');
  formData.append('sessionId', `session-${Date.now()}`);
  
  files.value.forEach(file => formData.append('files', file));

  const res = await fetch('/v1/api/n8n/multimodal/authenticated/multipart/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: formData
  });
  
  const data = await res.json();
  response.value = data.result.response;
};
</script>

<template>
  <form @submit.prevent="handleSend">
    <input type="file" @change="(e) => files = Array.from(e.target.files)" multiple />
    <textarea v-model="message" />
    <button type="submit">Send</button>
    <p>{{ response }}</p>
  </form>
</template>
```

## Svelte

```svelte
<script>
  let message = '';
  let files = [];
  let response = '';

  async function handleSend(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('message', message);
    formData.append('chatbotId', 'bot-123');
    formData.append('sessionId', `session-${Date.now()}`);
    
    files.forEach(file => formData.append('files', file));

    const res = await fetch('/v1/api/n8n/multimodal/authenticated/multipart/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    
    const data = await res.json();
    response = data.result.response;
  }
</script>

<form on:submit={handleSend}>
  <input type="file" bind:files multiple />
  <textarea bind:value={message} />
  <button type="submit">Send</button>
  <p>{response}</p>
</form>
```

## cURL

```bash
# Text only
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/anonymous/multipart/chat \
  -F "message=Hello" \
  -F "chatbotId=bot-1" \
  -F "sessionId=sess-1"

# With file
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/authenticated/multipart/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=Analyze this" \
  -F "chatbotId=bot-1" \
  -F "sessionId=sess-1" \
  -F "files=@document.pdf"

# Multiple files
curl -X POST http://localhost:8080/v1/api/n8n/multimodal/authenticated/multipart/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=Process both" \
  -F "chatbotId=bot-1" \
  -F "sessionId=sess-1" \
  -F "files=@file1.pdf" \
  -F "files=@file2.xlsx"
```

## Response

```json
{
  "success": true,
  "result": {
    "response": "Analysis complete..."
  },
  "vectorIdMap": {
    "document.pdf": "attachment_bot_123_..."
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

## Error Response

```json
{
  "success": false,
  "errorCode": "FILE_TOO_LARGE",
  "errorMessage": "File size exceeds 100 MB limit",
  "timestamp": 1707385650000
}
```

## File Limits

| Constraint | Limit |
|-----------|-------|
| File size | 100 MB |
| Total size | 500 MB |
| Files per request | 20 |

## Supported Types

- PDF (`.pdf`)
- Images (`.jpg`, `.png`, `.gif`, `.webp`)
- Documents (`.doc`, `.docx`, `.txt`)
- Spreadsheets (`.xls`, `.xlsx`, `.csv`)
- Presentations (`.ppt`, `.pptx`)

## Helper Functions

```typescript
import {
  sendMultimodalMessageFormData,
  validateFile,
  validateTotalAttachmentSize,
  listAttachments,
  deleteAttachment
} from '@/widget/multimodalApiHelper';

// Send message
const res = await sendMultimodalMessageFormData(
  apiUrl, message, files, chatbotId, sessionId, authToken
);

// Validate single file
const error = validateFile(file);

// Validate total size
const error = validateTotalAttachmentSize(files);

// List attachments
const attachments = await listAttachments(apiUrl, chatbotId, authToken);

// Delete attachment
await deleteAttachment(apiUrl, chatbotId, vectorId, authToken);
```

## Key Points

✅ **Always include:** message, chatbotId, sessionId
✅ **Use multipart/form-data** for file uploads
✅ **Reuse sessionId** for conversation continuity
✅ **Access response** via `data.result.response`
✅ **Track files** using `vectorIdMap` and `vectorAttachments`

❌ **Don't:**
- Send files > 100 MB
- Create new sessionId each message
- Use JSON Content-Type for files
- Forget Authorization header for authenticated endpoint

---

**Last Updated:** Feb 8, 2026





# File Attachment API - Quick Start Guide

**TL;DR** - Upload files once, use fileId in messages. No more base64!

---

## What Changed?

### Before (Old Way - Base64)
```
User selects file
  ↓
Convert to base64 (slow, large)
  ↓
Include in chat message (payload bloat)
  ↓
Send everything together
```

### Now (New Way - FileId)
```
User selects file
  ↓
Upload to API (fast, clean)
  ↓
Get fileId back
  ↓
Include just fileId in message (small payload)
  ↓
Send message with fileId reference
```

---

## How It Works

### For Users

1. **Click attachment button** 📎
2. **Select file**
3. **File uploads automatically**
4. **Type your message**
5. **Click Send**
6. **Attachments show in message with download link** ⬇️

### For Developers

```typescript
// Service is already integrated!
// Just use it in your components:

const attachmentService = getAttachmentService('/api/attachments', chatbotId);

// Upload a file
const result = await attachmentService.uploadFile(file, sessionId);
// Returns: { fileId, fileName, downloadUrl, ... }

// Include in chat message
const payload = {
  message: 'Check this out',
  fileAttachments: [
    {
      fileId: result.fileId,
      fileName: result.fileName,
      // ... other metadata
    }
  ]
};

// Send to backend
```

---

## Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **AttachmentService** | Upload/download files | `src/services/attachmentService.ts` |
| **AssistantChatWindow** | Main chat interface | `src/component/AssistantChatWindow.tsx` |
| **ChatInput** | Input with attachment button | `src/component/openwebui/ChatInput.tsx` |
| **ChatMessage** | Display messages with attachments | `src/component/openwebui/ChatMessage.tsx` |
| **API Routes** | Proxy to backend | `app/api/attachments/*` |

---

## API Endpoints

All go through frontend proxy at `/api/attachments/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/upload` | POST | Upload file, get fileId |
| `/download/{fileId}` | GET | Download file by fileId |
| `/metadata/{fileId}` | GET | Get file info |
| `/list/{chatbotId}` | GET | List all files |
| `/{fileId}` | DELETE | Delete file |

---

## Configuration

### Minimal Setup (Works Out of Box)
No configuration needed! It will:
- Use frontend proxy at `/api/attachments/`
- Use your current chatbotId
- Work with your sessionId

### Optional Configuration
```env
# In .env.local
NEXT_PUBLIC_ATTACHMENT_API_URL=http://localhost:8080
REACT_APP_CHATBOT_ID=my_bot_id
```

---

## Response Format

### Upload
```json
{
  "fileId": "file_chatbot_123_session_456_doc_1707385649123",
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 256000,
  "downloadUrl": "http://...",
  "uploadedAt": 1707385649000,
  "status": "stored"
}
```

### In Chat Message (Now Using FileId)
```json
{
  "message": "Here's the document",
  "fileAttachments": [
    {
      "fileId": "file_chatbot_123_session_456_doc_1707385649123",
      "fileName": "document.pdf",
      "mimeType": "application/pdf",
      "fileSize": 256000,
      "downloadUrl": "http://..."
    }
  ],
  "sessionId": "session_456",
  "chatbotId": "chatbot_123"
}
```

---

## Common Tasks

### Upload a File
```typescript
const service = getAttachmentService('/api/attachments', 'my_bot');
const result = await service.uploadFile(file, 'session_123');
console.log('Uploaded with ID:', result.fileId);
```

### Get File Info
```typescript
const metadata = await service.getFileMetadata(fileId);
console.log('File size:', metadata.formattedFileSize);
```

### List All Files
```typescript
const list = await service.listFiles();
console.log('Total files:', list.totalFiles);
```

### Delete a File
```typescript
await service.deleteFile(fileId);
console.log('File deleted');
```

### Download a File
```typescript
await service.downloadFileToClient(fileId, 'myfile.pdf');
// File auto-downloads to user's computer
```

---

## Error Handling

```typescript
try {
  const result = await service.uploadFile(file, sessionId);
} catch (error) {
  if (error instanceof Error) {
    console.error('Upload error:', error.message);
    // Show user-friendly message
  }
}
```

Common errors:
- "Network error during file upload" - Check backend
- "File is empty" - File has no content
- "chatbotId is required" - Include chatbot ID
- "File not found" - fileId is wrong or file deleted

---

## File Size Limits

- **Maximum**: 15 MB per file
- **Enforced by**: Backend
- **Will show error**: "File size too large"

---

## What's Included

### Components Already Updated
✅ AssistantChatWindow - Full file support
✅ ChatInput - Attachment button + UI
✅ ChatMessage - Display attachments with download
✅ Types - FileAttachment interface

### API Routes Already Created
✅ `/api/attachments/upload` - Upload proxy
✅ `/api/attachments/download/[fileId]` - Download proxy
✅ `/api/attachments/metadata/[fileId]` - Metadata proxy
✅ `/api/attachments/list/[chatbotId]` - List proxy
✅ `/api/attachments/[fileId]` - Delete proxy

### Service Already Provided
✅ AttachmentService - Full client implementation
✅ getAttachmentService() - Singleton factory
✅ updateAttachmentService() - Config updater

---

## Testing Your Integration

1. Start your backend with File Attachment API running
2. Set `NEXT_PUBLIC_ATTACHMENT_API_URL` if not localhost:8080
3. Open the chat interface
4. Click 📎 button
5. Select a file
6. Type a message
7. Click Send
8. Verify:
   - ✅ File uploads (green bar shows)
   - ✅ Message shows file attachment
   - ✅ Download link works

---

## Troubleshooting

### Files not uploading
```
Check: 
1. Is backend running?
2. Can you reach http://localhost:8080/api/attachments/list/test
3. Check browser console for errors
4. File size < 15MB?
```

### Download links broken
```
Check:
1. fileId correct?
2. chatbotId matches upload?
3. File not deleted?
4. Check network tab in DevTools
```

### Slow uploads
```
Check:
1. Network connection speed
2. Backend CPU/memory
3. File size (very large files)
4. Network latency
```

---

## Next Steps

1. **Start backend** - File Attachment API must be running
2. **Set environment** - Optional, but recommended
3. **Test upload** - Try uploading a file
4. **Check chat** - Message should include file reference
5. **Download** - Verify download link works

---

## Key Differences from Base64

| Aspect | Base64 | FileId |
|--------|--------|--------|
| Conversion | Manual (slow) | Automatic upload |
| Payload | Large (includes file) | Small (just ID) |
| Storage | In message | In separate service |
| Reuse | Not possible | Easy via fileId |
| Performance | Poor for large files | Excellent |
| Backend parsing | Complex | Simple lookup |
| User feedback | None | Upload progress |
| Security | Embedded | Separated |

---

## Support Resources

- **Full docs**: `FILE_ATTACHMENT_API_INTEGRATION.md`
- **Code examples**: `src/services/attachmentService.ts`
- **Component examples**: `src/component/AssistantChatWindow.tsx`
- **Type definitions**: `src/component/openwebui/types.ts`

---

## Questions?

- Check the full integration guide
- Look at component implementations
- Review API proxy routes
- Check browser console for errors
- Look at network tab in DevTools

Good luck! 🚀


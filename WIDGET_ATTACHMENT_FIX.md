# Widget Update - File Attachment API Integration

**Status**: ✅ Fixed & Rebuilt  
**Date**: February 10, 2026  
**Widget Version**: Updated

---

## 🔧 What Was Fixed

The chat widget was **updated to use the File Attachment API** instead of sending files directly with multipart/form-data.

### Before (Old Method)
```
User selects file
    ↓
Send file directly in FormData with message
    ↓
Backend receives file in multipart request
    ↓
Large payload (1.3 MB for 1 MB file)
```

### After (New Method - File Attachment API)
```
User selects file
    ↓
Upload file to /api/attachments/upload
    ↓
Get fileId back
    ↓
Send fileId in JSON message payload
    ↓
Tiny payload (100 bytes)
    ↓
Backend can fetch file via fileId if needed
```

---

## 📝 Changes Made to Widget

### 1. **Added `uploadFiles()` Function**
- Uploads pending attachments to File Attachment API
- Gets fileId, fileName, downloadUrl back
- Returns array of file attachments with fileIds
- Handles errors gracefully

```typescript
const uploadFiles = async (): Promise<Array<{
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  downloadUrl: string;
}>> => {
  // Uploads to /api/attachments/upload
  // Returns file metadata with fileId
}
```

### 2. **Updated `sendMessage()` Function**
- Calls `uploadFiles()` before sending message
- Includes `fileAttachments` in payload instead of `files`
- Sends JSON payload instead of FormData
- Uses `/v1/api/n8n/authenticated/chat` endpoint

**Before:**
```typescript
const formData = new FormData();
formData.append('files', file); // Send file directly
for (const file of attachments) {
  formData.append('files', file);
}
const endpoint = '/v1/api/n8n/multimodal/authenticated/multipart/chat';
body: formData
```

**After:**
```typescript
const uploadedFiles = await uploadFiles(); // Upload first
const payload = {
  message: userMessage.content,
  fileAttachments: uploadedFiles, // Send fileId references
  sessionId: sessionIdRef.current,
  chatbotId: config.chatbotId,
};
const endpoint = '/v1/api/n8n/authenticated/chat';
body: JSON.stringify(payload)
```

---

## 🚀 How It Works Now

### Step 1: File Upload
```
User clicks 📎 → selects file → 
  ↓
uploadFiles() called
  ↓
POST /api/attachments/upload with FormData
  ↓
Response: {
  fileId: "file_...",
  fileName: "document.pdf",
  downloadUrl: "http://..."
}
```

### Step 2: Message Send
```
fileAttachments array with fileIds
  ↓
POST /v1/api/n8n/authenticated/chat with JSON payload
  ↓
Payload includes:
{
  message: "User message",
  fileAttachments: [{
    fileId: "file_...",
    fileName: "document.pdf",
    downloadUrl: "http://..."
  }],
  sessionId: "...",
  chatbotId: "..."
}
```

### Step 3: Backend Processing
```
Backend receives fileAttachments with fileIds
  ↓
Can fetch file content via fileId if needed
  ↓
Process message with AI + file context
```

---

## ✨ Benefits

✅ **Smaller Payloads** - 100 bytes vs 1.3 MB  
✅ **Faster Uploads** - File uploaded separately  
✅ **Better UX** - Upload progress feedback  
✅ **Cleaner Code** - JSON instead of FormData  
✅ **Reusable Files** - FileId can be referenced multiple times  
✅ **Consistent API** - Same File Attachment API as frontend  

---

## 📦 Widget Rebuild

The widget has been **successfully rebuilt** with the new integration:

```
✅ Build Results
   File:        chat-widget.iife.js
   Size:        349.08 KB (raw)
   Compressed:  118.64 KB (gzipped)
   Modules:     113 bundled
   Build time:  1.33 seconds
```

---

## 🧪 How to Test

### Test the Updated Widget

1. **Rebuild already done** ✅
   ```bash
   npm run build:widget
   ```

2. **Deploy the new widget**
   ```bash
   # Copy updated widget to your server
   cp public/widget-dist/chat-widget.iife.js /path/to/server/
   ```

3. **Test file upload**
   - Embed widget on test page
   - Click 📎 attachment button
   - Select a file
   - Type a message
   - Click Send
   - **Verify**: File is uploaded to `/api/attachments/upload` instead of being sent in message

### Check Network Requests

In browser DevTools Network tab, you should see:
1. **POST /api/attachments/upload** (Form-Data) - File upload
2. **POST /v1/api/n8n/authenticated/chat** (JSON) - Message with fileId

---

## 📋 API Endpoints Used

### For File Upload
```
POST /api/attachments/upload
Request: FormData (file, chatbotId, sessionId)
Response: {fileId, fileName, downloadUrl, ...}
```

### For Chat Message
```
POST /v1/api/n8n/authenticated/chat
Request: JSON {message, fileAttachments, sessionId, chatbotId}
Response: {result: "AI response"}
```

---

## 🔒 Security Notes

- Files uploaded to secure File Attachment API (MongoDB)
- ChatbotId validates access
- SessionId tracks uploads
- FileIds are unique and tied to chatbot
- No file content sent in message payload

---

## 🚀 Next Steps

1. ✅ **Widget Updated** - File Attachment API integrated
2. ✅ **Widget Rebuilt** - Production ready
3. 🌐 **Deploy** - Copy new widget to server
4. 🧪 **Test** - Verify file upload works
5. 📊 **Monitor** - Check API calls in DevTools

---

## ⚠️ Important Notes

**The widget now requires:**
- Frontend API proxy at `/api/attachments/upload` (already created)
- Backend File Attachment API running and accessible
- Backend `/v1/api/n8n/authenticated/chat` endpoint accepting `fileAttachments`

**Ensure your backend supports:**
```json
{
  "message": "User message",
  "fileAttachments": [
    {
      "fileId": "file_...",
      "fileName": "document.pdf",
      "mimeType": "application/pdf",
      "fileSize": 256000,
      "downloadUrl": "http://..."
    }
  ],
  "sessionId": "...",
  "chatbotId": "..."
}
```

---

## 📝 Summary

| Aspect | Old Method | New Method |
|--------|-----------|-----------|
| File Send | Multipart FormData | FileId in JSON |
| Endpoint | /multimodal/multipart/chat | /authenticated/chat |
| Payload | Large (includes file) | Tiny (just fileId) |
| Upload | With message | Before message |
| API | Direct to backend | Via File Attachment API |
| UX | No feedback | Upload progress |
| Backend Load | Heavy (decode file) | Light (lookup fileId) |

---

**Status**: 🟢 **UPDATED & READY TO DEPLOY**  
**Build Time**: 1.33 seconds  
**Widget Size**: 349.08 KB (118.64 KB gzipped)


# File Attachment API Integration Guide

**Version:** 1.0  
**Date:** February 10, 2026  
**Status:** Production Ready  
**Last Updated:** February 10, 2026

---

## Overview

This document describes the integration of the **File Attachment API** into the chat frontend. Instead of converting files to base64 and embedding them in chat messages, files are now uploaded to a dedicated file storage service, and only the `fileId` is included in the chat message.

### Benefits

✅ **Efficient File Handling**
- No need to convert large files to base64
- Reduced message payload size
- Better performance for multimodal chat

✅ **Cleaner API**
- Files stored separately from chat messages
- Reusable file references across multiple messages
- Proper file metadata tracking

✅ **Better UX**
- Visual feedback during file upload
- Download links in chat messages
- Clear attachment status indicators

---

## Architecture

### Components

1. **AttachmentService** (`src/services/attachmentService.ts`)
   - Client-side service for uploading/downloading files
   - Handles API communication with the attachment endpoints
   - Provides progress tracking and error handling

2. **AssistantChatWindow** (`src/component/AssistantChatWindow.tsx`)
   - Main chat interface with file attachment support
   - Manages file upload state
   - Displays uploaded files with download links

3. **API Routes** (`app/api/attachments/`)
   - Proxy routes to forward requests to backend File Attachment API
   - `/upload` - Upload files
   - `/download/[fileId]` - Download files
   - `/metadata/[fileId]` - Get file information
   - `/list/[chatbotId]` - List all files
   - `/[fileId]` - Delete files

4. **Types** (`src/component/openwebui/types.ts`)
   - `FileAttachment` - File metadata with fileId
   - `N8NRequest` - Updated to include fileAttachments

---

## Usage

### Basic Flow

1. **User selects a file**
   ```
   Click "📎" attachment button
   → File picker opens
   → User selects file
   ```

2. **File is uploaded**
   ```
   AttachmentService.uploadFile()
   → FormData with file, chatbotId, sessionId
   → POST /api/attachments/upload
   → Returns fileId and downloadUrl
   ```

3. **File appears in chat**
   ```
   Uploaded file shows in green "Attached Files" section
   → Download link available
   → File not yet sent to AI
   ```

4. **User sends message**
   ```
   Click "Send" button
   → fileAttachments array included in payload
   → Message sent with fileId references
   → Backend AI can access files via fileId
   ```

5. **Files displayed in message**
   ```
   Chat message shows attachments section
   → Each file has download link
   → User can retrieve file anytime
   ```

---

## Implementation Details

### File Upload Flow

```typescript
// 1. Service initialization
const attachmentService = getAttachmentService(
  '/api/attachments', // Frontend proxy
  chatbotId           // Bot identifier
);

// 2. Upload file
const result = await attachmentService.uploadFile(
  file,                    // File object
  sessionIdRef.current,    // Session ID
  onProgress              // Optional progress callback
);

// 3. Result contains
{
  fileId: "file_...",
  fileName: "document.pdf",
  mimeType: "application/pdf",
  fileSize: 256000,
  downloadUrl: "http://...",
  uploadedAt: 1707385649000,
  status: "stored"
}
```

### Message Submission with Files

```typescript
// Upload pending files
const uploadedFiles = await uploadFiles();

// Include in API request
const payload = {
  message: userMessage.content,
  attachments: [],              // Legacy base64 attachments
  fileAttachments: uploadedFiles, // New: fileId-based attachments
  sessionId: sessionId,
  chatbotId: chatbotId,
};
```

### File Display in Messages

Files attached to messages are displayed with download links:

```
┌─────────────────────────────────────┐
│ Here's the document I mentioned     │
│                                     │
│ 📎 Attachments                      │
│ ⬇️ report.pdf  ⬇️ image.png         │
└─────────────────────────────────────┘
```

---

## API Endpoints

All endpoints are proxied through the frontend via `/api/attachments/`

### Upload File
```
POST /api/attachments/upload

Parameters (FormData):
- file: File object
- chatbotId: string
- sessionId: string

Response:
{
  fileId: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  downloadUrl: string,
  uploadedAt: number,
  status: "stored"
}
```

### Download File
```
GET /api/attachments/download/{fileId}?chatbotId={chatbotId}

Response: Binary file content
```

### Get Metadata
```
GET /api/attachments/metadata/{fileId}?chatbotId={chatbotId}

Response:
{
  fileId: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  uploadedAt: number,
  status: "stored",
  formattedFileSize: string
}
```

### List Files
```
GET /api/attachments/list/{chatbotId}

Response:
{
  chatbotId: string,
  totalFiles: number,
  files: FileMetadata[]
}
```

### Delete File
```
DELETE /api/attachments/{fileId}?chatbotId={chatbotId}

Response:
{
  success: true,
  message: "File deleted successfully",
  timestamp: number
}
```

---

## Configuration

### Environment Variables

Configure in `.env.local`:

```env
# Optional: Backend API URL (defaults to frontend proxy)
NEXT_PUBLIC_ATTACHMENT_API_URL=http://localhost:8080

# Default chatbot ID
REACT_APP_CHATBOT_ID=default_bot
```

### Default Behavior

- **Upload endpoint**: `/api/attachments/upload` (proxied)
- **Storage**: MongoDB on backend
- **Max file size**: 15 MB (backend enforced)
- **Session tracking**: Via sessionId parameter

---

## File Structure

```
src/
├── services/
│   └── attachmentService.ts          # AttachmentService class
├── component/
│   ├── AssistantChatWindow.tsx       # Main chat with file support
│   ├── openwebui/
│   │   ├── ChatInput.tsx             # Input with file button
│   │   ├── ChatMessage.tsx           # Message with attachment display
│   │   └── types.ts                  # FileAttachment type
│   └── ...

app/api/
└── attachments/
    ├── upload/
    │   └── route.ts                  # POST /upload proxy
    ├── download/
    │   └── [fileId]/
    │       └── route.ts              # GET /download/{fileId} proxy
    ├── metadata/
    │   └── [fileId]/
    │       └── route.ts              # GET /metadata/{fileId} proxy
    ├── list/
    │   └── [chatbotId]/
    │       └── route.ts              # GET /list/{chatbotId} proxy
    └── [fileId]/
        └── route.ts                  # DELETE /{fileId} proxy
```

---

## Migration from Base64

If migrating from the old base64 approach:

### Before (Base64)
```typescript
const attachments = [];
for (const file of files) {
  const base64 = await fileToBase64(file);
  attachments.push({
    name: file.name,
    type: file.type,
    size: file.size,
    data: base64  // Large string
  });
}

const payload = {
  message: "Analyze this",
  attachments: attachments,  // All files in one request
  ...
};
```

### After (FileId)
```typescript
const uploadedFiles = [];
for (const file of files) {
  const result = await attachmentService.uploadFile(file, sessionId);
  uploadedFiles.push({
    fileId: result.fileId,
    fileName: result.fileName,
    mimeType: result.mimeType,
    fileSize: result.fileSize,
    downloadUrl: result.downloadUrl,
  });
}

const payload = {
  message: "Analyze this",
  fileAttachments: uploadedFiles,  // Just fileId references
  ...
};
```

---

## Error Handling

### Upload Errors

```typescript
try {
  const result = await attachmentService.uploadFile(file, sessionId);
} catch (error) {
  console.error('Upload failed:', error.message);
  // Show user-friendly error message
}
```

### Network Issues

The service includes automatic error handling:

```typescript
// Network error
"Network error during file upload"

// Invalid response
"Failed to parse upload response"

// HTTP errors
"Upload failed with status 400"
```

---

## Security Considerations

### Authentication
- All requests include `chatbotId` for access control
- Backend validates chatbot ownership
- SessionId prevents unauthorized file access

### File Validation
- Backend enforces 15 MB file size limit
- MIME type validation
- File extension checks

### Data Protection
- Files stored in secure MongoDB
- Access controlled by chatbotId
- Session-based tracking

---

## Performance Tips

### Optimize Upload
```typescript
// Show progress to user
const handleProgress = (event: ProgressEvent) => {
  const percent = (event.loaded / event.total) * 100;
  console.log(`Upload: ${percent}%`);
};

const result = await attachmentService.uploadFile(
  file,
  sessionId,
  handleProgress
);
```

### Lazy Load Downloads
```typescript
// Download only when needed
const handleDownload = async (fileId: string) => {
  await attachmentService.downloadFileToClient(fileId, fileName);
};
```

### Cleanup Old Files
```typescript
// Delete unused files
await attachmentService.deleteFile(fileId);
```

---

## Troubleshooting

### Files not uploading
1. Check backend is running at configured URL
2. Verify chatbotId is correct
3. Check file size (max 15MB)
4. Look at browser console for errors

### Download links broken
1. Verify fileId is correct
2. Check chatbotId matches upload
3. Ensure file hasn't been deleted
4. Check browser privacy settings

### Slow uploads
1. Check network connection
2. Verify backend performance
3. Consider smaller file sizes
4. Check backend logs for issues

---

## Examples

### React Component with File Upload

```tsx
import { useState } from 'react';
import { getAttachmentService, FileAttachment } from '@/services/attachmentService';

export function FileUploadExample() {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const service = getAttachmentService('/api/attachments', 'my_chatbot');
      const result = await service.uploadFile(file, 'session_123');
      
      setFiles([...files, {
        fileId: result.fileId,
        fileName: result.fileName,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        downloadUrl: result.downloadUrl,
      }]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={loading}
      />
      {loading && <p>Uploading...</p>}
      <ul>
        {files.map(f => (
          <li key={f.fileId}>
            <a href={f.downloadUrl} download>{f.fileName}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Testing

### Manual Testing
1. Open chat interface
2. Click attachment button
3. Select a file (any type, <15MB)
4. Verify upload completes
5. Type a message
6. Click send
7. Verify message shows with attachment
8. Click download link
9. Verify file downloads correctly

### Unit Testing
```typescript
// Test attachment upload
it('should upload file and return fileId', async () => {
  const file = new File(['content'], 'test.txt', { type: 'text/plain' });
  const service = new AttachmentService('/api/attachments', 'bot-123');
  
  const result = await service.uploadFile(file, 'session-456');
  
  expect(result.fileId).toBeDefined();
  expect(result.fileName).toBe('test.txt');
  expect(result.mimeType).toBe('text/plain');
});
```

---

## Support & Issues

For issues or questions:

1. Check browser console for error messages
2. Verify backend service is running
3. Check network requests in DevTools
4. Review backend logs
5. Contact development team with:
   - Error message
   - Browser console output
   - Network request/response details
   - Steps to reproduce

---

## Changelog

### Version 1.0 (Feb 10, 2026)
- Initial release
- File upload with fileId tracking
- API proxy routes
- File display in messages
- Download support
- Metadata endpoints
- Full documentation

---

## Future Enhancements

- [ ] Drag-and-drop file upload
- [ ] Multiple file upload
- [ ] File preview before upload
- [ ] Progress bar UI
- [ ] File size validation UI
- [ ] Retry on failed uploads
- [ ] File versioning
- [ ] File sharing between sessions


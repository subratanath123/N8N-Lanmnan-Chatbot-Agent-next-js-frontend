# File Upload with Base64 Conversion

## Overview
The OpenWebUI page now supports file uploads with automatic base64 conversion. When users attach files, they are automatically converted to base64 strings and sent to the backend via the N8N API.

## Features

### ✅ **Supported File Types**
- Images (PNG, JPEG, GIF, etc.)
- Documents (PDF, DOC, TXT, etc.)
- Videos and Audio files
- Any file type supported by the browser

### 📏 **File Size Limits**
- **Maximum file size**: 10MB per file
- Files larger than 10MB are automatically skipped with a warning
- **Single attachment limit**: Only one file can be uploaded at a time

### 🔄 **Base64 Conversion Process**
1. User selects files using the attachment button (📎)
2. Files are validated for size limits
3. Valid files are converted to base64 strings using FileReader API
4. Base64 data is included in the N8N API request
5. Visual feedback shows conversion progress

## Technical Implementation

### **Frontend Changes**

#### **Types (`src/component/openwebui/types.ts`)**
```typescript
export interface Attachment {
  name: string;
  size: number;
  type: string;
  base64: string;
}

export interface N8NRequest {
  // ... existing fields
  attachments?: Attachment[];
}
```

#### **Main Page (`app/openwebui/page.tsx`)**
- Added `convertFileToBase64()` utility function
- Added `convertFilesToBase64()` single file conversion function
- Updated `getAIResponse()` to include base64 attachment
- Added `isProcessingAttachments` state for UI feedback

#### **ChatInput Component (`src/component/openwebui/ChatInput.tsx`)**
- Added loading spinner for attachment processing
- Visual indicator when files are being converted
- Enhanced attachment preview with status information

### **Backend Integration**

#### **N8N API Request Structure**
```json
{
  "message": "User message with attachment",
  "workflowId": "workflow-id",
  "webhookUrl": "webhook-url",
  "sessionId": "session-id",
  "attachments": [
    {
      "name": "document.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "base64": "JVBERi0xLjQKJcOkw7zDtsO..."
    }
  ],
  "additionalParams": {
    "temperature": 0.7,
    "systemPrompt": "You are a helpful AI assistant.",
    "model": "gpt-4"
  }
}
```

#### **File Processing Flow**
1. **File Selection**: User clicks attachment button and selects a single file
2. **Validation**: File is checked for size limits (10MB max)
3. **Conversion**: Valid file is converted to base64 using FileReader
4. **API Request**: Base64 data is included in the N8N workflow request
5. **Backend Processing**: N8N workflow receives base64 string for processing

## User Experience

### **Visual Indicators**
- 📎 Attachment button in chat input
- Single file preview with name, size, and type
- Loading spinner during base64 conversion
- Status indicators (✅ Ready, ⚠️ Too large)
- Progress feedback in chat messages

### **Error Handling**
- Large files (>10MB) are automatically skipped
- Failed conversions are logged but don't block other files
- User is informed about skipped files in the chat

## Configuration

### **Environment Variables**
- `BACKEND_URL`: Backend service URL for N8N integration
- N8N workflow configuration through the settings modal

### **File Size Limits**
- Default: 10MB per file
- Configurable in the `convertFilesToBase64` function
- Can be adjusted based on backend requirements

## Security Considerations

### **File Validation**
- File size limits prevent abuse
- File type information is preserved for backend processing
- Base64 conversion happens client-side before transmission

### **Data Transmission**
- Base64 data is sent over HTTPS
- Authentication tokens are included for authenticated users
- Session management prevents unauthorized access

## Usage Examples

### **Basic File Upload**
1. Click the 📎 attachment button
2. Select a single file
3. Type your message (optional)
4. Click send ➤
5. File is automatically converted and sent

### **Single File Upload**
- Only one file can be attached per message
- File replaces any previous attachment
- Failed conversions don't affect the message

### **Large File Handling**
- Files over 10MB are automatically skipped
- Warning messages appear in the chat
- User can remove large files and try again

## Troubleshooting

### **Common Issues**
- **File too large**: Reduce file size or split into smaller files
- **Conversion failed**: Check browser console for errors
- **Upload timeout**: Large files may take longer to process

### **Browser Compatibility**
- Requires modern browsers with FileReader API support
- Tested on Chrome, Firefox, Safari, Edge
- Mobile browsers may have different file size limits

## Future Enhancements

### **Potential Improvements**
- Drag and drop file upload
- File compression before conversion
- Progress bars for large files
- File type validation and filtering
- Batch file processing optimization
- Cloud storage integration

### **Performance Optimizations**
- Web Workers for file processing
- Streaming uploads for very large files
- Caching of converted files
- Lazy loading of attachment previews

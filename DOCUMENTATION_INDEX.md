# Chat Widget Documentation Index

## Complete Documentation for File Upload Support

This folder contains comprehensive documentation for implementing file upload support in the Chat Widget backend.

### 📚 Documentation Files

#### 1. **CHATWIDGET_INTEGRATION_GUIDE.md** ⭐ START HERE
- **Purpose:** Quick reference and integration guide
- **Contains:**
  - API endpoint overview
  - Request/response format summary
  - Implementation checklist
  - Testing examples
  - Troubleshooting guide
- **Best For:** Getting started quickly, overview

#### 2. **API_REQUEST_STRUCTURE.md**
- **Purpose:** Complete API specification
- **Contains:**
  - Detailed endpoint documentation
  - Full request/response schema
  - Field descriptions with examples
  - All example requests (text, files, multiple attachments)
  - Response field variations
  - Session management details
- **Best For:** Backend implementation, understanding exact format

#### 3. **CHATWIDGET_API_TYPES.ts**
- **Purpose:** TypeScript interface definitions
- **Contains:**
  - Type definitions for request/response
  - Helper interfaces
  - Example usage patterns
  - Validation functions
  - Database storage examples
- **Best For:** TypeScript projects, type-safe implementation

#### 4. **BACKEND_IMPLEMENTATION_EXAMPLE.md**
- **Purpose:** Full backend implementation examples
- **Contains:**
  - Node.js/Express complete implementation
  - Python/Flask complete implementation
  - File processing examples
  - Database schema examples
  - Security considerations
  - Implementation checklist
- **Best For:** Actual backend coding, reference examples

#### 5. **DOCUMENTATION_INDEX.md** (This File)
- **Purpose:** Navigation guide
- **Contains:** List of all documentation with descriptions

---

## Quick Navigation

### ❓ I Want To...

**...understand what the chat widget sends**
→ Read: `API_REQUEST_STRUCTURE.md` → Section "Request Body Structure"

**...see a complete backend example**
→ Read: `BACKEND_IMPLEMENTATION_EXAMPLE.md` (choose Node.js or Python)

**...get started quickly**
→ Read: `CHATWIDGET_INTEGRATION_GUIDE.md` → Implementation Steps

**...use TypeScript for my backend**
→ Read: `CHATWIDGET_API_TYPES.ts` → Copy types and interfaces

**...test the API endpoints**
→ Read: `CHATWIDGET_INTEGRATION_GUIDE.md` → Testing section

**...understand file encoding**
→ Read: `API_REQUEST_STRUCTURE.md` → Field Details section

**...handle errors properly**
→ Read: `CHATWIDGET_INTEGRATION_GUIDE.md` → Error Handling section

**...store files in database**
→ Read: `BACKEND_IMPLEMENTATION_EXAMPLE.md` → Database Schema section

---

## Reading Order (Recommended)

### For Beginners
1. `CHATWIDGET_INTEGRATION_GUIDE.md` - Get overview
2. `API_REQUEST_STRUCTURE.md` - Understand the format
3. `BACKEND_IMPLEMENTATION_EXAMPLE.md` - Choose language and implement

### For Experienced Developers
1. `API_REQUEST_STRUCTURE.md` - Quick reference
2. `CHATWIDGET_API_TYPES.ts` - Types/interfaces
3. `BACKEND_IMPLEMENTATION_EXAMPLE.md` - Code examples as needed

### For TypeScript Projects
1. `CHATWIDGET_API_TYPES.ts` - Copy type definitions
2. `API_REQUEST_STRUCTURE.md` - Reference for details
3. `BACKEND_IMPLEMENTATION_EXAMPLE.md` - Node.js section

---

## API Summary

### Endpoints
```
POST /v1/api/n8n/authenticated/chat    (requires Bearer token)
POST /v1/api/n8n/anonymous/chat        (no auth)
```

### Request Format
```json
{
  "role": "user",
  "message": "text message",
  "attachments": [
    {
      "name": "file.pdf",
      "type": "application/pdf",
      "size": 102400,
      "data": "base64_encoded_content"
    }
  ],
  "sessionId": "session_123",
  "chatbotId": "bot_456"
}
```

### Response Format
```json
{
  "output": "AI response text"
}
```

---

## Key Features Supported

✅ Text messages  
✅ File attachments (base64 encoded)  
✅ Multiple files (one per message)  
✅ Session tracking  
✅ Authenticated and anonymous access  
✅ File metadata (name, type, size)  
✅ All common file types  

---

## Implementation Checklist

- [ ] Read `CHATWIDGET_INTEGRATION_GUIDE.md`
- [ ] Read `API_REQUEST_STRUCTURE.md`
- [ ] Choose your backend language
- [ ] Read relevant section in `BACKEND_IMPLEMENTATION_EXAMPLE.md`
- [ ] Copy example code
- [ ] Implement endpoints
- [ ] Add file processing
- [ ] Add database storage
- [ ] Test with examples from guide
- [ ] Deploy to production
- [ ] Monitor and optimize

---

## File Type Support

### Document Types
- PDF, TXT, CSV, JSON, DOCX, XLSX, PPTX, DOC, XLS, PPT

### Image Types
- JPEG, PNG, GIF, WEBP

### Media Types
- MP4, MP3, WAV, OGG, MPEG, MOV

### Archive Types
- ZIP, RAR, 7Z

---

## Common Implementation Patterns

### Pattern: Document Analysis
User uploads document → Extract text → Use AI to analyze → Return results

### Pattern: Image Recognition
User uploads image → Run OCR → Analyze content → Return findings

### Pattern: File Review
User uploads file + question → Extract content → Answer question → Return answer

### Pattern: Data Processing
User uploads data file → Parse structure → Process with AI → Return results

---

## Security Checklist

- [ ] Validate file MIME types
- [ ] Enforce file size limits (recommended: 10-50MB)
- [ ] Sanitize filenames
- [ ] Store files outside web root
- [ ] Implement access controls
- [ ] Verify authentication tokens
- [ ] Scan files for malware (optional)
- [ ] Log file uploads
- [ ] Implement rate limiting
- [ ] Use HTTPS only

---

## Performance Tips

1. **Efficient Decoding**
   - Decode Base64 on-demand only
   - Stream large files if possible

2. **Async Processing**
   - Process files asynchronously
   - Return response quickly
   - Use job queues for heavy processing

3. **Caching**
   - Cache extracted content
   - Reuse file analysis results

4. **Storage**
   - Organize files by sessionId/chatbotId
   - Implement cleanup for old files
   - Consider cloud storage for scalability

---

## Troubleshooting Resources

### Problem: Widget shows loading spinner forever
- Check backend endpoint is accessible
- Verify CORS headers if cross-origin
- Check browser console for network errors

### Problem: Files not being sent
- Verify Base64 encoding
- Check file size isn't too large
- Ensure attachments array is properly formatted

### Problem: Response not showing in widget
- Verify response includes one of: output, message, data, response, answer
- Check response is valid JSON
- Ensure response text is not empty

### Problem: Files not being stored
- Check file permissions
- Verify upload directory exists
- Check storage space available
- Review error logs

---

## Support Resources

- 📖 **API_REQUEST_STRUCTURE.md** - Detailed specifications
- 💻 **BACKEND_IMPLEMENTATION_EXAMPLE.md** - Working code examples
- 🔐 **CHATWIDGET_API_TYPES.ts** - Type definitions
- 📋 **CHATWIDGET_INTEGRATION_GUIDE.md** - Step-by-step guide

---

## Version Information

- **Widget Version:** Latest (with file attachment support)
- **API Version:** v1
- **Documentation Version:** 1.0
- **Last Updated:** February 6, 2026

---

## Document Statistics

| Document | Type | Length | Purpose |
|----------|------|--------|---------|
| CHATWIDGET_INTEGRATION_GUIDE.md | Markdown | ~500 lines | Quick reference & guide |
| API_REQUEST_STRUCTURE.md | Markdown | ~400 lines | Complete API spec |
| CHATWIDGET_API_TYPES.ts | TypeScript | ~400 lines | Type definitions |
| BACKEND_IMPLEMENTATION_EXAMPLE.md | Markdown | ~700 lines | Implementation examples |
| DOCUMENTATION_INDEX.md | Markdown | This file | Navigation guide |

**Total Documentation:** ~2,400 lines of comprehensive guides and examples

---

## Next Steps

1. **Start Here:** Read `CHATWIDGET_INTEGRATION_GUIDE.md`
2. **Understand Format:** Read `API_REQUEST_STRUCTURE.md`
3. **Get Types:** Copy from `CHATWIDGET_API_TYPES.ts`
4. **Implement:** Follow `BACKEND_IMPLEMENTATION_EXAMPLE.md`
5. **Test:** Use examples from integration guide
6. **Deploy:** Push to production
7. **Monitor:** Track file uploads and responses

---

**Happy Implementing! 🚀**

For questions about the Chat Widget file upload feature, refer to the appropriate documentation file above.







# Chat Widget Multimodal Architecture

**Version:** 1.0 | **Date:** Feb 8, 2026

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             Chat Widget Component                      │   │
│  │  (ChatbotWidget.tsx)                                  │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────────┐ │   │
│  │  │  Input Area                                      │ │   │
│  │  │  ┌────────────────────────────────────────────┐ │ │   │
│  │  │  │ 📎 [Attach Files] [Input Box] [Send] ➤   │ │ │   │
│  │  │  └────────────────────────────────────────────┘ │ │   │
│  │  │                                                  │ │   │
│  │  │  ┌────────────────────────────────────────────┐ │ │   │
│  │  │  │ File Preview (if attached)                │ │ │   │
│  │  │  │ 📄 document.pdf (250KB) ×                 │ │ │   │
│  │  │  │ 📊 spreadsheet.xlsx (150KB) ×             │ │ │   │
│  │  │  └────────────────────────────────────────────┘ │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────────┐ │   │
│  │  │  Message Display Area                           │ │   │
│  │  │  ┌────────────────────────────────────────────┐ │ │   │
│  │  │  │ User: "Analyze these files"                │ │ │   │
│  │  │  │ AI: "Analysis complete..."                 │ │ │   │
│  │  │  └────────────────────────────────────────────┘ │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Helper Module (multimodalApiHelper.ts)                       │
│  • sendMultimodalMessageFormData()                            │
│  • validateFile()                                             │
│  • validateTotalAttachmentSize()                              │
│  • listAttachments()                                          │
│  • deleteAttachment()                                         │
└─────────────────────────────────────────────────────────────────┘
           │
           │ multipart/form-data
           │ (message, chatbotId, sessionId, files)
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API SERVER                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Router: POST /v1/api/n8n/multimodal/[auth]/multipart │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────────┐ │   │
│  │  │ Request Handler                                 │ │   │
│  │  │                                                 │ │   │
│  │  │ 1. Parse form fields                           │ │   │
│  │  │    • Extract message                           │ │   │
│  │  │    • Extract chatbotId                         │ │   │
│  │  │    • Extract sessionId                         │ │   │
│  │  │    • Extract Google tokens (optional)          │ │   │
│  │  │                                                 │ │   │
│  │  │ 2. Process files                               │ │   │
│  │  │    • Validate file size (< 100MB each)        │ │   │
│  │  │    • Validate file type                        │ │   │
│  │  │    • Check total size (< 500MB)               │ │   │
│  │  │    • Scan for malware (optional)              │ │   │
│  │  │                                                 │ │   │
│  │  │ 3. Authenticate                               │ │   │
│  │  │    • Validate JWT token                       │ │   │
│  │  │    • Check user permissions                   │ │   │
│  │  │    • Verify chatbot access                    │ │   │
│  │  │                                                 │ │   │
│  │  │ 4. Store files                                │ │   │
│  │  │    • Save to temporary storage                │ │   │
│  │  │    • Generate unique IDs                      │ │   │
│  │  │                                                 │ │   │
│  │  │ 5. Process message                            │ │   │
│  │  │    • Sanitize text                            │ │   │
│  │  │    • Store in chat history                    │ │   │
│  │  │                                                 │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┬──────────────┐
          │                │                │              │
          ▼                ▼                ▼              ▼
     ┌────────────┐  ┌──────────────┐ ┌──────────────┐ ┌────────┐
     │ Vector DB  │  │ LLM API      │ │ Chat History │ │Google  │
     │ (Pinecone/ │  │ (OpenAI/     │ │ (Database)   │ │OAuth   │
     │ Weaviate)  │  │ Anthropic)   │ │              │ │ (for   │
     │            │  │              │ │              │ │Google  │
     │ • Index    │  │ • Generate   │ │ • Store      │ │Drive   │
     │   files    │  │   response   │ │   Q&A pairs  │ │access) │
     │ • Search   │  │ • Stream     │ │ • Query      │ │        │
     │   vectors  │  │   tokens     │ │   history    │ │        │
     └────────────┘  └──────────────┘ └──────────────┘ └────────┘
```

## Request Flow - Text Message

```
User Input: "What is automation?"
    │
    ▼
Create FormData:
    message: "What is automation?"
    chatbotId: "bot-123"
    sessionId: "sess-456"
    │
    ▼
POST /v1/api/n8n/multimodal/authenticated/multipart/chat
    │
    ▼
Backend Processing:
    1. ✓ Parse form fields
    2. ✓ Validate authentication
    3. ✓ Sanitize message
    4. ✓ Query LLM
    │
    ▼
Response:
    {
      "success": true,
      "result": { "response": "Automation is..." },
      "vectorIdMap": {},
      "vectorAttachments": [],
      "timestamp": 1707385650000
    }
    │
    ▼
Display in Chat: "Automation is..."
```

## Request Flow - File Upload

```
User Input: "Analyze this PDF" + [document.pdf]
    │
    ▼
File Selected:
    file = document.pdf (2.5 MB)
    │
    ▼
Create FormData:
    message: "Analyze this PDF"
    chatbotId: "bot-123"
    sessionId: "sess-456"
    files: [File object] ← Browser handles encoding
    │
    ▼
POST /v1/api/n8n/multimodal/authenticated/multipart/chat
    Content-Type: multipart/form-data; boundary=...
    [Binary file data]
    │
    ▼
Backend Processing:
    1. ✓ Parse multipart data
    2. ✓ Extract file from form
    3. ✓ Validate file size < 100MB
    4. ✓ Validate MIME type (PDF)
    5. ✓ Authenticate user
    6. ✓ Save file to temp storage
    │
    ▼
Vector Store Processing:
    1. Extract text from PDF
    2. Split into chunks
    3. Generate embeddings
    4. Store in vector DB
    5. Index for retrieval
    │
    ▼
LLM Processing:
    1. Query vector DB for relevant chunks
    2. Build context from file
    3. Generate response
    4. Include file analysis
    │
    ▼
Response:
    {
      "success": true,
      "result": { "response": "Document analysis: ..." },
      "vectorIdMap": {
        "document.pdf": "attachment_bot_123_xyz"
      },
      "vectorAttachments": [{
        "vectorId": "attachment_bot_123_xyz",
        "fileName": "document.pdf",
        "mimeType": "application/pdf",
        "fileSize": 2621440,
        "uploadedAt": 1707385649123
      }],
      "timestamp": 1707385650000
    }
    │
    ▼
Display in Chat:
    User: "Analyze this PDF"
    AI: "Document analysis: ..."
    
    Files: [document.pdf] (stored in vector DB)
```

## Request Flow - Multiple Files

```
User Input: "Compare these reports" + [file1.pdf, file2.xlsx]
    │
    ▼
Create FormData:
    message: "Compare these reports"
    chatbotId: "bot-123"
    sessionId: "sess-456"
    files: [file1.pdf, file2.xlsx]
    │
    ▼
Browser (FormData):
    ────────────────────────────────
    Content-Disposition: form-data; name="message"
    
    Compare these reports
    ────────────────────────────────
    Content-Disposition: form-data; name="chatbotId"
    
    bot-123
    ────────────────────────────────
    Content-Disposition: form-data; name="files"; filename="file1.pdf"
    Content-Type: application/pdf
    
    [binary PDF data]
    ────────────────────────────────
    Content-Disposition: form-data; name="files"; filename="file2.xlsx"
    Content-Type: application/vnd.ms-excel
    
    [binary XLSX data]
    ────────────────────────────────
    │
    ▼
Backend Processing (Parallel):
    ┌─────────────────┬────────────────┐
    │                 │                │
    ▼                 ▼                ▼
File1 Processing    File2 Processing   Message Processing
│                   │                  │
├─ Extract text     ├─ Convert to CSV   ├─ Sanitize
├─ Generate chunks  ├─ Parse data       ├─ Validate
├─ Create embeddings├─ Create embeddings├─ Store
└─ Index            └─ Index            └─ Query LLM
    │                   │                  │
    └─────────────────┬─────────────────┬──┘
                      │
                      ▼
            Combined Context:
            • File1: "Report A shows..."
            • File2: "Report B shows..."
            • Message: "Compare these"
                      │
                      ▼
            LLM Generates:
            "Comparison: File1 and File2
             differences are..."
                      │
                      ▼
Response:
    vectorIdMap: {
      "file1.pdf": "attachment_bot_123_abc",
      "file2.xlsx": "attachment_bot_123_def"
    },
    vectorAttachments: [
      { vectorId: "..._abc", fileName: "file1.pdf", ... },
      { vectorId: "..._def", fileName: "file2.xlsx", ... }
    ]
```

## Authentication Flow

```
Frontend (Has JWT Token)
    │
    ▼
Include in Request:
    Authorization: Bearer eyJhbGc...
    │
    ▼
POST /v1/api/n8n/multimodal/authenticated/multipart/chat
    │
    ▼
Backend Validation:
    1. Extract token from Authorization header
    2. Verify signature using secret key
    3. Check token not expired
    4. Verify token not blacklisted
    5. Extract user ID from token
    6. Check user has access to chatbot
    │
    ├─ Valid? ──▶ Continue Processing
    │
    └─ Invalid? ──▶ Return 401 Unauthorized
                    {
                      "success": false,
                      "errorCode": "UNAUTHORIZED",
                      "errorMessage": "Invalid token"
                    }
```

## State Management (React Example)

```
Component State:

const [messages, setMessages]              // Chat history
const [inputValue, setInputValue]          // Text input
const [files, setFiles]                    // Selected files
const [loading, setLoading]                // Processing state
const [error, setError]                    // Error message
const [isMinimized, setIsMinimized]        // Widget state
const [attachments, setAttachments]        // File list
const [googleTokens, setGoogleTokens]      // OAuth tokens

User Action Flow:

1. User selects file
   │
   ├─ handleFileUpload()
   │ ├─ Validate file
   │ └─ setAttachments([file])
   │
   ▼
2. User types message
   │
   ├─ setInputValue(message)
   │
   ▼
3. User clicks Send
   │
   ├─ sendMessage()
   │ ├─ setLoading(true)
   │ ├─ Create FormData
   │ ├─ POST to API
   │ ├─ setMessages([...messages, userMsg])
   │ ├─ setMessages([...messages, aiMsg])
   │ └─ setLoading(false)
   │
   ▼
4. Update Display
   │
   ├─ Re-render with new messages
   ├─ Clear input
   ├─ Clear files
   └─ Scroll to bottom
```

## Data Flow Diagram

```
┌──────────────┐
│  User Input  │
└──────┬───────┘
       │
       ├──► Message Text ──┐
       │                   │
       ├──► File 1 ────────┤
       │                   │
       └──► File 2 ────────┤
                           │
                           ▼
                    FormData Object
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
       Form Field    Form Field    Binary Data
       (message)     (files)       (file content)
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                  HTTP Multipart Request
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
        Backend         Backend        Vector Store
        (Process)       (Authenticate) (Index Files)
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                      LLM Processing
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
        Context         Prompt         Generation
        (From Files)    (Message)      (Response)
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                    JSON Response
            ┌──────────────┬──────────────┐
            │              │              │
            ▼              ▼              ▼
         Success        VectorID      Attachments
         Result         Map           Metadata
            │              │              │
            └──────────────┬──────────────┘
                           │
                           ▼
                   Display in Chat
```

## Error Handling Flow

```
User Action
    │
    ▼
Try Block
    ├─ File Validation
    │   │
    │   ├─ Size > 100MB? ──▶ Catch Block
    │   │
    │   ├─ Type not allowed? ──▶ Catch Block
    │   │
    │   └─ Valid? Continue
    │       │
    │       ▼
    ├─ API Request
    │   │
    │   ├─ Network Error? ──▶ Catch Block
    │   │
    │   ├─ 401 Unauthorized? ──▶ Catch Block
    │   │
    │   ├─ 400 Bad Request? ──▶ Catch Block
    │   │
    │   ├─ 500 Server Error? ──▶ Catch Block
    │   │
    │   └─ 200 OK? Continue
    │       │
    │       ▼
    └─ Parse Response
        │
        ├─ Invalid JSON? ──▶ Catch Block
        │
        ├─ success: false? ──▶ Catch Block
        │
        └─ success: true? Display Result
            │
            ▼
        Catch Block
            │
            ├─ Log Error
            ├─ Show Error Message
            └─ Reset Loading State
```

## Component Lifecycle

```
Component Mount
    │
    ▼
Initialize:
    • Get/create sessionId
    • Load from localStorage
    • Set default values
    │
    ▼
useEffect (on mount):
    • Check chatbot details
    • Load chat history
    • Check Google OAuth status
    │
    ▼
Render Component
    │
    ▼
User Interactions
    • Type message
    • Select file
    • Send message
    • Click minimize
    │
    ▼
State Updates (re-render)
    │
    ▼
useEffect (on message change):
    • Scroll to bottom
    │
    ▼
User Leaves Page
    │
    ▼
Cleanup:
    • Save sessionId
    • No local cleanup needed (stateless)
```

---

**Last Updated:** February 8, 2026 | **Status:** ✅ Complete





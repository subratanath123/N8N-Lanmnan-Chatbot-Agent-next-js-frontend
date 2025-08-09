# Backend API Requirements for Chat History

This document outlines the backend API endpoints that need to be implemented to support the chat history feature in the OpenWebUI frontend.

## Base URL
The frontend expects the backend to be running at: `http://localhost:8000` (configurable via `BACKEND_URL` environment variable)

## Required Endpoints

### 1. Get Chat History
**GET** `/v1/api/chat-history/{userId}`

**Query Parameters:**
- `limit` (optional): Number of chat sessions to return (default: 50)
- `offset` (optional): Number of sessions to skip for pagination (default: 0)

**Headers:**
- `Authorization: Bearer {clerk_jwt_token}` (required)
- `Content-Type: application/json`

**Expected Response (Current Backend Format):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "68979358cb8f952c18270e7a",
        "email": "shuvra.dev9@gmail.com",
        "conversationid": "session_1754764089953_mmwzjbuh2",
        "userMessage": "Hello, can you help me with React?",
        "createdAt": 1754764117.823,
        "aiMessage": "Of course! I'd be happy to help with React development.",
        "mode": "production",
        "anonymous": true
      }
    ],
    "errorMessage": null,
    "timestamp": 1754764152955,
    "totalCount": 2,
    "currentPage": 0,
    "pageSize": 50
  },
  "timestamp": 1754764152959
}
```

**Alternative Simplified Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session_id_1",
      "sessionId": "session_id_1",
      "userId": "user_123",
      "title": "Chat about React development",
      "messages": [
        {
          "id": "msg_1",
          "content": "Hello, can you help me with React?",
          "role": "user",
          "timestamp": "2024-01-15T10:30:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  ],
  "timestamp": 1705312200000
}
```

### 2. Save Chat History
**POST** `/v1/api/chat-history`

**Headers:**
- `Authorization: Bearer {clerk_jwt_token}` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "userId": "user_123",
  "sessionId": "session_id_1",
  "title": "Chat about React development",
  "messages": [
    {
      "id": "msg_1",
      "content": "Hello, can you help me with React?",
      "role": "user",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "session_id_1",
    "message": "Chat history saved successfully"
  },
  "timestamp": 1705312200000
}
```

### 3. Get Conversation Messages
**GET** `/v1/api/chat-history/{conversationId}/messages`

**Headers:**
- `Authorization: Bearer {clerk_jwt_token}` (required)
- `Content-Type: application/json`

**Expected Response (Current Backend Format):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": null,
    "data": [
      {
        "id": "68979358cb8f952c18270e7a",
        "email": "shuvra.dev9@gmail.com",
        "conversationid": "session_1754764089953_mmwzjbuh2",
        "userMessage": "Hello, can you help me with React?",
        "createdAt": 1754764117.823,
        "aiMessage": "Of course! I'd be happy to help with React development.",
        "mode": "production",
        "anonymous": true
      },
      {
        "id": "689795b7cb8f952c18270e7b",
        "email": "shuvra.dev9@gmail.com",
        "conversationid": "session_1754764089953_mmwzjbuh2",
        "userMessage": "What are React hooks?",
        "createdAt": 1754764724.347,
        "aiMessage": "React hooks are functions that let you use state and other React features...",
        "mode": "production",
        "anonymous": true
      }
    ],
    "errorMessage": null,
    "timestamp": 1754765078834,
    "totalCount": 3,
    "currentPage": 0,
    "pageSize": 0
  },
  "timestamp": 1754765078838
}
```

**Alternative Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_1",
      "content": "Hello, can you help me with React?",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": 1754764152959
}
```

### 4. Delete Chat History
**DELETE** `/v1/api/chat-history/{conversationId}`

**Headers:**
- `Authorization: Bearer {clerk_jwt_token}` (required)
- `Content-Type: application/json`

**Expected Response:**
```json
{
  "success": true,
  "message": "Chat history deleted successfully",
  "timestamp": 1705312200000
}
```

## Error Response Format
All endpoints should return errors in this format:

```json
{
  "success": false,
  "errorMessage": "Description of the error",
  "errorCode": "ERROR_CODE", // Optional
  "timestamp": 1705312200000
}
```

## Authentication
- The frontend uses Clerk for authentication
- JWT tokens are passed in the `Authorization` header as `Bearer {token}`
- The backend should validate these tokens and extract user information
- Unauthenticated requests should return 401 status code

## Database Schema Suggestions

### Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_updated_at (updated_at)
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_timestamp (timestamp)
);
```

## Field Mappings

The frontend code handles multiple response formats by mapping fields as follows:

| Frontend Field | Backend Field Options (in order of preference) |
|----------------|------------------------------------------------|
| `id` | `conversationid` → `sessionId` → `id` |
| `userId` | `email` → `userId` |
| `title` | `title` → `userMessage` (first 50 chars) → "Untitled Chat" |
| `messages` | `messages` → `[{userMessage, aiMessage}]` → `[]` |
| `createdAt` | `createdAt` (Unix timestamp * 1000) → current timestamp |
| `updatedAt` | `updatedAt` → `createdAt` → current timestamp |
| `isAnonymous` | `anonymous` → `false` |

### Message Structure Conversion

The current backend format provides separate `userMessage` and `aiMessage` fields for each conversation record. The frontend converts these into a proper chronological messages array:

**For Conversation Messages Endpoint:**
Each record in the response represents one conversation turn and gets converted into two separate messages:

```javascript
// Backend format (array of conversation records):
[
  {
    "id": "68979358cb8f952c18270e7a",
    "userMessage": "Hello, can you help me?",
    "aiMessage": "Of course! I'd be happy to help.",
    "createdAt": 1754764117.823
  },
  {
    "id": "689795b7cb8f952c18270e7b", 
    "userMessage": "What are React hooks?",
    "aiMessage": "React hooks are functions...",
    "createdAt": 1754764724.347
  }
]

// Frontend conversion (chronological message array):
[
  {
    "id": "68979358cb8f952c18270e7a_user_0",
    "content": "Hello, can you help me?",
    "role": "user",
    "createdAt": "2024-01-15T10:30:17Z"
  },
  {
    "id": "68979358cb8f952c18270e7a_ai_0", 
    "content": "Of course! I'd be happy to help.",
    "role": "assistant",
    "createdAt": "2024-01-15T10:30:18Z"
  },
  {
    "id": "689795b7cb8f952c18270e7b_user_1",
    "content": "What are React hooks?", 
    "role": "user",
    "createdAt": "2024-01-15T10:38:44Z"
  },
  {
    "id": "689795b7cb8f952c18270e7b_ai_1",
    "content": "React hooks are functions...",
    "role": "assistant", 
    "createdAt": "2024-01-15T10:38:45Z"
  }
]
```

## Implementation Notes

1. **Pagination**: Implement proper pagination for chat history to handle users with many sessions
2. **Security**: Ensure users can only access their own chat history
3. **Performance**: Consider adding database indexes on frequently queried fields
4. **Cleanup**: Consider implementing automatic cleanup of old chat sessions
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Validation**: Validate all input data before processing
7. **Response Format**: The frontend supports both nested (`data.data.data`) and flat (`data`) response formats

## Testing the Integration

You can test the chat history feature by:

1. Starting the backend server with the required endpoints
2. Signing in to the OpenWebUI frontend with Clerk
3. Having some conversations to generate chat history
4. Checking that the chat history appears in the left sidebar
5. Testing the ability to load previous conversations
6. Testing the delete functionality

The frontend will automatically load chat history when a user signs in and will save conversations after each AI response.

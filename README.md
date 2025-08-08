# Chat Frontend with Session Management

This is a modern chat interface built with Next.js that includes session management for non-logged-in users and AI response integration.

## Features

### Session Management
- **Automatic Session Creation**: When a user visits the chat interface, a unique session ID is automatically generated and stored in localStorage
- **Session Persistence**: Sessions persist across browser sessions and page refreshes
- **Session Display**: The current session ID is displayed in the header for transparency
- **New Session Creation**: Users can create a new session at any time using the "New Session" button

### AI Integration
- **Multi-Model Support**: Supports various AI models (GPT-4, GPT-3.5 Turbo, Claude 3, Llama 2, Gemini Pro)
- **Real API Calls**: Makes actual API calls to `/api/chat` endpoint instead of simulated responses
- **Error Handling**: Comprehensive error handling with user-friendly error messages
- **Session Context**: Maintains conversation context within each session

### User Interface
- **Modern Design**: Clean, responsive interface with smooth animations
- **File Attachments**: Support for file uploads and attachment preview
- **Settings Panel**: Configurable model selection, temperature, and system prompts
- **Real-time Feedback**: Loading states and error indicators

## API Endpoints

### POST `/api/chat`
Handles chat requests and AI response generation.

**Request Body:**
```json
{
  "message": "User's message",
  "model": "gpt-4",
  "temperature": 0.7,
  "systemPrompt": "You are a helpful AI assistant.",
  "sessionId": "session_1234567890_abc123",
  "attachments": [
    {
      "name": "document.pdf",
      "size": 1024,
      "type": "application/pdf"
    }
  ]
}
```

**Response:**
```json
{
  "response": "AI response text",
  "sessionId": "session_1234567890_abc123"
}
```

### GET `/api/chat?sessionId=session_id`
Retrieves session history and metadata.

**Response:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "messages": [...],
  "model": "gpt-4",
  "temperature": 0.7,
  "systemPrompt": "You are a helpful AI assistant.",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastActivity": "2024-01-01T12:00:00.000Z"
}
```

## Session Management Details

### Session ID Generation
- Format: `session_[timestamp]_[random_string]`
- Example: `session_1704067200000_abc123def`
- Stored in browser localStorage for persistence

### Session Storage
- Currently uses in-memory storage (Map) for demonstration
- In production, should be replaced with a database (Redis, PostgreSQL, etc.)
- Sessions include:
  - Unique session ID
  - Creation timestamp
  - Last activity timestamp
  - Message history
  - Model preferences
  - System prompt

### Session Lifecycle
1. **Creation**: Automatically created when user first visits
2. **Persistence**: Stored in localStorage and server memory
3. **Updates**: Updated with each message exchange
4. **Retrieval**: Can be retrieved via API for session history
5. **Recreation**: Users can create new sessions at any time

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Access the Chat Interface:**
   Navigate to `http://localhost:3000/openwebui`

## Configuration

### Environment Variables
For production deployment, add these environment variables:

```env
# AI Service API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key

# Database Configuration (for production)
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
```

### AI Service Integration
The current implementation includes placeholder code for AI service integration. To connect to real AI services:

1. Uncomment the relevant sections in `/app/api/chat/route.ts`
2. Add your API keys to environment variables
3. Update the `callAIService` function with your preferred AI provider

## Security Considerations

- Session IDs are generated client-side and should be validated server-side
- Consider implementing rate limiting for API endpoints
- Add authentication for production use
- Implement proper CORS policies
- Use HTTPS in production

## Future Enhancements

- [ ] Database integration for session storage
- [ ] User authentication system
- [ ] Rate limiting and API quotas
- [ ] Real-time messaging with WebSockets
- [ ] File upload to cloud storage
- [ ] Conversation export functionality
- [ ] Advanced model configuration options

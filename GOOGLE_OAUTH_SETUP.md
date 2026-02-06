# Google OAuth Setup for Consumer Calendar Integration

This guide explains how to set up Google OAuth for consumers (website visitors) to authenticate and create calendar events through the chatbot.

## Overview

The implementation allows consumers to:
1. Authenticate with Google Calendar through the chatbot widget
2. Store their OAuth tokens associated with their session
3. Pass tokens to backend/n8n workflows for creating calendar events

## Architecture

### Flow Diagram

```
Consumer → Chatbot Widget → Google OAuth → Callback → Backend Storage → n8n Workflow
```

1. **Consumer clicks "Connect Google"** in the chatbot widget
2. **OAuth popup opens** with Google authorization
3. **Consumer authorizes** the application
4. **Callback receives code** and exchanges for tokens
5. **Tokens stored** in backend database (associated with sessionId)
6. **Widget retrieves tokens** and includes them in API calls
7. **n8n workflow** receives tokens and uses them to create calendar events

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     http://localhost:3000/api/google-oauth/callback  (for development)
     https://your-domain.com/api/google-oauth/callback  (for production)
     ```
   - Copy the **Client ID** and **Client Secret**

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend URL (for OAuth redirects)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com  # Production

# Backend URL (where tokens are stored)
NEXT_PUBLIC_BACKEND_URL=http://your-backend-url.com
```

### 3. Backend API Endpoints Required

Your backend needs to implement these endpoints:

#### Store Tokens
**POST** `/v1/api/google-oauth/store-tokens`

Request body:
```json
{
  "sessionId": "session_1234567890_abc123",
  "chatbotId": "chatbot_123",
  "accessToken": "ya29.a0AfH6SMC...",
  "refreshToken": "1//0g...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

Response:
```json
{
  "success": true,
  "message": "Tokens stored successfully"
}
```

#### Get Tokens
**GET** `/v1/api/google-oauth/get-tokens?sessionId={sessionId}&chatbotId={chatbotId}`

Response:
```json
{
  "success": true,
  "accessToken": "ya29.a0AfH6SMC...",
  "refreshToken": "1//0g...",
  "expiresAt": 1234567890000,
  "expiresIn": 3600
}
```

#### Update Tokens
**POST** `/v1/api/google-oauth/update-tokens`

Request body:
```json
{
  "sessionId": "session_1234567890_abc123",
  "chatbotId": "chatbot_123",
  "accessToken": "ya29.new_token...",
  "expiresIn": 3600
}
```

### 4. Database Schema

Create a table to store consumer OAuth tokens:

```sql
CREATE TABLE consumer_google_tokens (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  chatbot_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session_chatbot (session_id, chatbot_id),
  INDEX idx_expires_at (expires_at)
);
```

## Usage in n8n Workflows

When a consumer sends a message that requires calendar access, the chatbot includes Google tokens in the request:

### Request Headers
```
X-Google-Access-Token: ya29.a0AfH6SMC...
```

### Request Body
```json
{
  "message": "Create a calendar event for tomorrow at 2pm",
  "sessionId": "session_1234567890_abc123",
  "chatbotId": "chatbot_123",
  "googleTokens": {
    "accessToken": "ya29.a0AfH6SMC...",
    "refreshToken": "1//0g..."
  }
}
```

### n8n HTTP Request Node Configuration

**Method:** POST  
**URL:** `https://www.googleapis.com/calendar/v3/calendars/primary/events`  
**Authentication:** None (handle in headers)  
**Headers:**
```
Authorization: Bearer {{ $json.googleTokens.accessToken }}
Content-Type: application/json
```

**Body:**
```json
{
  "summary": "Meeting",
  "start": {
    "dateTime": "2024-01-15T14:00:00",
    "timeZone": "America/New_York"
  },
  "end": {
    "dateTime": "2024-01-15T15:00:00",
    "timeZone": "America/New_York"
  }
}
```

## Widget Features

### Google OAuth Status Indicator

- **Not Connected**: Shows "Connect Google Calendar" button
- **Connected**: Shows green indicator with "✓ Google Calendar connected"
- **Disconnect**: Button to remove stored tokens

### Token Management

- Tokens are automatically checked on widget load
- Expired tokens are automatically refreshed using refresh_token
- Tokens are stored per session (sessionId + chatbotId)

## Security Considerations

1. **Token Storage**: Tokens are stored server-side, never in localStorage
2. **HTTPS Required**: Use HTTPS in production for secure token transmission
3. **Token Expiration**: Access tokens expire after 1 hour, refresh tokens are used automatically
4. **Session Isolation**: Each consumer session has isolated tokens
5. **Scope Limitation**: Only requests `calendar.events` scope (read/write calendar events)

## Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Embed the widget** on a test page or use the widget directly

3. **Click "Connect Google"** in the widget

4. **Authorize** with a test Google account

5. **Verify tokens** are stored in your backend database

6. **Send a message** that triggers calendar creation

7. **Check n8n workflow** receives tokens and creates calendar event

## Troubleshooting

### OAuth Popup Blocked
- Ensure popup blockers are disabled
- Check browser console for errors

### Token Not Found
- Verify sessionId matches between widget and backend
- Check database for stored tokens
- Ensure chatbotId matches

### Token Expired
- Refresh token should automatically refresh access token
- Check refresh token is valid and not revoked
- Verify backend update-tokens endpoint works

### Calendar API Errors
- Verify Google Calendar API is enabled
- Check OAuth scopes include `calendar.events`
- Ensure access token has required permissions

## API Reference

### Frontend API Endpoints

- `GET /api/google-oauth/authorize` - Get OAuth authorization URL
- `GET /api/google-oauth/callback` - Handle OAuth callback
- `GET /api/google-oauth/get-tokens` - Retrieve stored tokens
- `POST /api/google-oauth/refresh-token` - Refresh access token

### Pages

- `/oauth-success` - OAuth success page (closes popup)
- `/oauth-error` - OAuth error page (shows error message)

## Next Steps

1. Implement backend endpoints for token storage
2. Configure Google Cloud Console OAuth credentials
3. Test OAuth flow end-to-end
4. Integrate with n8n workflows for calendar event creation
5. Add error handling and user feedback
6. Implement token refresh logic in backend


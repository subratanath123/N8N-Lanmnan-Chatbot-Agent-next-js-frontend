# Clerk Authentication Setup Guide

## Prerequisites

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application in your Clerk dashboard

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# N8N Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/your_webhook_id
N8N_WORKFLOW_ID=your_workflow_id
```

## Getting Your Clerk Keys

1. **Publishable Key**: Found in your Clerk dashboard under "API Keys"
2. **Secret Key**: Found in your Clerk dashboard under "API Keys"
3. **Webhook Secret**: Create a webhook in your Clerk dashboard and copy the signing secret

## Setting Up Webhooks

1. Go to your Clerk dashboard
2. Navigate to "Webhooks"
3. Create a new webhook with the endpoint: `https://your-domain.com/api/webhook/clerk`
4. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created`
   - `session.ended`
5. Copy the signing secret to your `.env.local` file

## Features Implemented

### Anonymous Users
- Can chat without authentication
- Sessions are temporary (cleared on page refresh)
- See "Anonymous User" indicator

### Authenticated Users
- Sign in with Clerk authentication
- Persistent chat history across sessions
- Can view and switch between previous chat sessions
- Chat history is saved automatically

### Authentication Flow
1. Users can start chatting immediately (anonymous mode)
2. Click "Sign in" to authenticate with Clerk
3. After authentication, users get access to chat history
4. Chat sessions are automatically saved for authenticated users

## Backend Integration

To fully implement chat history persistence, you'll need to:

1. **Create a database** to store chat sessions
2. **Update the API endpoints** to handle user-specific data
3. **Implement session management** for authenticated users

### Example API Endpoints to Create:

```typescript
// GET /api/chat/sessions - Get user's chat sessions
// POST /api/chat/sessions - Create new chat session
// PUT /api/chat/sessions/:id - Update chat session
// DELETE /api/chat/sessions/:id - Delete chat session
```

## Testing

1. Start your development server: `npm run dev`
2. Visit `/openwebui` to test the chat interface
3. Try both anonymous and authenticated modes
4. Test chat history functionality

## Troubleshooting

- **Authentication not working**: Check your Clerk keys in `.env.local`
- **Webhooks not receiving events**: Verify your webhook URL and secret
- **Chat history not loading**: Check browser console for API errors

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment variables for all sensitive configuration
- Implement proper CORS policies for your API endpoints
- Consider rate limiting for chat API endpoints

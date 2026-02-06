# Google OAuth Implementation Summary

## What Was Implemented

A complete Google OAuth flow for consumers (website visitors) to authenticate with Google Calendar through the chatbot widget. This allows consumers to create calendar events in their own Google Calendar accounts.

## Files Created/Modified

### New API Endpoints

1. **`app/api/google-oauth/authorize/route.ts`**
   - Generates Google OAuth authorization URL
   - Returns URL for widget to redirect user

2. **`app/api/google-oauth/callback/route.ts`**
   - Handles OAuth callback from Google
   - Exchanges authorization code for access/refresh tokens
   - Stores tokens in backend database

3. **`app/api/google-oauth/get-tokens/route.ts`**
   - Retrieves stored tokens for a session
   - Used by widget to check authentication status

4. **`app/api/google-oauth/refresh-token/route.ts`**
   - Refreshes expired access tokens
   - Uses refresh token to get new access token

### New Pages

1. **`app/oauth-success/page.tsx`**
   - Success page shown after OAuth authorization
   - Closes popup and notifies widget

2. **`app/oauth-error/page.tsx`**
   - Error page shown if OAuth fails
   - Displays error message to user

### Modified Files

1. **`widget/ChatbotWidget.tsx`**
   - Added Google OAuth state management
   - Added "Connect Google" button
   - Added token checking and refresh logic
   - Updated message sending to include Google tokens
   - Added OAuth status indicator UI

2. **`middleware.ts`**
   - Added OAuth routes to public routes
   - Allows unauthenticated access to OAuth endpoints

### Documentation

1. **`GOOGLE_OAUTH_SETUP.md`**
   - Complete setup guide
   - Backend API requirements
   - Database schema
   - n8n workflow integration examples

## How It Works

### Flow

1. **Consumer opens chatbot widget** → Widget checks for existing Google tokens
2. **No tokens found** → Widget shows "Connect Google Calendar" button
3. **Consumer clicks button** → Opens Google OAuth popup
4. **Consumer authorizes** → Google redirects to callback endpoint
5. **Callback exchanges code** → Gets access_token and refresh_token
6. **Tokens stored** → Backend stores tokens with sessionId + chatbotId
7. **Widget detects success** → Updates UI to show "Connected" status
8. **Consumer sends message** → Widget includes Google tokens in API call
9. **n8n workflow receives tokens** → Uses tokens to create calendar events

### Token Storage

Tokens are stored in backend database with:
- `sessionId`: Unique consumer session identifier
- `chatbotId`: Chatbot instance identifier
- `accessToken`: Short-lived token (expires in 1 hour)
- `refreshToken`: Long-lived token (used to refresh access token)
- `expiresAt`: Timestamp when access token expires

### Token Usage

When consumer sends a message:
- Widget includes `googleTokens` in request body
- Widget includes `X-Google-Access-Token` header
- Backend/n8n can use these tokens to call Google Calendar API

## Backend Requirements

Your backend must implement these endpoints:

1. **POST** `/v1/api/google-oauth/store-tokens`
   - Store tokens for a session

2. **GET** `/v1/api/google-oauth/get-tokens?sessionId={id}&chatbotId={id}`
   - Retrieve tokens for a session

3. **POST** `/v1/api/google-oauth/update-tokens`
   - Update access token after refresh

## Environment Variables Needed

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000  # or your production URL
NEXT_PUBLIC_BACKEND_URL=http://your-backend-url.com
```

## Widget UI Changes

### Before Authentication
- Shows orange banner: "Connect Google Calendar to create events"
- "🔗 Connect Google" button

### After Authentication
- Shows green banner: "✓ Google Calendar connected"
- "Disconnect" button to remove tokens

## Testing Checklist

- [ ] Google Cloud Console OAuth credentials configured
- [ ] Environment variables set
- [ ] Backend endpoints implemented
- [ ] Database table created
- [ ] Widget loads and checks for tokens
- [ ] OAuth popup opens correctly
- [ ] Authorization flow completes
- [ ] Tokens stored in database
- [ ] Widget shows "Connected" status
- [ ] Tokens included in API calls
- [ ] n8n workflow receives tokens
- [ ] Calendar events created successfully

## Next Steps

1. **Implement Backend Endpoints**
   - Create database table for tokens
   - Implement store/get/update endpoints
   - Add token expiration checking

2. **Configure Google Cloud**
   - Set up OAuth consent screen
   - Add redirect URIs
   - Enable Calendar API

3. **Test End-to-End**
   - Test OAuth flow
   - Verify token storage
   - Test calendar event creation

4. **n8n Workflow Integration**
   - Update workflows to use Google tokens
   - Add HTTP Request nodes for Calendar API
   - Handle token refresh if needed

## Security Notes

- Tokens stored server-side only (never in localStorage)
- HTTPS required in production
- Access tokens expire after 1 hour
- Refresh tokens used automatically
- Each session has isolated tokens
- Only `calendar.events` scope requested

## Troubleshooting

### Popup Blocked
- Check browser popup settings
- Verify OAuth URL is correct

### Tokens Not Found
- Verify sessionId matches
- Check database for stored tokens
- Ensure backend endpoints work

### Token Expired
- Refresh should happen automatically
- Check refresh token validity
- Verify update-tokens endpoint

### Calendar API Errors
- Verify Calendar API enabled
- Check OAuth scopes
- Ensure access token has permissions


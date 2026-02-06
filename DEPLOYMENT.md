# Deployment Guide

## Build Status

✅ **Widget Built Successfully**
- Location: `public/widget-dist/chat-widget.iife.js`
- Size: ~338 KB (117.71 KB gzipped)
- Includes: Google OAuth integration

✅ **Next.js App Built Successfully**
- Build output: `.next/` directory
- All API routes compiled
- OAuth pages included

## Deployment Checklist

### 1. Environment Variables

Ensure these are set in your production environment:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret

# URLs
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com

# Clerk (if using)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
```

### 2. Google Cloud Console Setup

1. **OAuth Consent Screen**
   - Set to "External" (or "Internal" for Workspace)
   - Add authorized domains
   - Configure scopes: `https://www.googleapis.com/auth/calendar.events`

2. **OAuth Credentials**
   - Add authorized redirect URI: `https://your-domain.com/api/google-oauth/callback`
   - Copy Client ID and Secret to environment variables

3. **Enable APIs**
   - Enable Google Calendar API

### 3. Backend Endpoints

Ensure your backend implements:

- `POST /v1/api/google-oauth/store-tokens`
- `GET /v1/api/google-oauth/get-tokens`
- `POST /v1/api/google-oauth/update-tokens`

See `GOOGLE_OAUTH_SETUP.md` for details.

### 4. Build Commands

```bash
# Build widget
npm run build:widget

# Build Next.js app
npm run build

# Start production server
npm start
```

### 5. Widget Deployment

The widget is built as a standalone IIFE bundle:

**File:** `public/widget-dist/chat-widget.iife.js`

**Usage in HTML:**
```html
<script src="https://your-domain.com/widget-dist/chat-widget.iife.js"></script>
<script>
  window.initChatWidget({
    chatbotId: 'your-chatbot-id',
    apiUrl: 'https://your-backend-url.com',
    authToken: 'optional-bearer-token',
    width: 380,  // optional
    height: 600  // optional
  });
</script>
```

### 6. Static File Serving

Ensure your hosting provider serves static files from `/public/widget-dist/`:

- **Vercel**: Automatic
- **Netlify**: Configure `_redirects` if needed
- **Custom Server**: Serve `/public/widget-dist` as static files

### 7. API Routes

All API routes are server-rendered (dynamic):
- `/api/google-oauth/*` - OAuth endpoints
- `/api/n8n/*` - N8N integration
- `/api/chat/*` - Chat endpoints

### 8. Pages

Static pages:
- `/oauth-success` - OAuth success page
- `/oauth-error` - OAuth error page

## Deployment Platforms

### Vercel

1. Connect your repository
2. Set environment variables
3. Deploy (automatic on push)

```bash
vercel --prod
```

### Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Set environment variables in dashboard

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npm run build:widget
EXPOSE 3000
CMD ["npm", "start"]
```

### Custom Server

```bash
# Build
npm run build
npm run build:widget

# Start
npm start
```

## Post-Deployment Verification

1. **Widget Loading**
   - [ ] Widget script loads from CDN
   - [ ] Widget initializes correctly
   - [ ] No console errors

2. **OAuth Flow**
   - [ ] "Connect Google" button appears
   - [ ] OAuth popup opens
   - [ ] Authorization completes
   - [ ] Tokens stored in backend
   - [ ] Widget shows "Connected" status

3. **API Endpoints**
   - [ ] `/api/google-oauth/authorize` returns auth URL
   - [ ] `/api/google-oauth/callback` processes tokens
   - [ ] `/api/google-oauth/get-tokens` retrieves tokens
   - [ ] `/api/google-oauth/refresh-token` refreshes tokens

4. **Backend Integration**
   - [ ] Backend receives tokens in API calls
   - [ ] Tokens stored correctly
   - [ ] n8n workflows receive tokens

## Troubleshooting

### Widget Not Loading
- Check CORS settings
- Verify static file serving
- Check browser console for errors

### OAuth Not Working
- Verify redirect URI matches Google Console
- Check environment variables
- Verify HTTPS (required for OAuth)

### Tokens Not Stored
- Check backend endpoints
- Verify database connection
- Check backend logs

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Rebuild: `npm run build`

## Monitoring

### Key Metrics to Monitor

1. **OAuth Success Rate**
   - Track successful authentications
   - Monitor callback errors

2. **Token Refresh Rate**
   - Monitor token expiration
   - Track refresh failures

3. **API Response Times**
   - Monitor OAuth endpoint performance
   - Track token retrieval times

4. **Error Rates**
   - Monitor OAuth errors
   - Track API failures

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] OAuth credentials protected
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Token storage encrypted
- [ ] Session isolation maintained

## Support

For issues or questions:
1. Check `GOOGLE_OAUTH_SETUP.md` for setup details
2. Check `GOOGLE_OAUTH_IMPLEMENTATION.md` for implementation details
3. Review backend API logs
4. Check browser console for errors


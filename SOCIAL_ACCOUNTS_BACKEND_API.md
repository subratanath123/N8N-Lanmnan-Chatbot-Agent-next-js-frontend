# Social Accounts Backend API

This document describes the backend API contract for storing Facebook and Twitter/X OAuth tokens and page info. The frontend sends long-lived tokens and page data after the user completes "Login with Facebook" or "Login with X (Twitter)" so the backend can automatically post on behalf of the user.

## Overview

- **User flow**: User clicks "Login with Facebook" or "Login with X (Twitter)" in Social Media Suite → My Accounts
- **OAuth**: Frontend handles OAuth, exchanges for long-lived tokens, fetches page info (Facebook)
- **Storage**: Frontend sends tokens + page info to backend; backend stores and uses for scheduled posting

## Authentication

All endpoints require a valid Clerk JWT in the `Authorization: Bearer <token>` header. The frontend obtains this via `getToken()` from `@clerk/nextjs` and passes it through the OAuth flow.

---

## Endpoints

### 1. Store Facebook Account

**POST** `/v1/api/social-accounts/facebook`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "longLivedToken": "string",
  "pages": [
    {
      "pageId": "string",
      "pageName": "string",
      "pageAccessToken": "string"
    }
  ],
  "expiresIn": 5184000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `longLivedToken` | string | Long-lived user access token (~60 days). Used to refresh page tokens if needed. |
| `pages` | array | Facebook Pages the user manages. Each has `pageId`, `pageName`, and `pageAccessToken`. Page tokens are long-lived and do not expire. |
| `expiresIn` | number | Token expiry in seconds (optional). |

**Response (200):**
```json
{
  "success": true,
  "platform": "facebook",
  "pagesCount": 2
}
```

**Backend usage:** Use `pageAccessToken` for each page when posting via [Facebook Graph API](https://developers.facebook.com/docs/graph-api/reference/page/feed/).

---

### 2. Store Twitter/X Account

**POST** `/v1/api/social-accounts/twitter`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "accessToken": "string",
  "refreshToken": "string | null",
  "expiresIn": 7200,
  "username": "string | null"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | OAuth 2.0 access token for posting. |
| `refreshToken` | string \| null | Refresh token if `offline.access` scope was requested. |
| `expiresIn` | number \| null | Token expiry in seconds. |
| `username` | string \| null | X username (handle) for display. |

**Response (200):**
```json
{
  "success": true,
  "platform": "twitter"
}
```

**Backend usage:** Use `accessToken` when posting via [X API v2 Tweets](https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets).

---

### 3. List Connected Accounts

**GET** `/v1/api/social-accounts`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
```

**Response (200):**
```json
{
  "accounts": [
    {
      "platform": "facebook",
      "connectedAt": "2026-02-20T12:00:00Z",
      "pages": [{"pageId": "123", "pageName": "My Page"}]
    },
    {
      "platform": "twitter",
      "connectedAt": "2026-02-20T12:00:00Z",
      "username": "myhandle"
    }
  ]
}
```

---

### 4. Disconnect Account

**DELETE** `/v1/api/social-accounts/:platform`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
```

**Parameters:**
- `platform`: `facebook` | `twitter`

**Response (200):**
```json
{
  "success": true
}
```

---

## Environment Variables (Frontend)

Add to `.env.local`:

```env
# Facebook - create app at https://developers.facebook.com/
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Twitter/X - create app at https://developer.x.com/
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Frontend URL (for OAuth redirects)
NEXT_PUBLIC_FRONTEND_URL=https://subratapc.net

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://subratapc.net:8080
```

**Note:** All social auth routes use `/auth/social/` (no `/api` prefix) so they are handled by the frontend and not proxied to the backend.

## Facebook App Setup

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com/).
2. Add **Facebook Login** product.
3. In Facebook Login settings, add Valid OAuth Redirect URIs:
   - `https://subratapc.net/auth/social/facebook/callback` (dev)
   - `https://your-domain.com/auth/social/facebook/callback` (prod)
4. Request permissions: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `pages_manage_metadata`, `business_management`.

## Twitter/X App Setup

1. Create a project and app at [developer.x.com](https://developer.x.com/).
2. Enable OAuth 2.0 and set callback URL:
   - `https://subratapc.net/auth/social/twitter/callback` (dev)
   - `https://your-domain.com/auth/social/twitter/callback` (prod)
3. Request scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`.

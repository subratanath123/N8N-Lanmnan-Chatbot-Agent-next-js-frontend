# Social Accounts Backend API

This document describes the backend API contract for storing Facebook, Twitter/X, and LinkedIn OAuth tokens. The frontend handles OAuth, exchanges for tokens, and sends them to the backend so it can post on behalf of users.

## Overview

- **User flow**: User clicks "Connect" in Social Media Suite → My Accounts
- **OAuth**: Frontend handles the full OAuth popup flow, exchanges for long-lived tokens
- **Storage**: Frontend sends tokens + profile data to backend; backend stores and uses for scheduled posting

## Authentication

All endpoints require a valid Clerk JWT in the `Authorization: Bearer <token>` header.

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
  "longLivedToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "pages": [
    {
      "pageId": "123456789012345",
      "pageName": "My Business Page",
      "pageAccessToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  ],
  "expiresIn": 5184000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `longLivedToken` | string | Long-lived user access token (~60 days) |
| `pages` | array | Facebook Pages the user manages |
| `pages[].pageId` | string | Facebook Graph API page ID |
| `pages[].pageName` | string | Display name |
| `pages[].pageAccessToken` | string | Long-lived page token — **use this when posting** |
| `expiresIn` | number | Token expiry in seconds |

**Response (200):**
```json
{
  "success": true,
  "platform": "facebook",
  "pagesCount": 1
}
```

**Posting API:** `POST https://graph.facebook.com/v18.0/{pageId}/feed` with `pageAccessToken`.

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
  "accessToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "refreshToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "expiresIn": 7200,
  "username": "myhandle"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | OAuth 2.0 access token for posting |
| `refreshToken` | string \| null | Refresh token (`offline.access` scope) — expires in 6 months |
| `expiresIn` | number \| null | Access token expiry in seconds (~2 hours) |
| `username` | string \| null | X handle for display |

**Response (200):**
```json
{
  "success": true,
  "platform": "twitter"
}
```

**Token refresh:** `POST https://api.twitter.com/2/oauth2/token` with `grant_type=refresh_token`.  
**Posting API:** `POST https://api.twitter.com/2/tweets` with `Authorization: Bearer <accessToken>`.

---

### 3. Store LinkedIn Account

**POST** `/v1/api/social-accounts/linkedin`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "accessToken": "AQXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "refreshToken": null,
  "expiresIn": 5183944,
  "linkedInUserId": "urn:li:person:AbCdEfGhIj",
  "displayName": "John Doe",
  "email": "john@example.com",
  "profilePicture": "https://media.licdn.com/dms/image/..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | OAuth 2.0 access token — **use this when posting** |
| `refreshToken` | string \| null | Refresh token if granted (LinkedIn's refresh token lasts 60 days; only issued when `offline_access` scope is approved — not in basic products) |
| `expiresIn` | number \| null | Access token expiry in seconds (~60 days for Sign In with LinkedIn) |
| `linkedInUserId` | string \| null | OpenID Connect `sub` claim — URN format e.g. `urn:li:person:AbCdEfGhIj` |
| `displayName` | string | Full name for display in UI |
| `email` | string \| null | User's LinkedIn email |
| `profilePicture` | string \| null | Profile picture URL |

**Response (200):**
```json
{
  "success": true,
  "platform": "linkedin",
  "accountId": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Important:** Always **add** a new account row — do not replace an existing LinkedIn connection for the same user. Multiple LinkedIn accounts per user are supported.

**Posting API (personal profile):**
```
POST https://api.linkedin.com/v2/ugcPosts
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "author": "urn:li:person:<linkedInUserId>",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Your post content here"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Token expiry:** LinkedIn access tokens from the basic products (Sign In + Share) last ~60 days. No automatic refresh is available without the Marketing Developer Platform. Prompt users to reconnect when expired.

---

### 4. List Connected Accounts

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
      "accountId": "550e8400-e29b-41d4-a716-446655440000",
      "platform": "facebook",
      "connectedAt": "2026-02-20T12:00:00Z",
      "pages": [
        { "pageId": "123456789012345", "pageName": "My Business Page" }
      ]
    },
    {
      "accountId": "550e8400-e29b-41d4-a716-446655440001",
      "platform": "twitter",
      "connectedAt": "2026-02-20T12:05:00Z",
      "username": "myhandle"
    },
    {
      "accountId": "550e8400-e29b-41d4-a716-446655440002",
      "platform": "linkedin",
      "connectedAt": "2026-02-20T12:10:00Z",
      "displayName": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

---

### 5. Disconnect Account

**DELETE** `/v1/api/social-accounts/{accountId}`

**Response (200):**
```json
{ "success": true }
```

---

## Environment Variables (Frontend)

Add to `.env.local`:

```env
# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Twitter/X
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# URLs
NEXT_PUBLIC_FRONTEND_URL=https://subratapc.net
NEXT_PUBLIC_BACKEND_URL=http://subratapc.net:8080
```

---

## LinkedIn App Setup

1. Go to [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) and create an app.
2. Under **Products**, request:
   - **Sign In with LinkedIn using OpenID Connect** (instant approval) → unlocks `openid profile email`
   - **Share on LinkedIn** (instant approval) → unlocks `w_member_social`
3. Under **Auth → OAuth 2.0 settings → Authorized redirect URLs**, add:
   - `https://subratapc.net/auth/social/linkedin/callback`
   - `http://localhost:3000/auth/social/linkedin/callback`
4. Copy **Client ID** and **Client Secret** to `.env.local`.

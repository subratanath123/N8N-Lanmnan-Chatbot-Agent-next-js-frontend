# Social Media Accounts API – Spring Backend Specification

**Version:** 1.0  
**Purpose:** Store long-lived OAuth tokens for Facebook/Twitter so users can select connected accounts when scheduling social media posts. Supports multiple accounts per platform.

---

## 1. Overview

### 1.1 Goals
- Store long-lived tokens when users connect Facebook or Twitter via OAuth
- Support **multiple accounts per platform** (e.g. multiple Facebook logins, each with multiple pages)
- Provide an **available accounts** list for the scheduling dropdown
- Use stored tokens to post on behalf of users when scheduling

### 1.2 Authentication
All endpoints use **Clerk JWT** in the header:
```
Authorization: Bearer <clerk_jwt>
```
Resolve `userId` from the JWT (Clerk `sub` claim) and associate all data with that user.

---

## 2. Data Model

### 2.1 SocialAccount (per connected account)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `userId` | String | From Clerk JWT `sub` |
| `platform` | Enum | `FACEBOOK`, `TWITTER` |
| `longLivedToken` | String | Long-lived user token (Facebook ~60 days) |
| `accessToken` | String | For Twitter; for Facebook same as page token when posting |
| `refreshToken` | String? | Twitter refresh token |
| `expiresAt` | Instant? | Token expiry |
| `createdAt` | Instant | When connected |
| `metadata` | JSON? | Extra platform-specific data |

### 2.2 SocialAccountPage (Facebook pages only)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `accountId` | UUID | FK to SocialAccount |
| `pageId` | String | Facebook page ID |
| `pageName` | String | Display name |
| `pageAccessToken` | String | Long-lived page token (use for posting) |

### 2.3 Twitter (no pages)
For Twitter, the account itself is the post target. Store `username` in metadata or a separate column.

---

## 3. API Endpoints

### 3.1 Add Facebook Account (supports multiple)

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
    },
    {
      "pageId": "987654321098765",
      "pageName": "Personal Page",
      "pageAccessToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  ],
  "expiresIn": 5184000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `longLivedToken` | string | Yes | Long-lived user access token (~60 days) |
| `pages` | array | Yes | Facebook Pages the user manages |
| `pages[].pageId` | string | Yes | Facebook Graph API page ID |
| `pages[].pageName` | string | Yes | Display name |
| `pages[].pageAccessToken` | string | Yes | Long-lived page token (use for posting) |
| `expiresIn` | number | No | Token expiry in seconds (default 5184000) |

**Response 200:**
```json
{
  "success": true,
  "accountId": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "facebook",
  "pagesCount": 2
}
```

**Behavior:** Always **add** a new account. Do not replace existing accounts. One Facebook login = one `SocialAccount` with multiple `SocialAccountPage` rows.

---

### 3.2 Add Twitter Account (supports multiple)

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accessToken` | string | Yes | OAuth 2.0 access token |
| `refreshToken` | string | No | Refresh token |
| `expiresIn` | number | No | Expiry in seconds |
| `username` | string | No | X username for display |

**Response 200:**
```json
{
  "success": true,
  "accountId": "550e8400-e29b-41d4-a716-446655440001",
  "platform": "twitter"
}
```

**Behavior:** Always **add** a new account. Do not replace existing Twitter accounts.

---

### 3.3 List All Accounts (for My Accounts page)

**GET** `/v1/api/social-accounts`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
```

**Response 200:**
```json
{
  "accounts": [
    {
      "accountId": "550e8400-e29b-41d4-a716-446655440000",
      "platform": "facebook",
      "connectedAt": "2026-02-20T12:00:00Z",
      "pages": [
        {
          "pageId": "123456789012345",
          "pageName": "My Business Page"
        },
        {
          "pageId": "987654321098765",
          "pageName": "Personal Page"
        }
      ]
    },
    {
      "accountId": "550e8400-e29b-41d4-a716-446655440001",
      "platform": "twitter",
      "connectedAt": "2026-02-20T12:05:00Z",
      "username": "myhandle"
    }
  ]
}
```

---

### 3.4 List Available Targets (for scheduling dropdown)

**GET** `/v1/api/social-accounts/targets`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
```

**Query params (optional):**
| Param | Type | Description |
|-------|------|-------------|
| `platform` | string | Filter: `facebook`, `twitter` |

**Response 200:**
```json
{
  "targets": [
    {
      "targetId": "550e8400-e29b-41d4-a716-446655440000:123456789012345",
      "accountId": "550e8400-e29b-41d4-a716-446655440000",
      "platform": "facebook",
      "displayName": "Facebook - My Business Page",
      "pageId": "123456789012345",
      "pageName": "My Business Page"
    },
    {
      "targetId": "550e8400-e29b-41d4-a716-446655440000:987654321098765",
      "accountId": "550e8400-e29b-41d4-a716-446655440000",
      "platform": "facebook",
      "displayName": "Facebook - Personal Page",
      "pageId": "987654321098765",
      "pageName": "Personal Page"
    },
    {
      "targetId": "550e8400-e29b-41d4-a716-446655440001",
      "accountId": "550e8400-e29b-41d4-a716-446655440001",
      "platform": "twitter",
      "displayName": "X (Twitter) - @myhandle",
      "username": "myhandle"
    }
  ]
}
```

**Note:** `targetId` for Facebook = `accountId:pageId`. For Twitter = `accountId`. Use `targetId` when scheduling a post.

---

### 3.5 Disconnect Single Account

**DELETE** `/v1/api/social-accounts/{accountId}`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
```

**Path params:**
| Param | Type | Description |
|-------|------|-------------|
| `accountId` | UUID | ID of the account to remove |

**Response 200:**
```json
{
  "success": true
}
```

**Response 404:** Account not found or not owned by user.

---

### 3.6 Get Token for Posting (internal use when scheduling)

**POST** `/v1/api/social-accounts/targets/token`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "targetId": "550e8400-e29b-41d4-a716-446655440000:123456789012345"
}
```

**Response 200:**
```json
{
  "platform": "facebook",
  "pageAccessToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "pageId": "123456789012345"
}
```

For Twitter:
```json
{
  "platform": "twitter",
  "accessToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "username": "myhandle"
}
```

**Note:** This endpoint is for backend-to-backend use when the scheduler needs the token to post. The frontend may not call it directly.

---

### 3.7 Schedule a Post

**POST** `/v1/api/social-posts/schedule`

**Headers:**
```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request body:**
```json
{
  "targetIds": ["550e8400-e29b-41d4-a716-446655440000:123456789012345"],
  "content": "Hello from my scheduled post!",
  "scheduledAt": "2026-02-21T14:00:00Z",
  "immediate": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetIds` | string[] | Yes | One or more target IDs from the targets endpoint |
| `content` | string | Yes | Post text content |
| `scheduledAt` | string (ISO 8601) | No | When to publish. Omit if `immediate` is true |
| `immediate` | boolean | No | If true, post immediately. Default false |

**Response 200:**
```json
{
  "success": true,
  "postId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "scheduled",
  "scheduledAt": "2026-02-21T14:00:00Z"
}
```

For immediate posts:
```json
{
  "success": true,
  "postId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "published"
}
```

**Response 400:** Invalid targetIds, missing content, or invalid scheduledAt.

---

## 4. Example cURL Requests

### Add Facebook Account
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-accounts/facebook" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "longLivedToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "pages": [
      {
        "pageId": "123456789012345",
        "pageName": "My Business Page",
        "pageAccessToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    ],
    "expiresIn": 5184000
  }'
```

### Add Twitter Account
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-accounts/twitter" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "refreshToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "expiresIn": 7200,
    "username": "myhandle"
  }'
```

### Get Targets for Dropdown
```bash
curl -X GET "https://subratapc.net:8080/v1/api/social-accounts/targets" \
  -H "Authorization: Bearer <clerk_jwt>"
```

### Get Targets filtered by platform
```bash
curl -X GET "https://subratapc.net:8080/v1/api/social-accounts/targets?platform=facebook" \
  -H "Authorization: Bearer <clerk_jwt>"
```

### List All Accounts
```bash
curl -X GET "https://subratapc.net:8080/v1/api/social-accounts" \
  -H "Authorization: Bearer <clerk_jwt>"
```

### Disconnect Account
```bash
curl -X DELETE "https://subratapc.net:8080/v1/api/social-accounts/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <clerk_jwt>"
```

### Schedule Post
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-posts/schedule" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetIds": ["550e8400-e29b-41d4-a716-446655440000:123456789012345"],
    "content": "Hello from my scheduled post!",
    "immediate": true
  }'
```

### Schedule Post for Later
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-posts/schedule" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetIds": ["550e8400-e29b-41d4-a716-446655440000:123456789012345"],
    "content": "Hello from my scheduled post!",
    "scheduledAt": "2026-02-21T14:00:00Z",
    "immediate": false
  }'
```

---

## 5. Suggested Spring Implementation

### 5.1 Entities (JPA)
```java
@Entity
@Table(name = "social_accounts")
public class SocialAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String userId;  // Clerk sub
    @Enumerated(EnumType.STRING)
    private Platform platform;
    @Column(length = 2000)
    private String longLivedToken;
    @Column(length = 2000)
    private String accessToken;
    private String refreshToken;
    private Instant expiresAt;
    private Instant createdAt;
    
    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL)
    private List<SocialAccountPage> pages;
    // getters/setters
}

@Entity
@Table(name = "social_account_pages")
public class SocialAccountPage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne
    private SocialAccount account;
    private String pageId;
    private String pageName;
    @Column(length = 2000)
    private String pageAccessToken;
    // getters/setters
}

enum Platform { FACEBOOK, TWITTER }
```

### 5.2 User Resolution
Extract `userId` from Clerk JWT:
- Decode JWT, read `sub` claim
- Or call Clerk API to validate and get user ID

### 5.3 Posting Flow
When a scheduled post runs:
1. Load target by `targetId` (parse `accountId:pageId` for Facebook)
2. Get `pageAccessToken` (Facebook) or `accessToken` (Twitter)
3. Call Facebook Graph API or X API to post

---

## 6. Frontend Integration

- **My Accounts:** Uses `GET /v1/api/social-accounts` to list accounts and `DELETE /v1/api/social-accounts/{accountId}` to disconnect.
- **Create Post / Schedule:** Uses `GET /v1/api/social-accounts/targets` to populate the "Select your target account" dropdown.
- **Schedule button:** Calls `POST /v1/api/social-posts/schedule` with `targetIds`, `content`, `scheduledAt` (optional), and `immediate`.
- **OAuth callback:** Uses `POST /v1/api/social-accounts/facebook` or `POST /v1/api/social-accounts/twitter` to store new accounts (adds, never replaces).

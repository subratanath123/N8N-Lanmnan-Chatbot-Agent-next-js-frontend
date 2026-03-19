# Social Media Accounts API – Spring Backend Specification

**Version:** 2.0  
**Purpose:** Store long-lived OAuth tokens for Facebook, Twitter/X, and LinkedIn so users can connect accounts and schedule posts through the Social Media Suite.

---

## 1. Overview

### 1.1 Goals
- Store OAuth tokens when users connect Facebook, Twitter, or LinkedIn via the popup OAuth flow
- Support **multiple accounts per platform** per user
- Provide connected account list for the My Accounts page
- Provide available scheduling targets for the Create Post dropdown
- Use stored tokens when the scheduler posts on behalf of users

### 1.2 Authentication
All endpoints use **Clerk JWT** in the header:
```
Authorization: Bearer <clerk_jwt>
```
Resolve `userId` from the JWT `sub` claim and associate all data with that user.

---

## 2. Data Model

### 2.1 SocialAccount

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `userId` | String | Clerk JWT `sub` claim |
| `platform` | Enum | `FACEBOOK` / `TWITTER` / `LINKEDIN` |
| `accessToken` | String | Current OAuth access token (encrypted at rest) |
| `refreshToken` | String? | Refresh token where supported (encrypted at rest) |
| `longLivedToken` | String? | Facebook long-lived user token |
| `expiresAt` | Instant? | When the access token expires |
| `displayName` | String? | Human-readable name (`@handle` for Twitter, full name for LinkedIn) |
| `email` | String? | LinkedIn email |
| `externalUserId` | String? | Platform user ID (LinkedIn `sub`, Twitter user ID) |
| `profilePicture` | String? | Profile image URL (LinkedIn) |
| `createdAt` | Instant | When connected |

### 2.2 SocialAccountPage (Facebook only)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `accountId` | UUID | FK → SocialAccount |
| `pageId` | String | Facebook page ID |
| `pageName` | String | Display name |
| `pageAccessToken` | String | Long-lived page token — **use this for posting** |

### 2.3 Platform summary

| Platform | Token type | Expiry | Refresh |
|----------|-----------|--------|---------|
| Facebook | Page access token (per page) | Never (long-lived page tokens don't expire) | Not needed |
| Twitter/X | OAuth 2.0 Bearer | ~2 hours | Yes — via `refresh_token` (6 months) |
| LinkedIn | OAuth 2.0 Bearer | ~60 days | Not available in basic products — prompt reconnect |

---

## 3. API Endpoints

### 3.1 Add Facebook Account

**POST** `/v1/api/social-accounts/facebook`

```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request:**
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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `longLivedToken` | string | Yes | Long-lived user access token (~60 days) |
| `pages` | array | Yes | Pages the user manages (may be empty) |
| `pages[].pageId` | string | Yes | Facebook Graph API page ID |
| `pages[].pageName` | string | Yes | Page display name |
| `pages[].pageAccessToken` | string | Yes | Long-lived page token — use for posting |
| `expiresIn` | number | No | User token expiry in seconds |

**Response (200):**
```json
{
  "success": true,
  "accountId": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "facebook",
  "pagesCount": 1
}
```

**Behavior:** Always insert a new `SocialAccount` row — never replace. Each Facebook login = new row + child `SocialAccountPage` rows.

---

### 3.2 Add Twitter/X Account

**POST** `/v1/api/social-accounts/twitter`

```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request:**
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
| `accessToken` | string | Yes | OAuth 2.0 Bearer token |
| `refreshToken` | string | No | Refresh token (6-month expiry) |
| `expiresIn` | number | No | Access token expiry in seconds (~7200) |
| `username` | string | No | X handle for display |

**Response (200):**
```json
{
  "success": true,
  "accountId": "550e8400-e29b-41d4-a716-446655440001",
  "platform": "twitter"
}
```

**Token refresh (backend job):**
```
POST https://api.twitter.com/2/oauth2/token
Authorization: Basic base64(clientId:clientSecret)
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=<stored_refresh_token>
```
Run this automatically before the `accessToken` expires.

---

### 3.3 Add LinkedIn Account ⭐ New

**POST** `/v1/api/social-accounts/linkedin`

```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request:**
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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accessToken` | string | Yes | OAuth 2.0 Bearer token — **use for posting** |
| `refreshToken` | string \| null | No | `null` for basic LinkedIn products |
| `expiresIn` | number \| null | No | Expiry in seconds (~5,183,944 ≈ 60 days) |
| `linkedInUserId` | string \| null | No | OpenID Connect `sub` (URN format) |
| `displayName` | string | Yes | Full name for display |
| `email` | string \| null | No | User's email |
| `profilePicture` | string \| null | No | Profile picture URL |

**Response (200):**
```json
{
  "success": true,
  "accountId": "550e8400-e29b-41d4-a716-446655440002",
  "platform": "linkedin"
}
```

**Behavior:** Always insert a new row — never replace. Multiple LinkedIn accounts per user are supported.

**Posting API — personal profile:**
```
POST https://api.linkedin.com/v2/ugcPosts
Authorization: Bearer <accessToken>
Content-Type: application/json
X-Restli-Protocol-Version: 2.0.0

{
  "author": "urn:li:person:<linkedInUserId>",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": { "text": "Post content here" },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Posting with image:**
```
Step 1 — Register upload:
POST https://api.linkedin.com/v2/assets?action=registerUpload
{ "registerUploadRequest": { "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"], "owner": "urn:li:person:<id>", "serviceRelationships": [{ "relationshipType": "OWNER", "identifier": "urn:li:userGeneratedContent" }] } }

Step 2 — Upload binary:
PUT <uploadUrl from step 1>
Content-Type: image/jpeg

Step 3 — Post with asset:
shareMediaCategory: "IMAGE" + "media": [{ "status": "READY", "media": "<asset URN>" }]
```

**Token expiry:** No refresh token available in basic products. Store `expiresAt = now + expiresIn`. When expired, the frontend will show "Reconnect" and the user goes through OAuth again.

---

### 3.4 List Connected Accounts

**GET** `/v1/api/social-accounts`

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

### 3.5 List Available Targets (scheduling dropdown)

**GET** `/v1/api/social-accounts/targets?platform={platform}`

`platform` query param is optional. Filters by `facebook`, `twitter`, or `linkedin`.

**Response (200):**
```json
{
  "targets": [
    {
      "targetId": "550e8400-e29b-41d4-a716-446655440000:123456789012345",
      "accountId": "550e8400-e29b-41d4-a716-446655440000",
      "platform": "facebook",
      "displayName": "Facebook – My Business Page",
      "pageId": "123456789012345",
      "pageName": "My Business Page"
    },
    {
      "targetId": "550e8400-e29b-41d4-a716-446655440001",
      "accountId": "550e8400-e29b-41d4-a716-446655440001",
      "platform": "twitter",
      "displayName": "X (Twitter) – @myhandle",
      "username": "myhandle"
    },
    {
      "targetId": "550e8400-e29b-41d4-a716-446655440002",
      "accountId": "550e8400-e29b-41d4-a716-446655440002",
      "platform": "linkedin",
      "displayName": "LinkedIn – John Doe",
      "username": "John Doe"
    }
  ]
}
```

**`targetId` format:**
- Facebook: `{accountId}:{pageId}` (post as that page)
- Twitter: `{accountId}`
- LinkedIn: `{accountId}`

---

### 3.6 Disconnect Account

**DELETE** `/v1/api/social-accounts/{accountId}`

**Response (200):**
```json
{ "success": true }
```

**Response (404):** Account not found or not owned by requesting user.

---

### 3.7 Schedule a Post

**POST** `/v1/api/social-posts/schedule`

```
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request:**
```json
{
  "targetIds": [
    "550e8400-e29b-41d4-a716-446655440000:123456789012345",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "content": "Hello from my scheduled post!",
  "scheduledAt": "2026-02-21T14:00:00Z",
  "immediate": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetIds` | string[] | Yes | One or more target IDs from the targets endpoint |
| `content` | string | Yes | Post text |
| `scheduledAt` | string (ISO 8601) | Conditional | Required when `immediate` is false |
| `immediate` | boolean | No | If true, post right now. Default false |

**Response (200) — scheduled:**
```json
{
  "success": true,
  "postId": "550e8400-e29b-41d4-a716-446655440003",
  "status": "scheduled",
  "scheduledAt": "2026-02-21T14:00:00Z"
}
```

**Response (200) — published immediately:**
```json
{
  "success": true,
  "postId": "550e8400-e29b-41d4-a716-446655440003",
  "status": "published"
}
```

---

## 4. cURL Examples

### Add LinkedIn Account
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-accounts/linkedin" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "AQXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "refreshToken": null,
    "expiresIn": 5183944,
    "linkedInUserId": "urn:li:person:AbCdEfGhIj",
    "displayName": "John Doe",
    "email": "john@example.com",
    "profilePicture": null
  }'
```

### Add Facebook Account
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-accounts/facebook" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "longLivedToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "pages": [{ "pageId": "123456789", "pageName": "My Page", "pageAccessToken": "EAAxxxxxxxx" }],
    "expiresIn": 5184000
  }'
```

### Add Twitter Account
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-accounts/twitter" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{ "accessToken": "xxx", "refreshToken": "xxx", "expiresIn": 7200, "username": "myhandle" }'
```

### Get Targets for Dropdown
```bash
curl "https://subratapc.net:8080/v1/api/social-accounts/targets" \
  -H "Authorization: Bearer <clerk_jwt>"

# Filtered by platform
curl "https://subratapc.net:8080/v1/api/social-accounts/targets?platform=linkedin" \
  -H "Authorization: Bearer <clerk_jwt>"
```

### Schedule Post to LinkedIn + Twitter
```bash
curl -X POST "https://subratapc.net:8080/v1/api/social-posts/schedule" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetIds": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002"
    ],
    "content": "Exciting news from our team!",
    "immediate": true
  }'
```

---

## 5. Spring Implementation

### 5.1 Updated Entities

```java
@Entity
@Table(name = "social_accounts")
public class SocialAccount {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String userId;          // Clerk sub

    @Enumerated(EnumType.STRING)
    private Platform platform;      // FACEBOOK, TWITTER, LINKEDIN

    @Column(length = 2000)
    private String accessToken;     // encrypted

    @Column(length = 2000)
    private String refreshToken;    // encrypted, null for LinkedIn basic

    @Column(length = 2000)
    private String longLivedToken;  // Facebook only

    private Instant expiresAt;
    private String  displayName;    // @handle (Twitter), full name (LinkedIn)
    private String  email;          // LinkedIn
    private String  externalUserId; // LinkedIn sub URN, Twitter user ID
    private String  profilePicture; // LinkedIn
    private Instant createdAt;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL)
    private List<SocialAccountPage> pages; // Facebook only

    // getters / setters
}

@Entity
@Table(name = "social_account_pages")
public class SocialAccountPage {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private SocialAccount account;

    private String pageId;
    private String pageName;

    @Column(length = 2000)
    private String pageAccessToken; // encrypted
    // getters / setters
}

enum Platform { FACEBOOK, TWITTER, LINKEDIN }
```

### 5.2 LinkedIn Controller

```java
@RestController
@RequestMapping("/v1/api/social-accounts")
public class SocialAccountController {

    @PostMapping("/linkedin")
    public ResponseEntity<Map<String, Object>> addLinkedIn(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody LinkedInAccountRequest body) {

        String userId = clerkService.getUserId(authHeader);

        SocialAccount account = new SocialAccount();
        account.setUserId(userId);
        account.setPlatform(Platform.LINKEDIN);
        account.setAccessToken(encrypt(body.getAccessToken()));
        account.setRefreshToken(body.getRefreshToken() != null ? encrypt(body.getRefreshToken()) : null);
        account.setExternalUserId(body.getLinkedInUserId());
        account.setDisplayName(body.getDisplayName());
        account.setEmail(body.getEmail());
        account.setProfilePicture(body.getProfilePicture());
        account.setExpiresAt(body.getExpiresIn() != null
            ? Instant.now().plusSeconds(body.getExpiresIn()) : null);
        account.setCreatedAt(Instant.now());

        SocialAccount saved = socialAccountRepo.save(account);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "accountId", saved.getId().toString(),
            "platform", "linkedin"
        ));
    }
}
```

### 5.3 LinkedIn Posting Service

```java
@Service
public class LinkedInPostingService {

    public String post(String accessToken, String linkedInUserId, String content) {
        String body = """
            {
              "author": "urn:li:person:%s",
              "lifecycleState": "PUBLISHED",
              "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                  "shareCommentary": { "text": "%s" },
                  "shareMediaCategory": "NONE"
                }
              },
              "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
              }
            }
            """.formatted(linkedInUserId, escapeJson(content));

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create("https://api.linkedin.com/v2/ugcPosts"))
            .header("Authorization", "Bearer " + accessToken)
            .header("Content-Type", "application/json")
            .header("X-Restli-Protocol-Version", "2.0.0")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 201) {
            throw new RuntimeException("LinkedIn post failed: " + res.body());
        }

        // Response contains "id" of the created UGC post
        return extractPostId(res.body());
    }
}
```

### 5.4 Token Expiry Handling

LinkedIn tokens expire after ~60 days with no refresh available (basic products).

```java
// When resolving token for posting:
if (account.getExpiresAt() != null && account.getExpiresAt().isBefore(Instant.now())) {
    throw new TokenExpiredException("LinkedIn token expired for account " + account.getId()
        + ". User must reconnect.");
}
```

The frontend should handle `TOKEN_EXPIRED` errors by showing a "Reconnect LinkedIn" button.

### 5.5 Targets Endpoint — LinkedIn entry

```java
// For LinkedIn accounts, targetId = accountId (no sub-pages)
targets.add(new TargetDto(
    account.getId().toString(),         // targetId
    account.getId().toString(),         // accountId
    "linkedin",                         // platform
    "LinkedIn – " + account.getDisplayName(), // displayName
    account.getDisplayName()            // username field (reused for display)
));
```

---

## 6. LinkedIn Developer Portal Checklist

| Requirement | Where | Notes |
|-------------|-------|-------|
| **Sign In with LinkedIn using OpenID Connect** | Products tab | Instant approval — unlocks `openid profile email` |
| **Share on LinkedIn** | Products tab | Instant approval — unlocks `w_member_social` |
| Callback URL registered | Auth tab | `https://subratapc.net/auth/social/linkedin/callback` |
| `LINKEDIN_CLIENT_ID` | `.env.local` | From Auth tab |
| `LINKEDIN_CLIENT_SECRET` | `.env.local` | From Auth tab |

---

## 7. Frontend Integration Summary

| Action | Endpoint |
|--------|----------|
| User connects LinkedIn | Popup → `/auth/social/linkedin/authorize` → LinkedIn → `/auth/social/linkedin/callback` → `POST /v1/api/social-accounts/linkedin` |
| My Accounts page loads | `GET /v1/api/social-accounts` |
| User disconnects | `DELETE /v1/api/social-accounts/{accountId}` |
| Create Post — target dropdown | `GET /v1/api/social-accounts/targets?platform=linkedin` |
| User clicks Schedule | `POST /v1/api/social-posts/schedule` |

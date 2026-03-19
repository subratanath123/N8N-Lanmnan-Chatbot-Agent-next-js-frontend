# Backend Avatar & Chatbot API Changes

**Date:** February 12, 2026  
**Purpose:** Fix AI avatar storage and public chatbot response for embedded widget  
**Audience:** Backend implementation team

---

## 1. Problem Summary

The frontend was incorrectly saving **blob URLs** (e.g. `blob:https://subratapc.net/d1ff3571-1d8b-458b-b612-79606b6497ee`) as `aiAvatar` when users uploaded custom avatars. Blob URLs are ephemeral and invalid after the page session. The backend should:

1. **Store** `avatarFileId` for custom uploads (never store blob URLs)
2. **Store** `aiAvatar` only when it is a valid HTTP/HTTPS URL (preset avatars)
3. **Return** the correct avatar data in the public chatbot endpoint so the embedded widget can display it

---

## 2. Chatbot Create/Update – Request Contract

### `POST /v1/api/chatbot/create` (and equivalent update endpoint)

**Avatar fields the frontend sends:**

| Field | Type | When sent | Description |
|-------|------|-----------|-------------|
| `aiAvatar` | string \| undefined | Preset avatar or default | Full HTTP/HTTPS URL (e.g. `https://i.pravatar.cc/150?img=1`). **Never** a blob URL. |
| `avatarFileId` | string \| undefined | Custom upload only | File ID from `/v1/api/file/upload` response. |

**Rules:**

- If `avatarFileId` is present → **custom avatar**. Store `avatarFileId` only. Do **not** store `aiAvatar` (or set it to `null`).
- If `aiAvatar` is present and is a valid URL (starts with `http://` or `https://`) → **preset avatar**. Store `aiAvatar`. Do **not** store `avatarFileId` (or set it to `null`).
- If `aiAvatar` starts with `blob:` → **invalid**. Ignore it. Treat as no custom avatar; use default preset URL if needed.
- Default preset URL: `https://i.pravatar.cc/150?img=1`

**Backend validation:**

```text
- Reject or ignore aiAvatar if it starts with "blob:"
- Store avatarFileId when provided (custom upload)
- Store aiAvatar only when it is http:// or https://
```

---

## 3. Public Chatbot Endpoint – Response Contract

### `GET /v1/api/public/chatbot/{chatbotId}`

**Must return avatar data for the embedded widget.**

**Response fields (avatar-related):**

| Field | Type | When to include | Description |
|-------|------|-----------------|-------------|
| `aiAvatar` | string | Preset avatar | Full URL to the avatar image (e.g. `https://i.pravatar.cc/150?img=1`). |
| `avatarFileId` | string | Custom avatar | File ID when chatbot uses a custom uploaded avatar. |

**Resolution logic (backend should apply):**

1. **Custom avatar** (stored `avatarFileId`):
   - Return `avatarFileId` in the response.
   - Optionally return `aiAvatar` as the **resolved download URL** (see below). If you only return `avatarFileId`, the widget will construct the URL.

2. **Preset avatar** (stored `aiAvatar` as URL):
   - Return `aiAvatar` with the full URL.
   - Do not return `avatarFileId`.

3. **Default / no avatar**:
   - Return `aiAvatar: "https://i.pravatar.cc/150?img=1"` or omit both; widget will show the chatbot name initial.

**Resolved avatar URL for custom uploads (optional but recommended):**

If you prefer to return a ready-to-use URL instead of `avatarFileId`, resolve it as:

```text
{baseUrl}/api/attachments/download/{avatarFileId}?chatbotId={chatbotId}
```

Where `baseUrl` is your backend/attachment API base URL. Then return `aiAvatar` with this URL and you may omit `avatarFileId` in the response.

**Example response (flat format, widget supports both flat and nested `theme`):**

```json
{
  "id": "chatbot_123",
  "name": "Support Bot",
  "title": "Support Bot",
  "greetingMessage": "How can I help?",
  "width": 380,
  "height": 600,
  "headerBackground": "#2D3748",
  "headerText": "#FFFFFF",
  "aiBackground": "#F7FAFC",
  "aiText": "#1A202C",
  "userBackground": "#3B82F6",
  "userText": "#FFFFFF",
  "widgetPosition": "right",
  "aiAvatar": "https://your-api/api/attachments/download/file_xxx?chatbotId=chatbot_123",
  "avatarFileId": "file_xxx",
  "hideMainBannerLogo": false
}
```

Or with nested `theme`:

```json
{
  "id": "chatbot_123",
  "name": "Support Bot",
  "greetingMessage": "How can I help?",
  "width": 380,
  "height": 600,
  "theme": {
    "headerBackground": "#2D3748",
    "headerText": "#FFFFFF",
    "aiAvatar": "https://...",
    "widgetPosition": "right"
  }
}
```

---

## 4. Data Migration – Fix Existing Bad Data

**Problem:** Some chatbots have `aiAvatar` stored as a blob URL (e.g. `blob:https://subratapc.net/...`).

**Migration steps:**

1. Find all chatbots where `aiAvatar` starts with `blob:`.
2. For each:
   - If `avatarFileId` exists → set `aiAvatar` to `null` (or remove it). Keep `avatarFileId`.
   - If `avatarFileId` is missing → set `aiAvatar` to default: `https://i.pravatar.cc/150?img=1`.
3. Ensure no blob URLs remain in the database.

**Example migration (pseudo-code):**

```text
FOR EACH chatbot WHERE aiAvatar STARTS WITH 'blob:':
  IF avatarFileId IS NOT NULL:
    SET aiAvatar = NULL
  ELSE:
    SET aiAvatar = 'https://i.pravatar.cc/150?img=1'
  END IF
END FOR
```

---

## 5. File Upload Endpoint

### `POST /v1/api/file/upload` (avatar upload)

**Request:** `multipart/form-data` with `file`, `workflowId: "chatbot-avatar"`, `webhookUrl: "chatbot-avatar"`.

**Response (recommended):**

```json
{
  "fileId": "file_abc123",
  "downloadUrl": "https://your-api/api/attachments/download/file_abc123",
  "fileName": "avatar.png",
  "mimeType": "image/png"
}
```

- `fileId` is required.
- `downloadUrl` is optional but useful; if omitted, the widget will construct the URL from `avatarFileId` and `apiUrl`.

---

## 6. Avatar Download Endpoint (Required)

The avatar uses the **attachments API** (same as chat file attachments):

- **Upload:** `POST /api/attachments/upload` (frontend proxy → backend)
- **Download:** `GET /api/attachments/download/{fileId}?chatbotId={chatbotId}` (frontend proxy → backend)

The frontend proxies these for embedded widgets (avoids CORS).

---

## 7. Summary Checklist

- [ ] **Create/Update:** Never persist `aiAvatar` when it starts with `blob:`.
- [ ] **Create/Update:** Store `avatarFileId` when provided (custom avatar).
- [ ] **Create/Update:** Store `aiAvatar` only when it is `http://` or `https://`.
- [ ] **Public GET:** Return `aiAvatar` (full URL) and/or `avatarFileId` per resolution rules.
- [ ] **Migration:** Replace blob URLs in `aiAvatar` with `null` or default preset URL.
- [ ] **File upload:** Return `fileId` (and optionally `downloadUrl`) for avatar uploads.
- [ ] **Download endpoint:** Ensure `/api/attachments/download/{fileId}` works and allows CORS.

---

## 8. Frontend Behavior (Reference)

| Scenario | Frontend sends | Backend should store |
|----------|----------------|----------------------|
| User selects preset avatar | `aiAvatar: "https://i.pravatar.cc/150?img=1"`, no `avatarFileId` | `aiAvatar` only |
| User uploads custom avatar | `avatarFileId: "file_xxx"`, no `aiAvatar` | `avatarFileId` only |
| User uses default (no selection) | `aiAvatar: "https://i.pravatar.cc/150?img=1"` | `aiAvatar` |
| Legacy blob URL (should not occur) | Frontend filters; backend should reject | Never store |

---

**End of document**

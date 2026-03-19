# Backend Chatbot Operations - API Contract & Requirements

**Date:** February 2026  
**Version:** 1.0  
**Status:** For Implementation  
**Priority:** High

---

## Overview

This document defines the API contracts and backend requirements for:

1. **Chatbot Delete** – Remove a chatbot
2. **Chatbot Enable/Disable** – Toggle chatbot status
3. **Widget Disabled State** – Public API must return status so the widget can show disabled state
4. **Statistics & Aggregation** – Requirements for Total Chatbots, Total Conversations, Total Messages, Active Domains

---

## 1. Delete Chatbot

### Endpoint

```
DELETE /v1/api/chatbot/{chatbotId}
```

### Authentication

- **Required:** Bearer token (JWT)
- **Header:** `Authorization: Bearer {token}`

### Request

| Path Param | Type | Description |
|------------|------|-------------|
| `chatbotId` | string | Unique chatbot identifier |

### Success Response

- **Status:** `200 OK` or `204 No Content`
- **Body:** Optional (empty or `{ success: true }`)

### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Unauthorized – missing or invalid token |
| `403` | Forbidden – user cannot delete this chatbot |
| `404` | Chatbot not found |

### Frontend Usage

- Called from the chatbot card menu when user selects "Delete"
- Confirmation modal is shown before calling

---

## 2. Toggle Enable/Disable (Status)

### Endpoint

```
PUT /v1/api/chatbot/{chatbotId}/toggle
```

### Authentication

- **Required:** Bearer token (JWT)
- **Header:** `Authorization: Bearer {token}`

### Request Body

```json
{
  "status": "ACTIVE"
}
```

or

```json
{
  "status": "DISABLED"
}
```

### Request Fields

| Field | Type | Required | Values | Description |
|-------|------|----------|--------|-------------|
| `status` | string | Yes | `ACTIVE`, `DISABLED` | New status for the chatbot |

### Success Response

- **Status:** `200 OK`
- **Body:** Updated chatbot object (or at least `{ id, status }`)

```json
{
  "success": true,
  "data": {
    "id": "chatbot_123",
    "status": "ACTIVE"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| `400` | Invalid status value |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Chatbot not found |

### Frontend Usage

- Called when user toggles the Active/Inactive switch on a chatbot card
- Current status: `ACTIVE` → new status: `DISABLED` (and vice versa)

---

## 3. Public Chatbot Response – Status for Widget

### Endpoint

```
GET /v1/api/public/chatbot/{chatbotId}
```

### Requirement

The response **must** include a `status` field so the embedded widget can show a disabled state when the chatbot is disabled.

### Response Fields (Add/Ensure)

| Field | Type | Required | Values | Description |
|-------|------|----------|--------|-------------|
| `status` | string | Yes | `ACTIVE`, `DISABLED` | Chatbot status. When `DISABLED`, the widget should not allow new messages. |

### Example Response (with status)

```json
{
  "id": "chatbot_123",
  "name": "My Chatbot",
  "greetingMessage": "Hello!",
  "status": "ACTIVE",
  "width": 380,
  "height": 600,
  "theme": { ... }
}
```

### Widget Behavior

When `status === "DISABLED"`:

- The widget should **not** allow sending new messages
- Show a message such as: "This chatbot is currently unavailable."
- Optionally hide the input area or show it as disabled

When `status === "ACTIVE"` or status is omitted (legacy):

- Widget behaves normally

---

## 4. Statistics & Aggregation Requirements

The AI Chatbots listing page shows:

- **Total Chatbots**
- **Total Conversations**
- **Total Messages**
- **Active Domains** (count of chatbots with `status === "ACTIVE"`)

### Option A: Enhance List Endpoint

**Endpoint:** `GET /v1/api/chatbot/list`

Each chatbot in the list should include:

| Field | Type | Description |
|-------|------|-------------|
| `totalConversations` | number | Total conversation count for this chatbot |
| `totalMessages` | number | Total message count for this chatbot |
| `status` | string | `ACTIVE` or `DISABLED` |

### Option B: Separate Stats Endpoint

**Endpoint:** `GET /v1/api/chatbot/stats`

**Response:**

```json
{
  "totalChatbots": 11,
  "totalConversations": 42,
  "totalMessages": 156,
  "activeChatbots": 8
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalChatbots` | number | Total number of chatbots |
| `totalConversations` | number | Sum of conversations across all chatbots |
| `totalMessages` | number | Sum of messages across all chatbots |
| `activeChatbots` | number | Count of chatbots with `status === "ACTIVE"` |

### Frontend Fallback

The frontend currently:

- Uses `chatbots.length` for Total Chatbots
- Aggregates `totalConversations` or `conversationCount` or `conversations` per chatbot
- Aggregates `totalMessages` or `messageCount` or `messages` per chatbot
- Counts `status === "ACTIVE"` for Active Domains

**Backend should provide** at least one of:

1. Per-chatbot `totalConversations` and `totalMessages` in the list response, OR
2. A `/stats` endpoint that returns the aggregated values.

---

## 5. Summary Checklist

| Feature | Endpoint | Method | Status |
|---------|----------|--------|--------|
| Delete chatbot | `/v1/api/chatbot/{id}` | DELETE | To implement |
| Toggle status | `/v1/api/chatbot/{id}/toggle` | PUT | To implement |
| Public chatbot status | `/v1/api/public/chatbot/{id}` | GET | Add `status` field |
| List with stats | `/v1/api/chatbot/list` | GET | Add `totalConversations`, `totalMessages` per chatbot |
| Optional: Stats | `/v1/api/chatbot/stats` | GET | Optional aggregation endpoint |

---

## 6. Related Documents

- `BACKEND_AVATAR_CHANGES.md` – Avatar and theme requirements
- `BACKEND_ENDPOINT_REQUIREMENTS.md` – Chatbot reply API

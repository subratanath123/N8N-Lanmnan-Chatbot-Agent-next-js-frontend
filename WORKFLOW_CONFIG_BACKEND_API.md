# Workflow Configuration — Backend API Specification

This document describes the REST endpoints the backend must implement to support
the **Workflow Configuration** feature (`/ai-chatbots/:id/workflow`).

---

## Overview

Business owners configure custom backend endpoints (chat handlers, order placement,
booking APIs, etc.) per chatbot. The frontend saves/loads this configuration and
proxies user messages through the configured endpoints at runtime.

---

## Data Model

### `WorkflowConfig` (MongoDB / JPA entity)

```json
{
  "chatbotId": "support-bot",
  "chatEndpoint": {
    "url": "https://your-n8n.com/webhook/abc123",
    "method": "POST",
    "authType": "bearer",           // "none" | "bearer" | "apikey" | "basic"
    "authValue": "sk-...",          // encrypted at rest
    "apiKeyHeader": "X-API-Key",    // only for authType=apikey
    "bodyTemplate": "{ \"message\": \"{{message}}\", \"sessionId\": \"{{sessionId}}\" }",
    "responsePath": "output",       // dot-notation path to extract reply text
    "enabled": true
  },
  "actions": [
    {
      "id": "action-1234567890",
      "name": "Place Order",
      "description": "Triggered when user wants to place an order",
      "triggerPhrases": "place order, buy now, add to cart, purchase",
      "url": "https://store.com/api/orders",
      "method": "POST",
      "authType": "bearer",
      "authValue": "sk-...",
      "bodyTemplate": "{ \"action\": \"{{actionName}}\", \"message\": \"{{message}}\", \"userId\": \"{{userId}}\" }",
      "successMessage": "Done! Your order has been placed.",
      "failureMessage": "Sorry, I could not complete that action.",
      "enabled": true
    }
  ],
  "createdAt": "2026-02-12T10:00:00Z",
  "updatedAt": "2026-02-12T10:00:00Z"
}
```

> ⚠️ **Security:** `authValue` fields must be **encrypted at rest** (AES-256 or similar).
> Never return plain-text secrets to the frontend — return a masked value like `"••••••••"` or omit entirely.

---

## Endpoints

### 1. Get Workflow Config

```
GET /v1/api/chatbot/{chatbotId}/workflow
Authorization: Bearer <clerk_jwt>
```

**Response 200:**
```json
{
  "chatbotId": "support-bot",
  "chatEndpoint": {
    "url": "https://your-n8n.com/webhook/abc123",
    "method": "POST",
    "authType": "bearer",
    "authValue": "••••••••",
    "apiKeyHeader": "X-API-Key",
    "bodyTemplate": "{ \"message\": \"{{message}}\", \"sessionId\": \"{{sessionId}}\" }",
    "responsePath": "output",
    "enabled": true
  },
  "actions": [...]
}
```

**Response 404** — no config saved yet (frontend shows default empty form)

---

### 2. Save / Update Workflow Config

```
POST /v1/api/chatbot/{chatbotId}/workflow
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request Body:** full `WorkflowConfig` object (same structure as above).

- If `authValue` is `"••••••••"` (masked), **do not overwrite** the stored secret.
- Upsert — create if not exists, replace if exists.

**Response 200:**
```json
{ "success": true, "chatbotId": "support-bot" }
```

---

### 3. Test Chat Endpoint (optional but recommended)

```
POST /v1/api/chatbot/{chatbotId}/workflow/test
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request Body:**
```json
{ "message": "Hello, what products do you have?" }
```

This endpoint calls the stored `chatEndpoint` config with the test message,
substituting variables, and returns the raw + parsed response.

**Response 200:**
```json
{
  "httpStatus": 200,
  "ok": true,
  "durationMs": 143,
  "rawResponse": "{ \"output\": \"We have 50+ products...\" }",
  "parsedReply": "We have 50+ products..."
}
```

**Response 400** — endpoint not configured or disabled
**Response 502** — upstream call failed

---

## Runtime: Message Routing

When a user message arrives at the chat endpoint:

```
POST /v1/api/n8n/authenticated/chat
```

The backend should check if the chatbot has a `WorkflowConfig` with `chatEndpoint.enabled = true`.

**If enabled:**
1. Substitute template variables in `bodyTemplate`:
   - `{{message}}` → user's message text
   - `{{sessionId}}` → `conversationId` / session ID
   - `{{userId}}` → authenticated user's ID or email
   - `{{chatbotId}}` → the chatbot's ID
2. Forward the request to `chatEndpoint.url` with the configured method and auth headers.
3. Extract the reply using `responsePath` (dot-notation traversal).
4. **Action detection** (optional):
   - Before forwarding, check if message contains any `triggerPhrases` from enabled actions.
   - If matched, additionally call the action's endpoint.
   - Replace the final reply with `successMessage` or `failureMessage` based on the action response.
5. Return the extracted reply to the user.

**If disabled (or no config):** fall back to default N8N/AI processing.

---

## Auth Header Construction

| `authType` | Header added to upstream request |
|------------|----------------------------------|
| `none`     | No auth header                   |
| `bearer`   | `Authorization: Bearer <authValue>` |
| `apikey`   | `<apiKeyHeader>: <authValue>`    |
| `basic`    | `Authorization: Basic <authValue>` |

---

## Variable Reference

| Variable | Replaced with |
|---|---|
| `{{message}}` | User's current message text |
| `{{sessionId}}` | Conversation session / ID |
| `{{userId}}` | Clerk user ID or email |
| `{{chatbotId}}` | The chatbot's identifier |
| `{{actionName}}` | Name of the triggered action (actions only) |

---

## Spring Boot Implementation Notes

### Entity (MongoDB)

```java
@Document(collection = "chatbot_workflow_configs")
public class WorkflowConfig {
    @Id
    private String id;
    private String chatbotId;
    private ChatEndpointConfig chatEndpoint;
    private List<ActionEndpoint> actions = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
}
```

### Repository

```java
public interface WorkflowConfigRepository extends MongoRepository<WorkflowConfig, String> {
    Optional<WorkflowConfig> findByChatbotId(String chatbotId);
}
```

### Controller Endpoints

```java
@RestController
@RequestMapping("/v1/api/chatbot/{chatbotId}/workflow")
public class WorkflowConfigController {

    @GetMapping
    public ResponseEntity<WorkflowConfig> getConfig(@PathVariable String chatbotId) { ... }

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveConfig(
        @PathVariable String chatbotId,
        @RequestBody WorkflowConfig config) { ... }

    @PostMapping("/test")
    public ResponseEntity<TestResult> testEndpoint(
        @PathVariable String chatbotId,
        @RequestBody Map<String, String> body) { ... }
}
```

---

## Security Checklist

- [ ] Only the chatbot owner (matched via Clerk JWT `sub` or `email`) can read/write the config
- [ ] `authValue` is encrypted at rest using AES-256
- [ ] `authValue` is never returned in plain text — use `"••••••••"` mask in GET responses
- [ ] Rate-limit the `/test` endpoint (e.g. 10 requests/minute per user)
- [ ] Validate `url` to be a valid HTTPS URL (reject `localhost`, internal IPs for security)
- [ ] Log upstream request failures for debugging (without logging secrets)

# Workflow Configuration — Backend API Specification

> **Version:** 2.0  
> **Updated to reflect:** Custom parameters (flat + nested object types), MCP tool schema generation, and N8N action execution.

---

## Overview

Each chatbot can have a **Workflow Config** — a list of **Action Endpoints** that the AI can trigger on behalf of the user.  
When a user's message matches an action's intent, the backend:

1. Constructs the **MCP tool schema** from the action's parameters
2. Passes it to N8N (as OpenAI function-calling tools)
3. N8N/LLM collects the required values from the user
4. Backend calls the configured endpoint with the filled payload

---

## Data Models

### `SubParam` — a field inside an object parameter

```json
{
  "id": "sp-1234-abcd",
  "name": "productId",
  "type": "string",
  "description": "The product ID the user wants to buy",
  "required": true,
  "example": "PROD-123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Frontend-generated unique ID |
| `name` | string | yes | Field name — used as `{{parent.name}}` in body template |
| `type` | `"string" \| "number" \| "boolean" \| "array"` | yes | JSON Schema primitive |
| `description` | string | yes | Shown to the AI — tells it what to collect |
| `required` | boolean | yes | Whether the AI must collect this before firing |
| `example` | string | no | Hints to AI on expected format |

---

### `ActionParam` — a top-level parameter for an action

```json
{
  "id": "p-5678-efgh",
  "name": "order",
  "type": "object",
  "description": "The order details collected from the user",
  "required": true,
  "example": "",
  "properties": [
    {
      "id": "sp-0001-aaaa",
      "name": "productId",
      "type": "string",
      "description": "Product ID the user wants to buy",
      "required": true,
      "example": "PROD-123"
    },
    {
      "id": "sp-0002-bbbb",
      "name": "quantity",
      "type": "number",
      "description": "How many units",
      "required": true,
      "example": "2"
    },
    {
      "id": "sp-0003-cccc",
      "name": "deliveryAddress",
      "type": "string",
      "description": "Full delivery address",
      "required": false,
      "example": "123 Main St, New York"
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Frontend-generated unique ID |
| `name` | string | yes | Param name — used as `{{name}}` in body template |
| `type` | `"string" \| "number" \| "boolean" \| "array" \| "object"` | yes | `"object"` enables sub-properties |
| `description` | string | yes | Tells the AI what this param represents |
| `required` | boolean | yes | Whether the AI must collect this before firing |
| `example` | string | no | Not used when type is `"object"` |
| `properties` | `SubParam[]` | only when `type === "object"` | Sub-fields of the object |

---

### `ActionEndpoint` — one configurable action

```json
{
  "id": "action-1700000000000",
  "name": "Place Order",
  "description": "Triggered when the user wants to purchase a product or place an order. Requires product details and quantity.",
  "triggerPhrases": "place order, buy now, add to cart, checkout, purchase",
  "url": "https://your-store.com/api/orders",
  "method": "POST",
  "authType": "bearer",
  "authValue": "ENCRYPTED:AES256:...",
  "apiKeyHeader": "X-API-Key",
  "params": [
    {
      "id": "p-0001",
      "name": "productId",
      "type": "string",
      "description": "The product ID the user wants to buy",
      "required": true,
      "example": "PROD-123",
      "properties": []
    },
    {
      "id": "p-0002",
      "name": "order",
      "type": "object",
      "description": "Full order details",
      "required": true,
      "example": "",
      "properties": [
        { "id": "sp-0001", "name": "quantity",  "type": "number",  "description": "How many units", "required": true,  "example": "1" },
        { "id": "sp-0002", "name": "address",   "type": "string",  "description": "Delivery address", "required": false, "example": "123 Main St" }
      ]
    }
  ],
  "bodyTemplate": "{\n  \"action\": \"{{actionName}}\",\n  \"productId\": \"{{productId}}\",\n  \"order\": {{order}},\n  \"sessionId\": \"{{sessionId}}\"\n}",
  "successMessage": "Your order has been placed! You'll receive a confirmation shortly.",
  "failureMessage": "Sorry, I couldn't place the order. Please try again or contact support.",
  "enabled": true
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique action ID |
| `name` | string | Display name, also used as `{{actionName}}` |
| `description` | string | Passed to AI as tool description |
| `triggerPhrases` | string | Comma-separated — also used for intent matching |
| `url` | string | Endpoint to call |
| `method` | `"POST" \| "GET" \| "PUT" \| "PATCH" \| "DELETE"` | HTTP method |
| `authType` | `"none" \| "bearer" \| "apikey" \| "basic"` | Authentication type |
| `authValue` | string | **Must be AES-256 encrypted at rest.** Masked as `"••••••"` in GET responses |
| `apiKeyHeader` | string | Only used when `authType === "apikey"` |
| `params` | `ActionParam[]` | Custom parameters for MCP tool schema |
| `bodyTemplate` | string | JSON template with `{{variable}}` placeholders |
| `responseMode` | `"static" \| "dynamic"` | **`static`** — always reply with `successMessage`. **`dynamic`** — extract a field from the API response JSON and show that to the user (falls back to `successMessage` if the path is missing) |
| `responsePath` | string | Dot-notation path into the action endpoint's JSON response. Only used when `responseMode === "dynamic"`. e.g. `"message"`, `"data.reply"`, `"order.confirmationText"` |
| `successMessage` | string | Shown on success when `responseMode === "static"`, or as fallback when `responseMode === "dynamic"` and the path is empty/missing |
| `failureMessage` | string | Chatbot replies with this on failure |
| `enabled` | boolean | If false, action is ignored entirely |

---

### `WorkflowConfig` — the full config for a chatbot

```json
{
  "chatbotId": "support-bot",
  "actions": [ /* ActionEndpoint[] */ ]
}
```

---

## REST Endpoints

### `GET /v1/api/chatbot/{chatbotId}/workflow`

Returns the workflow config. `authValue` fields are **masked**.

**Response 200:**
```json
{
  "chatbotId": "support-bot",
  "actions": [
    {
      "id": "action-1700000000000",
      "name": "Place Order",
      "authValue": "••••••",
      "params": [ /* ActionParam[] */ ],
      ...
    }
  ]
}
```

---

### `POST /v1/api/chatbot/{chatbotId}/workflow`

Save (create or replace) the workflow config. Accepts full `authValue` in plaintext — backend must encrypt before storing.

**Request body:**
```json
{
  "actions": [ /* ActionEndpoint[] */ ]
}
```

**Response 200:**
```json
{ "chatbotId": "support-bot", "savedAt": "2026-02-12T10:00:00Z" }
```

**Security requirements:**
- Validate JWT — only the chatbot owner can save
- If `authValue` starts with `"ENCRYPTED:"` it is already encrypted — do not re-encrypt
- Otherwise encrypt with AES-256-GCM before persisting
- Never return plaintext `authValue` in any response

---

## MCP Tool Schema Generation

When the N8N agent needs to know what tools are available, call:

### `GET /v1/api/mcp/{chatbotId}/tools`

Returns OpenAI function-calling compatible tool definitions, built from the `params` arrays.

**Response 200:**
```json
{
  "chatbotId": "support-bot",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "place_order",
        "description": "Triggered when the user wants to purchase a product or place an order.",
        "parameters": {
          "type": "object",
          "properties": {
            "productId": {
              "type": "string",
              "description": "The product ID the user wants to buy",
              "example": "PROD-123"
            },
            "order": {
              "type": "object",
              "description": "Full order details",
              "properties": {
                "quantity": {
                  "type": "number",
                  "description": "How many units",
                  "example": "1"
                },
                "address": {
                  "type": "string",
                  "description": "Delivery address"
                }
              },
              "required": ["quantity"]
            }
          },
          "required": ["productId", "order"]
        }
      }
    }
  ]
}
```

**Schema generation rules:**

| `ActionParam.type` | Schema output |
|---|---|
| `"string" / "number" / "boolean" / "array"` | `{ "type": "...", "description": "...", "example": "..." }` |
| `"object"` (no properties) | `{ "type": "object", "description": "..." }` |
| `"object"` (with properties) | `{ "type": "object", "properties": { ... }, "required": [...] }` |

---

## Action Execution

### `POST /v1/api/mcp/{chatbotId}/execute`

Called by N8N after the LLM has collected all required parameter values.

**Request body:**
```json
{
  "actionId": "action-1700000000000",
  "collectedParams": {
    "productId": "PROD-123",
    "order": {
      "quantity": 2,
      "address": "123 Main St, New York"
    }
  },
  "sessionId": "session-abc",
  "userId": "user@email.com",
  "message": "I want to order 2 blue widgets"
}
```

**Backend execution steps:**

1. Load `WorkflowConfig` for `chatbotId` and find the action by `actionId`
2. Verify action is `enabled: true`
3. Decrypt `authValue`
4. **Interpolate body template** — replace `{{variables}}` with collected values:

| Template variable | Replaced with |
|---|---|
| `{{actionName}}` | `action.name` |
| `{{message}}` | user's last message |
| `{{sessionId}}` | conversation session ID |
| `{{userId}}` | platform user ID/email (from Clerk JWT) |
| `{{chatbotId}}` | chatbot identifier |
| `{{userToken}}` | token passed from the business website's widget init |
| `{{paramName}}` | flat param value collected by AI |
| `{{objectParam}}` | `JSON.stringify(collectedParams.objectParam)` — full object |
| `{{objectParam.field}}` | individual sub-field value — dot notation |

5. Build HTTP request headers based on `authType`:

| `authType` | Header added |
|---|---|
| `bearer` | `Authorization: Bearer {decryptedAuthValue}` |
| `apikey` | `{apiKeyHeader}: {decryptedAuthValue}` |
| `basic` | `Authorization: Basic {decryptedAuthValue}` |
| `none` | No auth header |

6. Call the action's `url` with the interpolated body
7. Return response:

7. **Determine the reply** shown to the user based on `responseMode`:

| `responseMode` | Reply logic |
|---|---|
| `"static"` | Return `action.successMessage` verbatim |
| `"dynamic"` | Parse the action endpoint's JSON response, extract `responsePath` using dot-notation. If found and non-empty → use that string. Otherwise fall back to `action.successMessage` |

**Dot-notation extraction (Java):**
```java
private String extractPath(String responseBody, String dotPath) {
    try {
        JsonNode root = new ObjectMapper().readTree(responseBody);
        for (String key : dotPath.split("\\.")) {
            root = root.path(key);
            if (root.isMissingNode()) return null;
        }
        return root.isTextual() ? root.asText() : root.toString();
    } catch (Exception e) {
        return null;
    }
}

// Usage in execute:
String reply;
if ("dynamic".equals(action.getResponseMode())) {
    String extracted = extractPath(responseBody, action.getResponsePath());
    reply = (extracted != null && !extracted.isBlank())
        ? extracted
        : action.getSuccessMessage();   // fallback
} else {
    reply = action.getSuccessMessage();
}
```

**Response 200 (success):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order #1234 placed! Expected delivery: March 25",
  "responseBody": { /* raw response from the action endpoint */ }
}
```

> `message` is what the chatbot shows the user — either the extracted API value (dynamic) or the fixed success message (static).

**Response 200 (action endpoint returned error):**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Sorry, I couldn't place the order. Please try again or contact support.",
  "error": "Upstream returned HTTP 500"
}
```

---

## User Identity Token — `userToken`

The embedded chat widget supports passing the **business website's user auth token** at initialization time.  
This lets the action endpoint know *who* the visitor is (their customer account, session, etc.).

### Widget initialization (business website)

```html
<!-- Server-rendered page (PHP / Django / Rails) -->
<script>
  window.ChatWidgetConfig = {
    chatbotId: "support-bot",
    userToken: "<?php echo $currentUser->getJWT() ?>"
  };
</script>

<!-- SPA (React / Next.js) -->
<script>
  window.ChatWidgetConfig = {
    chatbotId: "support-bot",
    userToken: localStorage.getItem("auth_token")  // or getAuthHeader()
  };
</script>
```

### How it flows

```
Browser: ChatWidget.init({ userToken: "eyJhbGci..." })
    ↓
Widget sends userToken with every message to N8N chat endpoint
    ↓
N8N/LLM decides to trigger "Place Order" action
    ↓
Backend receives userToken in /execute request
    ↓
Backend interpolates {{userToken}} into body template
    ↓
Your business API receives the token → verify → identify user → process order
```

### In the execute request

The `userToken` is passed as a top-level field in `POST /v1/api/mcp/{chatbotId}/execute`:

```json
{
  "actionId": "action-xxx",
  "collectedParams": { "productId": "PROD-1", "quantity": 2 },
  "sessionId": "sess-abc",
  "userId": "platform-user@email.com",
  "userToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "I want to order 2 blue widgets"
}
```

### In the body template

```json
{
  "action": "{{actionName}}",
  "productId": "{{productId}}",
  "quantity": {{quantity}},
  "sessionId": "{{sessionId}}",
  "userToken": "{{userToken}}"
}
```

Your business endpoint receives `userToken` and can:
- Verify it as a JWT to extract `userId`, `email`, `role`, etc.
- Use it as a session/cookie identifier
- Forward it to a downstream service
- Look up the customer in your database

### Security note

- `userToken` is provided by the browser — treat it as **untrusted input**
- Always verify/validate it server-side before using it for authorization
- The platform does not inspect, store, or validate `userToken` — it is forwarded as-is

---

## Body Template Interpolation — Full Reference

Given these `collectedParams`:
```json
{
  "productId": "PROD-123",
  "order": { "quantity": 2, "address": "123 Main St" },
  "sessionId": "sess-001",
  "userId": "user@email.com"
}
```

And this body template:
```json
{
  "action": "{{actionName}}",
  "session": "{{sessionId}}",
  "product": "{{productId}}",
  "fullOrder": {{order}},
  "qty": {{order.quantity}},
  "street": "{{order.address}}"
}
```

Produces:
```json
{
  "action": "place_order",
  "session": "sess-001",
  "product": "PROD-123",
  "fullOrder": {"quantity": 2, "address": "123 Main St"},
  "qty": 2,
  "street": "123 Main St"
}
```

**Interpolation priority (process in this order):**
1. Dot-notation first: `{{object.field}}` → individual value
2. Object placeholders: `{{objectName}}` → `JSON.stringify(object)` — note: no surrounding quotes in template
3. Flat placeholders: `{{paramName}}` → string value

---

## MongoDB Document Structure

```javascript
// Collection: chatbot_workflow_configs
{
  "_id": ObjectId("..."),
  "chatbotId": "support-bot",
  "ownerId": "user@email.com",        // from Clerk JWT
  "updatedAt": ISODate("2026-02-12"),
  "actions": [
    {
      "id": "action-1700000000000",
      "name": "Place Order",
      "description": "...",
      "triggerPhrases": "place order, buy now",
      "url": "https://your-store.com/api/orders",
      "method": "POST",
      "authType": "bearer",
      "authValue": "ENCRYPTED:AES256GCM:iv=...:tag=...:cipher=...",  // AES-256-GCM
      "apiKeyHeader": "X-API-Key",
      "params": [
        {
          "id": "p-0001",
          "name": "productId",
          "type": "string",
          "description": "Product ID",
          "required": true,
          "example": "PROD-123",
          "properties": []
        },
        {
          "id": "p-0002",
          "name": "order",
          "type": "object",
          "description": "Order details",
          "required": true,
          "example": "",
          "properties": [
            { "id": "sp-0001", "name": "quantity",  "type": "number",  "description": "Units", "required": true,  "example": "1" },
            { "id": "sp-0002", "name": "address",   "type": "string",  "description": "Delivery address", "required": false, "example": "" }
          ]
        }
      ],
      "bodyTemplate": "{\n  \"productId\": \"{{productId}}\",\n  \"order\": {{order}}\n}",
      "responseMode": "dynamic",
      "responsePath": "message",
      "successMessage": "Order placed!",
      "failureMessage": "Failed to place order.",
      "enabled": true
    }
  ]
}
```

---

## Java / Spring Boot — Suggested Classes

```java
// SubParam.java
public class SubParam {
    private String id;
    private String name;
    private String type;         // "string" | "number" | "boolean" | "array"
    private String description;
    private boolean required;
    private String example;
}

// ActionParam.java
public class ActionParam {
    private String id;
    private String name;
    private String type;         // "string" | "number" | "boolean" | "array" | "object"
    private String description;
    private boolean required;
    private String example;
    private List<SubParam> properties = new ArrayList<>();  // populated when type = "object"
}

// ActionEndpoint.java
public class ActionEndpoint {
    private String id;
    private String name;
    private String description;
    private String triggerPhrases;
    private String url;
    private String method;
    private String authType;
    private String authValue;    // encrypted at rest
    private String apiKeyHeader;
    private List<ActionParam> params = new ArrayList<>();
    private String bodyTemplate;
    private String responseMode = "static";   // "static" | "dynamic"
    private String responsePath = "message";  // dot-path, only used when responseMode = "dynamic"
    private String successMessage;
    private String failureMessage;
    private boolean enabled;
}

// WorkflowConfig.java  (MongoDB document)
@Document(collection = "chatbot_workflow_configs")
public class WorkflowConfig {
    @Id
    private String id;
    private String chatbotId;
    private String ownerId;
    private LocalDateTime updatedAt;
    private List<ActionEndpoint> actions = new ArrayList<>();
}
```

---

## MCP Schema Builder — Java Logic

```java
public Map<String, Object> buildParamSchema(ActionParam p) {
    Map<String, Object> schema = new LinkedHashMap<>();
    schema.put("type", p.getType());
    schema.put("description", p.getDescription() != null ? p.getDescription() : "The " + p.getName());
    if (p.getExample() != null && !p.getExample().isEmpty()) {
        schema.put("example", p.getExample());
    }

    if ("object".equals(p.getType()) && p.getProperties() != null && !p.getProperties().isEmpty()) {
        Map<String, Object> subProps = new LinkedHashMap<>();
        List<String> subRequired = new ArrayList<>();
        for (SubParam sp : p.getProperties()) {
            if (sp.getName() == null || sp.getName().isBlank()) continue;
            Map<String, Object> spSchema = new LinkedHashMap<>();
            spSchema.put("type", sp.getType());
            spSchema.put("description", sp.getDescription() != null ? sp.getDescription() : "The " + sp.getName());
            if (sp.getExample() != null && !sp.getExample().isEmpty()) spSchema.put("example", sp.getExample());
            subProps.put(sp.getName(), spSchema);
            if (sp.isRequired()) subRequired.add(sp.getName());
        }
        schema.put("properties", subProps);
        if (!subRequired.isEmpty()) schema.put("required", subRequired);
    }
    return schema;
}

public Map<String, Object> buildToolDefinition(ActionEndpoint action) {
    Map<String, Object> properties = new LinkedHashMap<>();
    List<String> required = new ArrayList<>();

    for (ActionParam p : action.getParams()) {
        if (p.getName() == null || p.getName().isBlank()) continue;
        properties.put(p.getName(), buildParamSchema(p));
        if (p.isRequired()) required.add(p.getName());
    }

    Map<String, Object> parameters = Map.of(
        "type", "object",
        "properties", properties,
        "required", required
    );
    Map<String, Object> function = Map.of(
        "name", action.getName().toLowerCase().replace(" ", "_"),
        "description", action.getDescription(),
        "parameters", parameters
    );
    return Map.of("type", "function", "function", function);
}
```

---

## Body Template Interpolation — Java Logic

```java
public String interpolate(String template, ActionEndpoint action,
                           Map<String, Object> collectedParams,
                           String sessionId, String userId, String chatbotId,
                           String userToken) {   // ← token from widget init
    String out = template
        .replace("{{actionName}}", action.getName())
        .replace("{{sessionId}}", sessionId)
        .replace("{{userId}}", userId)
        .replace("{{chatbotId}}", chatbotId)
        .replace("{{userToken}}", userToken != null ? userToken : "")
        .replace("{{message}}", (String) collectedParams.getOrDefault("message", ""));

    // 1. Dot-notation first: {{obj.field}}
    for (ActionParam p : action.getParams()) {
        if ("object".equals(p.getType()) && collectedParams.containsKey(p.getName())) {
            Object objVal = collectedParams.get(p.getName());
            if (objVal instanceof Map<?, ?> objMap) {
                for (Map.Entry<?, ?> entry : objMap.entrySet()) {
                    out = out.replace("{{" + p.getName() + "." + entry.getKey() + "}}", String.valueOf(entry.getValue()));
                }
            }
        }
    }

    // 2. Object placeholder: {{objName}} → full JSON
    for (ActionParam p : action.getParams()) {
        if ("object".equals(p.getType()) && collectedParams.containsKey(p.getName())) {
            String json = new ObjectMapper().writeValueAsString(collectedParams.get(p.getName()));
            out = out.replace("{{" + p.getName() + "}}", json);
        }
    }

    // 3. Flat params: {{paramName}}
    for (Map.Entry<String, Object> entry : collectedParams.entrySet()) {
        if (!entry.getKey().equals("message")) {
            out = out.replace("{{" + entry.getKey() + "}}", String.valueOf(entry.getValue()));
        }
    }

    return out;
}
```

---

## Security Checklist

- [ ] `authValue` encrypted with AES-256-GCM before MongoDB write
- [ ] `authValue` masked (`"••••••"`) in all GET responses
- [ ] JWT validated — only chatbot owner can read/write workflow
- [ ] Action execution (`/execute`) validates that `chatbotId` owns the `actionId`
- [ ] Timeout on upstream HTTP calls (e.g. 10s) to prevent hanging requests
- [ ] Log action executions (chatbotId, actionId, statusCode, durationMs) — not the payload
- [ ] Rate limit `/execute` per session to prevent abuse

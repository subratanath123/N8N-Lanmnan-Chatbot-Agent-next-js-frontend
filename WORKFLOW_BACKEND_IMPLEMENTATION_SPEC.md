# Workflow Config — Backend Implementation Spec

> **Scope:** Everything the backend needs to implement to support the Chatbot Workflow Configuration feature.  
> **Audience:** Backend agent (Spring Boot / MongoDB).

---

## 1. Data Models

### 1.1 `SubParam`
Leaf-level field inside an `object`-typed parameter.

```java
public class SubParam {
    private String id;
    private String name;         // field name, e.g. "productId"
    private String type;         // "string" | "number" | "boolean" | "array"
    private String description;  // shown to the AI — what to collect
    private boolean required;
    private String example;      // hint for the AI, e.g. "PROD-123"
}
```

### 1.2 `ActionParam`
A top-level parameter for one action.

```java
public class ActionParam {
    private String id;
    private String name;         // e.g. "order"
    private String type;         // "string" | "number" | "boolean" | "array" | "object"
    private String description;
    private boolean required;
    private String example;
    private List<SubParam> properties = new ArrayList<>();  // only used when type == "object"
}
```

### 1.3 `ActionEndpoint`
One configurable action the AI can trigger.

```java
public class ActionEndpoint {
    private String id;
    private String name;             // e.g. "Place Order"
    private String description;      // tells the AI when to use this
    private String triggerPhrases;   // comma-separated, e.g. "place order, buy now"
    private String url;              // your website's API endpoint
    private String method;           // "POST" | "GET" | "PUT" | "PATCH" | "DELETE"
    private String authType;         // "none" | "bearer" | "apikey" | "basic"
    private String authValue;        // AES-256-GCM encrypted at rest
    private String apiKeyHeader;     // only for authType == "apikey", e.g. "X-API-Key"
    private List<ActionParam> params = new ArrayList<>();
    private String bodyTemplate;     // JSON template with {{variable}} placeholders
    private String responseMode;     // "static" | "dynamic"  (default: "static")
    private String responsePath;     // dot-path into API response, e.g. "message" or "data.reply"
    private String successMessage;   // shown verbatim (static) or as fallback (dynamic)
    private String failureMessage;
    private boolean enabled;
}
```

### 1.4 `WorkflowConfig` (MongoDB document)

```java
@Document(collection = "chatbot_workflow_configs")
public class WorkflowConfig {
    @Id
    private String id;
    private String chatbotId;
    private String ownerId;             // userEmail from Clerk JWT
    private LocalDateTime updatedAt;
    private List<ActionEndpoint> actions = new ArrayList<>();
}
```

---

## 2. REST Endpoints

### `GET /v1/api/chatbot/{chatbotId}/workflow`

Return the saved config. **Mask `authValue`** in the response.

**Auth:** JWT required — only the chatbot owner.

**Response 200:**
```json
{
  "chatbotId": "support-bot",
  "actions": [
    {
      "id": "action-xxx",
      "name": "Place Order",
      "authValue": "••••••",
      "responseMode": "dynamic",
      "responsePath": "message",
      "params": [ /* ActionParam[] */ ],
      ...
    }
  ]
}
```

---

### `POST /v1/api/chatbot/{chatbotId}/workflow`

Save (upsert) the workflow config.

**Auth:** JWT required — only the chatbot owner.

**Request body:**
```json
{
  "actions": [ /* ActionEndpoint[] — authValue in plaintext */ ]
}
```

**Security:**
- If `authValue` starts with `"ENCRYPTED:"` → already encrypted, store as-is.
- Otherwise → encrypt with AES-256-GCM before persisting.
- Never return plaintext `authValue`.

**Response 200:**
```json
{ "chatbotId": "support-bot", "savedAt": "2026-02-12T10:00:00Z" }
```

---

## 3. MCP Tool Schema — `GET /v1/api/mcp/{chatbotId}/tools`

Called by N8N to discover what actions are available for a chatbot.

Builds **OpenAI function-calling compatible** tool definitions from each action's `params`.

**Response 200:**
```json
{
  "chatbotId": "support-bot",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "place_order",
        "description": "Triggered when the user wants to purchase a product.",
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
                "quantity": { "type": "number", "description": "How many units", "example": "1" },
                "address":  { "type": "string", "description": "Delivery address" }
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

### Schema generation rules

| `ActionParam.type` | Schema node |
|---|---|
| `"string" / "number" / "boolean" / "array"` | `{ "type": "...", "description": "...", "example": "..." }` |
| `"object"` with no properties | `{ "type": "object", "description": "..." }` |
| `"object"` with properties | `{ "type": "object", "description": "...", "properties": {...}, "required": [...] }` |

### Java helper

```java
public Map<String, Object> buildParamSchema(ActionParam p) {
    Map<String, Object> schema = new LinkedHashMap<>();
    schema.put("type", p.getType());
    schema.put("description", nvl(p.getDescription(), "The " + p.getName()));
    if (hasText(p.getExample())) schema.put("example", p.getExample());

    if ("object".equals(p.getType()) && !p.getProperties().isEmpty()) {
        Map<String, Object> subProps = new LinkedHashMap<>();
        List<String> subRequired = new ArrayList<>();
        for (SubParam sp : p.getProperties()) {
            if (isBlank(sp.getName())) continue;
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("type", sp.getType());
            s.put("description", nvl(sp.getDescription(), "The " + sp.getName()));
            if (hasText(sp.getExample())) s.put("example", sp.getExample());
            subProps.put(sp.getName(), s);
            if (sp.isRequired()) subRequired.add(sp.getName());
        }
        schema.put("properties", subProps);
        if (!subRequired.isEmpty()) schema.put("required", subRequired);
    }
    return schema;
}
```

---

## 4. Action Execution — `POST /v1/api/mcp/{chatbotId}/execute`

Called by N8N after the LLM has collected all parameter values.

### Request body

```json
{
  "actionId": "action-xxx",
  "collectedParams": {
    "productId": "PROD-123",
    "order": {
      "quantity": 2,
      "address": "123 Main St, New York"
    }
  },
  "sessionId": "sess-abc",
  "userId": "user@email.com",
  "userToken": "eyJhbGci...",
  "message": "I want to order 2 blue widgets"
}
```

| Field | Notes |
|---|---|
| `actionId` | Match to an action in the saved `WorkflowConfig` |
| `collectedParams` | Values the AI collected — flat or nested objects |
| `sessionId` | Conversation session ID |
| `userId` | Platform user (from Clerk JWT) |
| `userToken` | **Auth token from the embedding website** — the visitor's identity token, forwarded to your action endpoint via `{{userToken}}` |
| `message` | The user's raw message |

---

### Execution steps

**Step 1** — Load `WorkflowConfig` for `chatbotId`. Find action by `actionId`. Verify `enabled == true`.

**Step 2** — Decrypt `authValue`.

**Step 3** — Interpolate body template (see Section 5).

**Step 4** — Build request headers:

| `authType` | Header |
|---|---|
| `bearer` | `Authorization: Bearer {decryptedAuthValue}` |
| `apikey` | `{apiKeyHeader}: {decryptedAuthValue}` |
| `basic` | `Authorization: Basic {decryptedAuthValue}` |
| `none` | — |

**Step 5** — HTTP call to `action.url` with `action.method` and interpolated body. Timeout: **10 seconds**.

**Step 6** — Determine the reply to return to the user:

```java
String userReply;

if ("dynamic".equals(action.getResponseMode())) {
    String extracted = extractPath(responseBody, action.getResponsePath());
    userReply = hasText(extracted) ? extracted : action.getSuccessMessage();
} else {
    userReply = action.getSuccessMessage();
}
```

**Step 7** — Return response:

```json
// Success
{
  "success": true,
  "statusCode": 200,
  "message": "Order #1234 placed! Expected delivery: March 25",
  "responseBody": { /* raw upstream response */ }
}

// Failure (upstream error or HTTP 4xx/5xx)
{
  "success": false,
  "statusCode": 500,
  "message": "Sorry, I couldn't complete that action. Please try again.",
  "error": "Upstream returned HTTP 500"
}
```

> `message` is what N8N passes back to the chatbot to show the user.

---

## 5. Body Template Interpolation

### Variables

| Placeholder | Replaced with |
|---|---|
| `{{actionName}}` | `action.name` |
| `{{message}}` | user's last message |
| `{{sessionId}}` | conversation session ID |
| `{{userId}}` | platform user (Clerk) |
| `{{chatbotId}}` | chatbot identifier |
| `{{userToken}}` | token from the embedding website's widget init |
| `{{paramName}}` | flat collected param value |
| `{{objParam}}` | `JSON.stringify(collectedParams.objParam)` — full object |
| `{{objParam.field}}` | individual sub-field — dot notation |

### Processing order (important)

1. System variables: `{{actionName}}`, `{{message}}`, `{{sessionId}}`, `{{userId}}`, `{{chatbotId}}`, `{{userToken}}`
2. Dot-notation fields first: `{{order.quantity}}` → individual value
3. Object placeholders: `{{order}}` → full JSON object
4. Remaining flat params: `{{productId}}`

### Java implementation

```java
public String interpolate(String template, ActionEndpoint action,
                           Map<String, Object> collectedParams,
                           String sessionId, String userId,
                           String chatbotId, String userToken) {
    String out = template
        .replace("{{actionName}}", nvl(action.getName(), ""))
        .replace("{{message}}",   nvl((String) collectedParams.get("message"), ""))
        .replace("{{sessionId}}", nvl(sessionId, ""))
        .replace("{{userId}}",    nvl(userId, ""))
        .replace("{{chatbotId}}", nvl(chatbotId, ""))
        .replace("{{userToken}}", nvl(userToken, ""));

    // 1. Dot-notation: {{order.quantity}}
    for (ActionParam p : action.getParams()) {
        if ("object".equals(p.getType()) && collectedParams.containsKey(p.getName())) {
            Object obj = collectedParams.get(p.getName());
            if (obj instanceof Map<?, ?> m) {
                for (var entry : m.entrySet()) {
                    out = out.replace("{{" + p.getName() + "." + entry.getKey() + "}}",
                                      String.valueOf(entry.getValue()));
                }
            }
        }
    }

    // 2. Object placeholder: {{order}} → full JSON
    for (ActionParam p : action.getParams()) {
        if ("object".equals(p.getType()) && collectedParams.containsKey(p.getName())) {
            String json = objectMapper.writeValueAsString(collectedParams.get(p.getName()));
            out = out.replace("{{" + p.getName() + "}}", json);
        }
    }

    // 3. Flat params: {{productId}}
    for (Map.Entry<String, Object> e : collectedParams.entrySet()) {
        if (!"message".equals(e.getKey())) {
            out = out.replace("{{" + e.getKey() + "}}", String.valueOf(e.getValue()));
        }
    }

    return out;
}
```

---

## 6. Response Path Extraction (`responseMode: "dynamic"`)

```java
private String extractPath(String responseBody, String dotPath) {
    try {
        JsonNode root = objectMapper.readTree(responseBody);
        for (String key : dotPath.split("\\.")) {
            root = root.path(key);
            if (root.isMissingNode()) return null;
        }
        return root.isTextual() ? root.asText() : root.toString();
    } catch (Exception e) {
        log.warn("extractPath failed for path '{}': {}", dotPath, e.getMessage());
        return null;
    }
}
```

**Examples:**

| API response | `responsePath` | Extracted reply |
|---|---|---|
| `{"message":"Order #1234 placed!"}` | `message` | `Order #1234 placed!` |
| `{"data":{"reply":"Booked for 3pm"}}` | `data.reply` | `Booked for 3pm` |
| `{"result":{"text":"Stock: 12 units"}}` | `result.text` | `Stock: 12 units` |
| `{"status":"ok"}` | `message` | *(not found → fallback to successMessage)* |

---

## 7. Credential Security

- Encrypt `authValue` with **AES-256-GCM** before writing to MongoDB.
- Store as: `ENCRYPTED:AES256GCM:iv=<base64>:tag=<base64>:cipher=<base64>`
- Detect already-encrypted values by the `ENCRYPTED:` prefix — do not re-encrypt.
- **Always mask** `authValue` as `"••••••"` in all GET responses.
- Never log `authValue` or `userToken`.

---

## 8. MongoDB Document Example

```json
{
  "_id": "...",
  "chatbotId": "support-bot",
  "ownerId": "owner@email.com",
  "updatedAt": "2026-02-12T10:00:00Z",
  "actions": [
    {
      "id": "action-1700000000000",
      "name": "Place Order",
      "description": "Triggered when user wants to purchase a product.",
      "triggerPhrases": "place order, buy now, checkout",
      "url": "https://your-store.com/api/orders",
      "method": "POST",
      "authType": "bearer",
      "authValue": "ENCRYPTED:AES256GCM:iv=...:tag=...:cipher=...",
      "apiKeyHeader": "X-API-Key",
      "params": [
        {
          "id": "p-0001",
          "name": "productId",
          "type": "string",
          "description": "Product ID the user wants to buy",
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
            { "id": "sp-001", "name": "quantity", "type": "number",  "description": "How many",       "required": true,  "example": "1" },
            { "id": "sp-002", "name": "address",  "type": "string",  "description": "Delivery address","required": false, "example": "" }
          ]
        }
      ],
      "bodyTemplate": "{\n  \"productId\": \"{{productId}}\",\n  \"order\": {{order}},\n  \"userToken\": \"{{userToken}}\"\n}",
      "responseMode": "dynamic",
      "responsePath": "message",
      "successMessage": "Your order has been placed!",
      "failureMessage": "Sorry, I couldn't place the order. Please try again.",
      "enabled": true
    }
  ]
}
```

---

## 9. Security Checklist

- [ ] JWT validated on every endpoint — only chatbot owner can read/write
- [ ] `authValue` AES-256-GCM encrypted before write
- [ ] `authValue` masked (`"••••••"`) in all GET responses
- [ ] Execution validates `chatbotId` owns the `actionId`
- [ ] HTTP call to action URL has a **10-second timeout**
- [ ] Log execution audit trail: `chatbotId`, `actionId`, `statusCode`, `durationMs` — **not** the payload or `userToken`
- [ ] Rate-limit `/execute` per `sessionId` to prevent abuse
- [ ] `userToken` forwarded as-is — never validated, never stored

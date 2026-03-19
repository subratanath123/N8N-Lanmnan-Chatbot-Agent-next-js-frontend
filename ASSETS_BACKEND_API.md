# Media Assets — Backend API Specification

**Version:** 2.0  
**Change from v1:** The backend now owns **all** Supabase operations.  
The frontend sends raw files to the backend — backend uploads to Supabase, tracks in DB, and returns public URLs.

---

## Architecture

```
User selects file(s)
        │
        ▼
Frontend  ──  POST /v1/api/assets/upload  (multipart/form-data, files[])
                        │
                        ▼  (backend does both steps)
                  Upload file ──► Supabase Storage
                        │        bucket: social-media-assets
                        │        path:   social-posts/{userEmail}/{timestamp}_{filename}
                        ▼
                  Save to DB ──► media_assets table
                  (userEmail, fileName, mimeType, sizeBytes, supabaseUrl, objectPath)
                        │
                        ▼
              Return asset records with public URLs
                        │
        ◄───────────────┘
Frontend shows uploaded file in asset grid

GET  /v1/api/assets        ◄── list user's assets
DELETE /v1/api/assets/{id} ◄── delete asset (DB + Supabase)
```

**Why backend owns Supabase:**
- Frontend never touches Supabase credentials
- Supabase service role key stays server-side (secure)
- Backend can enforce quotas, virus scan, image resize, etc.
- Simpler frontend — just one multipart POST

---

## Authentication

All endpoints require a Clerk JWT:
```
Authorization: Bearer <clerk_jwt>
```

Extract `userEmail` from the JWT `email` claim to identify the user:

```java
public String getUserEmail(String authHeader) {
    String token = authHeader.replaceFirst("(?i)Bearer\\s+", "").trim();
    String payload = new String(
        Base64.getUrlDecoder().decode(token.split("\\.")[1]),
        StandardCharsets.UTF_8
    );
    return new JSONObject(payload).getString("email");
}
```

---

## Endpoints

### 1. Upload Assets

**POST** `/v1/api/assets/upload`

Accepts one or more files. Backend uploads each to Supabase, saves a DB record, returns all uploaded assets.

**Headers:**
```
Authorization: Bearer <clerk_jwt>
Content-Type: multipart/form-data
```

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | `File[]` | Yes | One or more image/video files (repeat field for multiple) |

**Example request (browser fetch):**
```js
const formData = new FormData();
files.forEach(f => formData.append("files", f));

fetch("/v1/api/assets/upload", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});
```

**Example cURL:**
```bash
curl -X POST "https://subratapc.net:8080/v1/api/assets/upload" \
  -H "Authorization: Bearer <clerk_jwt>" \
  -F "files=@product-photo.jpg" \
  -F "files=@promo-video.mp4"
```

**Response (200):**
```json
{
  "uploaded": [
    {
      "id":          "550e8400-e29b-41d4-a716-446655440001",
      "fileName":    "product-photo.jpg",
      "mimeType":    "image/jpeg",
      "sizeBytes":   204800,
      "supabaseUrl": "https://sgenamkaqezylpyiqbsb.supabase.co/storage/v1/object/public/social-media-assets/social-posts/john@example.com/1709123456789_product-photo.jpg",
      "objectPath":  "social-posts/john@example.com/1709123456789_product-photo.jpg",
      "createdAt":   "2026-03-19T10:00:00Z"
    }
  ],
  "failed": []
}
```

| Field | Description |
|-------|-------------|
| `uploaded` | Array of successfully uploaded assets |
| `failed` | Array of `{ fileName, error }` for any files that failed — allows partial success |

**Response (400):** No files provided.  
**Response (401):** Missing or invalid JWT.  
**Response (413):** File too large (enforce 50 MB limit per file).

**Backend steps for each file:**
1. Extract `userEmail` from JWT
2. Generate `objectPath = social-posts/{userEmail}/{timestamp}_{safeFilename}`
3. Upload file bytes to Supabase Storage at `objectPath`
4. Get the public URL from Supabase
5. Insert row into `media_assets` table
6. Append to `uploaded[]` in response

---

### 2. List Assets

**GET** `/v1/api/assets`

Returns all assets for the authenticated user, newest first.

**Headers:**
```
Authorization: Bearer <clerk_jwt>
```

**Query params (all optional):**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `image` \| `video` | — | Filter by MIME type prefix |
| `search` | string | — | Case-insensitive filename contains |
| `limit` | number | `100` | Max items to return |
| `offset` | number | `0` | Pagination offset |

**Response (200):**
```json
{
  "assets": [
    {
      "id":          "550e8400-e29b-41d4-a716-446655440001",
      "fileName":    "product-photo.jpg",
      "mimeType":    "image/jpeg",
      "sizeBytes":   204800,
      "supabaseUrl": "https://sgenamkaqezylpyiqbsb.supabase.co/...",
      "objectPath":  "social-posts/john@example.com/1709123456789_product-photo.jpg",
      "createdAt":   "2026-03-19T10:00:00Z",
      "tags":        []
    }
  ],
  "total": 42
}
```

---

### 3. Delete Asset

**DELETE** `/v1/api/assets/{id}`

Deletes from **both** Supabase Storage and the DB.

**Headers:**
```
Authorization: Bearer <clerk_jwt>
```

**Backend steps:**
1. Extract `userEmail` from JWT
2. Find asset by `id` where `userEmail` matches — return 404 if not owned
3. Delete from Supabase Storage using service role key
4. Delete DB row

**Response (200):**
```json
{ "success": true }
```

**Response (404):** Asset not found or not owned by this user.

---

### 4. Get Single Asset (optional)

**GET** `/v1/api/assets/{id}`

**Response (200):** Same shape as a single item from the list endpoint.  
**Response (404):** Not found or not owned.

---

## Data Model (JPA Entity)

```java
@Entity
@Table(name = "media_assets", indexes = {
    @Index(name = "idx_media_assets_user_email", columnList = "userEmail")
})
public class MediaAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String userEmail;       // from Clerk JWT "email" claim

    @Column(nullable = false)
    private String fileName;        // original filename for display

    @Column(nullable = false)
    private String mimeType;        // image/jpeg, video/mp4, etc.

    private Long sizeBytes;

    @Column(nullable = false, length = 2000)
    private String supabaseUrl;     // full public CDN URL — return this to frontend

    @Column(length = 1000)
    private String objectPath;      // bucket-relative path — used for deletion

    @CreationTimestamp
    private Instant createdAt;

    @ElementCollection
    private List<String> tags = new ArrayList<>();

    // getters / setters
}
```

---

## Spring Controller

```java
@RestController
@RequestMapping("/v1/api/assets")
@RequiredArgsConstructor
public class MediaAssetController {

    private final MediaAssetService assetService;
    private final ClerkService clerkService;

    /** Upload one or more files */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> upload(
            @RequestHeader("Authorization") String auth,
            @RequestParam("files") List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String userEmail = clerkService.getUserEmail(auth);
        UploadResponse result = assetService.uploadAll(userEmail, files);
        return ResponseEntity.ok(result);
    }

    /** List assets for the authenticated user */
    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestHeader("Authorization") String auth,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        String userEmail = clerkService.getUserEmail(auth);
        List<MediaAsset> assets = assetService.list(userEmail, type, search, limit, offset);
        long total = assetService.count(userEmail);
        return ResponseEntity.ok(Map.of("assets", assets, "total", total));
    }

    /** Delete an asset */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> delete(
            @RequestHeader("Authorization") String auth,
            @PathVariable UUID id) {

        String userEmail = clerkService.getUserEmail(auth);
        assetService.delete(userEmail, id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
```

---

## MediaAssetService

```java
@Service
@RequiredArgsConstructor
public class MediaAssetService {

    private final MediaAssetRepository assetRepo;
    private final SupabaseStorageService supabase;

    public UploadResponse uploadAll(String userEmail, List<MultipartFile> files) {
        List<MediaAsset> uploaded = new ArrayList<>();
        List<Map<String, String>> failed = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                if (file.getSize() > 50L * 1024 * 1024) {
                    throw new IllegalArgumentException("File exceeds 50 MB limit");
                }

                String safeName = file.getOriginalFilename()
                    .replaceAll("[^\\w.\\-]", "_")
                    .replaceAll("_+", "_")
                    .toLowerCase();
                String objectPath = "social-posts/" + userEmail + "/"
                    + System.currentTimeMillis() + "_" + safeName;

                String publicUrl = supabase.upload(objectPath,
                    file.getBytes(), file.getContentType());

                MediaAsset asset = new MediaAsset();
                asset.setUserEmail(userEmail);
                asset.setFileName(file.getOriginalFilename());
                asset.setMimeType(file.getContentType());
                asset.setSizeBytes(file.getSize());
                asset.setSupabaseUrl(publicUrl);
                asset.setObjectPath(objectPath);

                uploaded.add(assetRepo.save(asset));

            } catch (Exception e) {
                failed.add(Map.of(
                    "fileName", file.getOriginalFilename(),
                    "error",    e.getMessage()
                ));
            }
        }

        return new UploadResponse(uploaded, failed);
    }

    public void delete(String userEmail, UUID id) {
        MediaAsset asset = assetRepo.findByIdAndUserEmail(id, userEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        supabase.delete(asset.getObjectPath());
        assetRepo.delete(asset);
    }

    public List<MediaAsset> list(String userEmail, String type,
                                  String search, int limit, int offset) {
        return assetRepo.findByUserEmailFiltered(userEmail, type, search,
            PageRequest.of(offset / Math.max(limit, 1), limit,
                Sort.by("createdAt").descending()));
    }

    public long count(String userEmail) {
        return assetRepo.countByUserEmail(userEmail);
    }
}
```

---

## SupabaseStorageService

```java
@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.bucket}")
    private String bucket;

    private final RestTemplate rest = new RestTemplate();

    /**
     * Upload bytes to Supabase Storage.
     * Returns the public CDN URL.
     */
    public String upload(String objectPath, byte[] bytes, String contentType) {
        String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.set("Content-Type",  contentType != null ? contentType : "application/octet-stream");
        headers.set("x-upsert",      "false");

        ResponseEntity<String> res = rest.exchange(
            url, HttpMethod.POST,
            new HttpEntity<>(bytes, headers),
            String.class
        );

        if (!res.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Supabase upload failed: " + res.getBody());
        }

        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
    }

    /** Delete a file from Supabase Storage. */
    public void delete(String objectPath) {
        String url = supabaseUrl + "/storage/v1/object/" + bucket;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"prefixes\": [\"" + objectPath + "\"]}";

        rest.exchange(url, HttpMethod.DELETE,
            new HttpEntity<>(body, headers), Void.class);
    }
}
```

---

## application.properties

```properties
supabase.url=https://sgenamkaqezylpyiqbsb.supabase.co
supabase.service-role-key=<get from Supabase Dashboard → Project Settings → API → service_role>
supabase.bucket=social-media-assets
```

> **Important:** Use the `service_role` key (not the publishable/anon key). It bypasses RLS and allows server-side uploads/deletes without needing bucket policies.

---

## Supabase Bucket Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Storage
2. Create bucket named **`social-media-assets`**
3. Set to **Public** (so CDN URLs are accessible without auth)
4. No RLS policies needed — all operations go through the service role key

---

## Summary

| Method | Path | What it does |
|--------|------|--------------|
| `POST` | `/v1/api/assets/upload` | Upload files → Supabase → DB → return URLs |
| `GET` | `/v1/api/assets` | List user's assets from DB |
| `DELETE` | `/v1/api/assets/{id}` | Delete from Supabase + DB |
| `GET` | `/v1/api/assets/{id}` | Get single asset (optional) |

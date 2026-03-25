# Face Swap - Setup Guide

## Overview
Face Swap uses AI to seamlessly swap faces between images. Upload a source face and a target image to create realistic face replacements.

## Architecture

### Frontend
- **Page**: `/face-swap`
- **Component**: `app/face-swap/page.tsx`
- **Features**:
  - Dual image upload (source face + target image)
  - Side-by-side preview
  - Real-time processing status
  - Three-panel result view (source, target, result)
  - Job history with download options
  - localStorage persistence

### Backend
- **Endpoints**:
  - `POST /v1/api/face-swap/swap` - Swap faces
  - `GET /v1/api/face-swap/status/{jobId}` - Check status
  - `GET /v1/api/face-swap/jobs` - List jobs

- **Service**: `FaceSwapService.java`
- **Entity**: `FaceSwapJob` (MongoDB collection: `face_swap_jobs`)
- **DAO**: `FaceSwapJobDao`

## Configuration

### Required API Keys

Add to `application.properties`:

```properties
# Replicate API (recommended)
replicate.api.key=r8_your-replicate-api-key

# Alternative services
# faceswap.api.key=your-faceswap-key
# deepfacelab.api.key=your-deepfacelab-key
```

## API Provider Options

### 1. Replicate (Recommended)

**Models:**
- `lucataco/faceswap` - Fast and accurate
- `yan-ops/face_swap` - High quality results
- `tstramer/midjourney-face-swap` - Artistic style

**Integration:**
```java
String REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_JSON);
headers.set("Authorization", "Token " + replicateApiKey);

Map<String, Object> input = Map.of(
    "source_image", sourceImageBase64OrUrl,
    "target_image", targetImageBase64OrUrl
);

Map<String, Object> requestBody = Map.of(
    "version", "FACE_SWAP_MODEL_VERSION",
    "input", input
);

// POST to create prediction
ResponseEntity<Map> response = restTemplate.exchange(
    REPLICATE_API_URL, HttpMethod.POST, 
    new HttpEntity<>(requestBody, headers), Map.class
);

String predictionId = (String) response.getBody().get("id");

// Poll for completion
String status = "processing";
while (status.equals("processing") || status.equals("starting")) {
    Thread.sleep(2000);
    ResponseEntity<Map> statusRes = restTemplate.exchange(
        REPLICATE_API_URL + "/" + predictionId,
        HttpMethod.GET,
        new HttpEntity<>(headers),
        Map.class
    );
    status = (String) statusRes.getBody().get("status");
    if (status.equals("succeeded")) {
        return (String) statusRes.getBody().get("output");
    }
}
```

### 2. DeepFaceLab API

Commercial service with high-quality face swapping:
- API: `https://api.deepfacelab.com/swap`
- Better quality than OpenAI
- More expensive but specialized

### 3. InsightFace

Open-source alternative:
- Can be self-hosted
- No API costs
- Requires GPU infrastructure
- GitHub: `deepinsight/insightface`

### 4. FaceSwapper (GitHub)

Free open-source:
- Repository: `neuralchen/SimSwap`
- Self-hosted
- Good quality
- GPU required

## Face Swap Process

1. **Face Detection**
   - Detect faces in both images
   - Extract facial landmarks
   - Validate face presence

2. **Face Alignment**
   - Align source face to target pose
   - Match rotation and scale
   - Preserve target facial features

3. **Blending**
   - Seamless boundary blending
   - Color matching
   - Lighting adjustment

4. **Post-Processing**
   - Sharpen details
   - Fix artifacts
   - Final quality enhancement

## Data Models

### FaceSwapJob
```java
{
    id: String,
    userEmail: String,
    sourceImageUrl: String,
    targetImageUrl: String,
    status: String,
    resultUrl: String,
    assetId: String,
    error: String,
    createdAt: Instant,
    completedAt: Instant
}
```

## API Examples

### Swap Faces

```bash
curl -X POST https://subratapc.net/v1/api/face-swap/swap \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "sourceFace=@face.jpg" \
  -F "targetImage=@photo.jpg"
```

Response:
```json
{
    "jobId": "swap-123-abc",
    "status": "pending",
    "message": "Face swap started"
}
```

### Check Status

```bash
curl https://subratapc.net/v1/api/face-swap/status/swap-123-abc \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
    "id": "swap-123-abc",
    "status": "completed",
    "resultUrl": "https://...",
    "assetId": "asset-789",
    "createdAt": "2026-03-25T12:00:00Z",
    "completedAt": "2026-03-25T12:00:25Z"
}
```

## Best Practices

### Input Requirements

**Source Face Image:**
- Clear, frontal face view
- Good lighting
- High resolution (at least 512x512)
- Single face in image
- Minimal occlusion

**Target Image:**
- Clear face to replace
- Similar lighting conditions
- Similar face angle helps
- Can have multiple faces (swaps first detected)

### Quality Tips

1. **Lighting Match**
   - Similar lighting between source and target
   - Better blending results

2. **Face Angle**
   - Closer angles = better results
   - Frontal to frontal works best
   - Extreme angles may distort

3. **Resolution**
   - Higher resolution = better detail
   - Minimum 512x512 recommended
   - 1024x1024+ for best results

4. **Image Quality**
   - Sharp, in-focus images
   - Good exposure
   - Minimal compression artifacts

## Use Cases

### Entertainment
- Face swap with celebrities
- Historical figure recreations
- Movie character transformations

### Marketing
- Model variations
- Demographic testing
- Personalization demos

### Creative Projects
- Art projects
- Social media content
- Memes and fun content

### Testing
- UI mockups with different faces
- Avatar generation
- Identity testing (privacy-safe)

## Ethical Considerations

### Important Guidelines

1. **Consent Required**
   - Get permission for face use
   - Don't use without consent
   - Respect privacy rights

2. **Appropriate Use**
   - No deepfakes for misinformation
   - No identity theft attempts
   - No inappropriate content

3. **Disclosure**
   - Mark AI-generated content
   - Be transparent about manipulation
   - Follow platform guidelines

4. **Legal Compliance**
   - Follow local laws on AI content
   - Respect copyright and likeness rights
   - Commercial use may require releases

### Built-in Safeguards

- Watermark results (optional)
- Usage logging
- Rate limiting
- Content moderation (if needed)

## Performance

- Processing time: 20-40 seconds
- Polling interval: 3 seconds
- Results stored in Assets
- Job history persistent

## Cost Comparison

**Replicate:**
- ~$0.005-0.01 per swap
- Pay per use
- No subscription needed

**DeepFaceLab:**
- ~$0.02-0.05 per swap
- Higher quality
- Subscription options

**Self-Hosted (InsightFace):**
- Free (compute costs only)
- One-time setup
- Requires GPU server

## Advanced Configuration

### Quality Settings

```java
Map<String, Object> input = Map.of(
    "source_image", sourceUrl,
    "target_image", targetUrl,
    "blend_ratio", 0.95,      // 0-1, higher = more source face
    "face_enhance", true,     // Post-processing enhancement
    "background_enhance", true // Enhance non-face areas
);
```

### Multi-Face Support

```java
// Swap specific face in multi-face image
Map<String, Object> input = Map.of(
    "source_image", sourceUrl,
    "target_image", targetUrl,
    "face_index", 0           // Which face to swap (0 = first detected)
);
```

## Troubleshooting

### Common Issues

1. **"No face detected"**
   - Ensure face is clearly visible
   - Check image quality
   - Face must be at least 100x100 pixels
   - Remove obstructions (sunglasses, masks)

2. **Poor blending**
   - Match lighting conditions
   - Use similar face angles
   - Increase source image quality
   - Try different models

3. **Artifacts or distortion**
   - Use higher resolution images
   - Ensure faces are in focus
   - Check for extreme angles
   - Enable face enhancement

4. **Slow processing**
   - Normal for high-quality results
   - GPU availability dependent
   - Consider dedicated API service

## Implementation Guide

### Step 1: Choose API Provider
- Sign up for Replicate.com (easiest)
- Or set up self-hosted solution
- Get API key

### Step 2: Configure Backend
```properties
replicate.api.key=r8_your-api-key
```

### Step 3: Implement API Call

Update `FaceSwapService.callFaceSwapAPI()`:
```java
private String callFaceSwapAPI(MultipartFile sourceFace, MultipartFile targetImage) throws Exception {
    // Convert to base64 or upload to cloud storage
    // Call Replicate API
    // Poll for completion
    // Return result URL
}
```

### Step 4: Test Integration
```bash
# Test with sample images
curl -X POST http://localhost:8080/v1/api/face-swap/swap \
  -H "Authorization: Bearer $TOKEN" \
  -F "sourceFace=@test-face.jpg" \
  -F "targetImage=@test-photo.jpg"
```

### Step 5: Monitor Usage
- Track API costs
- Set up alerts
- Implement rate limiting
- Monitor quality

## Security Considerations

1. **Input Validation**
   - Validate file types
   - Check file sizes
   - Scan for malicious content

2. **Rate Limiting**
   - Prevent abuse
   - Protect API costs
   - User quotas

3. **Content Moderation**
   - Optional NSFW detection
   - Inappropriate content blocking
   - Compliance with ToS

4. **Data Privacy**
   - Don't store faces permanently
   - Clear temporary files
   - Comply with GDPR/privacy laws

## Future Enhancements

1. Multi-face swapping (swap all faces)
2. Face morphing (blend multiple faces)
3. Age progression/regression
4. Gender swap
5. Celebrity lookalike matching
6. Video face swapping
7. Live face swap (real-time)
8. Face restoration (enhance old photos)

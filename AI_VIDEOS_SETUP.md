# AI Video Generation - Setup Guide

## Overview

The AI Videos feature provides a framework for integrating AI video generation APIs like Runway ML, Stability AI Video, or Pika Labs. Generated videos are automatically saved to your Assets library under the "AI Generated Videos" folder.

## Architecture

1. **Frontend** (`/ai-videos`):
   - User enters prompt and selects options (duration, aspect ratio)
   - Submits generation request to backend
   - Polls backend every 5 seconds for job status
   - Displays real-time generation progress
   - Shows completed videos with playback and download options

2. **Backend** (`AIVideoService`):
   - Creates generation job in MongoDB
   - Asynchronously calls video generation API
   - Receives video URL from API provider
   - Saves video URL and metadata to MongoDB
   - Updates job status (pending → processing → completed/failed)

3. **Storage**:
   - Job metadata stored in `ai_video_jobs` collection
   - Generated video URLs stored in `media_assets` collection
   - Videos automatically tagged with "ai-generated" and "ai-video"
   - Organized in "AI Generated Videos" folder

## Backend Configuration

### Option 1: Runway ML (Recommended)

Runway ML Gen-3 is currently one of the best AI video generation APIs.

**Setup:**
1. Go to https://runwayml.com/
2. Sign up and get API key from your account settings
3. Add to `application.properties`:

```properties
# Runway ML Configuration
runway.api.key=your-runway-api-key-here
```

**API Documentation:** https://docs.runwayml.com/

### Option 2: Stability AI Video

Stability AI offers video generation through their Stable Video Diffusion model.

**Setup:**
1. Go to https://platform.stability.ai/
2. Get API key from your account
3. Add to `application.properties`:

```properties
# Stability AI Configuration
stability.api.key=sk-your-stability-key-here
```

**API Documentation:** https://platform.stability.ai/docs/api-reference

### Option 3: Custom Integration

The service is designed to be flexible. You can integrate with any video generation API by:
1. Adding your API key to `application.properties`
2. Implementing the `callVideoGenerationAPI()` method in `AIVideoService.java`
3. Handling the API's response format

## API Implementation

### Current Status

The backend service is **scaffolded and ready** but requires API integration. The `callVideoGenerationAPI()` method currently throws an exception with instructions.

### To Integrate a Video API:

Edit `/usr/local/Chat API/src/main/java/net/ai/chatbot/service/aivideo/AIVideoService.java`:

1. **Add API configuration:**
```java
@Value("${your.api.key:}")
private String yourApiKey;

private static final String YOUR_API_URL = "https://api.provider.com/v1/generate";
```

2. **Implement the API call:**
```java
private String callVideoGenerationAPI(String prompt, Integer duration, String aspectRatio) throws Exception {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("Authorization", "Bearer " + yourApiKey);

    Map<String, Object> requestBody = Map.of(
        "prompt", prompt,
        "duration", duration,
        "aspect_ratio", aspectRatio
    );

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

    ResponseEntity<Map> response = restTemplate.exchange(
        YOUR_API_URL,
        HttpMethod.POST,
        request,
        Map.class
    );

    // Extract video URL from response
    String videoUrl = (String) response.getBody().get("video_url");
    return videoUrl;
}
```

## API Endpoints

### Generate Video
```bash
POST /v1/api/ai-videos/generate
Authorization: Bearer <clerk-jwt>
Content-Type: application/json

{
  "prompt": "A time-lapse of a city skyline from day to night",
  "duration": 5,           // Options: 5, 10 (seconds)
  "aspectRatio": "16:9"    // Options: 16:9, 9:16, 1:1
}

Response:
{
  "jobId": "uuid",
  "status": "pending"
}
```

### Check Job Status
```bash
GET /v1/api/ai-videos/status/{jobId}
Authorization: Bearer <clerk-jwt>

Response:
{
  "id": "uuid",
  "userEmail": "user@example.com",
  "prompt": "A time-lapse...",
  "status": "completed",
  "videoUrl": "https://...",
  "assetId": "uuid",
  "duration": 5,
  "createdAt": "2026-03-25T18:00:00Z",
  "completedAt": "2026-03-25T18:03:00Z"
}
```

### List All Jobs
```bash
GET /v1/api/ai-videos/jobs
Authorization: Bearer <clerk-jwt>

Response:
[
  { "id": "uuid", "prompt": "...", "status": "completed", ... },
  ...
]
```

## Features

### Video Generation Options

1. **Duration Options:**
   - 5 seconds - Quick clips
   - 10 seconds - Longer scenes

2. **Aspect Ratio Options:**
   - Landscape (16:9) - Best for YouTube, web
   - Portrait (9:16) - Best for TikTok, Instagram Stories
   - Square (1:1) - Best for Instagram posts

### Real-time Progress Tracking

- Jobs start in "pending" state
- Backend updates to "processing" when API is called
- Frontend polls every 5 seconds for updates
- Shows spinner animation while generating
- Automatically displays video when completed
- Shows error message if generation fails
- Generation typically takes 2-5 minutes

### Automatic Asset Storage

Generated videos are automatically:
- Saved to your Assets library
- Tagged with "ai-generated", "ai-video", and duration
- Organized in "AI Generated Videos" folder
- Available for use in Social Media Suite

## Recommended Video APIs

### 1. Runway ML Gen-3 (Best Quality)
- **Pros:** Highest quality, consistent results, good API
- **Cons:** Expensive (~$0.05-0.10 per second)
- **Website:** https://runwayml.com/
- **Docs:** https://docs.runwayml.com/

### 2. Stability AI Video
- **Pros:** Good quality, reasonable pricing
- **Cons:** Limited duration options
- **Website:** https://platform.stability.ai/
- **Docs:** https://platform.stability.ai/docs/

### 3. Pika Labs
- **Pros:** Creative results, good for artistic content
- **Cons:** API may have waitlist
- **Website:** https://pika.art/

### 4. Luma AI Dream Machine
- **Pros:** High quality, realistic videos
- **Cons:** May require API access request
- **Website:** https://lumalabs.ai/

## Cost Considerations

Video generation is significantly more expensive than image generation:
- **Runway ML:** ~$0.05-0.10 per second
- **Stability AI:** ~$0.02-0.04 per second

Monitor usage carefully and consider:
- Setting rate limits per user
- Implementing usage quotas
- Showing cost estimates before generation

## Database Collections

### `ai_video_jobs`
Stores generation job metadata:
- Job ID, user email, prompt
- Generation parameters (duration, aspect ratio)
- Status and timestamps
- Result (videoUrl, assetId) or error

### `media_assets`
Stores generated video metadata:
- Linked via `assetId` from job
- Tagged for easy filtering
- Includes video URL
- Organized in "AI Generated Videos" folder

## Next Steps

1. **Choose a video API provider** (Runway ML recommended)
2. **Sign up and get API key**
3. **Add API key to `application.properties`**
4. **Implement the API call** in `AIVideoService.callVideoGenerationAPI()`
5. **Test the integration** with a simple prompt
6. **Monitor costs** and usage

## Example Integration (Runway ML)

```java
private String callVideoGenerationAPI(String prompt, Integer duration, String aspectRatio) throws Exception {
    if (runwayApiKey == null || runwayApiKey.isEmpty()) {
        throw new IllegalStateException("Runway API key not configured");
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("Authorization", "Bearer " + runwayApiKey);
    headers.set("X-Runway-Version", "2024-11-06");

    Map<String, Object> requestBody = Map.of(
        "promptText", prompt,
        "model", "gen3a_turbo",
        "duration", duration,
        "aspectRatio", aspectRatio
    );

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

    ResponseEntity<Map> response = restTemplate.exchange(
        "https://api.runwayml.com/v1/image_to_video",
        HttpMethod.POST,
        request,
        Map.class
    );

    String taskId = (String) response.getBody().get("id");
    
    // Poll for completion (Runway is async)
    String videoUrl = pollRunwayTask(taskId);
    return videoUrl;
}
```

## Troubleshooting

### "Video generation API not configured"
- Add API key to `application.properties`
- Implement the API integration in service
- Restart backend

### Jobs stuck in "pending" or "processing"
- Video generation takes 2-5 minutes (normal)
- Check backend logs for errors
- Verify API key is valid and has credits

### Frontend not showing videos
- Check browser console for errors
- Verify video URL is accessible (CORS)
- Check if URL has expired (some APIs use temporary URLs)

## Future Enhancements

- Multiple video variations from one prompt
- Video editing capabilities
- Text-to-video and image-to-video
- Custom duration options
- Quality/resolution settings
- Progress percentage tracking
- Video preview thumbnails
- Cost estimation before generation

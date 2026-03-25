# AI Image Generation - Setup Guide

## Overview

The AI Images feature uses OpenAI's DALL-E 3 API to generate high-quality images based on text prompts. Images are automatically saved to your Assets library under the "AI Generated" folder.

## Architecture

1. **Frontend** (`/ai-images`):
   - User enters prompt and selects options (size, quality, style)
   - Submits generation request to backend
   - Polls backend every 3 seconds for job status
   - Displays real-time generation progress
   - Shows completed images with download options

2. **Backend** (`AIImageService`):
   - Creates generation job in MongoDB
   - Asynchronously calls OpenAI DALL-E 3 API
   - Receives image URL from OpenAI
   - Saves image URL and metadata to MongoDB
   - Updates job status (pending → processing → completed/failed)

3. **Storage**:
   - Job metadata stored in `ai_image_jobs` collection
   - Generated image URLs stored in `media_assets` collection
   - **No file download/upload** - OpenAI URLs are stored directly
   - Images automatically tagged with "ai-generated" and "dall-e"
   - Organized in "AI Generated" folder

**Note:** OpenAI image URLs are temporary (expire after ~1 hour). For longer-term storage, consider implementing a background job to download and re-upload to your own storage.

## Backend Configuration

### 1. Add OpenAI API Key to `application.properties`

```properties
# OpenAI Configuration
openai.api.key=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note:** The API URL is hardcoded to `https://api.openai.com/v1/images/generations` in the service.

**How to get your OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `application.properties`
5. **IMPORTANT:** Keep this key secure and never commit it to git!

### 2. Enable Async Processing

The `@EnableAsync` annotation has been added to `ChatApplication.java` to support background image generation.

### 3. Required Dependencies

Ensure your `pom.xml` includes:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

(Already included in your project)

## API Endpoints

### Generate Image
```bash
POST /v1/api/ai-images/generate
Authorization: Bearer <clerk-jwt>
Content-Type: application/json

{
  "prompt": "A serene mountain landscape with aurora borealis",
  "size": "1024x1024",      // Options: 1024x1024, 1792x1024, 1024x1792
  "quality": "standard",     // Options: standard, hd
  "style": "vivid"          // Options: vivid, natural
}

Response:
{
  "jobId": "uuid",
  "status": "pending"
}
```

### Check Job Status
```bash
GET /v1/api/ai-images/status/{jobId}
Authorization: Bearer <clerk-jwt>

Response:
{
  "id": "uuid",
  "userEmail": "user@example.com",
  "prompt": "A serene mountain landscape...",
  "status": "completed",
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "assetId": "uuid",
  "createdAt": "2026-03-25T18:00:00Z",
  "completedAt": "2026-03-25T18:00:15Z"
}
```

### List All Jobs
```bash
GET /v1/api/ai-images/jobs
Authorization: Bearer <clerk-jwt>

Response:
[
  { "id": "uuid", "prompt": "...", "status": "completed", ... },
  ...
]
```

## Features

### Image Generation Options

1. **Size Options:**
   - Square (1024×1024) - Best for social media posts
   - Landscape (1792×1024) - Best for banners, headers
   - Portrait (1024×1792) - Best for mobile, stories

2. **Quality Options:**
   - Standard - Faster, lower cost
   - HD - Higher detail and quality

3. **Style Options:**
   - Vivid - Dramatic, hyper-real images
   - Natural - More natural, less hyper-real

### Real-time Progress Tracking

- Jobs start in "pending" state
- Backend updates to "processing" when OpenAI API is called
- Frontend polls every 3 seconds for updates
- Shows spinner animation while generating
- Automatically displays image when completed
- Shows error message if generation fails

### Automatic Asset Storage

Generated images are automatically:
- **Saved to MongoDB** with image URL and metadata
- Tagged with "ai-generated" and "dall-e"
- Organized in "AI Generated" folder
- Available in Assets library for browsing
- Accessible via the stored OpenAI URL

**Note:** OpenAI generates temporary URLs that expire after ~1 hour. The system stores these URLs directly without file download. Users can download images immediately after generation while the URL is valid.

## Cost Considerations

**DALL-E 3 Pricing (as of 2024):**
- Standard quality: ~$0.04 per image
- HD quality: ~$0.08 per image

Make sure your OpenAI account has sufficient credits and billing configured.

## Troubleshooting

### "OpenAI API key not configured"
- Add `openai.api.key` to your `application.properties`
- Restart the backend application

### "Generation failed"
- Check your OpenAI API key is valid
- Verify your OpenAI account has available credits
- Check backend logs for detailed error messages

### Jobs stuck in "pending"
- Verify `@EnableAsync` is present in `ChatApplication.java`
- Check backend logs for processing errors
- Restart backend if needed

## Database Collections

### `ai_image_jobs`
Stores generation job metadata:
- Job ID, user email, prompt
- Generation parameters (size, quality, style)
- Status and timestamps
- Result (imageUrl, assetId) or error

### `media_assets`
Stores generated image metadata:
- Linked via `assetId` from job
- Tagged for easy filtering
- Includes original OpenAI URL
- Organized in "AI Generated" folder

## Future Enhancements

Potential features to add:
- Batch generation (multiple variations)
- Image editing (DALL-E edit endpoint)
- Image variations (create variations of existing images)
- Custom folder selection for saving
- Generation history export
- Usage tracking and cost monitoring

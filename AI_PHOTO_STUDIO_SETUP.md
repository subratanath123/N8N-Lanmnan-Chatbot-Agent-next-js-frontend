# AI Photo Studio - Setup Guide

## Overview
AI Photo Studio enables users to edit and enhance images using AI. Features include custom edits with instructions, quality enhancement, background removal, and AI recoloring.

## Architecture

### Frontend
- **Page**: `/ai-photo-studio`
- **Component**: `app/ai-photo-studio/page.tsx`
- **Features**:
  - Image upload with preview
  - Edit type selection (custom, enhance, remove-bg, recolor)
  - Custom instruction input for general edits
  - Real-time job status polling
  - Edit history with before/after comparison
  - localStorage persistence for jobs

### Backend
- **Endpoints**:
  - `POST /v1/api/ai-photo-studio/edit` - Upload image and request edit
  - `GET /v1/api/ai-photo-studio/status/{jobId}` - Check job status
  - `GET /v1/api/ai-photo-studio/jobs` - List all jobs for user

- **Service**: `AIPhotoStudioService.java`
- **Entity**: `AIPhotoStudioJob` (MongoDB collection: `ai_photo_studio_jobs`)
- **DAO**: `AIPhotoStudioJobDao`

### Storage
- Job metadata stored in MongoDB
- Result images stored as URLs in MediaAsset collection
- Jobs cached in browser localStorage for instant UI feedback

## Configuration

### Required Environment Variables

Add to `application.properties` (backend):

```properties
# OpenAI API Key (for image editing)
openai.api.key=sk-your-openai-api-key

# Optional: Alternative image editing services
# stability.api.key=your-stability-api-key
# replicate.api.key=your-replicate-api-key
```

### API Integration

The service currently uses **OpenAI's Image Edit API**:
- **Endpoint**: `https://api.openai.com/v1/images/edits`
- **Model**: DALL-E 2 (supports image editing)
- **Cost**: ~$0.020 per edit (1024x1024)

**Alternative Services:**
1. **Stability AI** - Image editing and inpainting
2. **Replicate** - Various image editing models
3. **ClipDrop** - Background removal and enhancement
4. **Remove.bg** - Specialized background removal

## Edit Types

1. **Custom Edit** (`edit`)
   - User provides specific instructions
   - Example: "Change sky to sunset", "Add flowers"

2. **Enhance Quality** (`enhance`)
   - Automatic quality improvement
   - Enhances colors, sharpness, details

3. **Remove Background** (`remove-bg`)
   - Removes background, keeps subject
   - Outputs transparent background

4. **AI Recolor** (`recolor`)
   - Applies professional color grading
   - Enhances vibrancy

## Job Flow

1. User uploads image and selects edit type
2. Frontend creates FormData with image, instruction, editType
3. Backend receives request, creates job in MongoDB
4. Async processing starts:
   - Calls OpenAI Image Edit API
   - Stores result URL in MongoDB
   - Updates job status to 'completed'
5. Frontend polls every 3 seconds for status updates
6. When completed, displays before/after comparison

## Data Models

### AIPhotoStudioJob
```java
{
    id: String,
    userEmail: String,
    originalImageUrl: String,
    instruction: String,
    editType: String,
    status: String, // pending, processing, completed, failed
    resultUrl: String,
    assetId: String,
    error: String,
    createdAt: Instant,
    completedAt: Instant
}
```

## API Examples

### 1. Upload and Edit Image

```bash
curl -X POST https://subratapc.net/v1/api/ai-photo-studio/edit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@product.jpg" \
  -F "instruction=Change the sky to sunset" \
  -F "editType=edit"
```

Response:
```json
{
    "jobId": "abc-123-def",
    "status": "pending",
    "message": "Image edit started"
}
```

### 2. Check Job Status

```bash
curl https://subratapc.net/v1/api/ai-photo-studio/status/abc-123-def \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
    "id": "abc-123-def",
    "status": "completed",
    "resultUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "assetId": "asset-456",
    "createdAt": "2026-03-25T12:00:00Z",
    "completedAt": "2026-03-25T12:00:15Z"
}
```

### 3. List All Jobs

```bash
curl https://subratapc.net/v1/api/ai-photo-studio/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

1. Configure OpenAI API key in `application.properties`
2. Test with various edit types and images
3. Consider integrating specialized services for specific tasks:
   - Remove.bg API for background removal
   - Stability AI for advanced editing
4. Monitor API costs and usage
5. Implement rate limiting for production use

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Add `openai.api.key` to application.properties
   - Restart backend service

2. **Jobs stuck in "pending" status**
   - Check backend logs for errors
   - Verify API key is valid
   - Check network connectivity to OpenAI

3. **Edit quality not as expected**
   - Improve instruction clarity and specificity
   - Try different edit types
   - Use higher quality input images

4. **Background removal incomplete**
   - Consider using specialized service like Remove.bg
   - Ensure subject is clearly distinguishable in image

## Performance Notes

- Image edit typically takes 10-20 seconds
- Frontend polls every 3 seconds
- Jobs persist in localStorage across page refreshes
- Results stored permanently in Assets

## Security

- All requests require JWT authentication
- Users can only access their own jobs
- File uploads validated and size-limited
- Result URLs are temporary (OpenAI expires after 1 hour)

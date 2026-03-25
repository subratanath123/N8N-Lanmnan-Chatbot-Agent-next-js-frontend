# AI Product Studio - Setup Guide

## Overview
AI Product Studio creates professional product visualizations with full control over scene type, lighting, and camera angles. Ideal for creating multiple product shots from a single image.

## Architecture

### Frontend
- **Page**: `/ai-product-studio`
- **Component**: `app/ai-product-studio/page.tsx`
- **Features**:
  - Product image upload
  - Scene type selection (studio, outdoor, lifestyle, luxury)
  - Lighting control (soft, dramatic, natural, neon)
  - Camera angle selection (front, angled, top-down, 360°)
  - Visual icon-based controls
  - Generation history grid
  - localStorage persistence

### Backend
- **Endpoints**:
  - `POST /v1/api/ai-product-studio/generate` - Generate studio shot
  - `GET /v1/api/ai-product-studio/status/{jobId}` - Check status
  - `GET /v1/api/ai-product-studio/jobs` - List jobs

- **Service**: `AIProductStudioService.java`
- **Entity**: `AIProductStudioJob` (MongoDB collection: `ai_product_studio_jobs`)
- **DAO**: `AIProductStudioJobDao`

## Configuration

Add to `application.properties`:

```properties
# Primary API
openai.api.key=sk-your-openai-api-key

# Alternative services
# midjourney.api.key=your-midjourney-key
# leonardo.api.key=your-leonardo-key
```

## Scene Types

### Studio
- Clean, minimal background
- Professional studio setup
- Perfect for catalogs

### Outdoor
- Natural outdoor environment
- Daylight settings
- More casual feel

### Lifestyle
- Realistic use-case scenarios
- Contextual environments
- Shows product in action

### Luxury
- Premium materials
- Elegant environments
- High-end positioning

## Lighting Options

### Soft
- Diffused, even lighting
- No harsh shadows
- Professional standard

### Dramatic
- Strong directional light
- Deep shadows
- Artistic effect

### Natural
- Daylight simulation
- Window light quality
- Organic feel

### Neon
- Vibrant colored lighting
- Modern, edgy style
- Tech/gaming products

## Camera Angles

### Front View
- Straight-on perspective
- Clear product visibility
- Standard catalog view

### Angled (45°)
- Three-quarter view
- Shows depth and dimension
- Most popular for products

### Top-Down
- Flat lay perspective
- Great for small products
- Social media favorite

### 360° View
- Multiple angle composite
- Shows all sides
- Interactive potential

## Prompt Engineering

The service builds sophisticated prompts combining:
- Scene type description
- Lighting characteristics
- Camera angle specification
- Quality modifiers

Example generated prompt:
```
Professional product photography, clean studio environment, minimal background, 
soft diffused lighting, 45-degree angled view, high resolution, commercial quality, 
8k, hyperrealistic
```

## API Integration Examples

### OpenAI DALL-E (Current)
```java
Map<String, Object> requestBody = Map.of(
    "prompt", generatedPrompt,
    "n", 1,
    "size", "1024x1024",
    "quality", "hd"
);
```

### Midjourney API (Alternative)
```java
// Midjourney requires webhook or polling
Map<String, Object> requestBody = Map.of(
    "prompt", generatedPrompt + " --ar 1:1 --v 6",
    "callback_url", "https://subratapc.net/api/midjourney-callback"
);
```

### Leonardo AI (Alternative)
```java
Map<String, Object> requestBody = Map.of(
    "prompt", generatedPrompt,
    "modelId", "YOUR_MODEL_ID",
    "width", 1024,
    "height", 1024,
    "photoReal", true
);
```

## Data Models

### AIProductStudioJob
```java
{
    id: String,
    userEmail: String,
    originalImageUrl: String,
    sceneType: String,
    lighting: String,
    angle: String,
    status: String,
    resultUrl: String,
    assetId: String,
    error: String,
    createdAt: Instant,
    completedAt: Instant
}
```

## API Examples

### Generate Studio Shot

```bash
curl -X POST https://subratapc.net/v1/api/ai-product-studio/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@product.png" \
  -F "sceneType=studio" \
  -F "lighting=soft" \
  -F "angle=angle"
```

### Check Status

```bash
curl https://subratapc.net/v1/api/ai-product-studio/status/job-id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Use Cases

### E-commerce
- Generate multiple shots from single product photo
- Test different backgrounds for conversion
- Create consistent catalog imagery

### Marketing
- Lifestyle shots for social media
- Dramatic lighting for campaigns
- Seasonal background variations

### A/B Testing
- Generate multiple versions
- Test different scenes and lighting
- Optimize for conversions

### Content Creation
- Product videos (multiple angles)
- 360° interactive views
- Editorial content

## Best Practices

### Input Images
- High resolution product photos
- Clean background (or transparent PNG)
- Good product lighting
- Sharp focus

### Combination Guidelines
- **E-commerce**: Studio + Soft + Angled
- **Social Media**: Lifestyle + Natural + Front
- **Premium Brands**: Luxury + Dramatic + Angle
- **Tech Products**: Studio + Neon + Top

## Advanced Features (Future)

1. **Batch Generation**
   - Upload once, generate all combinations
   - Parallel processing
   - Bulk download

2. **Style Presets**
   - Save favorite combinations
   - Quick apply to new products
   - Brand consistency

3. **Video Generation**
   - Rotate product with camera movement
   - Zoom and pan animations
   - Export as video

4. **Interactive 360°**
   - True 360° view generation
   - Interactive viewer
   - Embed on product pages

## Performance & Costs

**Generation Time:**
- OpenAI DALL-E: 15-30 seconds
- Midjourney: 30-60 seconds
- Leonardo AI: 10-20 seconds

**Costs:**
- OpenAI HD: ~$0.080/image
- Leonardo: ~$0.01-0.02/image
- Midjourney: Subscription based

## Integration with Existing Features

- Results automatically saved to **Assets**
- Can be used in **Social Media Suite**
- Available for download and sharing
- Integrated with user authentication

## Troubleshooting

### Scene not matching selection
- Prompt engineering may need tuning
- Try different combinations
- Add more descriptive custom elements

### Lighting too subtle/strong
- Adjust scene type for better lighting match
- Custom prompts can override defaults
- Some combinations work better than others

### Quality issues
- Increase input image resolution
- Use HD quality setting
- Consider specialized service for product photos

# AI Product Photo - Setup Guide

## Overview
AI Product Photo transforms product images with professional AI-generated backgrounds. Perfect for e-commerce, marketing materials, and product catalogs.

## Architecture

### Frontend
- **Page**: `/ai-product-photo`
- **Component**: `app/ai-product-photo/page.tsx`
- **Features**:
  - Product image upload
  - Background type selection (white, gradient, lifestyle, custom)
  - Custom background prompt input
  - Before/after comparison view
  - Generation history with download options
  - localStorage persistence

### Backend
- **Endpoints**:
  - `POST /v1/api/ai-product-photo/generate` - Generate product photo
  - `GET /v1/api/ai-product-photo/status/{jobId}` - Check status
  - `GET /v1/api/ai-product-photo/jobs` - List jobs

- **Service**: `AIProductPhotoService.java`
- **Entity**: `AIProductPhotoJob` (MongoDB collection: `ai_product_photo_jobs`)
- **DAO**: `AIProductPhotoJobDao`

## Configuration

### Required Environment Variables

Add to `application.properties`:

```properties
# OpenAI API Key
openai.api.key=sk-your-openai-api-key

# Alternative services (optional)
# stability.api.key=your-stability-api-key
# clipdrop.api.key=your-clipdrop-api-key
```

## Background Types

### 1. Clean White
- Pure white studio background
- Professional e-commerce standard
- Best for product catalogs

### 2. Gradient
- Modern gradient backgrounds
- Soft color transitions
- Great for social media

### 3. Lifestyle Scene
- Product in realistic setting
- Contextual environment
- Higher engagement potential

### 4. Custom Background
- User-defined background description
- Maximum flexibility
- Example: "Wooden table with plants and natural light"

## API Integration

Currently uses **OpenAI DALL-E 3** to generate product images with specified backgrounds.

**Better Alternatives:**
1. **Pebblely API** - Specialized product photography AI
2. **PhotoRoom API** - Product background replacement
3. **Pixelcut API** - E-commerce product photos
4. **Remove.bg + Stable Diffusion** - Remove bg, then generate new scene

## Data Models

### AIProductPhotoJob
```java
{
    id: String,
    userEmail: String,
    originalImageUrl: String,
    backgroundType: String,
    customPrompt: String,
    status: String,
    resultUrl: String,
    assetId: String,
    error: String,
    createdAt: Instant,
    completedAt: Instant
}
```

## API Examples

### Generate Product Photo

```bash
curl -X POST https://subratapc.net/v1/api/ai-product-photo/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@product.png" \
  -F "backgroundType=gradient"
```

### Custom Background

```bash
curl -X POST https://subratapc.net/v1/api/ai-product-photo/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@product.png" \
  -F "backgroundType=custom" \
  -F "customPrompt=Marble countertop with soft window light"
```

## Best Practices

### Input Images
- Use PNG with transparent background for best results
- High resolution (at least 1024x1024)
- Clean product cutout
- Good lighting on original product

### Custom Prompts
- Be specific about materials and textures
- Mention lighting conditions
- Describe mood and atmosphere
- Examples:
  - "Rustic wooden table with morning sunlight"
  - "Modern minimalist desk with laptop and coffee"
  - "Outdoor garden setting with flowers"

## Integration with Third-Party Services

### Example: Pebblely API Integration

```java
private String callPebblelyAPI(MultipartFile imageFile, String backgroundType) throws Exception {
    String PEBBLELY_API_URL = "https://api.pebblely.com/generate";
    
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Bearer " + pebblelyApiKey);
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("image", new ByteArrayResource(imageFile.getBytes()) {
        @Override
        public String getFilename() {
            return imageFile.getOriginalFilename();
        }
    });
    body.add("background", backgroundType);
    
    HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
    
    ResponseEntity<Map> response = restTemplate.exchange(
        PEBBLELY_API_URL,
        HttpMethod.POST,
        request,
        Map.class
    );
    
    return (String) response.getBody().get("url");
}
```

## Troubleshooting

### Common Issues

1. **Product not centered in result**
   - Crop product closer before upload
   - Use transparent PNG
   - Ensure product is main focus

2. **Background doesn't match style**
   - Be more specific in custom prompts
   - Try different background types
   - Iterate with variations

3. **Low quality results**
   - Use higher resolution input
   - Ensure good lighting on original
   - Try "enhance" in AI Photo Studio first

## Performance

- Generation time: 15-30 seconds
- Polling interval: 3 seconds
- Result stored permanently in Assets
- OpenAI URLs expire after 1 hour (saved to MongoDB before expiry)

## Cost Considerations

**OpenAI DALL-E 3:**
- HD quality: ~$0.080 per image
- Standard quality: ~$0.040 per image

**Specialized Services (often cheaper):**
- Pebblely: $0.01-0.05 per image
- PhotoRoom: $0.02 per image
- Pixelcut: Various tiers

## Future Enhancements

1. Batch processing for multiple products
2. Template backgrounds library
3. Shadow and reflection generation
4. Multiple angle generation from single product
5. A/B testing different backgrounds
6. Direct Shopify/WooCommerce integration

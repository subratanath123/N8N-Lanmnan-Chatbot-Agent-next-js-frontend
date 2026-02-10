# Widget Build Guide

**Status**: ✅ Build Successful  
**Date**: February 10, 2026  
**Version**: 1.0

---

## 🎉 Widget Build Complete!

Your chat widget has been successfully built and is ready to deploy.

### Build Output

```
✓ 113 modules transformed
✓ Built in 1.27s
File: chat-widget.iife.js (348.56 kB raw, 118.51 kB gzipped)
Location: /public/widget-dist/chat-widget.iife.js
```

---

## 📦 What Was Built

The **Chat Widget** is a standalone, self-contained JavaScript bundle that can be embedded in any website.

### Features Included
✅ File attachment support (NEW!)  
✅ Multimodal chat capabilities  
✅ Real-time messaging  
✅ User authentication  
✅ Download links for attachments  
✅ Responsive design  
✅ Error handling  

---

## 🚀 How to Use the Widget

### 1. Host the Widget File
The built widget is located at:
```
public/widget-dist/chat-widget.iife.js
```

Make it available at a public URL:
```
https://your-domain.com/chat-widget.iife.js
```

### 2. Embed in Any Website
Add this to any HTML page:

```html
<!-- Container for the widget -->
<div id="chat-widget"></div>

<!-- Load and initialize the widget -->
<script src="https://your-domain.com/chat-widget.iife.js"></script>
<script>
  // Initialize with configuration
  const chatbotConfig = {
    chatbotId: 'my_bot_id',
    apiUrl: 'https://your-backend-url',
    containerId: 'chat-widget',
    theme: 'light',
    // Optional file attachment settings
    attachmentApiUrl: 'https://your-backend-url'
  };
  
  // Render the widget
  window.ChatWidget.render(chatbotConfig);
</script>
```

### 3. Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `chatbotId` | string | ✅ Yes | Unique chatbot identifier |
| `apiUrl` | string | ✅ Yes | Backend API URL |
| `containerId` | string | ✅ Yes | HTML element ID to mount widget |
| `theme` | string | No | 'light' or 'dark' |
| `attachmentApiUrl` | string | No | File attachment API URL |
| `position` | string | No | 'bottom-right', 'bottom-left', etc. |
| `width` | number | No | Widget width in pixels |
| `height` | number | No | Widget height in pixels |

---

## 📂 File Locations

```
chat-frontend/
├── widget/
│   ├── index.tsx          ← Widget entry point
│   ├── ChatbotWidget.tsx  ← Main widget component
│   ├── vite.config.ts     ← Build configuration
│   └── ...
├── public/
│   └── widget-dist/
│       └── chat-widget.iife.js  ← 🎯 Built widget (348 KB)
└── package.json
```

---

## 🔧 Building the Widget

### Build Command
```bash
npm run build:widget
```

### What Happens
1. Vite bundles all widget files
2. Creates self-contained IIFE (Immediately Invoked Function Expression)
3. Outputs to `public/widget-dist/chat-widget.iife.js`
4. Ready for embedding in any website

### Build Details
```
Format: IIFE (not ESM or UMD)
Size: 348.56 KB (118.51 KB gzipped)
Modules: 113
Dependencies: Bundled (no external requires)
Targets: All modern browsers
```

---

## 💡 Usage Examples

### Example 1: Simple Embed
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website with Chat</title>
</head>
<body>
    <h1>Welcome to My Site</h1>
    
    <!-- Widget container -->
    <div id="chat-widget"></div>

    <!-- Load widget -->
    <script src="/chat-widget.iife.js"></script>
    <script>
        ChatWidget.render({
            chatbotId: 'my_bot',
            apiUrl: 'http://localhost:8000',
            containerId: 'chat-widget'
        });
    </script>
</body>
</html>
```

### Example 2: With Customization
```html
<div id="my-chat"></div>

<script src="/chat-widget.iife.js"></script>
<script>
    ChatWidget.render({
        chatbotId: 'support_bot',
        apiUrl: 'https://api.example.com',
        containerId: 'my-chat',
        theme: 'dark',
        width: 400,
        height: 600,
        position: 'bottom-right'
    });
</script>
```

### Example 3: With File Attachment Support
```html
<div id="chat"></div>

<script src="/chat-widget.iife.js"></script>
<script>
    ChatWidget.render({
        chatbotId: 'document_bot',
        apiUrl: 'https://api.example.com',
        attachmentApiUrl: 'https://api.example.com/attachments',
        containerId: 'chat',
        theme: 'light'
    });
</script>
```

---

## 🌐 Deployment Options

### Option 1: Serve from Chat Frontend
```bash
# In your main Next.js app
npm run build
npm start

# Widget available at:
# https://your-chat-domain.com/chat-widget.iife.js
```

### Option 2: Serve from CDN
```bash
# Upload public/widget-dist/chat-widget.iife.js to CDN
# Example with AWS S3 + CloudFront:

aws s3 cp public/widget-dist/chat-widget.iife.js \
    s3://my-bucket/chat-widget.iife.js --public-read

# Use CDN URL:
# https://d123.cloudfront.net/chat-widget.iife.js
```

### Option 3: Serve from Separate Server
```bash
# Copy the widget file to your static server
scp public/widget-dist/chat-widget.iife.js \
    user@static-server:/var/www/widgets/

# Available at:
# https://static.example.com/widgets/chat-widget.iife.js
```

---

## 🔒 Security Considerations

### CORS
Ensure your backend supports CORS for widget requests:
```javascript
// Backend example (Express)
app.use(cors({
    origin: ['https://example.com', 'https://another-site.com'],
    credentials: true
}));
```

### HTTPS
Always use HTTPS in production:
```javascript
// ✅ Correct
<script src="https://your-domain.com/chat-widget.iife.js"></script>

// ❌ Wrong (insecure)
<script src="http://your-domain.com/chat-widget.iife.js"></script>
```

### Content Security Policy
Add CSP headers if needed:
```
Content-Security-Policy: script-src 'self' 'unsafe-inline' https://your-domain.com
```

---

## 📊 Widget Size & Performance

### Bundle Size
```
Development: 348.56 KB
Gzipped: 118.51 kB (recommended for transfer)
Modules: 113
Load time: ~200-500ms (over 3G)
```

### Performance Tips
1. **Compress in transit** - Serve with gzip enabled
2. **Cache** - Set long cache headers (1 year)
3. **Lazy load** - Load widget only when needed
4. **CDN** - Serve from geographically close CDN

---

## 🧪 Testing the Widget

### Test Locally
```bash
# Build the widget
npm run build:widget

# Start the dev server
npm run dev

# Test at http://localhost:3000
# Widget file at http://localhost:3000/chat-widget.iife.js
```

### Test in Browser Console
```javascript
// Check if widget is loaded
console.log(window.ChatWidget);

// Initialize manually
ChatWidget.render({
    chatbotId: 'test_bot',
    apiUrl: 'http://localhost:8000',
    containerId: 'chat-widget'
});
```

---

## 🔄 Rebuilding the Widget

### After Code Changes
```bash
# Update widget code
# Then rebuild
npm run build:widget

# This will:
# 1. Compile TypeScript
# 2. Bundle with Vite
# 3. Output to public/widget-dist/
# 4. Ready to redeploy
```

### Version Management
Consider versioning your widget:
```
chat-widget-v1.0.0.iife.js
chat-widget-v1.0.1.iife.js
chat-widget-v1.1.0.iife.js
```

---

## 📋 Deployment Checklist

- [ ] Widget built successfully (`npm run build:widget`)
- [ ] `chat-widget.iife.js` exists in `public/widget-dist/`
- [ ] Tested locally (works in browser)
- [ ] Backend API is running and accessible
- [ ] CORS configured on backend
- [ ] HTTPS enabled for production
- [ ] CDN configured (optional)
- [ ] Documentation provided to users
- [ ] Sample HTML provided
- [ ] Ready for production ✅

---

## 🚢 Production Deployment

### Step 1: Build
```bash
npm run build:widget
```

### Step 2: Verify
```bash
ls -lh public/widget-dist/chat-widget.iife.js
# Should be ~348 KB
```

### Step 3: Deploy
```bash
# Option A: Deploy with main app
npm run build && npm run start

# Option B: Upload to CDN
# Upload public/widget-dist/chat-widget.iife.js to your CDN

# Option C: Copy to static server
scp public/widget-dist/chat-widget.iife.js user@server:/path/
```

### Step 4: Verify Deployment
```javascript
// Test from any website
<script src="https://your-deployed-url/chat-widget.iife.js"></script>
<script>
    ChatWidget.render({...});
</script>
```

---

## 🐛 Troubleshooting

### Widget Not Loading
**Problem**: Script tag doesn't load  
**Solution**: 
- Check CORS headers
- Verify URL is correct
- Check browser console for errors
- Ensure HTTPS is used

### Widget Not Initializing
**Problem**: ChatWidget is undefined  
**Solution**:
- Wait for script to load before calling ChatWidget.render()
- Check script path
- Look in console for errors

### File Attachments Not Working
**Problem**: Can't upload files  
**Solution**:
- Verify attachmentApiUrl is set
- Ensure backend File API is running
- Check CORS on backend
- Review browser console

---

## 📖 Widget Integration Guide

For complete integration instructions, see:
- `WIDGET_INTEGRATION_GUIDE.md` (if available)
- `README.md`
- Backend API documentation

---

## 🎯 Next Steps

1. ✅ **Widget Built** - Complete!
2. 📋 **Test Locally** - Try embedding the widget
3. 🚀 **Deploy** - Move to production server/CDN
4. 📢 **Distribute** - Share widget with partners/clients
5. 📊 **Monitor** - Track usage and errors

---

## 📞 Support

For issues with the widget:
1. Check browser console for errors
2. Verify all configuration options
3. Check backend is running
4. Review CORS settings
5. Check network requests in DevTools

---

## 📝 Change Log

### v1.0 (Feb 10, 2026)
- ✅ Initial widget build
- ✅ File attachment support included
- ✅ Multimodal capabilities
- ✅ Production ready

---

**Status**: 🟢 **READY FOR PRODUCTION**  
**Built**: February 10, 2026  
**Size**: 348.56 KB (118.51 KB gzipped)


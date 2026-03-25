# Folder Creation Debugging Guide

## What I Fixed

I've added comprehensive logging to both frontend and backend to help diagnose the issue:

### **Frontend Changes** (`app/assets/page.tsx`)

#### Added Console Logging in `createFolderBackend()`:
```typescript
console.log("Creating folder:", { folderPath, backendUrl, headers });
console.log("Folder creation response:", { status: res.status, ok: res.ok });
console.log("Folder created successfully");
console.error("Folder creation failed:", errorData);
```

#### Added Console Logging in Button Handler:
```typescript
console.log("Creating folder with name:", folderName.trim());
```

### **Backend Changes** (`MediaAssetController.java`)

#### Added Comprehensive Logging:
```java
log.warn("Unauthorized create folder attempt - no user email");
log.warn("Invalid folder path: {}", request == null ? "null request" : request.getFolderPath());
log.info("Creating folder for user {}: {}", userEmail, folderPath);
log.info("Folder created successfully for user {}: {}", userEmail, folderPath);
log.warn("Invalid folder format for user {}: {}", userEmail, e.getMessage());
log.error("Error creating folder for user {}: {}", userEmail, e.getMessage(), e);
```

#### Improved Error Responses:
- Better error messages with `error` and `message` fields
- Proper HTTP status codes (400, 401, 500)
- Detailed logging for debugging

---

## How to Test and Debug

### **Step 1: Check Browser Console**

Open your browser DevTools (F12) and go to the **Console** tab.

When you click "New Folder" and enter a folder name, you should see:

```
Creating folder with name: MyFolder
Creating folder: { 
  folderPath: "MyFolder", 
  backendUrl: "http://localhost:8080", 
  headers: { Authorization: "Bearer ..." } 
}
```

If you see these logs, the frontend is working correctly.

### **Step 2: Check Backend Logs**

Look at the backend console/logs for:

```
INFO net.ai.chatbot.controller.mediaasset.MediaAssetController - Creating folder for user user@example.com: MyFolder
INFO net.ai.chatbot.controller.mediaasset.MediaAssetController - Folder created successfully for user user@example.com: MyFolder
```

Or error messages like:

```
WARN net.ai.chatbot.controller.mediaasset.MediaAssetController - Unauthorized create folder attempt - no user email
```

### **Step 3: Check Network Tab**

In browser DevTools, go to **Network** tab.

When you create a folder, you should see:

```
POST /v1/api/assets/folders
Status: 200 (or 4xx/5xx if error)
Headers:
  Authorization: Bearer <your-jwt-token>
  Content-Type: application/json
Body:
  {
    "folderPath": "MyFolder"
  }
Response:
  {
    "success": true,
    "folderPath": "MyFolder"
  }
```

---

## Common Issues & Solutions

### **Issue 1: Status 401 (Unauthorized)**

**Error Message:** "Unauthorized" or "User email not found in token"

**Cause:** The JWT token is not being sent or is invalid.

**Solution:**
- Check that you're logged in (see user profile in top-right)
- Check that Clerk authentication is configured correctly
- Verify `getToken()` is returning a valid JWT

**Debug:**
```javascript
// In browser console:
const token = await new Promise(resolve => {
  const iframe = document.querySelector('[data-clerk-sync]');
  // Alternative: check Application tab → Cookies for session
  console.log("Session cookies present:", document.cookie.includes('__session'));
});
```

### **Issue 2: Status 400 (Bad Request)**

**Error Message:** "Folder path cannot be empty" or "Invalid folder format"

**Cause:** Folder name contains invalid characters or is empty.

**Solution:**
- Use simple names: "Photos", "Work", "2024"
- Don't use: "/", "\\", "//", "@", "#", etc.
- Click OK (don't leave blank)

### **Issue 3: Status 500 (Server Error)**

**Error Message:** "Internal server error" with details

**Cause:** Backend exception

**Solution:**
- Check backend logs for detailed error
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Ensure backend is running: `http://localhost:8080`

### **Issue 4: No API Call at All**

**No console logs, no network request**

**Cause:** Button handler not executing

**Solution:**
- Check browser console for any JavaScript errors
- Verify button is clickable (not disabled)
- Try clicking again and check console

---

## Test Workflow

### **Basic Test**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to `/assets`
4. Click "New Folder"
5. Enter "TestFolder"
6. Check console logs:
   - Should see `Creating folder with name: TestFolder`
   - Should see API call details
   - Should see response status: 200

### **Folder Hierarchy Test**

1. Create "Photos" folder
2. Click "Photos" to enter it
3. Click "New Folder"
4. Enter "Vacation"
5. Check backend log: `Creating folder for user ...: Photos/Vacation`

### **Verify Persistence**

1. Create a folder
2. Refresh the page (F5)
3. Folders should still be visible
4. This confirms data is saved in backend

---

## Expected Behavior After Fix

### **When Creating Folder Works:**

1. Click "New Folder" button
2. Prompt appears asking for folder name
3. Enter name (e.g., "Photos")
4. See console logs indicating API call
5. Folder appears in UI
6. Backend logs show creation
7. Refresh page → folder still exists

### **When Uploading to Folder:**

1. Enter a folder (click its card)
2. Click "Upload Files"
3. Files upload
4. Files appear in that folder only
5. Navigate back → see empty folder list
6. Re-enter folder → files are there

---

## Error Response Format

### **Success:**
```json
{
  "success": true,
  "folderPath": "Photos/Vacation"
}
```

### **Error (400):**
```json
{
  "error": "Invalid folder format",
  "message": "Folder path cannot contain '//', '\\', etc."
}
```

### **Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "User email not found in token"
}
```

### **Error (500):**
```json
{
  "error": "Internal server error",
  "message": "Exception details..."
}
```

---

## Quick Debugging Checklist

- [ ] Browser console shows folder creation logs
- [ ] Network tab shows POST to `/v1/api/assets/folders`
- [ ] Authorization header is present in request
- [ ] Response status is 200 (not 4xx or 5xx)
- [ ] Backend logs show creation message
- [ ] Folder appears in UI after creation
- [ ] Folder persists after page refresh
- [ ] Can click folder to navigate into it

---

## If Still Not Working

1. **Check Backend URL:**
   ```
   In browser console: console.log(process.env.NEXT_PUBLIC_BACKEND_URL)
   Should output: http://localhost:8080 (or your backend URL)
   ```

2. **Check JWT Token:**
   ```
   Look in Application tab → Cookies → __session cookie
   Should exist and not be empty
   ```

3. **Check Backend Running:**
   ```
   curl http://localhost:8080/v1/api/assets
   -H "Authorization: Bearer your-token"
   Should get 200 response with asset list
   ```

4. **Review Backend Logs:**
   - Check for WARN or ERROR messages
   - Look for "Unauthorized" or "Invalid folder"
   - Get full stack trace for exceptions

---

**Last Updated:** March 25, 2026  
**Status:** Debugging with comprehensive logging enabled

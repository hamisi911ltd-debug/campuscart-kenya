# R2 Image Storage Setup

## Current Setup

Your project uses **Cloudflare R2** for image storage:

✅ **R2 Bucket:** `campusmart-storage`  
✅ **Binding:** `STORAGE` (configured in Pages)  
✅ **Upload Endpoint:** `/api/upload-image`  
✅ **Serve Endpoint:** `/api/images/[[path]]` (catch-all for nested paths)  

## How It Works

### 1. Image Upload Flow

```
User selects image → uploadImage() → /api/upload-image → R2 bucket
                                                          ↓
                                    Returns: /api/images/products/123.jpg
```

### 2. Image Display Flow

```
<img src="/api/images/products/123.jpg" />
                ↓
        /api/images/[[path]] endpoint
                ↓
        Fetches from R2 bucket
                ↓
        Returns image with cache headers
```

### 3. Database Storage

Products table stores **URL paths**, not base64:

```sql
image_url: "/api/images/products/1777543425964-dnoxfj.jpg"
images: "['/api/images/products/123.jpg', '/api/images/products/456.jpg']"
```

## API Endpoints

### Upload Image: `POST /api/upload-image`

**Request:**
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload-image', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "key": "products/1777543425964-dnoxfj.jpg",
  "url": "/api/images/products/1777543425964-dnoxfj.jpg",
  "size": 245678,
  "type": "image/jpeg"
}
```

**Validation:**
- Max size: 5MB
- Allowed types: JPG, PNG, WebP
- Unique filename: `{timestamp}-{random}.{ext}`

### Serve Image: `GET /api/images/[[path]]`

**Example:**
```
GET /api/images/products/1777543425964-dnoxfj.jpg
```

**Response:**
- Image binary data
- `Content-Type: image/jpeg`
- `Cache-Control: public, max-age=31536000, immutable`
- `ETag` for cache validation

**Catch-all routing:**
- `/api/images/products/123.jpg` → `path = ["products", "123.jpg"]`
- `/api/images/avatars/user.png` → `path = ["avatars", "user.png"]`

## Frontend Usage

### Upload Component (SellPage)

```tsx
import { uploadImages } from "@/lib/uploadImage";

const handlePhotoUpload = async (files: File[]) => {
  const uploadedUrls = await uploadImages(files);
  // uploadedUrls = ["/api/images/products/123.jpg", ...]
  setPhotoUrls(uploadedUrls);
};
```

### Display Component

```tsx
<img 
  src={product.image_url} 
  alt={product.title}
/>
```

No special handling needed - the URL path works directly in `<img>` tags.

## Benefits of R2 Storage

### vs Base64 in Database:
✅ **Smaller database** - URLs are ~50 bytes vs ~1MB for base64  
✅ **Faster queries** - Less data to transfer  
✅ **Better caching** - Images cached separately from data  
✅ **CDN support** - R2 serves from edge locations  

### vs External Services (S3, Imgur):
✅ **No CORS issues** - Same domain  
✅ **Integrated billing** - Part of Cloudflare  
✅ **Fast in production** - Cloudflare's global network  
✅ **Simple setup** - No API keys or external accounts  

## R2 Bucket Structure

```
campusmart-storage/
├── products/
│   ├── 1777543425964-dnoxfj.jpg
│   ├── 1777543426123-abc123.jpg
│   └── ...
└── (future folders)
    ├── avatars/
    └── categories/
```

## Cache Strategy

### Images (Static Assets):
```
Cache-Control: public, max-age=31536000, immutable
```
- Cached for 1 year
- Never changes (unique filenames)
- Served from edge

### Product Data (API):
```
Cache-Control: no-cache
```
- Always fresh
- Fetched from D1 database

## Troubleshooting

### Images Not Displaying

1. **Check R2 binding:**
   ```bash
   wrangler pages deployment list
   # Verify STORAGE binding exists
   ```

2. **Check image URL format:**
   ```javascript
   // ✅ Correct
   "/api/images/products/123.jpg"
   
   // ❌ Wrong
   "products/123.jpg"
   "https://r2.cloudflare.com/..."
   ```

3. **Check browser console:**
   - 404 = Image not in R2 bucket
   - 500 = R2 binding issue
   - CORS = Should not happen (same domain)

4. **Test endpoint directly:**
   ```
   https://campusmart.co.ke/api/images/products/1777543425964-dnoxfj.jpg
   ```

### Upload Failing

1. **Check file size:** Max 5MB
2. **Check file type:** Only JPG, PNG, WebP
3. **Check R2 binding:** Must be configured in Pages
4. **Check browser console:** Look for specific error

### Slow Loading

1. **Images are cached** - First load may be slow, subsequent loads instant
2. **R2 serves from edge** - Should be fast globally
3. **Check image size** - Compress large images before upload

## R2 Limits (Free Tier)

- **Storage:** 10 GB
- **Class A operations:** 1M/month (writes)
- **Class B operations:** 10M/month (reads)

For 1000 products with 3 images each (2MB avg):
- Storage: ~6 GB ✅
- Reads: ~100K/month (10K users × 10 products) ✅

## Migration from Base64

If you have existing base64 images in the database:

```javascript
// Convert base64 to R2
const base64Data = product.image_url; // "data:image/jpeg;base64,..."
const blob = await fetch(base64Data).then(r => r.blob());
const file = new File([blob], "image.jpg", { type: "image/jpeg" });
const { url } = await uploadImage(file);
// Update database with new URL
```

## Next Steps

1. ✅ R2 bucket created
2. ✅ Upload endpoint working
3. ✅ Serve endpoint fixed (catch-all routing)
4. ✅ Frontend using R2 upload
5. ⏳ Test image upload on /sell page
6. ⏳ Verify images display correctly

## Support

If images still don't display after deployment:
1. Visit https://campusmart.co.ke/clear-cache.html
2. Clear all caches
3. Test upload on /sell page
4. Check browser console for errors

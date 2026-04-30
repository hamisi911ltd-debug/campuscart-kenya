# 🗄️ Cloudflare R2 Setup Guide for CampusMart

## Overview

Cloudflare R2 will store:
- Product images uploaded by sellers
- User profile pictures
- Advertisement images

## Step 1: Create R2 Bucket

1. **Go to Cloudflare Dashboard**
   - https://dash.cloudflare.com/
   - Select your account

2. **Navigate to R2**
   - Click **R2** in the sidebar
   - Click **Create bucket**

3. **Configure Bucket**
   ```
   Bucket name: campusmart-images
   Location: Automatic (or choose closest to Kenya)
   ```
   - Click **Create bucket**

## Step 2: Configure Public Access

1. **Go to your bucket settings**
2. **Click "Settings" tab**
3. **Enable Public Access**:
   - Click **Allow Access**
   - This allows images to be viewed publicly

4. **Get Public URL**:
   ```
   Format: https://pub-[id].r2.dev
   Example: https://pub-abc123.r2.dev
   ```
   - Save this URL - you'll need it!

## Step 3: Create API Token

1. **Go to R2 → Manage R2 API Tokens**
2. **Click "Create API token"**
3. **Configure Token**:
   ```
   Token name: campusmart-upload
   Permissions: Object Read & Write
   Bucket: campusmart-images
   TTL: Forever (or set expiry)
   ```
4. **Copy credentials**:
   ```
   Access Key ID: [save this]
   Secret Access Key: [save this - shown only once!]
   ```

## Step 4: Add Environment Variables

### Local Development (.env.local)
```env
# Cloudflare R2 Configuration
VITE_R2_PUBLIC_URL=https://pub-abc123.r2.dev
VITE_R2_BUCKET_NAME=campusmart-images
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ACCOUNT_ID=your_cloudflare_account_id
```

### Cloudflare Pages (Production)
1. Go to your Pages project
2. **Settings → Environment variables**
3. Add these variables:
   ```
   VITE_R2_PUBLIC_URL = https://pub-abc123.r2.dev
   VITE_R2_BUCKET_NAME = campusmart-images
   R2_ACCESS_KEY_ID = [your key]
   R2_SECRET_ACCESS_KEY = [your secret]
   R2_ACCOUNT_ID = [your account id]
   ```

## Step 5: Backend API Setup

You need a backend API to handle uploads (can't upload directly from frontend for security).

### Option A: Cloudflare Workers (Recommended)

Create `workers/upload.ts`:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response('No file provided', { status: 400 });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `products/${timestamp}-${file.name}`;

      // Upload to R2
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });

      const arrayBuffer = await file.arrayBuffer();
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: filename,
          Body: new Uint8Array(arrayBuffer),
          ContentType: file.type,
        })
      );

      // Return public URL
      const publicUrl = `${env.R2_PUBLIC_URL}/${filename}`;
      
      return new Response(JSON.stringify({ url: publicUrl }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Upload error:', error);
      return new Response('Upload failed', { status: 500 });
    }
  },
};
```

Deploy:
```bash
npm install @aws-sdk/client-s3
wrangler deploy workers/upload.ts
```

### Option B: Node.js Backend

Create `server/upload.js`:
```javascript
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const filename = `products/${Date.now()}-${file.originalname}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(3000, () => console.log('Upload server running on port 3000'));
```

## Step 6: Update Frontend

Update `src/lib/uploadImage.ts`:
```typescript
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.url;
};
```

Update `src/pages/SellPage.tsx`:
```typescript
import { uploadImage } from '@/lib/uploadImage';

const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
  if (photos.length + files.length > 3) {
    toast.error("Maximum 3 photos allowed");
    return;
  }

  try {
    // Upload each file to R2
    const uploadPromises = files.map(file => uploadImage(file));
    const uploadedUrls = await Promise.all(uploadPromises);

    // Update state with R2 URLs
    setPhotoUrls([...photoUrls, ...uploadedUrls]);
    setPhotos([...photos, ...files]);
    
    toast.success("Photos uploaded successfully!");
  } catch (error) {
    console.error('Upload error:', error);
    toast.error("Failed to upload photos. Please try again.");
  }
};
```

## Step 7: Database Integration

Update products to use database instead of localStorage.

Create `src/lib/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const createProduct = async (product: any) => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  
  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
};

export const getProducts = async () => {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const getProduct = async (id: string) => {
  const response = await fetch(`${API_URL}/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
};
```

## Step 8: CORS Configuration

Add CORS headers to your API:

```typescript
// Cloudflare Worker
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS request
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

## Step 9: Image Optimization (Optional)

Use Cloudflare Images for automatic optimization:

1. **Enable Cloudflare Images**
2. **Configure variants**:
   ```
   thumbnail: 200x200
   medium: 800x800
   large: 1200x1200
   ```

3. **Update image URLs**:
   ```typescript
   const optimizedUrl = `${R2_PUBLIC_URL}/cdn-cgi/image/width=800/${filename}`;
   ```

## Pricing

**Cloudflare R2**:
- Storage: $0.015/GB/month
- Class A operations (writes): $4.50/million
- Class B operations (reads): $0.36/million
- **No egress fees!** (unlike AWS S3)

**Example costs for 1000 products**:
- Storage (1000 images × 500KB): ~0.5GB = $0.0075/month
- Uploads: 3000 images = $0.014
- Views: 100K views = $0.036
- **Total: ~$0.06/month** 🎉

## Testing

1. **Test upload**:
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@test-image.jpg"
   ```

2. **Verify in R2**:
   - Go to R2 bucket
   - Check if file appears
   - Test public URL

3. **Test in app**:
   - Go to /sell
   - Upload photos
   - Submit product
   - Verify images display

## Troubleshooting

### Images not uploading
- Check API token permissions
- Verify R2_ACCOUNT_ID is correct
- Check CORS headers

### Images not displaying
- Verify public access is enabled
- Check R2_PUBLIC_URL is correct
- Test URL directly in browser

### 403 Forbidden
- Regenerate API token
- Check bucket permissions
- Verify credentials in env vars

## Security Best Practices

1. **Never expose R2 credentials in frontend**
2. **Use signed URLs for uploads** (optional)
3. **Validate file types and sizes**
4. **Scan uploads for malware** (optional)
5. **Rate limit uploads per user**

## Next Steps

1. Set up R2 bucket ✅
2. Create upload API ✅
3. Update frontend code ✅
4. Test uploads ✅
5. Deploy to production ✅
6. Monitor usage in R2 dashboard ✅

---

**Need help?** Check Cloudflare R2 docs: https://developers.cloudflare.com/r2/

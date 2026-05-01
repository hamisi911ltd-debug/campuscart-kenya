# Image Storage Update - Base64 Implementation

## What Changed

Images are now stored as **base64 data** directly in the database instead of URLs. This means:

✅ **No external storage needed** - No R2, S3, or file server required  
✅ **Images always display** - No broken links or CORS issues  
✅ **Simpler deployment** - One database, no additional services  
✅ **Instant uploads** - No network requests to external storage  

## How It Works

### Before (URL-based):
```javascript
image_url: "https://r2.cloudflare.com/bucket/image.jpg"
```

### After (Base64):
```javascript
image_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
```

## Database Migration Required

Your D1 database needs to be updated to support larger image data:

### Option 1: Using Wrangler CLI (Recommended)

```bash
# Navigate to your project
cd campuscart-kenya

# Run the migration
wrangler d1 execute campusmart-db --file=migrations/001_update_image_columns.sql
```

### Option 2: Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages → D1
2. Select your `campusmart-db` database
3. Go to "Console" tab
4. Copy and paste the contents of `migrations/001_update_image_columns.sql`
5. Click "Execute"

### Option 3: Recreate Database (Fresh Start)

If you don't have important data yet:

```bash
# Drop and recreate the database
wrangler d1 execute campusmart-db --command="DROP TABLE IF EXISTS products;"
wrangler d1 execute campusmart-db --file=DATABASE_SCHEMA.sql
```

## Code Changes

### 1. Upload Function (`src/lib/uploadImage.ts`)
- ✅ Now always converts images to base64
- ✅ No more R2 or external storage calls
- ✅ Works identically in dev and production

### 2. SellPage (`src/pages/SellPage.tsx`)
- ✅ Stores base64 strings in `photoUrls` state
- ✅ Sends base64 data to API
- ✅ Database stores the raw base64 data

### 3. Database Schema
- ✅ `image_url` changed from `VARCHAR(500)` to `TEXT`
- ✅ `images` changed from `JSON` to `TEXT`
- ✅ Supports large base64 strings (up to 5MB per image)

## Image Size Limits

- **Max file size:** 5MB per image (enforced in validation)
- **Max images:** 3 per product
- **Supported formats:** JPG, PNG, WebP

Base64 encoding increases size by ~33%, so:
- 1MB image → ~1.33MB base64
- 3MB image → ~4MB base64
- 5MB image → ~6.65MB base64

## Display Images

Images display automatically since they're base64:

```tsx
<img src={product.image_url} alt={product.title} />
```

No changes needed in display components - base64 data URLs work exactly like regular URLs in `<img>` tags.

## Benefits

### 1. **Reliability**
- No broken image links
- No CORS issues
- No external service downtime

### 2. **Simplicity**
- One database to manage
- No R2 bucket configuration
- No API keys for storage

### 3. **Performance**
- Images load with product data (one request)
- No additional network calls
- Cached with the product data

### 4. **Cost**
- No storage service fees
- No bandwidth charges
- Only D1 database storage (very cheap)

## Potential Drawbacks

### 1. **Database Size**
- Base64 images are ~33% larger than binary
- D1 has generous limits (10GB free tier)
- For 1000 products with 3 images each (2MB avg): ~8GB

### 2. **Query Performance**
- Larger rows take slightly longer to fetch
- Mitigated by only fetching images when needed
- Use `SELECT id, title, price` for lists (exclude images)

### 3. **Not Ideal for Very Large Images**
- Keep images under 5MB
- Compress images before upload
- Use WebP format for better compression

## Testing

After migration, test:

1. **Upload new product** with 3 images
2. **View product** - images should display
3. **Check database** - `image_url` should contain base64 data
4. **Test on mobile** - images should load quickly

## Rollback (If Needed)

If you need to revert to URL-based storage:

```bash
git revert HEAD~3  # Revert last 3 commits
```

Then reconfigure R2 storage and update the upload function.

## Next Steps

1. ✅ Run the database migration
2. ✅ Test image upload on SellPage
3. ✅ Verify images display correctly
4. ✅ Deploy to production

## Support

If you encounter issues:
- Check browser console for errors
- Verify migration ran successfully
- Ensure images are under 5MB
- Check D1 database storage limits

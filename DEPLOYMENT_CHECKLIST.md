# CampusMart Production Deployment Checklist

## ✅ Completed Steps

1. ✅ **Code pushed to GitHub** (commit 37f77d8)
2. ✅ **API endpoints created**:
   - `functions/api/products/index.ts` (GET all, POST create)
   - `functions/api/products/[id].ts` (GET, PUT, DELETE single product)
   - `functions/api/upload-image.ts` (Image upload to R2)
   - `functions/api/images/[key].ts` (Serve images from R2)
3. ✅ **wrangler.toml configured** with D1 and R2 bindings
4. ✅ **Frontend updated** to use production APIs

## 🔴 CRITICAL: Steps You Need to Complete

### Step 1: Create D1 Database (If Not Done)

```bash
# Check if database exists
npx wrangler d1 list

# If "campusmart" doesn't exist, create it:
npx wrangler d1 create campusmart

# Copy the database_id from output and update wrangler.toml
```

### Step 2: Run Database Schema

**IMPORTANT**: You MUST run this to create the tables!

```bash
# Execute the schema in your D1 database
npx wrangler d1 execute campusmart --file=./DATABASE_SCHEMA.sql --remote
```

This creates all the necessary tables:
- `users`
- `products`
- `product_reviews`
- `cart_items`
- `orders`
- `order_items`
- `favorites`
- `advertisements`
- `notifications`
- `messages`
- `user_settings`
- `seller_stats`
- `categories`

### Step 3: Create R2 Bucket (If Not Done)

```bash
# Check if bucket exists
npx wrangler r2 bucket list

# If "campusmart-storage" doesn't exist, create it:
npx wrangler r2 bucket create campusmart-storage
```

### Step 4: Verify Cloudflare Pages Bindings

1. Go to **Cloudflare Dashboard** → **Pages** → **campusmart-kenya**
2. Click **Settings** → **Functions**
3. Verify these bindings exist:
   - **D1 Database**: Variable name `DB`, Database `campusmart`
   - **R2 Bucket**: Variable name `STORAGE`, Bucket `campusmart-storage`

### Step 5: Test the API Endpoints

After deployment, test these URLs:

```bash
# Test GET products (should return empty array initially)
curl https://campusmart-kenya.pages.dev/api/products

# Test POST product (replace with your actual data)
curl -X POST https://campusmart-kenya.pages.dev/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "seller_id": "test-user",
    "title": "Test Product",
    "description": "Test description",
    "category": "electronics",
    "price": 1000,
    "quantity_available": 1
  }'

# Test image upload
curl -X POST https://campusmart-kenya.pages.dev/api/upload-image \
  -F "image=@/path/to/test-image.jpg"
```

### Step 6: Check Cloudflare Logs

If products still don't save:

1. Go to **Cloudflare Dashboard** → **Pages** → **campusmart-kenya**
2. Click **Functions** → **Logs**
3. Look for errors when you try to post a product
4. Common errors:
   - `DB is not defined` → D1 binding not configured
   - `STORAGE is not defined` → R2 binding not configured
   - `no such table: products` → Schema not run

## 🔍 Debugging Guide

### Issue: Products Not Saving

**Check 1**: Open browser console when posting a product
- Look for network errors in the `/api/products` POST request
- Check the response body for error messages

**Check 2**: Verify database has tables
```bash
# List all tables in your D1 database
npx wrangler d1 execute campusmart --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

**Check 3**: Verify products table is empty
```bash
# Check products table
npx wrangler d1 execute campusmart --command="SELECT COUNT(*) FROM products;" --remote
```

### Issue: Images Not Displaying

**Check 1**: Verify R2 bucket exists
```bash
npx wrangler r2 bucket list
```

**Check 2**: Test image upload directly
```bash
curl -X POST https://campusmart-kenya.pages.dev/api/upload-image \
  -F "image=@test.jpg"
```

**Check 3**: Check if image URL is correct
- Image URLs should be: `/api/images/products/1234567890-filename.jpg`
- Not base64 data URLs

## 📝 Environment Variables

Make sure these are set in Cloudflare Pages:

1. Go to **Settings** → **Environment Variables**
2. Add these for **Production**:
   - `VITE_ADMIN_EMAIL` = `campusmart.care@gmail.com`
   - `VITE_ADMIN_PASSWORD` = `[your-secure-password]`
   - `VITE_GOOGLE_MAPS_API_KEY` = `[your-api-key]` (optional)

## ✅ Success Indicators

You'll know everything works when:

1. ✅ You can post a product with an image
2. ✅ The product appears immediately on the home page
3. ✅ The image displays correctly (not broken)
4. ✅ After refresh, the product is still there
5. ✅ Other users can see your posted products

## 🆘 Still Not Working?

If you've completed all steps and it's still not working:

1. **Share the error message** from browser console
2. **Share the Cloudflare Functions logs**
3. **Verify the database ID** in wrangler.toml matches your actual D1 database
4. **Check the build logs** for any deployment errors

## 📞 Quick Commands Reference

```bash
# Check D1 databases
npx wrangler d1 list

# Run schema
npx wrangler d1 execute campusmart --file=./DATABASE_SCHEMA.sql --remote

# Query database
npx wrangler d1 execute campusmart --command="SELECT * FROM products LIMIT 5;" --remote

# Check R2 buckets
npx wrangler r2 bucket list

# Deploy manually (if needed)
npm run build
npx wrangler pages deploy dist
```

---

**Next Step**: Run the database schema command above, then test posting a product!

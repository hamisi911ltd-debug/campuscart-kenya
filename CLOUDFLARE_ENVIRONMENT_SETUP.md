# 🔧 Cloudflare Environment Setup Guide

This guide shows you exactly how to configure your Cloudflare Pages project for production.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- [x] Cloudflare account
- [x] GitHub repository connected to Cloudflare Pages
- [x] D1 database created (`campusmart`)
- [x] R2 bucket created (`campusmart-storage`)
- [x] Project deployed to Cloudflare Pages

---

## 🔗 Step 1: Configure D1 Database Binding

### Why?
Your API functions need to access the D1 database. Without this binding, you'll get "DB binding not found" errors.

### How to Configure:

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Login to your account

2. **Navigate to Your Project**
   - Click **Workers & Pages** in the left sidebar
   - Find and click **campusmart-kenya** (or your project name)

3. **Open Settings**
   - Click the **Settings** tab at the top

4. **Find Functions Section**
   - Scroll down to the **Functions** section

5. **Add D1 Binding**
   - Click **D1 database bindings**
   - Click **Add binding** button
   - Fill in:
     - **Variable name**: `DB` (must be exactly this, case-sensitive)
     - **D1 database**: Select `campusmart` from dropdown
   - Click **Save**

### Verify:
After saving, you should see:
```
D1 database bindings
DB → campusmart
```

---

## 📦 Step 2: Configure R2 Storage Binding

### Why?
Your image upload API needs to store images in R2. Without this binding, image uploads will fail.

### How to Configure:

1. **In the Same Functions Section**
   - Still in **Settings** → **Functions**

2. **Add R2 Binding**
   - Click **R2 bucket bindings**
   - Click **Add binding** button
   - Fill in:
     - **Variable name**: `STORAGE` (must be exactly this, case-sensitive)
     - **R2 bucket**: Select `campusmart-storage` from dropdown
   - Click **Save**

### Verify:
After saving, you should see:
```
R2 bucket bindings
STORAGE → campusmart-storage
```

---

## 🔐 Step 3: Set Environment Variables

### Why?
Your admin login and other features need environment variables to work securely.

### How to Configure:

1. **Navigate to Environment Variables**
   - Still in **Settings** tab
   - Scroll down to **Environment variables** section

2. **Add Production Variables**
   - Click **Add variable** button
   - Add each variable:

#### Variable 1: Admin Email
```
Variable name: VITE_ADMIN_EMAIL
Value: campusmart.care@gmail.com
Environment: Production
```

#### Variable 2: Admin Password
```
Variable name: VITE_ADMIN_PASSWORD
Value: [Your secure password - DO NOT share publicly]
Environment: Production
```

3. **Click Save** after adding each variable

### Verify:
You should see:
```
Production environment variables
VITE_ADMIN_EMAIL = campusmart.care@gmail.com
VITE_ADMIN_PASSWORD = ••••••••••••••
```

---

## 🗄️ Step 4: Initialize Database Schema

### Why?
Your D1 database needs tables created before it can store data.

### How to Initialize:

1. **Open Terminal** in your project directory

2. **Run Schema Migration**
   ```bash
   npx wrangler d1 execute campusmart --remote --file=DATABASE_SCHEMA.sql
   ```

3. **Verify Tables Created**
   ```bash
   npx wrangler d1 execute campusmart --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
   ```

   You should see:
   ```
   users
   products
   categories
   orders
   order_items
   reviews
   messages
   notifications
   user_settings
   seller_stats
   ```

---

## 🚀 Step 5: Trigger New Deployment

### Why?
Binding changes only take effect after a new deployment.

### How to Deploy:

**Option A: Automatic (Recommended)**
1. Push any change to GitHub:
   ```bash
   git add .
   git commit -m "Configure production bindings"
   git push origin main
   ```
2. Cloudflare will automatically deploy

**Option B: Manual Retry**
1. In Cloudflare Dashboard → Your Project
2. Click **Deployments** tab
3. Find the latest deployment
4. Click **Retry deployment** button

### Wait for Deployment:
- Watch the deployment progress
- Wait for status: **Success** ✅

---

## ✅ Step 6: Test Your Deployment

### Test 1: Homepage
Visit: https://campusmart-kenya.pages.dev/

**Expected**: Homepage loads with products

---

### Test 2: Debug Endpoint
Visit: https://campusmart-kenya.pages.dev/api/debug

**Expected Response:**
```json
{
  "timestamp": "2026-04-30T...",
  "environment": "production",
  "step1_db_binding": "✅ DB binding exists",
  "step2_storage_binding": "✅ STORAGE binding exists",
  "step3_tables": ["users", "products", ...],
  "step4_users_count": 0,
  "step5_products_count": 0,
  "step6_r2_objects_count": 0
}
```

**If you see "❌ DB binding is UNDEFINED":**
- Go back to Step 1 and verify the binding name is exactly `DB`
- Make sure you clicked Save
- Trigger a new deployment (Step 5)

---

### Test 3: Products API
Visit: https://campusmart-kenya.pages.dev/api/products

**Expected Response:**
```json
[]
```
(Empty array is correct - no products yet)

---

### Test 4: User Registration

1. Go to: https://campusmart-kenya.pages.dev/auth
2. Click **Sign Up**
3. Fill in:
   - Full Name: Test User
   - Email: test@example.com
   - Password: test123
4. Click **Create Account**

**Expected**: Success message, redirected to homepage

**Verify in Database:**
```bash
npx wrangler d1 execute campusmart --remote --command "SELECT email, full_name FROM users"
```

Should show your test user.

---

### Test 5: Product Posting

1. Login with your test account
2. Click **Sell** in navigation
3. Fill in product details
4. Upload an image
5. Click **Submit Listing**

**Expected**: Success message, product appears on homepage

**Verify in Database:**
```bash
npx wrangler d1 execute campusmart --remote --command "SELECT title, category, price FROM products"
```

Should show your test product.

---

### Test 6: Admin Login

1. Go to: https://campusmart-kenya.pages.dev/admin/login
2. Enter:
   - Email: campusmart.care@gmail.com
   - Password: [Your VITE_ADMIN_PASSWORD]
3. Click **Sign in to Admin Dashboard**

**Expected**: Redirected to admin dashboard

---

## 🔍 Troubleshooting

### Problem: "DB binding not found"

**Solution:**
1. Check binding name is exactly `DB` (case-sensitive)
2. Verify database is `campusmart`
3. Click Save in Cloudflare Dashboard
4. Trigger new deployment
5. Wait for deployment to complete
6. Test `/api/debug` again

---

### Problem: "STORAGE binding not found"

**Solution:**
1. Check binding name is exactly `STORAGE` (case-sensitive)
2. Verify bucket is `campusmart-storage`
3. Click Save in Cloudflare Dashboard
4. Trigger new deployment
5. Wait for deployment to complete
6. Test `/api/debug` again

---

### Problem: "Table doesn't exist"

**Solution:**
1. Run schema migration:
   ```bash
   npx wrangler d1 execute campusmart --remote --file=DATABASE_SCHEMA.sql
   ```
2. Verify tables exist:
   ```bash
   npx wrangler d1 execute campusmart --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
   ```

---

### Problem: Admin login fails

**Solution:**
1. Check `VITE_ADMIN_PASSWORD` is set in Cloudflare environment variables
2. Verify it's set for **Production** environment
3. Trigger new deployment
4. Clear browser cache
5. Try again

---

### Problem: Images not uploading

**Solution:**
1. Check STORAGE binding is configured
2. Verify R2 bucket exists and is accessible
3. Check file size (max 5MB)
4. Check file type (JPG/PNG/WebP only)
5. Check browser console for errors

---

## 📊 Monitoring

### View Real-time Logs

1. Go to Cloudflare Dashboard → Your Project
2. Click **Functions** tab
3. Click **Real-time logs**
4. Perform actions on your site
5. Watch for errors in logs

### Check Analytics

1. Go to Cloudflare Dashboard → Your Project
2. Click **Analytics** tab
3. View:
   - Page views
   - Unique visitors
   - Requests
   - Bandwidth

---

## 🎉 Success!

If all tests pass, your CampusMart platform is fully configured and ready for production use!

**What's Next?**
- Share your site with users
- Monitor logs for errors
- Gather user feedback
- Iterate and improve

**Support:**
- Cloudflare Docs: https://developers.cloudflare.com/pages/
- D1 Docs: https://developers.cloudflare.com/d1/
- R2 Docs: https://developers.cloudflare.com/r2/

---

**Last Updated:** April 30, 2026

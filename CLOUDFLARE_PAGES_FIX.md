# 🔧 Cloudflare Pages Deployment Fix

## Issues Fixed

1. ✅ **Routing** - Added proper `_redirects` file for SPA routing
2. ✅ **Security Headers** - Added `_headers` file with security best practices
3. ✅ **API Routes** - Configured API passthrough in redirects
4. ✅ **Build Configuration** - Verified build output directory
5. ✅ **Functions** - Ensured Pages Functions are properly structured

---

## 📁 File Structure for Cloudflare Pages

```
campuscart-kenya/
├── dist/                    # Build output (auto-generated)
│   ├── index.html
│   ├── assets/
│   ├── _redirects          # SPA routing rules
│   └── _headers            # Security headers
├── functions/              # Cloudflare Pages Functions
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.ts
│   │   │   ├── login.ts
│   │   │   └── [id].ts
│   │   ├── products/
│   │   │   ├── index.ts
│   │   │   └── [id].ts
│   │   ├── images/
│   │   │   └── [key].ts
│   │   ├── upload-image.ts
│   │   └── debug.ts
│   └── types.d.ts
├── public/                 # Static assets (copied to dist)
│   ├── _redirects         # Will be copied to dist
│   ├── _headers           # Will be copied to dist
│   ├── manifest.json
│   └── sw.js
├── src/                   # React source code
├── wrangler.toml          # Cloudflare configuration
└── package.json
```

---

## 🚀 Cloudflare Pages Build Settings

### In Cloudflare Dashboard:

1. **Go to:** Workers & Pages → Your Project → Settings → Builds & deployments

2. **Build Configuration:**
   ```
   Build command:       npm run build
   Build output dir:    dist
   Root directory:      /
   ```

3. **Environment Variables (Production):**
   ```
   NODE_VERSION=18
   VITE_ADMIN_EMAIL=campusmart.care@gmail.com
   VITE_ADMIN_PASSWORD=[your-secure-password]
   ```

4. **Build Settings:**
   - Framework preset: **None** (or Vite)
   - Node version: **18** or higher

---

## 🔗 Bindings Configuration

### D1 Database Binding

1. Go to: **Settings** → **Functions**
2. Click: **D1 database bindings** → **Add binding**
3. Configure:
   - Variable name: `DB`
   - D1 database: `campusmart`
4. Click **Save**

### R2 Storage Binding

1. In the same **Functions** section
2. Click: **R2 bucket bindings** → **Add binding**
3. Configure:
   - Variable name: `STORAGE`
   - R2 bucket: `campusmart-storage`
4. Click **Save**

---

## 📝 _redirects File Explanation

```
/api/*  200
/*      /index.html   200
```

**What this does:**
- `/api/*` - Passes API requests to Pages Functions (status 200)
- `/*` - All other routes serve `index.html` for React Router (SPA mode)

---

## 🔒 _headers File Explanation

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
```

**What this does:**
- Security headers for all pages
- CORS headers for API endpoints
- Cache control for assets

---

## 🛠️ Deployment Steps

### Step 1: Build Locally (Test)

```bash
npm run build
```

**Expected:** Build succeeds, creates `dist/` folder

### Step 2: Verify Build Output

Check that `dist/` contains:
- ✅ `index.html`
- ✅ `_redirects`
- ✅ `_headers`
- ✅ `assets/` folder
- ✅ `manifest.json`
- ✅ `sw.js`

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Fix Cloudflare Pages deployment with proper routing and headers"
git push origin main
```

### Step 4: Wait for Cloudflare Deployment

1. Go to: **Cloudflare Dashboard** → **Workers & Pages** → Your Project
2. Click: **Deployments** tab
3. Watch the deployment progress
4. Wait for: **Success** ✅

### Step 5: Configure Bindings (First Time Only)

Follow the "Bindings Configuration" section above.

### Step 6: Initialize Database (First Time Only)

```bash
npx wrangler d1 execute campusmart --remote --file=DATABASE_SCHEMA.sql
```

---

## ✅ Testing Your Deployment

### Test 1: Homepage
**URL:** https://campusmart-kenya.pages.dev/

**Expected:** Homepage loads with products

---

### Test 2: Routing
**URL:** https://campusmart-kenya.pages.dev/category/electronics

**Expected:** Category page loads (not 404)

---

### Test 3: API Debug
**URL:** https://campusmart-kenya.pages.dev/api/debug

**Expected Response:**
```json
{
  "step1_db_binding": "✅ DB binding exists",
  "step2_storage_binding": "✅ STORAGE binding exists",
  "step3_tables": ["users", "products", ...],
  ...
}
```

---

### Test 4: Products API
**URL:** https://campusmart-kenya.pages.dev/api/products

**Expected:** JSON array (empty or with products)

---

### Test 5: User Registration

1. Go to: https://campusmart-kenya.pages.dev/auth
2. Register a new account
3. **Expected:** Success, redirected to homepage

---

### Test 6: Post Product

1. Login with your account
2. Go to: https://campusmart-kenya.pages.dev/sell
3. Fill form and submit
4. **Expected:** Product appears on homepage

---

## 🔍 Common Issues & Solutions

### Issue 1: "404 Not Found" on Routes

**Symptom:** Direct URLs like `/category/electronics` return 404

**Solution:**
1. Verify `_redirects` file exists in `public/` folder
2. Rebuild: `npm run build`
3. Check `dist/_redirects` exists after build
4. Redeploy to Cloudflare

---

### Issue 2: API Endpoints Return HTML

**Symptom:** `/api/products` returns HTML instead of JSON

**Solution:**
1. Check `_redirects` has `/api/* 200` BEFORE `/* /index.html 200`
2. Verify `functions/api/` folder structure is correct
3. Check Functions logs in Cloudflare Dashboard

---

### Issue 3: "DB binding not found"

**Symptom:** API returns error about missing DB binding

**Solution:**
1. Go to Cloudflare Dashboard → Settings → Functions
2. Add D1 binding: Variable `DB` → Database `campusmart`
3. Click Save
4. Trigger new deployment (push to GitHub)

---

### Issue 4: Images Not Uploading

**Symptom:** Image upload fails

**Solution:**
1. Add R2 binding: Variable `STORAGE` → Bucket `campusmart-storage`
2. Verify bucket exists and is accessible
3. Check file size (max 5MB) and type (JPG/PNG/WebP)

---

### Issue 5: Build Fails on Cloudflare

**Symptom:** Deployment fails during build

**Solution:**
1. Check Node version is 18 or higher
2. Verify `package.json` has correct scripts
3. Check build logs for specific errors
4. Test build locally: `npm run build`

---

## 📊 Monitoring

### View Deployment Logs

1. Cloudflare Dashboard → Your Project → **Deployments**
2. Click on a deployment
3. View build logs and deployment details

### View Functions Logs

1. Cloudflare Dashboard → Your Project → **Functions**
2. Click **Real-time logs**
3. Perform actions on your site
4. Watch for errors

### Check Analytics

1. Cloudflare Dashboard → Your Project → **Analytics**
2. View traffic, requests, and performance metrics

---

## 🎯 Performance Optimization

### Code Splitting (Optional)

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

### Image Optimization

- Use WebP format for images
- Compress images before upload
- Use lazy loading for images

### Caching

- Static assets cached for 1 year (via `_headers`)
- Service worker caches for offline support
- Cloudflare CDN caches at edge

---

## 🆘 Need Help?

### Cloudflare Documentation
- Pages: https://developers.cloudflare.com/pages/
- Functions: https://developers.cloudflare.com/pages/functions/
- D1: https://developers.cloudflare.com/d1/
- R2: https://developers.cloudflare.com/r2/

### Check Logs
- Build logs: Deployments tab
- Function logs: Functions → Real-time logs
- Browser console: F12 → Console tab

---

## ✨ Success Checklist

- [ ] Build succeeds locally
- [ ] `_redirects` and `_headers` in `dist/`
- [ ] Pushed to GitHub
- [ ] Cloudflare deployment succeeds
- [ ] D1 binding configured
- [ ] R2 binding configured
- [ ] Database schema applied
- [ ] Homepage loads
- [ ] Routing works (no 404s)
- [ ] API endpoints return JSON
- [ ] User registration works
- [ ] Product posting works
- [ ] Images upload to R2

---

**Last Updated:** April 30, 2026

Your CampusMart platform is now ready for production on Cloudflare Pages! 🚀

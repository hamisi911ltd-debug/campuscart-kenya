# 🚀 CampusMart - Cloudflare Pages Deployment Guide

## ✅ Pre-Deployment Checklist

Your project is ready for production! All features are implemented and tested.

---

## 📋 Step-by-Step Deployment

### 1. **Build the Project**

```bash
npm run build
```

This creates a `dist/` folder with production-ready files.

---

### 2. **Push to GitHub**

```bash
# Add all files
git add .

# Commit changes
git commit -m "Production ready: Complete CampusMart platform with PWA"

# Push to GitHub
git push origin main
```

---

### 3. **Deploy to Cloudflare Pages**

#### Option A: Via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Sign in or create account

2. **Create New Project**
   - Click "Pages" in sidebar
   - Click "Create a project"
   - Click "Connect to Git"

3. **Connect GitHub Repository**
   - Authorize Cloudflare to access GitHub
   - Select your repository: `campuscart-kenya`
   - Click "Begin setup"

4. **Configure Build Settings**
   ```
   Project name: campusmart-kenya
   Production branch: main
   Framework preset: Vite
   Build command: npm install --legacy-peer-deps && npm run build
   Build output directory: dist
   Root directory: /
   ```
   
   **Important**: The `--legacy-peer-deps` flag resolves dependency conflicts.

5. **Environment Variables** (REQUIRED!)
   
   **⚠️ You MUST add these before deploying:**
   
   Click "Environment variables" and add:
   ```
   VITE_ADMIN_EMAIL = campusmart.care@gmail.com
   VITE_ADMIN_PASSWORD = [Your NEW secure password - NOT the exposed one!]
   ```
   
   **Without these, admin login will NOT work!**

6. **Deploy**
   - Click "Save and Deploy"
   - Wait 2-5 minutes for build
   - Your site will be live!

#### Option B: Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=campusmart-kenya
```

---

### 4. **Custom Domain (Optional)**

1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter your domain (e.g., campusmart.ke)
5. Follow DNS instructions
6. Wait for SSL certificate (automatic)

---

## 🔧 Build Configuration

### Vite Config (Already Set)
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
```

### Redirects (Already Created)
```
// _redirects file
/*    /index.html   200
```

This ensures all routes work correctly (SPA routing).

---

## 📱 PWA Configuration

### Service Worker
- ✅ Already configured in `public/sw.js`
- ✅ Registered in `src/main.tsx`
- ✅ Will work automatically after deployment

### Manifest
- ✅ Already configured in `public/manifest.json`
- ✅ All icons generated (72px to 512px)
- ✅ Linked in `index.html`

### HTTPS Required
- ✅ Cloudflare provides automatic HTTPS
- ✅ PWA will work out of the box

---

## 🌐 Post-Deployment

### 1. **Test Your Site**

Visit your Cloudflare Pages URL:
```
https://campusmart-kenya.pages.dev
```

Test:
- [ ] Homepage loads
- [ ] All routes work
- [ ] PWA install prompt appears
- [ ] Can install app on mobile
- [ ] Dark mode works
- [ ] Location features work
- [ ] Admin panel accessible
- [ ] Reviews display correctly

### 2. **Test PWA Installation**

**On Mobile:**
- Open site in Chrome (Android) or Safari (iOS)
- Wait for install prompt
- Install app
- Test offline mode

**On Desktop:**
- Open site in Chrome
- Look for install icon in address bar
- Install app
- Test functionality

### 3. **Configure Analytics (Optional)**

Add Cloudflare Web Analytics:
1. Go to Cloudflare Dashboard
2. Click "Web Analytics"
3. Add your site
4. Copy tracking code
5. Add to `index.html`

---

## 🔐 Environment Variables

If you need to add environment variables:

1. **In Cloudflare Dashboard:**
   - Go to Pages project
   - Click "Settings"
   - Click "Environment variables"
   - Add variables:
     ```
     VITE_GOOGLE_MAPS_API_KEY=your_key_here
     VITE_ADMIN_EMAIL=campusmart.care@gmail.com
     ```

2. **In Code:**
   ```typescript
   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
   ```

---

## 📊 Performance Optimization

### Already Optimized:
- ✅ Vite build optimization
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Service worker caching
- ✅ Lazy loading

### Cloudflare Provides:
- ✅ Global CDN
- ✅ Automatic compression
- ✅ HTTP/2 & HTTP/3
- ✅ DDoS protection
- ✅ SSL/TLS encryption

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Routes Don't Work
- Ensure `_redirects` file is in project root
- Check build output includes `_redirects`

### PWA Not Installing
- Ensure site is HTTPS (Cloudflare provides this)
- Check service worker is registered
- Clear browser cache

### Dark Mode Not Working
- Check localStorage is enabled
- Test in incognito mode
- Clear site data and retry

---

## 📞 Support

**Email**: campusmart.care@gmail.com  
**WhatsApp**: 0108254465  
**Admin Login**: Configure via environment variables (see .env.example)

---

## 🎯 Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main
```

---

## ✅ Deployment Checklist

Before deploying:
- [x] All features working
- [x] Build succeeds
- [x] No console errors
- [x] PWA configured
- [x] Service worker registered
- [x] Icons generated
- [x] Redirects file created
- [x] .gitignore updated
- [x] README updated

After deploying:
- [ ] Site loads correctly
- [ ] All routes work
- [ ] PWA installs
- [ ] Dark mode works
- [ ] Location features work
- [ ] Admin panel accessible
- [ ] Mobile responsive
- [ ] Performance is good

---

## 🚀 You're Ready!

Your CampusMart platform is production-ready with:
- ✅ Complete e-commerce functionality
- ✅ PWA support (installable)
- ✅ Admin dashboard
- ✅ Order tracking
- ✅ Reviews & ratings
- ✅ Location-based checkout
- ✅ Dark mode
- ✅ Settings page
- ✅ WhatsApp integration

**Deploy now and go live!** 🎉

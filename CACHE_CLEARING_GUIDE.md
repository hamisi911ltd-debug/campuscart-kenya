# Cache Clearing Guide

## The Problem

Your browser is showing the **old JavaScript bundle** (`index-BZHrsEgO.js`) which has the `.map()` error. The new fixed version hasn't loaded yet due to aggressive caching.

## Quick Fix - Use the Cache Clearing Tool

### Option 1: Automated Tool (Easiest)

1. Visit: **https://campusmart.co.ke/clear-cache.html**
2. Click **"🔥 Clear Everything & Reload"**
3. Wait 2 seconds for automatic reload
4. The site should now work correctly

### Option 2: Manual Browser Cache Clear

#### Chrome/Edge:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "All time"
3. Check: ✅ Cached images and files
4. Check: ✅ Site settings (to clear service workers)
5. Click "Clear data"
6. Go to https://campusmart.co.ke
7. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) for hard refresh

#### Firefox:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Everything"
3. Check: ✅ Cache
4. Check: ✅ Site settings
5. Click "Clear Now"
6. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

#### Safari:
1. Press `Cmd+Option+E` to empty caches
2. Or: Safari menu → Clear History → All History
3. Hard refresh: `Cmd+Option+R`

### Option 3: DevTools Method (For Developers)

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **"Clear storage"** in left sidebar
4. Check all boxes:
   - ✅ Unregister service workers
   - ✅ Local and session storage
   - ✅ Cache storage
5. Click **"Clear site data"**
6. Close DevTools
7. Hard refresh the page

## What's Being Cached

### Old Bundle (Causing Errors):
- `index-BZHrsEgO.js` - Has the `.map()` error
- Service Worker v1, v2, v3

### New Bundle (Fixed):
- `index-Cqg3hA8B.js` or newer - Has async fixes
- Service Worker v4

## How to Verify It's Fixed

After clearing cache, check the browser console:

### ✅ Good Signs:
```
✅ Service Worker registered successfully
(No .map() errors)
(No "Failed to convert value to 'Response'" errors)
```

### ❌ Still Broken:
```
❌ TypeError: r.map is not a function
❌ index-BZHrsEgO.js (old bundle still loading)
```

If still broken, try:
1. Close ALL browser tabs for campusmart.co.ke
2. Wait 10 seconds
3. Open a new incognito/private window
4. Visit https://campusmart.co.ke

## For Mobile Users

### iOS Safari:
1. Settings → Safari → Clear History and Website Data
2. Confirm
3. Reopen Safari and visit the site

### Android Chrome:
1. Chrome menu (⋮) → Settings → Privacy
2. Clear browsing data
3. Select "All time"
4. Check: Cached images and files
5. Clear data

## Prevention

The new deployment includes:

✅ **Aggressive cache headers** - HTML never cached  
✅ **Service Worker v4** - Clears old caches automatically  
✅ **Cache-busting utility** - /clear-cache.html for easy clearing  

Future deployments should update automatically without manual cache clearing.

## Still Having Issues?

If the old bundle persists after trying all methods:

1. **Wait 5-10 minutes** - Cloudflare Pages deployment may still be in progress
2. **Check deployment status**: https://dash.cloudflare.com/
3. **Try incognito mode** - Bypasses all caches
4. **Different browser** - Test in a browser you haven't used before
5. **Different device** - Test on mobile if you've been using desktop

## Technical Details

### Why This Happened:

1. Vite generates content-hashed bundles (e.g., `index-BZHrsEgO.js`)
2. These are cached for 1 year (immutable)
3. The old bundle had the async bug
4. Service Worker was also caching aggressively
5. Multiple layers of caching prevented updates

### The Fix:

1. ✅ Fixed async issues in CategoryPage and FavoritesPage
2. ✅ Updated Service Worker to v4 (clears old caches)
3. ✅ Added aggressive no-cache headers for HTML
4. ✅ Service Worker now skips navigation requests
5. ✅ Created /clear-cache.html utility

### Cache Layers:

1. **Browser Cache** - Stores static files
2. **Service Worker Cache** - PWA offline cache
3. **Cloudflare CDN Cache** - Edge caching
4. **Local Storage** - App data

All layers have been addressed in this fix.

## Success Checklist

After clearing cache, verify:

- [ ] No `.map()` errors in console
- [ ] `/market`, `/house`, `/food` routes work
- [ ] Products display correctly
- [ ] Images load (if you've uploaded any)
- [ ] Cart works without 500 errors
- [ ] New bundle name (not `index-BZHrsEgO.js`)

## Contact

If issues persist after 10 minutes and trying all methods, there may be a deployment issue. Check:

1. Cloudflare Pages deployment logs
2. Browser console for specific errors
3. Network tab to see which bundle is loading

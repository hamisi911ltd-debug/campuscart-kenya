# Google Sign-In Troubleshooting Guide

## 🔴 Current Error Analysis

Based on the error you're seeing:
```
/api/auth/google:1 Failed to load resource: the server responded with a status of 400 ()
google-callback?iss=... Failed to load resource: the server responded with a status of 503 ()
❌ Sign-in Failed: Failed to exchange code
```

## 🔍 Root Causes & Solutions

### Issue 1: Wrong Redirect URI in Google Cloud Console

**Problem:** Google is redirecting to `/google-callback` instead of `/auth/google-callback`

**Solution:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, make sure you have EXACTLY:
   ```
   https://campusmart.co.ke/auth/google-callback
   ```
   (Note: `/auth/google-callback` NOT `/google-callback`)
4. Remove any old redirect URIs like:
   - `https://campusmart.co.ke/google-callback` ❌
   - Any localhost URLs ❌
5. Click **Save**

### Issue 2: Missing Environment Variables

**Problem:** The backend can't authenticate with Google because credentials are missing

**Solution:**
1. Go to Cloudflare Pages Dashboard
2. Navigate to: **Settings** → **Environment Variables**
3. Add these for **Production** environment:

```
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

**Get your credentials from:**
- Google Cloud Console → APIs & Services → Credentials
- Or from the `.env.google` file in your local project

4. After adding, click **Save**
5. Go to **Deployments** tab
6. Click **Retry deployment** on the latest deployment

### Issue 3: Redirect URI Mismatch

**Problem:** The redirect URI sent to Google doesn't match what's configured

**Verify these match EXACTLY:**
- In Google Cloud Console: `https://campusmart.co.ke/auth/google-callback`
- In your code: `${window.location.origin}/auth/google-callback`
- When testing: The URL should be `https://campusmart.co.ke/auth/google-callback`

## ✅ Step-by-Step Fix

### Step 1: Update Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID (should start with `456038926351-...`)
3. Click **Edit**
4. Under **Authorized redirect URIs**, add:
   ```
   https://campusmart.co.ke/auth/google-callback
   ```
5. Under **Authorized JavaScript origins**, add:
   ```
   https://campusmart.co.ke
   ```
6. Remove any incorrect URIs
7. Click **Save**

### Step 2: Add Environment Variables in Cloudflare

1. Go to: https://dash.cloudflare.com/
2. Select your **campusmart** project
3. Go to: **Settings** → **Environment Variables**
4. Click **Add variable** for Production:
   - Name: `GOOGLE_CLIENT_ID`
   - Value: `<your-google-client-id>` (from Google Cloud Console or `.env.google` file)
5. Click **Add variable** again:
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: `<your-google-client-secret>` (from Google Cloud Console or `.env.google` file)
6. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab in Cloudflare Pages
2. Find the latest deployment
3. Click **Retry deployment**
4. Wait for deployment to complete (usually 1-2 minutes)

### Step 4: Clear Cache & Test

1. Visit: https://campusmart.co.ke/clear-cache.html
2. Clear your browser cache (Ctrl+Shift+Delete)
3. Go to: https://campusmart.co.ke/auth
4. Click "Continue with Google"
5. Sign in with your Google account

## 🧪 Testing Checklist

After completing the steps above:

- [ ] Environment variables are set in Cloudflare Pages
- [ ] Redirect URI in Google Cloud Console is correct
- [ ] Latest deployment is successful
- [ ] Cache is cleared
- [ ] Google Sign-In button appears on auth page
- [ ] Clicking button redirects to Google
- [ ] After signing in, redirects back to campusmart.co.ke
- [ ] User is logged in successfully

## 🔍 Debugging Tips

### Check Environment Variables
1. Go to Cloudflare Pages → Settings → Environment Variables
2. Verify both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. Make sure they're set for **Production** environment

### Check Cloudflare Logs
1. Go to Cloudflare Pages → Deployments
2. Click on the latest deployment
3. Check the **Functions** tab for any errors
4. Look for logs from `/api/auth/google`

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try signing in with Google
4. Look for error messages
5. Check the Network tab for failed requests

### Test the Config Endpoint
1. Visit: https://campusmart.co.ke/api/config/google
2. Should return: `{"clientId":"<your-client-id>"}`
3. If it returns `{"clientId":"YOUR_GOOGLE_CLIENT_ID"}`, environment variables are not set

## 🆘 Common Errors & Solutions

### Error: "redirect_uri_mismatch"
**Cause:** Redirect URI doesn't match Google Cloud Console  
**Fix:** Update redirect URI in Google Cloud Console to exactly match

### Error: "invalid_client"
**Cause:** Client ID or Secret is wrong  
**Fix:** Verify environment variables in Cloudflare Pages

### Error: "Failed to exchange code"
**Cause:** Backend can't authenticate with Google  
**Fix:** Check environment variables and redeploy

### Error: 503 Service Unavailable
**Cause:** Function is not deployed or crashed  
**Fix:** Check Cloudflare deployment logs, redeploy if needed

### Error: "No authorization code received"
**Cause:** Google didn't send the code  
**Fix:** Check redirect URI configuration

## 📞 Still Having Issues?

If you've followed all steps and it's still not working:

1. **Check the exact error message** in browser console
2. **Check Cloudflare Functions logs** for backend errors
3. **Verify all URLs** match exactly (no trailing slashes, correct protocol)
4. **Try in incognito mode** to rule out cache issues
5. **Check Google Cloud Console** for any API restrictions

## 📝 Quick Reference

**Google Cloud Console:**
- URL: https://console.cloud.google.com/apis/credentials
- Redirect URI: `https://campusmart.co.ke/auth/google-callback`
- JavaScript Origin: `https://campusmart.co.ke`

**Cloudflare Pages:**
- Dashboard: https://dash.cloudflare.com/
- Environment Variables: Settings → Environment Variables
- Required: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**Test URLs:**
- Auth page: https://campusmart.co.ke/auth
- Config endpoint: https://campusmart.co.ke/api/config/google
- Clear cache: https://campusmart.co.ke/clear-cache.html

---

**Last Updated:** May 2, 2026

# Google Sign-In Setup Guide

## ✅ Code Status
All Google Sign-In code has been implemented and pushed to GitHub. Your Cloudflare Pages will automatically deploy the latest changes.

## 🔧 Required Configuration

### Step 1: Add Environment Variables in Cloudflare Pages

Go to your Cloudflare Pages dashboard:
1. Navigate to: **Settings** → **Environment Variables**
2. Add these variables for **Production** and **Preview**:

```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

**Note:** Use the actual credentials from your Google Cloud Console OAuth 2.0 Client ID.

### Step 2: Update Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://campusmart.co.ke/auth/google-callback
   ```
4. Under **Authorized JavaScript origins**, add:
   ```
   https://campusmart.co.ke
   ```
5. Click **Save**

### Step 3: Redeploy (if needed)

After adding environment variables:
1. Go to **Deployments** in Cloudflare Pages
2. Click **Retry deployment** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## 📁 Files Implemented

### Backend API Endpoints:
- ✅ `functions/api/auth/google.ts` - Handles Google OAuth flow
- ✅ `functions/api/auth/me.ts` - Returns current user info
- ✅ `functions/api/config/google.ts` - Returns public Google Client ID
- ✅ `functions/api/products/my-listings.ts` - Fetch user's products
- ✅ `functions/api/products/[id].ts` - Delete & toggle products
- ✅ `functions/api/orders/whatsapp.ts` - WhatsApp message formatter

### Frontend Pages:
- ✅ `src/pages/AuthPage.tsx` - Sign-in page with Google button
- ✅ `src/pages/auth/GoogleCallback.tsx` - Handles Google redirect
- ✅ `src/pages/MyListingsPage.tsx` - Manage user's listings
- ✅ `src/pages/ProfilePage.tsx` - Links to My Listings

### Routes:
- ✅ `/auth` - Sign in/Sign up page
- ✅ `/auth/google-callback` - Google OAuth callback
- ✅ `/my-listings` - User's product listings

## 🎯 Features Included

1. **Google Sign-In Button** - "Continue with Google" on auth page
2. **OAuth Flow** - Complete authentication with Google
3. **User Creation** - Auto-creates user in D1 database
4. **My Listings Page** - View, activate/deactivate, delete products
5. **Profile Integration** - Link to My Listings from profile

## 🧪 Testing

After deployment:
1. Visit: https://campusmart.co.ke/auth
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back and logged in
5. Visit: https://campusmart.co.ke/my-listings to manage products

## 🔍 Troubleshooting

### "redirect_uri_mismatch" error:
- Verify the redirect URI in Google Cloud Console matches exactly: `https://campusmart.co.ke/auth/google-callback`

### "Invalid client" error:
- Check that environment variables are set in Cloudflare Pages
- Redeploy after adding environment variables

### Google Sign-In button doesn't work:
- Check browser console for errors
- Verify `/api/config/google` returns the correct client ID
- Clear cache: https://campusmart.co.ke/clear-cache.html

## 📝 Notes

- The Google Client ID is public and safe to expose in frontend code
- The Client Secret is kept secure in Cloudflare environment variables
- Users can sign in with Google or email/password
- Google accounts are automatically linked to the database

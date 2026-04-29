# Google OAuth Setup Guide for CampusMart

This guide will help you set up Google OAuth authentication for production use.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "CampusMart" (or your preferred name)
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google+ API** (for user profile information)
   - **Google Identity Services** (for authentication)

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have Google Workspace)
3. Fill in the required information:
   - **App name**: CampusMart
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email and any other emails you want to test with)
6. Save and continue

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure the client:
   - **Name**: CampusMart Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:8080` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:8080/auth` (for development)
     - `https://yourdomain.com/auth` (for production)
5. Click "Create"
6. **Copy the Client ID** - you'll need this!

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Google Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   ```

## Step 6: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/auth` in your browser
3. Click "Sign in with Google"
4. Complete the OAuth flow

## Production Deployment

### For Production Domains:

1. Add your production domain to "Authorized JavaScript origins" in Google Cloud Console
2. Update your production environment variables with the same `VITE_GOOGLE_CLIENT_ID`
3. Ensure your domain is HTTPS (required by Google)

### Security Best Practices:

1. **Never expose your Client Secret** in frontend code
2. **Use HTTPS** in production (required by Google)
3. **Regularly rotate credentials** if compromised
4. **Monitor usage** in Google Cloud Console
5. **Set up proper CORS** policies

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Check that your redirect URI exactly matches what's configured in Google Cloud Console
   - Ensure you're using the correct protocol (http vs https)

2. **"origin_mismatch" error**:
   - Verify your domain is added to "Authorized JavaScript origins"
   - Check for typos in the domain name

3. **"access_blocked" error**:
   - Your app might not be verified by Google yet
   - Add test users in the OAuth consent screen
   - Submit for verification if needed for public use

4. **Google Sign-In button not appearing**:
   - Check browser console for JavaScript errors
   - Verify the Google Client ID is correctly set
   - Ensure the Google Identity Services script is loading

### Testing Checklist:

- [ ] Google Client ID is correctly configured
- [ ] OAuth consent screen is properly set up
- [ ] Test users are added (for unverified apps)
- [ ] Authorized origins include your current domain
- [ ] Environment variables are loaded correctly
- [ ] Browser allows third-party cookies
- [ ] No ad blockers interfering with Google services

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Test with different browsers/incognito mode
4. Check Google's [OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)

## Security Notes

- The implementation uses Google Identity Services (the modern approach)
- User data is handled securely and only basic profile information is accessed
- No sensitive data is stored in localStorage beyond what's necessary for the app
- The authentication flow follows Google's recommended security practices
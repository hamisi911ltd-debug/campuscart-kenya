# 🔒 Security Setup Guide

## ⚠️ IMPORTANT: Admin Credentials

The admin credentials are **NOT** stored in the code. They must be set as environment variables in Cloudflare Pages.

## Setting Up Admin Credentials in Cloudflare Pages

### Step 1: Go to Cloudflare Dashboard
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **campusmart-kenya**
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Environment Variables

Add these two variables for **Production**:

| Variable Name | Value |
|--------------|-------|
| `ADMIN_EMAIL` | `campusmart.care@gmail.com` |
| `ADMIN_PASSWORD` | `LUCYISOKORE@2026` |

**Also add for Preview (optional):**
- Check "Also apply to Preview" if you want the same credentials for preview deployments

### Step 3: Save and Redeploy

1. Click **"Save"**
2. Go to **Deployments** tab
3. Click **"Retry deployment"** on the latest deployment
   - OR push a new commit to trigger automatic deployment

## Local Development

For local development, create a `.env.local` file (already in .gitignore):

```bash
VITE_ADMIN_EMAIL=campusmart.care@gmail.com
VITE_ADMIN_PASSWORD=LUCYISOKORE@2026
```

**Never commit this file to Git!**

## Security Best Practices

✅ **DO:**
- Store credentials in environment variables
- Use strong, unique passwords
- Rotate passwords regularly
- Use HTTPS only
- Enable 2FA on your Cloudflare account

❌ **DON'T:**
- Hardcode credentials in source code
- Commit `.env.local` or `.env` files
- Share credentials in chat/email
- Use simple passwords
- Reuse passwords across services

## Verifying Setup

After setting environment variables in Cloudflare:

1. Visit: `https://admin.campusmart.co.ke/admin/login`
2. Enter email: `campusmart.care@gmail.com`
3. Enter password: `LUCYISOKORE@2026`
4. You should be able to log in successfully

If login fails, check:
- Environment variables are set correctly in Cloudflare
- Latest deployment has completed
- No typos in email/password

## Changing Credentials

To change admin credentials:

1. Update environment variables in Cloudflare Pages
2. Redeploy the application
3. Update your local `.env.local` file (if using)

## Need Help?

If you encounter issues:
- Check Cloudflare Pages deployment logs
- Verify environment variables are set
- Ensure you're accessing via `admin.campusmart.co.ke`

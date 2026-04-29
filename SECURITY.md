# 🔒 Security Configuration

## ⚠️ IMPORTANT: Exposed Secrets Remediation

If you received a GitGuardian alert, follow these steps immediately:

### 1. Rotate ALL Exposed Credentials

The following secrets were exposed and must be changed:

#### A. Admin Password
The admin password was hardcoded in source code.

#### B. Clerk API Keys
Clerk publishable and secret keys were committed to `.env.local`.

**Action Required**: Rotate these credentials immediately!

### 2. Change Admin Password

1. **Create/Update `.env.local` file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Set NEW secure credentials** in `.env.local`:
   ```env
   VITE_ADMIN_EMAIL=campusmart.care@gmail.com
   VITE_ADMIN_PASSWORD=YOUR_NEW_SECURE_PASSWORD_HERE
   ```

3. **Use a strong password**:
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Don't reuse the old exposed password

### 3. Rotate Clerk API Keys (if using Clerk)

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com/
2. **Navigate to**: Your App → API Keys
3. **Regenerate keys**:
   - Click "Regenerate" for both Publishable and Secret keys
   - Copy the new keys
4. **Update `.env.local`**:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_NEW_KEY_HERE
   CLERK_SECRET_KEY=sk_test_NEW_KEY_HERE
   ```
5. **Delete old keys** from Clerk dashboard

### 4. Verify .env.local is Ignored

Ensure `.env.local` is in `.gitignore` (it already is):
```bash
git check-ignore .env.local
# Should output: .env.local
```

### 5. Update Cloudflare Environment Variables

If already deployed to Cloudflare:

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click **Settings** → **Environment variables**
3. Add/Update:
   ```
   VITE_ADMIN_EMAIL = campusmart.care@gmail.com
   VITE_ADMIN_PASSWORD = YOUR_NEW_SECURE_PASSWORD
   ```
4. Redeploy the site

### 6. Verify the Fix

1. **Local testing**:
   ```bash
   npm run dev
   ```
   - Go to http://localhost:8080/admin/login
   - Try logging in with your NEW password from `.env.local`

2. **Production testing**:
   - Go to your deployed site `/admin/login`
   - Login with the password you set in Cloudflare environment variables

## 🔐 Security Best Practices

### Never Commit Secrets

❌ **DON'T**:
- Hardcode passwords in source code
- Commit `.env.local` or `.env.production`
- Share credentials in documentation
- Push secrets to public repositories

✅ **DO**:
- Use environment variables
- Keep `.env.local` in `.gitignore`
- Use `.env.example` as a template (no real values)
- Rotate passwords if exposed
- Use different passwords for dev/staging/production

### Environment Files

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `.env.example` | Template with placeholder values | ✅ Yes |
| `.env.local` | Local development secrets | ❌ No |
| `.env.production` | Production secrets | ❌ No |

### Admin Access

- Admin credentials are now loaded from environment variables
- Default fallback is empty password (will fail login)
- You MUST set `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` in:
  - `.env.local` for local development
  - Cloudflare environment variables for production

## 📞 Security Contact

If you discover a security vulnerability:
- **Email**: campusmart.care@gmail.com
- **Subject**: "Security Issue - CampusMart"
- Do not disclose publicly until fixed

## 🔄 Password Rotation Schedule

Recommended password changes:
- **Immediately**: After any exposure/leak
- **Quarterly**: Every 3 months for production
- **After team changes**: When admin access changes

## ✅ Security Checklist

Before deploying:
- [ ] `.env.local` created with secure password
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets in source code
- [ ] Cloudflare environment variables set
- [ ] Old exposed password is NOT used
- [ ] Admin login tested with new password
- [ ] GitGuardian alerts resolved

---

**Last Updated**: April 29, 2026  
**Status**: Secrets removed from codebase, environment variables implemented

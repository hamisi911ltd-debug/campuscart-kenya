# ⚠️ IMPORTANT: Cloudflare Pages Setup Instructions

## Issue: Wrangler Deploy Error

Cloudflare is trying to deploy as a **Worker** instead of **Pages**. This is wrong.

## Solution: Configure Cloudflare Pages Correctly

### Step 1: Go to Cloudflare Dashboard
1. Visit: https://dash.cloudflare.com/
2. Click **Pages** in sidebar

### Step 2: Create/Update Project

If creating new:
- Click **Create a project**
- Click **Connect to Git**
- Select `campuscart-kenya` repository
- Click **Begin setup**

If updating existing:
- Click on your project
- Go to **Settings**

### Step 3: Configure Build Settings (CRITICAL!)

**Settings → Builds & deployments → Build configurations**

Set these values:

```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: / (leave blank)
```

**⚠️ IMPORTANT**: Do NOT set a "Deploy command"! Leave it empty!

### Step 4: Add Environment Variables

**Settings → Environment variables**

Add these:
```
VITE_ADMIN_EMAIL = campusmart.care@gmail.com
VITE_ADMIN_PASSWORD = 911Hamisigakweli.
```

### Step 5: Save and Deploy

1. Click **Save and Deploy**
2. Wait for build to complete (should take 2-5 minutes)
3. You should see: ✓ Deployment successful

### Step 6: Verify

Visit your site:
- **URL**: `https://campusmart-kenya.pages.dev`
- **Admin**: `https://campusmart-kenya.pages.dev/admin/login`

---

## If You Already Have a Project

1. Go to your Pages project
2. Click **Settings**
3. Go to **Builds & deployments**
4. Check:
   - Build command: `npm run build`
   - Output directory: `dist`
   - **Deploy command: LEAVE EMPTY** (this is the issue!)
5. Click **Save**
6. Go to **Deployments** tab
7. Click **Retry deployment** on latest build

---

## Why This Matters

- **Cloudflare Pages**: Static site hosting (what we want)
- **Cloudflare Workers**: Serverless functions (not what we want)

The deploy command was trying to use Wrangler (Workers CLI), which is wrong for Pages.

---

## Expected Success

After fixing, you should see:
```
✓ Build command completed
✓ Deployment successful
```

NOT:
```
Executing user deploy command: npx wrangler deploy
```

---

**Follow these steps and your site will deploy successfully!** 🚀

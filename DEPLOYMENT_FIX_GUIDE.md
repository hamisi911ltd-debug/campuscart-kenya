# 🚀 Cloudflare Pages Deployment Fix Guide

## Current Issue
Data is not being saved to the D1 database in production, even though:
- ✅ API endpoints are accessible
- ✅ Database tables exist
- ✅ Code is correct
- ❌ Database bindings may not be properly configured in Cloudflare Pages

## Root Cause
**The D1 database binding must be configured in the Cloudflare Pages dashboard**, not just in `wrangler.toml`. The `wrangler.toml` file is used for local development with `wrangler pages dev`, but production deployments need the binding configured in the dashboard.

---

## 🔧 Step-by-Step Fix

### Step 1: Configure D1 Binding in Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click on your project: **campusmart-kenya** (or **campuscart-kenya**)
4. Go to **Settings** tab
5. Scroll down to **Functions** section
6. Click **D1 database bindings** → **Add binding**
7. Configure:
   - **Variable name**: `DB` (must match exactly)
   - **D1 database**: Select `campusmart` from dropdown
8. Click **Save**

### Step 2: Configure R2 Binding in Cloudflare Dashboard

1. In the same **Functions** section
2. Click **R2 bucket bindings** → **Add binding**
3. Configure:
   - **Variable name**: `STORAGE` (must match exactly)
   - **R2 bucket**: Select `campusmart-storage` from dropdown
4. Click **Save**

### Step 3: Verify Database Schema

Run this command to ensure all tables exist:

```bash
npx wrangler d1 execute campusmart --remote --file=DATABASE_SCHEMA.sql
```

### Step 4: Test the Bindings

After configuring the bindings, visit these URLs to test:

1. **Test API Debug**: https://campusmart-kenya.pages.dev/test-api-debug.html
2. **Test Products API**: https://campusmart-kenya.pages.dev/api/products
3. **Test Registration**: Use the app's registration form

### Step 5: Check Cloudflare Functions Logs

1. In Cloudflare Dashboard → Your Project
2. Go to **Functions** tab
3. Click **Real-time logs**
4. Try registering a user or posting a product
5. Watch for errors in real-time

---

## 🧪 Testing Checklist

After configuring bindings, test in this order:

- [ ] Visit `/api/products` - should return `[]` (empty array)
- [ ] Register a new user account
- [ ] Check if user appears in database: `npx wrangler d1 execute campusmart --remote --command "SELECT * FROM users"`
- [ ] Post a product
- [ ] Check if product appears: `npx wrangler d1 execute campusmart --remote --command "SELECT * FROM products"`
- [ ] Visit `/api/products` - should now show your product

---

## 🔍 Common Issues

### Issue: "DB binding not found"
**Solution**: The binding name in the dashboard must be exactly `DB` (case-sensitive)

### Issue: "Database not found"
**Solution**: Make sure you selected the correct database (`campusmart`) in the binding configuration

### Issue: "Table doesn't exist"
**Solution**: Run the schema migration command from Step 3

### Issue: Changes not reflecting
**Solution**: 
1. Bindings require a new deployment to take effect
2. After saving bindings, trigger a new deployment:
   - Go to **Deployments** tab
   - Click **Retry deployment** on the latest deployment
   - OR push a new commit to trigger automatic deployment

---

## 📊 Verify Database State

Check what's currently in your database:

```bash
# Check users
npx wrangler d1 execute campusmart --remote --command "SELECT id, email, full_name, created_at FROM users"

# Check products
npx wrangler d1 execute campusmart --remote --command "SELECT id, title, category, price, seller_id, created_at FROM products"

# Check all tables
npx wrangler d1 execute campusmart --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 🎯 Expected Behavior After Fix

1. **Registration**: Users can create accounts → Data saved to `users` table
2. **Login**: Users can log in with their credentials
3. **Post Product**: Sellers can post products → Data saved to `products` table
4. **View Products**: All users can see posted products from database
5. **Images**: Images uploaded to R2 and URLs stored in database

---

## 🚨 Important Notes

- **Bindings are environment-specific**: You need to configure them separately for production
- **wrangler.toml is for local dev**: It doesn't automatically configure production bindings
- **Redeploy after binding changes**: Changes to bindings require a new deployment
- **Case-sensitive**: Binding names must match exactly (`DB` not `db`)

---

## 📞 Next Steps

1. Configure the bindings in Cloudflare Dashboard (Steps 1-2)
2. Trigger a new deployment (push a commit or retry deployment)
3. Test using the checklist above
4. If still not working, check the Functions logs for specific errors

The database and R2 storage are ready - they just need to be connected to your Pages Functions via the dashboard bindings!

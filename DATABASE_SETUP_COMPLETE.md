# 🎯 Complete Database Setup Guide

## Current Status

✅ **Code is ready** - All API endpoints are created and pushed to GitHub
✅ **Configuration is ready** - wrangler.toml has D1 and R2 bindings
❌ **Database schema NOT run yet** - This is why products aren't saving

## 🚨 The Problem

Your products aren't being saved because the **database tables don't exist yet**. The D1 database exists, but it's empty - no tables have been created.

## ✅ The Solution (3 Simple Steps)

### Step 1: Run the Database Schema

**Option A: Using the setup script (Recommended)**

For Windows (PowerShell or CMD):
```bash
setup-database.bat
```

For Mac/Linux:
```bash
chmod +x setup-database.sh
./setup-database.sh
```

**Option B: Manual command**

```bash
npx wrangler d1 execute campusmart --file=./DATABASE_SCHEMA.sql --remote
```

This creates all the tables:
- ✅ users
- ✅ products
- ✅ product_reviews
- ✅ cart_items
- ✅ orders
- ✅ order_items
- ✅ favorites
- ✅ advertisements
- ✅ notifications
- ✅ messages
- ✅ user_settings
- ✅ seller_stats
- ✅ categories

### Step 2: Verify Tables Were Created

```bash
npx wrangler d1 execute campusmart --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

You should see a list of all the tables above.

### Step 3: Test the API

**Option A: Use the test page**

1. Open `test-api.html` in your browser
2. Click "Test GET /api/products" - should return empty array `[]`
3. Click "Test POST /api/products" - should create a test product
4. Click "Test GET /api/products" again - should show the product you just created

**Option B: Use curl**

```bash
# Test GET (should return empty array initially)
curl https://campusmart-kenya.pages.dev/api/products

# Test POST (create a product)
curl -X POST https://campusmart-kenya.pages.dev/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "seller_id": "test@student.uon.ac.ke",
    "title": "Test Product",
    "description": "Testing the API",
    "category": "electronics",
    "price": 1000,
    "quantity_available": 1
  }'

# Test GET again (should show the product)
curl https://campusmart-kenya.pages.dev/api/products
```

## 🎉 Success Indicators

After running the schema, you should be able to:

1. ✅ Post a product from the website
2. ✅ See the product appear immediately on the home page
3. ✅ Refresh the page and still see the product
4. ✅ Other users can see your products
5. ✅ Images display correctly (from R2, not base64)

## 🔍 Troubleshooting

### Error: "no such table: products"

**Cause**: Database schema hasn't been run yet
**Solution**: Run Step 1 above

### Error: "DB is not defined"

**Cause**: D1 binding not configured in Cloudflare Pages
**Solution**: 
1. Go to Cloudflare Dashboard → Pages → campusmart-kenya
2. Settings → Functions → D1 Database Bindings
3. Add binding: Variable name = `DB`, Database = `campusmart`

### Error: "STORAGE is not defined"

**Cause**: R2 binding not configured
**Solution**:
1. Create R2 bucket: `npx wrangler r2 bucket create campusmart-storage`
2. Go to Cloudflare Dashboard → Pages → campusmart-kenya
3. Settings → Functions → R2 Bucket Bindings
4. Add binding: Variable name = `STORAGE`, Bucket = `campusmart-storage`

### Products still not saving after schema is run

**Check 1**: Verify the database ID in wrangler.toml matches your actual database

```bash
# List your databases
npx wrangler d1 list

# Compare the ID with the one in wrangler.toml
# They should match exactly
```

**Check 2**: Check Cloudflare Functions logs

1. Go to Cloudflare Dashboard → Pages → campusmart-kenya
2. Click "Functions" → "Logs"
3. Try posting a product
4. Look for error messages in the logs

**Check 3**: Test the API directly

Open browser console (F12) and run:

```javascript
// Test POST
fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seller_id: 'test@example.com',
    title: 'Test Product',
    description: 'Test',
    category: 'electronics',
    price: 1000,
    quantity_available: 1
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## 📊 Database Schema Overview

The schema creates a complete e-commerce database with:

### Core Tables
- **users**: User accounts and profiles
- **products**: Product listings with images, prices, location
- **product_reviews**: Ratings and reviews for products
- **categories**: Product categories

### Shopping Tables
- **cart_items**: Shopping cart items
- **orders**: Order records
- **order_items**: Individual items in each order
- **favorites**: User's favorite products

### Communication Tables
- **messages**: Direct messages between users
- **notifications**: System notifications

### Admin Tables
- **advertisements**: Admin-managed ads
- **seller_stats**: Seller performance metrics
- **user_settings**: User preferences

### Indexes
All tables have proper indexes for fast queries on:
- User lookups (email, ID)
- Product searches (category, location, availability)
- Order tracking (buyer, seller, status)
- Message threads (sender, receiver)

## 🚀 Next Steps After Setup

1. **Test posting a product** from the website
2. **Verify it appears** on the home page
3. **Check the image** displays correctly
4. **Refresh the page** - product should still be there
5. **Open in incognito** - product should be visible to everyone

## 📞 Quick Reference Commands

```bash
# List databases
npx wrangler d1 list

# Run schema (CREATE TABLES)
npx wrangler d1 execute campusmart --file=./DATABASE_SCHEMA.sql --remote

# Check tables exist
npx wrangler d1 execute campusmart --command="SELECT name FROM sqlite_master WHERE type='table';" --remote

# Count products
npx wrangler d1 execute campusmart --command="SELECT COUNT(*) as count FROM products;" --remote

# View all products
npx wrangler d1 execute campusmart --command="SELECT * FROM products LIMIT 10;" --remote

# Delete all products (for testing)
npx wrangler d1 execute campusmart --command="DELETE FROM products;" --remote

# List R2 buckets
npx wrangler r2 bucket list

# Create R2 bucket
npx wrangler r2 bucket create campusmart-storage
```

---

## 🎯 TL;DR - Just Run This

```bash
# 1. Create tables
npx wrangler d1 execute campusmart --file=./DATABASE_SCHEMA.sql --remote

# 2. Verify tables exist
npx wrangler d1 execute campusmart --command="SELECT name FROM sqlite_master WHERE type='table';" --remote

# 3. Test the API
# Open test-api.html in your browser and click the test buttons
```

That's it! After running these commands, your database will be ready and products will save correctly. 🎉

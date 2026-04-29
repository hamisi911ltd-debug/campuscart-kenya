# 🗄️ Database Setup Guide

## Quick Start

1. **Choose your database**: PostgreSQL, MySQL, or SQLite
2. **Run the schema**: `DATABASE_SCHEMA.sql`
3. **Connect to your app**: Update `.env.local`

## Step 1: Run the Schema

### PostgreSQL
```bash
psql -U your_username -d campusmart < DATABASE_SCHEMA.sql
```

### MySQL
```bash
mysql -u your_username -p campusmart < DATABASE_SCHEMA.sql
```

### SQLite
```bash
sqlite3 campusmart.db < DATABASE_SCHEMA.sql
```

## Step 2: Add Database Connection

Update `.env.local`:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/campusmart
# or
DATABASE_URL=mysql://user:password@localhost:3306/campusmart
```

## Tables Created

- ✅ users (authentication & profiles)
- ✅ products (marketplace items)
- ✅ product_reviews (ratings & comments)
- ✅ cart_items (shopping cart)
- ✅ orders (purchase history)
- ✅ order_items (order details)
- ✅ favorites (wishlist)
- ✅ advertisements (homepage ads)
- ✅ notifications (user alerts)
- ✅ messages (buyer-seller chat)
- ✅ user_settings (preferences)
- ✅ seller_stats (seller analytics)
- ✅ categories (product categories)

## Done! 🎉

Your database is ready. Now integrate with your backend API.

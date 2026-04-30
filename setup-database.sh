#!/bin/bash

# CampusMart Database Setup Script
# This script helps you set up the D1 database for production

echo "🚀 CampusMart Database Setup"
echo "=============================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm install -g wrangler"
    echo ""
    exit 1
fi

echo "✅ Wrangler CLI found"
echo ""

# Step 1: List existing databases
echo "📋 Step 1: Checking existing D1 databases..."
echo ""
wrangler d1 list
echo ""

# Step 2: Ask if user wants to create database
read -p "Does 'campusmart' database exist in the list above? (y/n): " db_exists

if [ "$db_exists" != "y" ]; then
    echo ""
    echo "Creating new D1 database 'campusmart'..."
    wrangler d1 create campusmart
    echo ""
    echo "⚠️  IMPORTANT: Copy the database_id from above and update it in wrangler.toml"
    echo ""
    read -p "Press Enter after you've updated wrangler.toml..."
fi

# Step 3: Run the schema
echo ""
echo "📝 Step 2: Running database schema..."
echo ""
echo "This will create all tables (users, products, orders, etc.)"
echo ""
read -p "Press Enter to continue..."

wrangler d1 execute campusmart --file=./DATABASE_SCHEMA.sql --remote

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema executed successfully!"
else
    echo ""
    echo "❌ Error executing schema. Check the error message above."
    exit 1
fi

# Step 4: Verify tables were created
echo ""
echo "🔍 Step 3: Verifying tables were created..."
echo ""
wrangler d1 execute campusmart --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" --remote

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify R2 bucket exists: wrangler r2 bucket list"
echo "2. If not, create it: wrangler r2 bucket create campusmart-storage"
echo "3. Deploy your site: npm run build && npx wrangler pages deploy dist"
echo "4. Test the API using test-api.html"
echo ""

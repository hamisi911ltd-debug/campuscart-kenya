#!/bin/bash

# Script to run database migration for original_price and ratings

echo "🔄 Running database migration..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Run the migration
echo "📦 Adding original_price column and updating ratings..."
wrangler d1 execute campusmart-db --file=migrations/add_original_price_and_ratings.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Changes applied:"
    echo "  ✅ Added original_price column"
    echo "  ✅ Set original_price 15-35% above current price"
    echo "  ✅ Updated ratings to 3.5-4.9 range"
    echo "  ✅ Updated review counts to 3-49 range"
    echo ""
    echo "Next steps:"
    echo "1. Deploy the updated code to Cloudflare Pages"
    echo "2. Products will now show discounts and ratings"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    echo ""
    echo "Alternative: Run migration manually in Cloudflare Dashboard"
    echo "1. Go to Cloudflare Dashboard → D1"
    echo "2. Select 'campusmart-db'"
    echo "3. Go to Console tab"
    echo "4. Copy/paste contents of migrations/add_original_price_and_ratings.sql"
fi

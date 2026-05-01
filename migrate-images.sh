#!/bin/bash

# Migration script to update D1 database for base64 image storage

echo "🔄 Updating CampusMart database for base64 image storage..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Run the migration
echo "📦 Running migration on D1 database..."
wrangler d1 execute campusmart-db --file=migrations/001_update_image_columns.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test image upload on /sell page"
    echo "2. Verify images display correctly"
    echo "3. Deploy to production"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    echo ""
    echo "Alternative: Run migration manually in Cloudflare Dashboard"
    echo "1. Go to Cloudflare Dashboard → D1"
    echo "2. Select 'campusmart-db'"
    echo "3. Go to Console tab"
    echo "4. Copy/paste contents of migrations/001_update_image_columns.sql"
fi

#!/bin/bash

# CampusMart Deployment Script with Cache Busting
# Ensures immediate updates across all devices

echo "🚀 Starting CampusMart deployment with cache busting..."

# Update version in package.json
echo "📝 Updating version..."
npm version patch --no-git-tag-version

# Build the project
echo "🔨 Building project..."
npm run build

# Add cache-busting timestamp to built files
echo "⏰ Adding cache-busting timestamps..."
TIMESTAMP=$(date +%s)
find dist -name "*.js" -o -name "*.css" | while read file; do
    # Add timestamp comment to files
    echo "/* Cache-Bust: $TIMESTAMP */" >> "$file"
done

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=campusmart-kenya

# Clear Cloudflare cache
echo "🧹 Clearing Cloudflare cache..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}' || echo "⚠️ Cache clear failed - manual clear may be needed"

echo "✅ Deployment complete!"
echo "🔄 Changes should appear on all devices within 5 minutes"
echo "📱 Mobile users may need to refresh their browser once"

# Instructions for users
echo ""
echo "📋 User Instructions:"
echo "1. Mobile users: Pull down to refresh in browser"
echo "2. Desktop users: Ctrl+F5 or Cmd+Shift+R"
echo "3. PWA users: Close and reopen the app"
echo ""
echo "🎯 New features deployed:"
echo "- Mobile-optimized lucky code system"
echo "- Real product images in notifications"
echo "- Enhanced mobile responsiveness"
echo "- Automatic database table creation"
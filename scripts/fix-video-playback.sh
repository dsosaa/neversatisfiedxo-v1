#!/bin/bash

# Fix Video Playback Issues - Environment Configuration
# This script fixes the Cloudflare Stream video playback issues

set -e

echo "🎥 Fixing Video Playback Issues..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Set the correct Cloudflare customer code
export NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE="d6a71f77965f2f32d7f3ebb03869b8d6"

echo "✅ Setting Cloudflare Stream customer code: $NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE"

# Update docker-compose.yml with the environment variable
if grep -q "NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE" docker-compose.yml; then
    echo "✅ Environment variable already exists in docker-compose.yml"
else
    echo "📝 Adding Cloudflare Stream customer code to docker-compose.yml..."
    
    # Add the environment variable to the web service
    sed -i.bak '/environment:/a\
      - NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=d6a71f77965f2f32d7f3ebb03869b8d6' docker-compose.yml
    
    echo "✅ Added environment variable to docker-compose.yml"
fi

# Rebuild the web container with the new environment variable
echo "🔨 Rebuilding web container with updated environment..."
docker compose build web --no-cache

echo "🚀 Restarting services..."
docker compose down
docker compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Test the video API
echo "🧪 Testing video API..."
if curl -s "http://localhost:3000/api/trailers/4" | jq -e '.cf_video_uid' > /dev/null; then
    echo "✅ Video API is working"
else
    echo "❌ Video API test failed"
    exit 1
fi

# Test Cloudflare Stream iframe URL
echo "🧪 Testing Cloudflare Stream iframe URL..."
VIDEO_UID=$(curl -s "http://localhost:3000/api/trailers/4" | jq -r '.cf_video_uid')
if curl -s "https://iframe.videodelivery.net/$VIDEO_UID" | grep -q "Stream"; then
    echo "✅ Cloudflare Stream iframe URL is accessible"
else
    echo "❌ Cloudflare Stream iframe URL test failed"
    exit 1
fi

echo ""
echo "🎉 Video playback fix completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Visit http://localhost:3000/video/4 to test video playback"
echo "2. Check browser console for any Cloudflare Player debug messages"
echo "3. If issues persist, check the Cloudflare Stream dashboard for video availability"
echo ""
echo "🔧 Debug information:"
echo "- Video UID: $VIDEO_UID"
echo "- Customer Code: $NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE"
echo "- Iframe URL: https://iframe.videodelivery.net/$VIDEO_UID"

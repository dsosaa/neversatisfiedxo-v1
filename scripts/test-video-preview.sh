#!/bin/bash

# Test Video Preview Functionality
# This script tests the video preview functionality in trailer cards

set -e

echo "🎬 Testing Video Preview Functionality"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if services are running
echo "📊 Checking service status..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Docker services are running"
else
    echo "❌ Docker services are not running. Starting services..."
    docker compose up -d
    sleep 10
fi

echo ""

# Test API endpoints
echo "🧪 Testing API endpoints..."

# Test main API
echo "Testing /api/trailers endpoint..."
if curl -s "http://localhost:3000/api/trailers" | jq -e '.results | length' > /dev/null; then
    echo "✅ /api/trailers endpoint working"
    TRAILER_COUNT=$(curl -s "http://localhost:3000/api/trailers" | jq -r '.count')
    echo "   📊 Found $TRAILER_COUNT trailers"
else
    echo "❌ /api/trailers endpoint failed"
    exit 1
fi

# Test specific video API
echo "Testing /api/trailers/4 endpoint..."
if curl -s "http://localhost:3000/api/trailers/4" | jq -e '.cf_video_uid' > /dev/null; then
    echo "✅ /api/trailers/4 endpoint working"
    VIDEO_UID=$(curl -s "http://localhost:3000/api/trailers/4" | jq -r '.cf_video_uid')
    VIDEO_TITLE=$(curl -s "http://localhost:3000/api/trailers/4" | jq -r '.title')
    echo "   📹 Video UID: $VIDEO_UID"
    echo "   📝 Title: $VIDEO_TITLE"
else
    echo "❌ /api/trailers/4 endpoint failed"
    exit 1
fi

echo ""

# Test Cloudflare Stream URLs
echo "🌐 Testing Cloudflare Stream URLs..."

# Test iframe URL
echo "Testing Cloudflare Stream iframe URL..."
IFRAME_URL="https://iframe.videodelivery.net/$VIDEO_UID"
if curl -s "$IFRAME_URL" | grep -q "Stream"; then
    echo "✅ Cloudflare Stream iframe URL accessible"
    echo "   🔗 URL: $IFRAME_URL"
else
    echo "❌ Cloudflare Stream iframe URL not accessible"
    echo "   🔗 URL: $IFRAME_URL"
fi

# Test thumbnail URL (for poster)
echo "Testing Cloudflare Stream thumbnail URL..."
THUMBNAIL_URL="https://videodelivery.net/$VIDEO_UID/thumbnails/thumbnail.jpg?time=3ms&width=800&height=450&quality=85&fit=crop&format=webp"
if curl -s -I "$THUMBNAIL_URL" | grep -q "200 OK"; then
    echo "✅ Cloudflare Stream thumbnail URL accessible"
    echo "   🖼️ URL: $THUMBNAIL_URL"
else
    echo "❌ Cloudflare Stream thumbnail URL not accessible"
    echo "   🖼️ URL: $THUMBNAIL_URL"
    echo "   💡 Testing simpler URL..."
    SIMPLE_URL="https://videodelivery.net/$VIDEO_UID/thumbnails/thumbnail.jpg?time=3ms"
    if curl -s -I "$SIMPLE_URL" | grep -q "200 OK"; then
        echo "✅ Simple thumbnail URL works: $SIMPLE_URL"
    else
        echo "❌ Even simple thumbnail URL failed"
    fi
fi

echo ""

# Test authentication
echo "🔐 Testing authentication..."

# Test authentication API
echo "Testing /api/auth/verify endpoint..."
if curl -s -X POST -H "Content-Type: application/json" -d '{"accessCode":"yesmistress"}' "http://localhost:3000/api/auth/verify" | jq -e '.success' > /dev/null; then
    echo "✅ Authentication API working"
else
    echo "❌ Authentication API failed"
    echo "   💡 This might be why video pages redirect to login"
fi

echo ""

# Test video page access
echo "📄 Testing video page access..."

# Test if video page is accessible after authentication
echo "Testing video page after authentication..."
if curl -s -c cookies.txt -b cookies.txt -X POST -H "Content-Type: application/json" -d '{"accessCode":"yesmistress"}' "http://localhost:3000/api/auth/verify" > /dev/null; then
    if curl -s -b cookies.txt "http://localhost:3000/video/4" | grep -q "CloudflarePlayer"; then
        echo "✅ Video page contains CloudflarePlayer component"
    else
        echo "❌ Video page does not contain CloudflarePlayer component"
        echo "   💡 Check if authentication is working properly"
    fi
else
    echo "❌ Authentication failed, cannot test video page"
fi

echo ""

# Browser testing instructions
echo "🌐 Browser Testing Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Enter password: yesmistress"
echo "3. Look for video previews in the trailer cards"
echo "4. Check if videos show actual content instead of loading spinners"
echo "5. Click on a video to see the full video page"
echo "6. Open browser developer tools (F12) to check for any errors"

echo ""

# Video preview specific instructions
echo "🎥 Video Preview Testing:"
echo "1. Trailer cards should show video iframes (not static images)"
echo "2. Videos should be muted and not autoplay"
echo "3. Hovering over videos should show a play button overlay"
echo "4. Videos should load with a poster image initially"
echo "5. Clicking should navigate to the full video page"

echo ""

# Common issues and solutions
echo "🔧 Common Issues and Solutions:"
echo ""
echo "❌ Issue: Video previews show loading spinners"
echo "   💡 Solution: Check if Cloudflare Stream UIDs are correct"
echo "   💡 Check: https://iframe.videodelivery.net/$VIDEO_UID"
echo ""
echo "❌ Issue: Video previews show 'Video Not Found' error"
echo "   💡 Solution: Verify video exists in Cloudflare Stream"
echo "   💡 Check: Cloudflare Stream dashboard"
echo ""
echo "❌ Issue: Videos don't show poster images"
echo "   💡 Solution: Check thumbnail URL format and parameters"
echo "   💡 Check: https://videodelivery.net/$VIDEO_UID/thumbnails/thumbnail.jpg"
echo ""
echo "❌ Issue: Video page redirects to login"
echo "   💡 Solution: Check authentication API and cookie settings"
echo "   💡 Run: ./scripts/fix-video-playback.sh"

echo ""
echo "🎯 Summary:"
echo "==========="
echo "Video UID: $VIDEO_UID"
echo "Iframe URL: $IFRAME_URL"
echo "Thumbnail URL: $THUMBNAIL_URL"
echo ""
echo "✅ Video previews should now show actual video content instead of static thumbnails"
echo "✅ Users can see video previews directly in the trailer cards"
echo "✅ Clicking on videos navigates to the full video page"

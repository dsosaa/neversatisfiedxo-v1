#!/bin/bash

# Video Playback Diagnostic Script
# This script helps diagnose video playback issues

set -e

echo "🔍 Video Playback Diagnostic Tool"
echo "================================="
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

# Test thumbnail URL
echo "Testing Cloudflare Stream thumbnail URL..."
THUMBNAIL_URL="https://videodelivery.net/$VIDEO_UID/thumbnails/thumbnail.jpg"
if curl -s -I "$THUMBNAIL_URL" | grep -q "200 OK"; then
    echo "✅ Cloudflare Stream thumbnail URL accessible"
    echo "   🖼️ URL: $THUMBNAIL_URL"
else
    echo "❌ Cloudflare Stream thumbnail URL not accessible"
    echo "   🖼️ URL: $THUMBNAIL_URL"
fi

echo ""

# Check environment variables
echo "🔧 Checking environment variables..."

# Check if customer code is set
if docker compose exec web printenv NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE 2>/dev/null | grep -q "d6a71f77965f2f32d7f3ebb03869b8d6"; then
    echo "✅ NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE is set correctly"
else
    echo "❌ NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE is not set or incorrect"
    echo "   💡 Run: ./scripts/fix-video-playback.sh"
fi

echo ""

# Test video page
echo "📄 Testing video page..."
if curl -s "http://localhost:3000/video/4" | grep -q "CloudflarePlayer"; then
    echo "✅ Video page contains CloudflarePlayer component"
else
    echo "❌ Video page does not contain CloudflarePlayer component"
fi

echo ""

# Browser testing instructions
echo "🌐 Browser Testing Instructions:"
echo "1. Open http://localhost:3000/video/4 in your browser"
echo "2. Open browser developer tools (F12)"
echo "3. Check the Console tab for any error messages"
echo "4. Look for Cloudflare Player debug messages starting with '🔧'"
echo "5. Check the Network tab for failed requests to Cloudflare domains"

echo ""

# Common issues and solutions
echo "🔧 Common Issues and Solutions:"
echo ""
echo "❌ Issue: Video shows loading spinner but never loads"
echo "   💡 Solution: Check if NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE is set"
echo "   💡 Run: ./scripts/fix-video-playback.sh"
echo ""
echo "❌ Issue: Video shows 'Video Not Found' error"
echo "   💡 Solution: Check if the video UID exists in Cloudflare Stream"
echo "   💡 Check: https://iframe.videodelivery.net/$VIDEO_UID"
echo ""
echo "❌ Issue: CORS errors in browser console"
echo "   💡 Solution: Check if Cloudflare Stream domain is allowed in CSP"
echo "   💡 Check: next.config.ts security headers"
echo ""
echo "❌ Issue: Video loads but doesn't play"
echo "   💡 Solution: Check browser autoplay policies"
echo "   💡 Try: Click the play button manually"

echo ""
echo "🎯 Summary:"
echo "==========="
echo "Video UID: $VIDEO_UID"
echo "Iframe URL: $IFRAME_URL"
echo "Thumbnail URL: $THUMBNAIL_URL"
echo ""
echo "If all tests pass but videos still don't work in the browser:"
echo "1. Clear browser cache and cookies"
echo "2. Try a different browser or incognito mode"
echo "3. Check browser console for JavaScript errors"
echo "4. Verify Cloudflare Stream account has the video uploaded"

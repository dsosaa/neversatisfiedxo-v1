#!/bin/bash
# Test website functionality after nginx and SSL setup
# This script validates the complete authentication and gallery access flow

set -euo pipefail

DOMAIN="videos.neversatisfiedxo.com"
TEMP_COOKIES="/tmp/test_cookies.txt"
PASSWORD="yesmistress"

echo "🧪 Testing website functionality for https://$DOMAIN"

# Function to check HTTP status
check_status() {
    local url="$1"
    local expected="$2"
    local description="$3"
    
    echo -n "Testing $description... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
    
    if [ "$status" = "$expected" ]; then
        echo "✅ Pass (HTTP $status)"
        return 0
    else
        echo "❌ Fail (HTTP $status, expected $expected)"
        return 1
    fi
}

# Function to test with detailed output
test_request() {
    local url="$1"
    local description="$2"
    
    echo "🔍 Testing $description:"
    echo "URL: $url"
    
    response=$(curl -s -I "$url" --max-time 10 || echo "Connection failed")
    echo "Response:"
    echo "$response"
    echo ""
}

# Clean up previous cookies
rm -f "$TEMP_COOKIES"

echo "🌐 Basic connectivity tests:"

# Test 1: Domain resolution and SSL
test_request "https://$DOMAIN" "SSL certificate and domain resolution"

# Test 2: Authentication page
check_status "https://$DOMAIN/enter" "200" "Authentication page"

# Test 3: Health endpoint  
check_status "https://$DOMAIN/api/health" "200" "Health endpoint"

# Test 4: Authentication API
echo "🔐 Testing authentication flow:"
echo "POST https://$DOMAIN/api/gate with password"

auth_response=$(curl -s -X POST "https://$DOMAIN/api/gate" \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"$PASSWORD\"}" \
    -c "$TEMP_COOKIES" \
    -w "HTTPSTATUS:%{http_code}" \
    --max-time 10 || echo "HTTPSTATUS:000")

auth_status=$(echo "$auth_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
auth_body=$(echo "$auth_response" | sed 's/HTTPSTATUS:[0-9]*$//')

echo "Status: $auth_status"
echo "Response: $auth_body"

if [ "$auth_status" = "200" ]; then
    echo "✅ Authentication successful"
    
    # Check if cookies were set
    if [ -f "$TEMP_COOKIES" ] && grep -q "nsx_gate" "$TEMP_COOKIES"; then
        echo "✅ Authentication cookie set"
        echo "Cookie details:"
        grep "nsx_gate" "$TEMP_COOKIES"
    else
        echo "❌ Authentication cookie not found"
    fi
    
    # Test 5: Gallery access with authentication
    echo "🎬 Testing gallery access with authentication:"
    
    gallery_response=$(curl -s "https://$DOMAIN/" \
        -b "$TEMP_COOKIES" \
        -w "HTTPSTATUS:%{http_code}" \
        --max-time 10 || echo "HTTPSTATUS:000")
    
    gallery_status=$(echo "$gallery_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    gallery_body=$(echo "$gallery_response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$gallery_status" = "200" ]; then
        if echo "$gallery_body" | grep -q "neversatisfiedxo"; then
            echo "✅ Gallery access successful - content loaded"
        else
            echo "❌ Gallery accessed but content may not be loading correctly"
            echo "Response preview:"
            echo "$gallery_body" | head -10
        fi
    else
        echo "❌ Gallery access failed (HTTP $gallery_status)"
    fi
    
else
    echo "❌ Authentication failed"
fi

# Test 6: API endpoints
echo "📡 Testing API endpoints:"
check_status "https://$DOMAIN/api/trailers/" "200" "Trailers API"

# Test 7: Static assets
echo "📁 Testing static assets:"
check_status "https://$DOMAIN/_next/static/chunks/main.js" "200" "Next.js static assets" || true
check_status "https://$DOMAIN/favicon.ico" "200" "Favicon" || true

# Test 8: Admin interface
echo "🔧 Testing admin interface:"
check_status "https://$DOMAIN/admin/" "200" "Admin interface" || echo "⚠️ Admin may require authentication"

echo ""
echo "🏁 Test Summary:"
echo "Domain: https://$DOMAIN"

if [ -f "$TEMP_COOKIES" ]; then
    echo "Authentication: ✅ Working"
else
    echo "Authentication: ❌ Failed"
fi

# Clean up
rm -f "$TEMP_COOKIES"

echo ""
echo "🎯 Manual verification steps:"
echo "1. Visit: https://$DOMAIN/enter"
echo "2. Enter password: $PASSWORD"
echo "3. Verify you can access the gallery"
echo "4. Check video playback functionality"
echo ""
echo "🔍 If issues persist, check:"
echo "- nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "- SSL certificate: sudo certbot certificates"
echo "- Docker containers: docker compose ps"
echo ""
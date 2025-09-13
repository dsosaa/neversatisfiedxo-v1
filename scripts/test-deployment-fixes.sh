#!/bin/bash
# Deployment Fixes Validation Script
# Tests all the fixes implemented to prevent regression in future deployments

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-videos.neversatisfiedxo.com}"
TIMEOUT=30
TEMP_COOKIES="/tmp/deployment_test_cookies.txt"

# Test results tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  neversatisfiedxo Deployment Validation${NC}"
    echo -e "${BLUE}  Domain: $DOMAIN${NC}"
    echo -e "${BLUE}  Date: $(date)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "\n${BLUE}Test $TESTS_RUN: $test_name${NC}"
    
    if eval "$test_command"; then
        print_success "$test_name passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "$test_name failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Basic SSL and domain accessibility
test_ssl_accessibility() {
    print_info "Testing SSL certificate and domain accessibility..."
    
    local response
    response=$(curl -I "https://$DOMAIN/enter" --max-time $TIMEOUT --silent --write-out "HTTP_CODE:%{http_code}\n" || echo "FAILED")
    
    if echo "$response" | grep -q "HTTP_CODE:200\|HTTP_CODE:307"; then
        if echo "$response" | grep -q "strict-transport-security"; then
            print_success "SSL certificate and HSTS headers working"
            return 0
        else
            print_warning "SSL working but HSTS headers missing"
            return 1
        fi
    else
        print_error "Domain not accessible or SSL issues"
        return 1
    fi
}

# Test 2: Authentication flow
test_authentication_flow() {
    print_info "Testing authentication flow..."
    
    # Remove any existing cookies
    rm -f "$TEMP_COOKIES"
    
    local auth_response
    auth_response=$(curl -X POST "https://$DOMAIN/api/gate" \
        -H "Content-Type: application/json" \
        -d '{"password": "yesmistress"}' \
        --cookie-jar "$TEMP_COOKIES" \
        --max-time $TIMEOUT \
        --silent \
        --write-out "HTTP_CODE:%{http_code}\n" || echo "FAILED")
    
    if echo "$auth_response" | grep -q "HTTP_CODE:200"; then
        if echo "$auth_response" | grep -q '"success":true'; then
            print_success "Authentication endpoint working"
            return 0
        else
            print_error "Authentication failed - invalid response"
            return 1
        fi
    else
        print_error "Authentication endpoint not accessible"
        return 1
    fi
}

# Test 3: Gallery access after authentication
test_gallery_access() {
    print_info "Testing gallery access with authentication..."
    
    if [[ ! -f "$TEMP_COOKIES" ]]; then
        print_error "No authentication cookies found - run authentication test first"
        return 1
    fi
    
    local gallery_response
    gallery_response=$(curl -s "https://$DOMAIN/" \
        --cookie "$TEMP_COOKIES" \
        --max-time $TIMEOUT || echo "FAILED")
    
    if echo "$gallery_response" | grep -q "neversatisfiedxo"; then
        print_success "Gallery accessible with authentication"
        return 0
    else
        print_error "Gallery not accessible or authentication failed"
        return 1
    fi
}

# Test 4: Next.js Image Optimization
test_nextjs_image_optimization() {
    print_info "Testing Next.js image optimization routing..."
    
    local image_response
    image_response=$(curl -I "https://$DOMAIN/_next/image?url=/neversatisfiedxo-logo.png&w=200&q=75" \
        --max-time $TIMEOUT \
        --silent \
        --write-out "HTTP_CODE:%{http_code}\n" || echo "FAILED")
    
    if echo "$image_response" | grep -q "HTTP_CODE:200"; then
        print_success "Next.js image optimization working"
        return 0
    elif echo "$image_response" | grep -q "HTTP_CODE:400"; then
        print_warning "Image optimization returning 400 - may need container restart"
        return 1
    else
        print_error "Image optimization not working"
        return 1
    fi
}

# Test 5: Cloudflare Environment Variables
test_cloudflare_env_vars() {
    print_info "Testing Cloudflare environment variables on test page..."
    
    if [[ ! -f "$TEMP_COOKIES" ]]; then
        print_warning "No authentication cookies - testing without authentication"
        return 1
    fi
    
    local test_page_response
    test_page_response=$(curl -s "https://$DOMAIN/test-video" \
        --cookie "$TEMP_COOKIES" \
        --max-time $TIMEOUT || echo "FAILED")
    
    if echo "$test_page_response" | grep -q "d6a71f77965f2f32d7f3ebb03869b8d6"; then
        print_success "Cloudflare customer code accessible on client side"
        return 0
    else
        print_error "Cloudflare customer code not accessible - container may need restart"
        return 1
    fi
}

# Test 6: Video Player Functionality  
test_video_player_functionality() {
    print_info "Testing video player configuration..."
    
    if [[ ! -f "$TEMP_COOKIES" ]]; then
        print_warning "No authentication cookies - cannot test video player"
        return 1
    fi
    
    local test_page_response
    test_page_response=$(curl -s "https://$DOMAIN/test-video" \
        --cookie "$TEMP_COOKIES" \
        --max-time $TIMEOUT || echo "FAILED")
    
    # Check that the page doesn't contain the error message
    if echo "$test_page_response" | grep -q "Missing Cloudflare customer code"; then
        print_error "Video player still showing configuration error"
        return 1
    elif echo "$test_page_response" | grep -q "NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE"; then
        print_success "Video player configuration appears correct"
        return 0
    else
        print_warning "Cannot determine video player status"
        return 1
    fi
}

# Test 7: Health Endpoints
test_health_endpoints() {
    print_info "Testing application health endpoints..."
    
    local health_response
    health_response=$(curl -s "https://$DOMAIN/api/health" \
        --max-time $TIMEOUT || echo "FAILED")
    
    if echo "$health_response" | grep -q '"status":"healthy"'; then
        print_success "Application health endpoint working"
        return 0
    else
        print_error "Health endpoint not responding correctly"
        return 1
    fi
}

# Test 8: Static Asset Loading
test_static_assets() {
    print_info "Testing static asset loading..."
    
    local static_response
    static_response=$(curl -I "https://$DOMAIN/_next/static/chunks/" \
        --max-time $TIMEOUT \
        --silent \
        --write-out "HTTP_CODE:%{http_code}\n" 2>/dev/null || echo "HTTP_CODE:000")
    
    if echo "$static_response" | grep -q "HTTP_CODE:200\|HTTP_CODE:403"; then
        print_success "Static asset routing working"
        return 0
    else
        print_warning "Static asset routing may need attention"
        return 1
    fi
}

# Test 9: Nginx Configuration Completeness
test_nginx_configuration() {
    print_info "Testing nginx configuration completeness..."
    
    local errors=0
    
    # Test various route types
    local routes=(
        "/api/health:200"
        "/api/gate:405"  # Should reject GET requests
        "/_next/static/:403"  # Directory listing disabled
        "/favicon.ico:200"
        "/robots.txt:200"
    )
    
    for route_test in "${routes[@]}"; do
        local route="${route_test%:*}"
        local expected_code="${route_test#*:}"
        
        local response_code
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN$route" --max-time 10 || echo "000")
        
        if [[ "$response_code" == "$expected_code" ]]; then
            print_info "  Route $route: $response_code ✅"
        else
            print_warning "  Route $route: expected $expected_code, got $response_code"
            errors=$((errors + 1))
        fi
    done
    
    if [[ $errors -eq 0 ]]; then
        print_success "Nginx routing configuration correct"
        return 0
    else
        print_warning "Some nginx routes need attention ($errors issues)"
        return 1
    fi
}

# Test 10: Container Health Status
test_container_health() {
    print_info "Testing container health status..."
    
    if ! command -v ssh &> /dev/null; then
        print_warning "SSH not available, skipping container health test"
        return 0
    fi
    
    # This test requires SSH access to the server
    local ssh_host="root@82.180.137.156"
    local ssh_key="$HOME/.ssh/hostinger_deploy_ed25519"
    
    if [[ ! -f "$ssh_key" ]]; then
        print_warning "SSH key not found, skipping container health test"
        return 0
    fi
    
    local container_status
    container_status=$(ssh -i "$ssh_key" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        "$ssh_host" "cd /opt/neversatisfiedxo && docker compose ps --format table" 2>/dev/null || echo "FAILED")
    
    if echo "$container_status" | grep -q "healthy"; then
        print_success "Containers are healthy"
        return 0
    else
        print_warning "Cannot verify container health status"
        return 1
    fi
}

# Main execution
main() {
    print_header
    
    print_info "Starting comprehensive deployment validation..."
    echo ""
    
    # Run all tests
    run_test "SSL Certificate & Domain Access" "test_ssl_accessibility"
    run_test "Authentication Flow" "test_authentication_flow"
    run_test "Gallery Access" "test_gallery_access"
    run_test "Next.js Image Optimization" "test_nextjs_image_optimization"
    run_test "Cloudflare Environment Variables" "test_cloudflare_env_vars"
    run_test "Video Player Configuration" "test_video_player_functionality"
    run_test "Health Endpoints" "test_health_endpoints"
    run_test "Static Asset Loading" "test_static_assets"
    run_test "Nginx Route Configuration" "test_nginx_configuration"
    run_test "Container Health Status" "test_container_health"
    
    # Cleanup
    rm -f "$TEMP_COOKIES"
    
    # Summary
    echo ""
    print_info "========================================="
    print_info "Validation Results:"
    print_info "Tests Run: $TESTS_RUN"
    print_success "Tests Passed: $TESTS_PASSED"
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        print_error "Tests Failed: $TESTS_FAILED"
    fi
    
    local pass_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    print_info "Pass Rate: $pass_rate%"
    
    echo ""
    
    if [[ $pass_rate -ge 90 ]]; then
        print_success "Deployment validation passed! 🚀"
        print_info "All critical functionality is working correctly"
    elif [[ $pass_rate -ge 70 ]]; then
        print_warning "Deployment validation mostly passed ⚠️"
        print_info "Some non-critical issues found - review failed tests above"
    else
        print_error "Deployment validation failed ❌"
        print_info "Critical issues found - fix failed tests before proceeding"
        exit 1
    fi
}

# Handle script arguments
case "${1:-run}" in
    --help|-h)
        echo "Usage: $0 [domain]"
        echo ""
        echo "Tests all deployment fixes to ensure they're working correctly"
        echo ""
        echo "Arguments:"
        echo "  domain    Domain to test (default: videos.neversatisfiedxo.com)"
        echo ""
        echo "Examples:"
        echo "  $0                                    # Test default domain"
        echo "  $0 videos.neversatisfiedxo.com       # Test specific domain"
        ;;
    *)
        main
        ;;
esac
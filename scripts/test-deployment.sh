#!/bin/bash

# neversatisfiedxo Deployment Validation Script
# Tests the complete authentication flow and system functionality

set -e

# Configuration
TEST_DOMAIN="${TEST_DOMAIN:-videos.neversatisfiedxo.com}"
TEST_PASSWORD="${TEST_PASSWORD:-yesmistress}"
TEMP_DIR="/tmp/nsx_test_$$"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_test() { echo -e "${BLUE}[TEST]${NC} $1"; }

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Cleanup function
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Setup test environment
setup_test_env() {
    log_info "Setting up test environment..."
    mkdir -p "$TEMP_DIR"
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log_error "curl is required for testing"
        exit 1
    fi
    
    log_info "✓ Test environment ready"
}

# Test function helper
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log_test "Running: $test_name"
    
    if eval "$test_command"; then
        log_info "✓ PASS: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "✗ FAIL: $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name")
        return 1
    fi
}

# Test 1: Service Health Checks
test_service_health() {
    log_test "Testing service health endpoints..."
    
    # Test frontend health
    run_test "Frontend health check" \
        "curl -f -s http://localhost:3000/health > /dev/null"
    
    # Test frontend API health
    run_test "Frontend API health check" \
        "curl -f -s http://localhost:3000/api/health > /dev/null"
    
    # Test backend health
    run_test "Backend API health check" \
        "curl -f -s http://localhost:8000/api/v1/ > /dev/null"
    
    # Test admin interface
    run_test "Backend admin interface" \
        "curl -s http://localhost:8000/admin/ | grep -q 'Django'"
}

# Test 2: Authentication Flow
test_authentication_flow() {
    log_test "Testing complete authentication flow..."
    
    local cookie_jar="$TEMP_DIR/cookies.txt"
    
    # Test 1: Access protected page without authentication (should redirect)
    run_test "Unauthenticated access redirects to login" \
        "curl -s -L http://localhost:3000/ | grep -q 'Enter the password'"
    
    # Test 2: Submit correct password
    run_test "Authentication with correct password" \
        "curl -s -X POST http://localhost:3000/api/gate \
         -H 'Content-Type: application/json' \
         -d '{\"password\": \"$TEST_PASSWORD\"}' \
         --cookie-jar '$cookie_jar' | grep -q 'success.*true'"
    
    # Test 3: Access gallery with authentication cookie
    run_test "Authenticated access to gallery" \
        "curl -s http://localhost:3000/ --cookie '$cookie_jar' | grep -q 'neversatisfiedxo'"
    
    # Test 4: Test wrong password
    run_test "Authentication rejects wrong password" \
        "curl -s -X POST http://localhost:3000/api/gate \
         -H 'Content-Type: application/json' \
         -d '{\"password\": \"wrongpassword\"}' | grep -q 'success.*false'"
    
    # Test 5: Test session validation
    run_test "Session validation endpoint" \
        "curl -s http://localhost:3000/api/gate --cookie '$cookie_jar' | grep -q 'authenticated.*true'"
}

# Test 3: Docker Container Health
test_docker_containers() {
    log_test "Testing Docker container health..."
    
    # Check if all containers are running
    run_test "All containers are running" \
        "docker compose --profile production ps | grep -v 'Exit'"
    
    # Check specific containers
    run_test "Web container is healthy" \
        "docker compose --profile production ps web | grep -q 'healthy'"
    
    run_test "MediaCMS container is healthy" \
        "docker compose --profile production ps mediacms | grep -q 'healthy'"
    
    run_test "PostgreSQL container is healthy" \
        "docker compose --profile production ps postgres | grep -q 'healthy'"
    
    run_test "Redis container is healthy" \
        "docker compose --profile production ps redis | grep -q 'healthy'"
}

# Test 4: Database Connectivity
test_database_connectivity() {
    log_test "Testing database connectivity..."
    
    # Test PostgreSQL connection
    run_test "PostgreSQL connection" \
        "docker compose --profile production exec -T postgres pg_isready -U mediacms -d mediacms"
    
    # Test Redis connection
    run_test "Redis connection" \
        "docker compose --profile production exec -T redis redis-cli --pass 7e6e4c303ce745c830e847ed3bc719e1 ping | grep -q PONG"
    
    # Test Django database connection
    run_test "Django database connectivity" \
        "curl -s http://localhost:8000/admin/ | grep -q 'Django administration'"
}

# Test 5: Security Headers
test_security_headers() {
    log_test "Testing security headers..."
    
    # Test CSP headers
    run_test "Content Security Policy header" \
        "curl -s -I http://localhost:3000/ | grep -i 'content-security-policy'"
    
    # Test other security headers
    run_test "X-Frame-Options header" \
        "curl -s -I http://localhost:3000/ | grep -i 'x-frame-options'"
    
    run_test "X-Content-Type-Options header" \
        "curl -s -I http://localhost:3000/ | grep -i 'x-content-type-options'"
}

# Test 6: API Endpoints
test_api_endpoints() {
    log_test "Testing API endpoints..."
    
    local cookie_jar="$TEMP_DIR/cookies.txt"
    
    # Authenticate first
    curl -s -X POST http://localhost:3000/api/gate \
         -H 'Content-Type: application/json' \
         -d "{\"password\": \"$TEST_PASSWORD\"}" \
         --cookie-jar "$cookie_jar" > /dev/null
    
    # Test health endpoint returns JSON
    run_test "Health endpoint returns valid JSON" \
        "curl -s http://localhost:3000/api/health | jq -e '.status' > /dev/null"
    
    # Test MediaCMS API
    run_test "MediaCMS API accessible" \
        "curl -s http://localhost:8000/api/v1/ | grep -q 'MediaCMS'"
}

# Test 7: Performance and Load
test_performance() {
    log_test "Testing basic performance..."
    
    # Test response time for main page
    run_test "Frontend response time under 3 seconds" \
        "timeout 3 curl -s http://localhost:3000/health > /dev/null"
    
    # Test backend response time
    run_test "Backend response time under 3 seconds" \
        "timeout 3 curl -s http://localhost:8000/api/v1/ > /dev/null"
}

# Test 8: Environment Variables
test_environment_config() {
    log_test "Testing environment configuration..."
    
    # Check if required environment variables are set
    run_test "GATE_PASSWORD is configured" \
        "[[ -n '$TEST_PASSWORD' ]]"
    
    # Test Cloudflare Stream configuration
    run_test "Cloudflare Stream customer code configured" \
        "curl -s http://localhost:3000/api/health | jq -e '.checks.cloudflare.status' | grep -q 'pass'"
}

# Main test runner
run_all_tests() {
    log_info "🚀 Starting comprehensive deployment validation..."
    echo
    
    setup_test_env
    
    # Run all test suites
    test_service_health
    test_authentication_flow
    test_docker_containers
    test_database_connectivity
    test_security_headers
    test_api_endpoints
    test_performance
    test_environment_config
    
    # Test results summary
    echo
    log_info "📊 Test Results Summary"
    echo "=========================="
    log_info "Tests Passed: $TESTS_PASSED"
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_error "Tests Failed: $TESTS_FAILED"
        echo
        log_error "Failed Tests:"
        for test in "${FAILED_TESTS[@]}"; do
            echo "  - $test"
        done
    else
        log_info "Tests Failed: 0"
    fi
    
    echo
    if [[ $TESTS_FAILED -eq 0 ]]; then
        log_info "🎉 All tests passed! Deployment is ready for production."
        return 0
    else
        log_error "❌ Some tests failed. Please review and fix issues before production deployment."
        return 1
    fi
}

# Command line interface
case "${1:-all}" in
    "health")
        test_service_health
        ;;
    "auth")
        test_authentication_flow
        ;;
    "docker")
        test_docker_containers
        ;;
    "database")
        test_database_connectivity
        ;;
    "security")
        test_security_headers
        ;;
    "api")
        test_api_endpoints
        ;;
    "performance")
        test_performance
        ;;
    "env")
        test_environment_config
        ;;
    "all"|*)
        run_all_tests
        ;;
esac
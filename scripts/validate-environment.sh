#!/bin/bash
# Environment Variable Validation Script
# Validates required environment variables for neversatisfiedxo deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script metadata
SCRIPT_VERSION="2.4.0"
LAST_UPDATED="September 12, 2025"

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  neversatisfiedxo Environment Validation${NC}"
    echo -e "${BLUE}  Version: ${SCRIPT_VERSION}${NC}"
    echo -e "${BLUE}  Updated: ${LAST_UPDATED}${NC}"
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

# Track validation results
ERRORS=0
WARNINGS=0

# Function to validate environment variable
validate_env_var() {
    local var_name="$1"
    local description="$2"
    local is_required="${3:-true}"
    local min_length="${4:-1}"
    
    if [[ -z "${!var_name:-}" ]]; then
        if [[ "$is_required" == "true" ]]; then
            print_error "$description ($var_name) is required but not set"
            ERRORS=$((ERRORS + 1))
            return 1
        else
            print_warning "$description ($var_name) is not set (optional)"
            WARNINGS=$((WARNINGS + 1))
            return 0
        fi
    fi
    
    local var_value="${!var_name}"
    if [[ ${#var_value} -lt $min_length ]]; then
        print_error "$description ($var_name) is too short (minimum $min_length characters)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    print_success "$description ($var_name) is valid"
    return 0
}

# Function to validate Cloudflare customer code format
validate_cloudflare_customer_code() {
    local var_name="NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE"
    local var_value="${!var_name:-}"
    
    if [[ -z "$var_value" ]]; then
        print_error "Cloudflare Stream customer code is required but not set"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    # Check if it's 32 characters (standard Cloudflare customer code length)
    if [[ ${#var_value} -ne 32 ]]; then
        print_warning "Cloudflare customer code should be 32 characters (current: ${#var_value})"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check if it contains only valid characters
    if [[ ! "$var_value" =~ ^[a-f0-9]+$ ]]; then
        print_warning "Cloudflare customer code should contain only lowercase letters and numbers"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    print_success "Cloudflare Stream customer code is valid"
    return 0
}

# Function to test environment variable in Docker container
test_container_env_vars() {
    print_info "Testing environment variables in Docker container..."
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not available, skipping container validation"
        return 0
    fi
    
    if docker compose ps web | grep -q "Up"; then
        local customer_code
        customer_code=$(docker compose exec web printenv NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE 2>/dev/null || echo "")
        
        if [[ -n "$customer_code" ]]; then
            print_success "Cloudflare customer code accessible in container: ${customer_code:0:8}...${customer_code: -8}"
        else
            print_error "Cloudflare customer code not accessible in running container"
            print_info "  Try: docker compose restart web"
            ERRORS=$((ERRORS + 1))
        fi
    else
        print_info "Web container not running, skipping container validation"
    fi
}

# Function to validate .env file exists
validate_env_file() {
    if [[ ! -f ".env" ]]; then
        print_error ".env file not found in current directory"
        print_info "  Expected location: $(pwd)/.env"
        print_info "  Copy from .env.production.example and update values"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    print_success ".env file found"
    return 0
}

# Main validation function
main() {
    print_header
    
    # Check if .env file exists
    if ! validate_env_file; then
        exit 1
    fi
    
    # Load environment variables
    if [[ -f ".env" ]]; then
        print_info "Loading environment variables from .env"
        # Export variables from .env file
        set -a
        source .env
        set +a
    fi
    
    print_info "Validating core environment variables..."
    echo ""
    
    # Core application variables
    validate_env_var "DOMAIN_NAME" "Domain name" true 10
    validate_env_var "NEXT_PUBLIC_BASE_URL" "Base URL" true 10
    validate_env_var "NEXT_PUBLIC_SITE_NAME" "Site name" true 5
    validate_env_var "GATE_PASSWORD" "Gallery access password" true 8
    
    echo ""
    print_info "Validating Cloudflare Stream configuration..."
    
    # Cloudflare Stream variables
    validate_cloudflare_customer_code
    validate_env_var "CF_ACCOUNT_ID" "Cloudflare account ID" true 32
    validate_env_var "CF_STREAM_API_TOKEN" "Cloudflare Stream API token" true 20
    validate_env_var "CF_GLOBAL_API_KEY" "Cloudflare Global API key" true 30
    
    echo ""
    print_info "Validating database configuration..."
    
    # Database variables
    validate_env_var "POSTGRES_PASSWORD" "PostgreSQL password" true 16
    validate_env_var "POSTGRES_USER" "PostgreSQL user" true 5
    validate_env_var "POSTGRES_DB" "PostgreSQL database" true 5
    validate_env_var "REDIS_PASSWORD" "Redis password" true 16
    
    echo ""
    print_info "Validating Django configuration..."
    
    # Django variables
    validate_env_var "DJANGO_SECRET_KEY" "Django secret key" true 32
    validate_env_var "MEDIACMS_API_TOKEN" "MediaCMS API token" true 20
    validate_env_var "ALLOWED_HOSTS" "Django allowed hosts" true 10
    
    echo ""
    print_info "Validating optional variables..."
    
    # Optional variables
    validate_env_var "NEXT_PUBLIC_GA_ID" "Google Analytics ID" false
    validate_env_var "NEXT_PUBLIC_HOTJAR_ID" "Hotjar ID" false
    validate_env_var "MONITORING_WEBHOOK_URL" "Monitoring webhook URL" false
    
    # Test container environment if Docker is available
    echo ""
    test_container_env_vars
    
    # Summary
    echo ""
    print_info "========================================="
    print_info "Validation Summary:"
    
    if [[ $ERRORS -eq 0 ]]; then
        print_success "All required environment variables are valid"
    else
        print_error "$ERRORS critical errors found"
    fi
    
    if [[ $WARNINGS -gt 0 ]]; then
        print_warning "$WARNINGS warnings found"
    fi
    
    echo ""
    
    if [[ $ERRORS -eq 0 ]]; then
        print_success "Environment is ready for deployment! 🚀"
        exit 0
    else
        print_error "Fix the errors above before deploying"
        echo ""
        print_info "Quick fixes:"
        echo "  1. Copy .env.production.example to .env"
        echo "  2. Update all placeholder values with real credentials"
        echo "  3. Ensure Cloudflare credentials are from your Stream dashboard"
        echo "  4. Generate secure passwords for databases"
        exit 1
    fi
}

# Run main function
main "$@"
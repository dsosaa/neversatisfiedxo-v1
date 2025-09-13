#!/bin/bash
# Complete Production Deployment with Validation
# Prevents regression of fixed issues through comprehensive validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOMAIN="${1:-videos.neversatisfiedxo.com}"
SSH_KEY="$HOME/.ssh/hostinger_deploy_ed25519"
SSH_HOST="root@82.180.137.156"
REMOTE_PATH="/opt/neversatisfiedxo"

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  neversatisfiedxo Production Deployment${NC}"
    echo -e "${BLUE}  Version: 2.4.1 with Issue Prevention${NC}"
    echo -e "${BLUE}  Domain: $DOMAIN${NC}"
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

print_step() {
    echo -e "\n${BLUE}🚀 $1${NC}"
}

# Validation functions
validate_prerequisites() {
    print_step "Validating prerequisites..."
    
    # Check SSH key
    if [[ ! -f "$SSH_KEY" ]]; then
        print_error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    print_success "SSH key found"
    
    # Check environment variables
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        print_error ".env file not found"
        exit 1
    fi
    print_success ".env file found"
    
    # Run environment validation script
    if [[ -f "$SCRIPT_DIR/validate-environment.sh" ]]; then
        print_info "Running environment validation..."
        if "$SCRIPT_DIR/validate-environment.sh"; then
            print_success "Environment validation passed"
        else
            print_error "Environment validation failed"
            exit 1
        fi
    else
        print_warning "Environment validation script not found"
    fi
}

sync_files() {
    print_step "Syncing files to production server..."
    
    # Sync all files except excluded ones
    rsync -avz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=.next \
        --exclude=.env.local \
        --exclude=*.log \
        --exclude=coverage \
        --exclude=dist \
        --exclude=build \
        --exclude=tmp \
        -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
        "$PROJECT_ROOT/" "$SSH_HOST:$REMOTE_PATH/"
    
    print_success "Files synced to production server"
}

deploy_nginx_configuration() {
    print_step "Deploying nginx configuration..."
    
    # Deploy nginx site configuration
    if [[ -f "$PROJECT_ROOT/config/nginx-site.conf" ]]; then
        scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
            "$PROJECT_ROOT/config/nginx-site.conf" \
            "$SSH_HOST:/etc/nginx/sites-available/$DOMAIN"
        
        # Enable the site
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" \
            "ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN"
        
        # Test nginx configuration
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" \
            "nginx -t"
        
        # Reload nginx
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" \
            "systemctl reload nginx"
        
        print_success "Nginx configuration deployed and activated"
    else
        print_warning "Nginx configuration file not found"
    fi
}

deploy_containers() {
    print_step "Deploying Docker containers..."
    
    # Deploy containers with production configuration
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" \
        "cd $REMOTE_PATH && docker compose -f docker-compose.production.yml down || true"
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" \
        "cd $REMOTE_PATH && docker compose -f docker-compose.production.yml up -d --build"
    
    print_success "Docker containers deployed"
}

wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s -f "https://$DOMAIN/api/health" > /dev/null; then
            print_success "Services are ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        print_info "Waiting for services... ($attempt/$max_attempts)"
        sleep 10
    done
    
    print_warning "Services may not be fully ready, continuing with validation"
}

validate_deployment() {
    print_step "Validating deployment..."
    
    if [[ -f "$SCRIPT_DIR/test-deployment-fixes.sh" ]]; then
        if "$SCRIPT_DIR/test-deployment-fixes.sh" "$DOMAIN"; then
            print_success "Deployment validation passed"
        else
            print_error "Deployment validation failed"
            return 1
        fi
    else
        print_warning "Deployment validation script not found"
        
        # Basic manual validation
        print_info "Running basic validation checks..."
        
        # Test SSL
        if curl -I "https://$DOMAIN/enter" --max-time 30 > /dev/null 2>&1; then
            print_success "SSL and domain accessible"
        else
            print_error "Domain not accessible"
            return 1
        fi
        
        # Test health endpoint
        if curl -s "https://$DOMAIN/api/health" | grep -q '"status":"healthy"'; then
            print_success "Health endpoint working"
        else
            print_error "Health endpoint not working"
            return 1
        fi
    fi
}

fix_common_issues() {
    print_step "Applying preventive fixes..."
    
    # Restart web service to ensure environment variables are loaded
    print_info "Restarting web service to load environment variables..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_HOST" \
        "cd $REMOTE_PATH && docker compose -f docker-compose.production.yml restart web"
    
    # Wait a bit for the service to restart
    sleep 15
    
    print_success "Preventive fixes applied"
}

show_deployment_summary() {
    print_step "Deployment Summary"
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    print_info "Website: https://$DOMAIN"
    print_info "Gallery Access: Password 'yesmistress'"
    print_info "Admin Panel: https://$DOMAIN/admin/"
    echo ""
    
    print_info "Quick verification commands:"
    echo "  curl -I https://$DOMAIN/enter"
    echo "  curl -s https://$DOMAIN/api/health"
    echo ""
    
    print_info "If you encounter issues:"
    echo "  1. Check container status: make production-status"
    echo "  2. View logs: make production-logs"
    echo "  3. Run validation: ./scripts/test-deployment-fixes.sh"
    echo "  4. Check environment variables: make validate-env"
}

# Main deployment process
main() {
    print_header
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Run deployment steps
    validate_prerequisites
    sync_files
    deploy_nginx_configuration
    deploy_containers
    fix_common_issues
    wait_for_services
    
    # Validate deployment
    if validate_deployment; then
        show_deployment_summary
        return 0
    else
        print_error "Deployment validation failed - manual intervention required"
        print_info "Check the logs and run individual test commands"
        return 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    --help|-h)
        echo "Usage: $0 [domain]"
        echo ""
        echo "Complete production deployment with validation and issue prevention"
        echo ""
        echo "Arguments:"
        echo "  domain    Domain to deploy to (default: videos.neversatisfiedxo.com)"
        echo ""
        echo "This script:"
        echo "  1. Validates environment and prerequisites"
        echo "  2. Syncs files to production server"
        echo "  3. Deploys nginx configuration"
        echo "  4. Builds and starts Docker containers"
        echo "  5. Applies preventive fixes for known issues"
        echo "  6. Validates the complete deployment"
        echo ""
        echo "Examples:"
        echo "  $0                                    # Deploy to default domain"
        echo "  $0 videos.neversatisfiedxo.com       # Deploy to specific domain"
        ;;
    deploy|*)
        main
        ;;
esac
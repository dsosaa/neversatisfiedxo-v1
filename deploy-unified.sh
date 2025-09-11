#!/bin/bash

# Unified Deployment Script for V0 Trailer Site
# Handles both development and production deployments
# Usage: ./deploy-unified.sh [dev|prod] [local|remote]

set -e

# Configuration
MODE="${1:-dev}"
TARGET="${2:-local}"
VPS_HOST="82.180.137.156"
VPS_USER="root"
VPS_PATH="/opt/neversatisfiedxo"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy_ed25519"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_deploy() { echo -e "${PURPLE}[DEPLOY]${NC} $1"; }

# Validate parameters
validate_params() {
    if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
        log_error "Invalid mode. Use 'dev' or 'prod'"
        exit 1
    fi
    
    if [[ "$TARGET" != "local" && "$TARGET" != "remote" ]]; then
        log_error "Invalid target. Use 'local' or 'remote'"
        exit 1
    fi
}

# Get the correct compose file
get_compose_file() {
    if [[ "$MODE" == "dev" ]]; then
        echo "docker-compose.dev-unified.yml"
    else
        echo "docker-compose.prod-unified.yml"
    fi
}

# Deploy locally
deploy_local() {
    local compose_file=$(get_compose_file)
    
    log_deploy "Deploying $MODE mode locally..."
    
    # Stop existing containers
    log_step "Stopping existing containers..."
    docker compose -f "$compose_file" down --remove-orphans || true
    
    # Build and start new containers
    log_step "Building and starting containers..."
    DOCKER_BUILDKIT=1 docker compose -f "$compose_file" up -d --build
    
    # Wait for services to be healthy
    log_step "Waiting for services to be healthy..."
    sleep 30
    
    # Check container status
    log_step "Container status:"
    docker compose -f "$compose_file" ps
    
    # Show logs for any errors
    log_step "Checking for errors in logs..."
    docker compose -f "$compose_file" logs --tail=20 web
    docker compose -f "$compose_file" logs --tail=20 mediacms
    
    log_info "Local deployment completed!"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend: http://localhost:8000"
}

# Deploy to remote VPS
deploy_remote() {
    local compose_file=$(get_compose_file)
    
    log_deploy "Deploying $MODE mode to remote VPS..."
    
    # Check SSH key
    if [ ! -f "$SSH_KEY_PATH" ]; then
        log_error "SSH key not found at $SSH_KEY_PATH"
        exit 1
    fi
    
    # Test SSH connection
    log_step "Testing SSH connection..."
    if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Failed to connect to VPS via SSH"
        exit 1
    fi
    
    # Sync files to VPS
    log_step "Syncing files to VPS..."
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.git' \
        --exclude 'venv' \
        --exclude '__pycache__' \
        --exclude '*.log' \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./ "$VPS_USER@$VPS_HOST:$VPS_PATH/"
    
    # Deploy on VPS
    log_step "Deploying containers on VPS..."
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        
        # Stop existing containers
        echo "Stopping existing containers..."
        docker compose -f $compose_file down --remove-orphans || true
        
        # Clean up unused images
        echo "Cleaning up unused Docker images..."
        docker image prune -f || true
        
        # Build and start new containers
        echo "Building and starting containers..."
        DOCKER_BUILDKIT=1 docker compose -f $compose_file up -d --build
        
        # Wait for services to be healthy
        echo "Waiting for services to be healthy..."
        sleep 60
        
        # Check container status
        echo "Container status:"
        docker compose -f $compose_file ps
        
        # Check logs for any errors
        echo "Checking for errors in logs..."
        docker compose -f $compose_file logs --tail=20 web
        docker compose -f $compose_file logs --tail=20 mediacms
EOF
    
    log_info "Remote deployment completed!"
    log_info "Site should be available at: https://videos.neversatisfiedxo.com"
}

# Main function
main() {
    log_deploy "🚀 Unified Deployment Script"
    log_info "Mode: $MODE"
    log_info "Target: $TARGET"
    echo
    
    validate_params
    
    if [[ "$TARGET" == "local" ]]; then
        deploy_local
    else
        deploy_remote
    fi
    
    log_deploy "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"

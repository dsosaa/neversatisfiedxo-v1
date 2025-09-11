#!/bin/bash

# Enhanced deployment script with SSH key support for Hostinger VPS
# Usage: ./deploy-with-ssh.sh

set -e

# Configuration
VPS_HOST="82.180.137.156"
VPS_USER="root"
VPS_PATH="/opt/neversatisfiedxo"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    print_error "SSH key not found at $SSH_KEY_PATH"
    print_status "Please ensure your Hostinger SSH key is properly configured"
    exit 1
fi

# Set SSH key permissions
chmod 600 "$SSH_KEY_PATH"

print_status "Starting deployment to Hostinger VPS..."

# Test SSH connection
print_status "Testing SSH connection to $VPS_HOST..."
if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'"; then
    print_error "Failed to connect to VPS via SSH"
    exit 1
fi
print_success "SSH connection established"

# Build the application locally first
print_status "Building application locally..."
if ! npm run build --prefix apps/web; then
    print_error "Local build failed"
    exit 1
fi
print_success "Local build completed"

# Sync application files to VPS
print_status "Syncing application files to VPS..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'venv' \
    --exclude '__pycache__' \
    -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
    ./ "$VPS_USER@$VPS_HOST:$VPS_PATH/"

print_success "Files synced to VPS"

# Deploy using Docker Compose on VPS
print_status "Deploying containers on VPS..."

ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << EOF
    cd $VPS_PATH
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker compose -f docker-compose.vps.yml down --remove-orphans || true
    
    # Clean up unused images to free space
    echo "Cleaning up unused Docker images..."
    docker image prune -f || true
    
    # Build and start new containers
    echo "Building and starting new containers..."
    DOCKER_BUILDKIT=1 docker compose -f docker-compose.vps.yml up -d --build --remove-orphans
    
    # Wait for services to be healthy
    echo "Waiting for services to be healthy..."
    sleep 30
    
    # Check container status
    echo "Container status:"
    docker compose -f docker-compose.vps.yml ps
    
    # Check logs for any errors
    echo "Checking for errors in logs..."
    docker compose -f docker-compose.vps.yml logs --tail=50 web
EOF

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    print_status "Application should be available at: https://videos.neversatisfiedxo.com"
    
    # Test the deployment
    print_status "Testing deployment..."
    sleep 10
    if curl -f -s "https://videos.neversatisfiedxo.com/api/health" > /dev/null; then
        print_success "Health check passed - application is running!"
    else
        print_warning "Health check failed - please check the logs on the VPS"
    fi
else
    print_error "Deployment failed"
    exit 1
fi

print_success "Deployment script completed!"

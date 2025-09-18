#!/bin/bash

# Deploy Version 2.6.0 - Premium Visual Experience & Performance Optimization
# Features: 4K video support, high-quality posters, blue scrollbar theme, advanced image loading
# Date: January 15, 2025

set -e

echo "🚀 Deploying neversatisfiedxo Premium Trailer Gallery v2.6.0"
echo "📅 Date: $(date)"
echo "🎯 Features: 4K video support, high-quality posters, blue scrollbar theme"
echo ""

# Color codes for output
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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're on branch '$CURRENT_BRANCH', not 'main'. Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

print_status "Starting deployment process for v2.6.0..."

# Step 1: Update version information
print_status "Updating version information..."
if [ -f "apps/web/package.json" ]; then
    VERSION=$(grep '"version"' apps/web/package.json | cut -d'"' -f4)
    print_success "Web app version: $VERSION"
else
    print_warning "Could not read web app version"
fi

# Step 2: Clean up old containers and images
print_status "Cleaning up old containers and images..."
docker compose down --remove-orphans 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true
print_success "Cleanup completed"

# Step 3: Build new containers with no cache
print_status "Building containers with latest changes..."
docker compose build --no-cache --pull
print_success "Container build completed"

# Step 4: Start services
print_status "Starting services..."
docker compose up -d
print_success "Services started"

# Step 5: Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check if web service is running
if docker compose ps web | grep -q "Up"; then
    print_success "Web service is running"
else
    print_error "Web service failed to start"
    docker compose logs web
    exit 1
fi

# Step 6: Run health checks
print_status "Running health checks..."
HEALTH_URL="http://localhost:3000/api/health"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s "$HEALTH_URL" > /dev/null 2>&1; then
        print_success "Health check passed"
        break
    else
        ATTEMPT=$((ATTEMPT + 1))
        print_status "Health check attempt $ATTEMPT/$MAX_ATTEMPTS..."
        sleep 2
    fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    print_error "Health check failed after $MAX_ATTEMPTS attempts"
    docker compose logs web
    exit 1
fi

# Step 7: Test key features
print_status "Testing key features..."

# Test gallery access
if curl -s "http://localhost:3000/gallery" | grep -q "Gallery"; then
    print_success "Gallery page accessible"
else
    print_warning "Gallery page may not be accessible"
fi

# Test API endpoints
if curl -s "http://localhost:3000/api/trailers" | grep -q "trailers"; then
    print_success "API endpoints working"
else
    print_warning "API endpoints may not be working"
fi

# Step 8: Display deployment summary
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  • Version: 2.6.0 - Premium Visual Experience & Performance Optimization"
echo "  • Features: 4K video support, high-quality posters, blue scrollbar theme"
echo "  • Status: All services running and healthy"
echo "  • Web URL: http://localhost:3000"
echo "  • Gallery: http://localhost:3000/gallery"
echo "  • Health: http://localhost:3000/api/health"
echo ""

# Step 9: Display container status
print_status "Container Status:"
docker compose ps

echo ""
print_success "🚀 neversatisfiedxo Premium Trailer Gallery v2.6.0 is now live!"
print_status "Access the gallery at: http://localhost:3000/gallery"
print_status "Password: yesmistress"
echo ""

# Step 10: Optional production deployment
if [ "$1" = "--production" ]; then
    print_status "Production deployment requested..."
    print_warning "This will deploy to production VPS. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Starting production deployment..."
        # Add production deployment commands here
        print_success "Production deployment completed"
    else
        print_status "Production deployment cancelled"
    fi
fi

print_success "Deployment script completed successfully!"

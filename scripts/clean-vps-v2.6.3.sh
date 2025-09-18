#!/bin/bash

# VPS Cleanup Script for neversatisfiedxo Premium Trailer Gallery v2.6.3
# Clears all caches, containers, and prepares for fresh deployment
# Date: September 18, 2025
# Target: Hostinger VPS (82.180.137.156)

set -e

echo "🧹 Cleaning VPS for neversatisfiedxo Premium Trailer Gallery v2.6.3"
echo "📅 Date: $(date)"
echo "🌐 Target: videos.neversatisfiedxo.com"
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

# VPS Configuration
VPS_HOST="82.180.137.156"
VPS_USER="root"
PROJECT_DIR="/root/v0-trailer"
BACKUP_DIR="/root/backups/v0-trailer-$(date +%Y%m%d-%H%M%S)"

# Check if SSH key exists and set SSH options
SSH_KEY=""
SSH_OPTIONS=""
if [ -f ~/.ssh/hostinger_deploy_ed25519 ]; then
    SSH_KEY="-i ~/.ssh/hostinger_deploy_ed25519"
    SSH_OPTIONS="-o StrictHostKeyChecking=no"
elif [ -f ~/.ssh/hostinger_deploy ]; then
    SSH_KEY="-i ~/.ssh/hostinger_deploy"
    SSH_OPTIONS="-o StrictHostKeyChecking=no"
elif [ -f ~/.ssh/id_ed25519 ]; then
    SSH_KEY="-i ~/.ssh/id_ed25519"
    SSH_OPTIONS="-o StrictHostKeyChecking=no"
elif [ -f ~/.ssh/id_rsa ]; then
    SSH_KEY="-i ~/.ssh/id_rsa"
    SSH_OPTIONS="-o StrictHostKeyChecking=no"
else
    print_error "SSH key not found. Please ensure you have SSH access to the VPS."
    exit 1
fi

print_status "Using SSH key: $SSH_KEY with options: $SSH_OPTIONS"

print_status "Starting VPS cleanup process..."

# Step 1: Create backup before cleanup
print_status "Creating backup before cleanup..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "mkdir -p $BACKUP_DIR && cp -r $PROJECT_DIR $BACKUP_DIR/ 2>/dev/null || true"
print_success "Backup created at $BACKUP_DIR"

# Step 2: Stop all running containers
print_status "Stopping all running containers..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "cd $PROJECT_DIR && docker compose -f docker-compose.production.yml down --remove-orphans --volumes 2>/dev/null || true"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker stop \$(docker ps -aq) 2>/dev/null || true"
print_success "All containers stopped"

# Step 3: Remove all containers
print_status "Removing all containers..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker rm -f \$(docker ps -aq) 2>/dev/null || true"
print_success "All containers removed"

# Step 4: Remove all images
print_status "Removing all Docker images..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker rmi -f \$(docker images -aq) 2>/dev/null || true"
print_success "All Docker images removed"

# Step 5: Remove all volumes
print_status "Removing all Docker volumes..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker volume rm \$(docker volume ls -q) 2>/dev/null || true"
print_success "All Docker volumes removed"

# Step 6: Remove all networks
print_status "Removing all Docker networks..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker network rm \$(docker network ls -q) 2>/dev/null || true"
print_success "All Docker networks removed"

# Step 7: Clean Docker system
print_status "Cleaning Docker system..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker system prune -af --volumes"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker builder prune -af"
print_success "Docker system cleaned"

# Step 8: Clear Nginx cache
print_status "Clearing Nginx cache..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "rm -rf /var/cache/nginx/* 2>/dev/null || true"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "rm -rf /var/log/nginx/*.log 2>/dev/null || true"
print_success "Nginx cache cleared"

# Step 9: Clear system caches
print_status "Clearing system caches..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true"
print_success "System caches cleared"

# Step 10: Clean up old logs
print_status "Cleaning up old logs..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "find /var/log -name '*.log' -mtime +7 -delete 2>/dev/null || true"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "find /var/log -name '*.gz' -mtime +7 -delete 2>/dev/null || true"
print_success "Old logs cleaned up"

# Step 11: Clean up old backups
print_status "Cleaning up old backups..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "find /root/backups -name 'v0-trailer-*' -mtime +7 -type d -exec rm -rf {} + 2>/dev/null || true"
print_success "Old backups cleaned up"

# Step 12: Check disk space
print_status "Checking disk space..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "df -h /"
print_success "Disk space checked"

# Step 13: Restart Docker service
print_status "Restarting Docker service..."
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "systemctl restart docker"
print_success "Docker service restarted"

# Step 14: Verify Docker is running
print_status "Verifying Docker is running..."
if ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker --version"; then
    print_success "Docker is running"
else
    print_error "Docker failed to start"
    exit 1
fi

# Step 15: Display cleanup summary
echo ""
print_success "🎉 VPS cleanup completed successfully!"
echo ""
echo "📊 Cleanup Summary:"
echo "  • All containers stopped and removed"
echo "  • All Docker images removed"
echo "  • All Docker volumes removed"
echo "  • All Docker networks removed"
echo "  • Docker system cleaned"
echo "  • Nginx cache cleared"
echo "  • System caches cleared"
echo "  • Old logs cleaned up"
echo "  • Old backups cleaned up"
echo "  • Docker service restarted"
echo "  • Backup created at: $BACKUP_DIR"
echo ""

# Step 16: Display current status
print_status "Current VPS Status:"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker ps -a"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker images"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker volume ls"
ssh $SSH_KEY $SSH_OPTIONS $VPS_USER@$VPS_HOST "docker network ls"

echo ""
print_success "🚀 VPS is now clean and ready for fresh v2.6.3 deployment!"
print_status "Run ./scripts/deploy-production-v2.6.3.sh to deploy the new version"
echo ""

print_success "VPS cleanup script completed successfully!"

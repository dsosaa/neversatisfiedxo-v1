#!/bin/bash

# VPS Cleanup Script - Complete cleanup of old containers, images, and files
# Usage: ./clean-vps.sh

set -e

# Configuration
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
log_clean() { echo -e "${PURPLE}[CLEAN]${NC} $1"; }

# Check SSH key
check_ssh_key() {
    if [ ! -f "$SSH_KEY_PATH" ]; then
        log_error "SSH key not found at $SSH_KEY_PATH"
        exit 1
    fi
    chmod 600 "$SSH_KEY_PATH"
}

# Test SSH connection
test_ssh_connection() {
    log_step "Testing SSH connection to $VPS_HOST..."
    if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Failed to connect to VPS via SSH"
        exit 1
    fi
    log_info "✓ SSH connection established"
}

# Stop and remove all containers
cleanup_containers() {
    log_clean "Stopping and removing all containers..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << 'EOF'
        echo "=== Stopping all running containers ==="
        docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"
        
        echo "=== Removing all containers ==="
        docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
        
        echo "=== Removing all Docker Compose containers ==="
        # Try to stop all possible compose projects
        for compose_file in docker-compose*.yml; do
            if [ -f "$compose_file" ]; then
                echo "Stopping containers from $compose_file..."
                docker compose -f "$compose_file" down --remove-orphans 2>/dev/null || true
            fi
        done
        
        echo "=== Force removing any remaining containers ==="
        docker container prune -f 2>/dev/null || true
EOF
    
    log_info "✓ All containers stopped and removed"
}

# Remove all Docker images
cleanup_images() {
    log_clean "Removing all Docker images..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << 'EOF'
        echo "=== Removing all Docker images ==="
        docker rmi $(docker images -aq) 2>/dev/null || echo "No images to remove"
        
        echo "=== Removing unused images ==="
        docker image prune -a -f 2>/dev/null || true
        
        echo "=== Removing build cache ==="
        docker builder prune -a -f 2>/dev/null || true
EOF
    
    log_info "✓ All Docker images removed"
}

# Clean up volumes and networks
cleanup_volumes_networks() {
    log_clean "Cleaning up volumes and networks..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << 'EOF'
        echo "=== Removing unused volumes ==="
        docker volume prune -f 2>/dev/null || true
        
        echo "=== Removing unused networks ==="
        docker network prune -f 2>/dev/null || true
        
        echo "=== Removing all custom networks ==="
        docker network ls --format "{{.Name}}" | grep -E "(v0_trailer|neversatisfiedxo)" | xargs -r docker network rm 2>/dev/null || true
EOF
    
    log_info "✓ Volumes and networks cleaned"
}

# Clean up project directory
cleanup_project_directory() {
    log_clean "Cleaning up project directory..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        echo "=== Backing up important files ==="
        if [ -d "$VPS_PATH" ]; then
            # Backup environment files
            mkdir -p /tmp/v0_trailer_backup
            cp $VPS_PATH/.env* /tmp/v0_trailer_backup/ 2>/dev/null || true
            cp $VPS_PATH/docker-compose*.yml /tmp/v0_trailer_backup/ 2>/dev/null || true
            
            echo "=== Removing project directory ==="
            rm -rf $VPS_PATH
        fi
        
        echo "=== Creating fresh project directory ==="
        mkdir -p $VPS_PATH
        chmod 755 $VPS_PATH
EOF
    
    log_info "✓ Project directory cleaned and recreated"
}

# Clean up system caches and temporary files
cleanup_system() {
    log_clean "Cleaning up system caches..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << 'EOF'
        echo "=== Cleaning package cache ==="
        apt clean 2>/dev/null || true
        apt autoclean 2>/dev/null || true
        
        echo "=== Cleaning temporary files ==="
        rm -rf /tmp/docker-* 2>/dev/null || true
        rm -rf /var/tmp/* 2>/dev/null || true
        
        echo "=== Cleaning logs ==="
        journalctl --vacuum-time=1d 2>/dev/null || true
        
        echo "=== Freeing up space ==="
        sync
        echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
EOF
    
    log_info "✓ System caches cleaned"
}

# Verify cleanup
verify_cleanup() {
    log_step "Verifying cleanup..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << 'EOF'
        echo "=== Docker System Status ==="
        echo "Containers:"
        docker ps -a
        echo
        echo "Images:"
        docker images
        echo
        echo "Volumes:"
        docker volume ls
        echo
        echo "Networks:"
        docker network ls
        echo
        echo "=== Disk Usage ==="
        df -h /
        echo
        echo "=== Memory Usage ==="
        free -h
EOF
    
    log_info "✓ Cleanup verification completed"
}

# Main cleanup function
main() {
    log_clean "🧹 Starting VPS cleanup process..."
    echo
    
    check_ssh_key
    test_ssh_connection
    
    # Perform cleanup steps
    cleanup_containers
    cleanup_images
    cleanup_volumes_networks
    cleanup_project_directory
    cleanup_system
    
    # Verify cleanup
    verify_cleanup
    
    log_clean "🎉 VPS cleanup completed successfully!"
    echo
    log_info "VPS is now clean and ready for fresh deployment"
    log_info "Next step: Deploy unified configuration"
}

# Run main function
main "$@"

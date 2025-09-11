#!/bin/bash

# QuickSync SSH Development System
# Syncs local changes to VPS and restarts affected services
# Usage: ./quicksync.sh [service] [action]
# Examples:
#   ./quicksync.sh web sync          # Sync web changes and restart web container
#   ./quicksync.sh mediacms sync     # Sync MediaCMS changes and restart
#   ./quicksync.sh all sync          # Sync all changes and restart all services
#   ./quicksync.sh web logs          # View web container logs
#   ./quicksync.sh status            # Check all container status

set -e

# Configuration
VPS_HOST="82.180.137.156"
VPS_USER="root"
VPS_PATH="/opt/neversatisfiedxo"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy_ed25519"
COMPOSE_FILE="docker-compose.prod-unified.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_sync() { echo -e "${PURPLE}[SYNC]${NC} $1"; }
log_quick() { echo -e "${CYAN}[QUICK]${NC} $1"; }

# Validate parameters
validate_params() {
    local service="$1"
    local action="$2"
    
    if [[ -z "$service" || -z "$action" ]]; then
        if [[ "$service" == "status" ]]; then
            return 0
        fi
        log_error "Usage: $0 [service] [action]"
        log_info "Services: web, mediacms, nginx, postgres, redis, all"
        log_info "Actions: sync, restart, logs, status, shell"
        exit 1
    fi
    
    case "$service" in
        web|mediacms|nginx|postgres|redis|all)
            ;;
        *)
            log_error "Invalid service: $service"
            log_info "Valid services: web, mediacms, nginx, postgres, redis, all"
            exit 1
            ;;
    esac
    
    case "$action" in
        sync|restart|logs|status|shell)
            ;;
        *)
            log_error "Invalid action: $action"
            log_info "Valid actions: sync, restart, logs, status, shell"
            exit 1
            ;;
    esac
}

# Check SSH connection
check_ssh() {
    log_step "Testing SSH connection..."
    if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Failed to connect to VPS via SSH"
        exit 1
    fi
    log_info "✓ SSH connection established"
}

# Sync web application
sync_web() {
    log_sync "Syncing web application..."
    
    # Sync source code
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude 'tsconfig.tsbuildinfo' \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./apps/web/ "$VPS_USER@$VPS_HOST:$VPS_PATH/apps/web/"
    
    # Sync package files
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./apps/web/package*.json "$VPS_USER@$VPS_HOST:$VPS_PATH/apps/web/"
    
    # Sync data directory
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./data/ "$VPS_USER@$VPS_HOST:$VPS_PATH/data/"
    
    log_info "✓ Web application synced"
}

# Sync MediaCMS application
sync_mediacms() {
    log_sync "Syncing MediaCMS application..."
    
    # Sync MediaCMS source code
    rsync -avz --progress \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude '.git' \
        --exclude 'venv' \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./apps/mediacms/ "$VPS_USER@$VPS_HOST:$VPS_PATH/apps/mediacms/"
    
    log_info "✓ MediaCMS application synced"
}

# Sync configuration files
sync_config() {
    log_sync "Syncing configuration files..."
    
    # Sync Docker Compose files
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./docker-compose*.yml "$VPS_USER@$VPS_HOST:$VPS_PATH/"
    
    # Sync Dockerfiles
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./Dockerfile* "$VPS_USER@$VPS_HOST:$VPS_PATH/"
    
    # Sync nginx config
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./config/ "$VPS_USER@$VPS_HOST:$VPS_PATH/config/"
    
    # Sync environment files
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        ./.env* "$VPS_USER@$VPS_HOST:$VPS_PATH/"
    
    log_info "✓ Configuration files synced"
}

# Restart service
restart_service() {
    local service="$1"
    
    log_step "Restarting $service service..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        
        if [[ "$service" == "web" ]]; then
            echo "Rebuilding and restarting web container..."
            docker compose -f $COMPOSE_FILE up -d --build web
        elif [[ "$service" == "mediacms" ]]; then
            echo "Restarting MediaCMS container..."
            docker compose -f $COMPOSE_FILE restart mediacms
        elif [[ "$service" == "nginx" ]]; then
            echo "Restarting nginx container..."
            docker compose -f $COMPOSE_FILE restart nginx
        elif [[ "$service" == "all" ]]; then
            echo "Restarting all services..."
            docker compose -f $COMPOSE_FILE restart
        else
            echo "Restarting $service container..."
            docker compose -f $COMPOSE_FILE restart $service
        fi
        
        echo "Waiting for services to be ready..."
        sleep 10
        
        echo "Container status:"
        docker compose -f $COMPOSE_FILE ps
EOF
    
    log_info "✓ $service service restarted"
}

# Show logs
show_logs() {
    local service="$1"
    
    log_step "Showing $service logs..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        docker compose -f $COMPOSE_FILE logs --tail=50 -f $service
EOF
}

# Show status
show_status() {
    log_step "Checking container status..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        echo "=== Container Status ==="
        docker compose -f $COMPOSE_FILE ps
        echo
        echo "=== Resource Usage ==="
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        echo
        echo "=== Disk Usage ==="
        df -h /
        echo
        echo "=== Memory Usage ==="
        free -h
EOF
}

# Open shell
open_shell() {
    local service="$1"
    
    log_step "Opening shell for $service..."
    
    if [[ "$service" == "all" ]]; then
        log_info "Opening VPS shell..."
        ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST"
    else
        log_info "Opening shell in $service container..."
        ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
            cd $VPS_PATH
            docker compose -f $COMPOSE_FILE exec $service /bin/sh
EOF
    fi
}

# Main sync function
sync_and_restart() {
    local service="$1"
    
    case "$service" in
        web)
            sync_web
            restart_service web
            ;;
        mediacms)
            sync_mediacms
            restart_service mediacms
            ;;
        all)
            sync_web
            sync_mediacms
            sync_config
            restart_service all
            ;;
        *)
            log_error "Sync not supported for service: $service"
            exit 1
            ;;
    esac
}

# Main function
main() {
    local service="$1"
    local action="$2"
    
    log_quick "🚀 QuickSync SSH Development System"
    echo
    
    validate_params "$service" "$action"
    check_ssh
    
    case "$action" in
        sync)
            sync_and_restart "$service"
            ;;
        restart)
            restart_service "$service"
            ;;
        logs)
            show_logs "$service"
            ;;
        status)
            show_status
            ;;
        shell)
            open_shell "$service"
            ;;
    esac
    
    log_quick "🎉 QuickSync operation completed!"
}

# Run main function
main "$@"

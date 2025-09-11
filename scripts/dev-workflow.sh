#!/bin/bash

# Development Workflow Script
# Provides easy commands for VPS development workflow
# Usage: ./dev-workflow.sh [command]
# Commands:
#   start     - Start development with auto-sync
#   stop      - Stop all services
#   restart   - Restart all services
#   status    - Check service status
#   logs      - View logs
#   shell     - Open shell
#   deploy    - Full deployment
#   clean     - Clean up and restart

set -e

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
log_dev() { echo -e "${PURPLE}[DEV]${NC} $1"; }
log_workflow() { echo -e "${CYAN}[WORKFLOW]${NC} $1"; }

# Show usage
show_usage() {
    echo "Development Workflow Script"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  start     - Start development with auto-sync"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  status    - Check service status"
    echo "  logs      - View logs (specify service: web, mediacms, nginx)"
    echo "  shell     - Open shell (specify service: web, mediacms, nginx, all)"
    echo "  deploy    - Full deployment"
    echo "  clean     - Clean up and restart"
    echo "  help      - Show this help"
    echo
    echo "Examples:"
    echo "  $0 start                    # Start development with auto-sync"
    echo "  $0 logs web                 # View web container logs"
    echo "  $0 shell mediacms           # Open shell in MediaCMS container"
    echo "  $0 restart                  # Restart all services"
}

# Start development
start_dev() {
    log_workflow "🚀 Starting Development Workflow"
    echo
    
    # Check if fswatch is available
    if command -v fswatch &> /dev/null; then
        log_info "Starting with auto-sync enabled..."
        log_info "Files will be automatically synced to VPS when changed"
        log_info "Press Ctrl+C to stop"
        echo
        ./scripts/watch-and-sync.sh all
    else
        log_warn "fswatch not installed. Using manual sync mode."
        log_info "Use './scripts/quicksync.sh [service] sync' to sync changes"
        echo
        ./scripts/quicksync.sh all status
    fi
}

# Stop services
stop_services() {
    log_step "Stopping all services..."
    ./scripts/quicksync.sh all restart
    log_info "All services stopped"
}

# Restart services
restart_services() {
    log_step "Restarting all services..."
    ./scripts/quicksync.sh all restart
    log_info "All services restarted"
}

# Check status
check_status() {
    log_step "Checking service status..."
    ./scripts/quicksync.sh status
}

# View logs
view_logs() {
    local service="${1:-all}"
    
    if [[ "$service" == "all" ]]; then
        log_step "Viewing logs for all services..."
        ./scripts/quicksync.sh web logs &
        ./scripts/quicksync.sh mediacms logs &
        ./scripts/quicksync.sh nginx logs &
        wait
    else
        log_step "Viewing logs for $service..."
        ./scripts/quicksync.sh "$service" logs
    fi
}

# Open shell
open_shell() {
    local service="${1:-all}"
    
    log_step "Opening shell for $service..."
    ./scripts/quicksync.sh "$service" shell
}

# Full deployment
full_deploy() {
    log_step "Performing full deployment..."
    ./deploy-unified.sh prod remote
    log_info "Full deployment completed"
}

# Clean and restart
clean_restart() {
    log_step "Cleaning up and restarting..."
    
    # Clean VPS
    ./scripts/clean-vps.sh
    
    # Deploy fresh
    ./deploy-unified.sh prod remote
    
    log_info "Clean restart completed"
}

# Main function
main() {
    local command="$1"
    local service="$2"
    
    case "$command" in
        start)
            start_dev
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs "$service"
            ;;
        shell)
            open_shell "$service"
            ;;
        deploy)
            full_deploy
            ;;
        clean)
            clean_restart
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            echo
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

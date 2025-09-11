#!/bin/bash

# Watch and Sync - Automatic file watching and syncing
# Watches local files for changes and automatically syncs to VPS
# Usage: ./watch-and-sync.sh [service]
# Examples:
#   ./watch-and-sync.sh web      # Watch web files and auto-sync
#   ./watch-and-sync.sh mediacms # Watch MediaCMS files and auto-sync
#   ./watch-and-sync.sh all      # Watch all files and auto-sync

set -e

# Configuration
SERVICE="${1:-web}"
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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_watch() { echo -e "${PURPLE}[WATCH]${NC} $1"; }
log_auto() { echo -e "${CYAN}[AUTO]${NC} $1"; }

# Check if fswatch is installed
check_fswatch() {
    if ! command -v fswatch &> /dev/null; then
        log_error "fswatch is not installed. Please install it first:"
        log_info "  macOS: brew install fswatch"
        log_info "  Ubuntu: apt-get install fswatch"
        log_info "  Or use: ./quicksync.sh [service] sync (manual sync)"
        exit 1
    fi
}

# Sync function
sync_files() {
    local changed_file="$1"
    local service="$2"
    
    log_auto "File changed: $changed_file"
    
    # Determine which service to sync based on file path
    if [[ "$changed_file" == *"/apps/web/"* ]]; then
        log_auto "Syncing web application..."
        ./scripts/quicksync.sh web sync
    elif [[ "$changed_file" == *"/apps/mediacms/"* ]]; then
        log_auto "Syncing MediaCMS application..."
        ./scripts/quicksync.sh mediacms sync
    elif [[ "$changed_file" == *"docker-compose"* ]] || [[ "$changed_file" == *"Dockerfile"* ]] || [[ "$changed_file" == *"config/"* ]]; then
        log_auto "Syncing configuration files..."
        ./scripts/quicksync.sh all sync
    else
        log_auto "Syncing all services..."
        ./scripts/quicksync.sh all sync
    fi
}

# Watch web files
watch_web() {
    log_watch "Watching web application files..."
    
    fswatch -o \
        --exclude='.*' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='*.log' \
        --exclude='tsconfig.tsbuildinfo' \
        ./apps/web/ \
        ./data/ \
        ./config/ \
        ./docker-compose*.yml \
        ./Dockerfile* \
        ./.env* | while read f; do
        sync_files "$f" "web"
    done
}

# Watch MediaCMS files
watch_mediacms() {
    log_watch "Watching MediaCMS application files..."
    
    fswatch -o \
        --exclude='.*' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='venv' \
        ./apps/mediacms/ \
        ./data/ \
        ./config/ \
        ./docker-compose*.yml \
        ./Dockerfile* \
        ./.env* | while read f; do
        sync_files "$f" "mediacms"
    done
}

# Watch all files
watch_all() {
    log_watch "Watching all application files..."
    
    fswatch -o \
        --exclude='.*' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='venv' \
        --exclude='*.log' \
        --exclude='tsconfig.tsbuildinfo' \
        ./apps/ \
        ./data/ \
        ./config/ \
        ./docker-compose*.yml \
        ./Dockerfile* \
        ./.env* | while read f; do
        sync_files "$f" "all"
    done
}

# Main function
main() {
    log_auto "🔍 Watch and Sync - Automatic File Monitoring"
    log_info "Service: $SERVICE"
    log_info "Press Ctrl+C to stop watching"
    echo
    
    check_fswatch
    
    # Initial sync
    log_step "Performing initial sync..."
    ./scripts/quicksync.sh "$SERVICE" sync
    
    # Start watching
    case "$SERVICE" in
        web)
            watch_web
            ;;
        mediacms)
            watch_mediacms
            ;;
        all)
            watch_all
            ;;
        *)
            log_error "Invalid service: $SERVICE"
            log_info "Valid services: web, mediacms, all"
            exit 1
            ;;
    esac
}

# Handle Ctrl+C
trap 'log_info "Stopping file watcher..."; exit 0' INT

# Run main function
main "$@"

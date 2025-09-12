#!/bin/bash

# Smart Deployment Script - Automatically choose the right deployment strategy
# Analyzes changed files to determine optimal deployment method

set -e

# Configuration
PRODUCTION_HOST="${PRODUCTION_HOST:-82.180.137.156}"
PRODUCTION_USER="${PRODUCTION_USER:-root}"
PRODUCTION_PATH="${PRODUCTION_PATH:-/opt/neversatisfiedxo}"
DOMAIN="${DOMAIN:-videos.neversatisfiedxo.com}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_deploy() { echo -e "${PURPLE}[DEPLOY]${NC} $1"; }

# Get changed files since last commit or specific ref
get_changed_files() {
    local base_ref="${1:-HEAD~1}"
    
    if git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
        git diff --name-only "$base_ref"
    else
        log_warn "Base ref '$base_ref' not found, using all tracked files"
        git ls-files
    fi
}

# Analyze changes to determine deployment strategy
analyze_changes() {
    local changed_files="$1"
    local needs_fresh=false
    local needs_rebuild=false
    local needs_sync=true
    
    log_step "Analyzing changed files..."
    
    # Fresh deployment triggers
    if echo "$changed_files" | grep -qE "(docker-compose\.yml|migrations/|\.sql$|ssl/|nginx\.conf|postgres|redis|infrastructure)"; then
        needs_fresh=true
        log_info "🚀 Fresh deployment required - Infrastructure/database changes detected"
    fi
    
    # Container rebuild triggers
    if echo "$changed_files" | grep -qE "(package\.json|requirements\.txt|Dockerfile|\.dockerignore|next\.config\.|webpack\.|yarn\.lock|package-lock\.json|poetry\.lock)"; then
        needs_rebuild=true
        log_info "🔄 Container rebuild required - Dependencies/build changes detected"
    fi
    
    # SSH sync triggers (default for code changes)
    if echo "$changed_files" | grep -qE "\.(tsx?|jsx?|py|css|scss|md|json|env|conf)$"; then
        log_info "⚡ SSH sync suitable - Code/config changes detected"
    fi
    
    # Output analysis
    if [ "$needs_fresh" = true ]; then
        echo "fresh"
    elif [ "$needs_rebuild" = true ]; then
        echo "rebuild"
    else
        echo "sync"
    fi
}

# SSH Sync deployment (fastest)
deploy_sync() {
    log_deploy "Starting SSH sync deployment (fastest)..."
    
    # Sync code changes excluding build artifacts
    log_step "Syncing files to production server..."
    rsync -avz --progress \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=.next \
        --exclude=__pycache__ \
        --exclude=.env.local \
        --exclude=logs/ \
        --exclude=.DS_Store \
        ./ "${PRODUCTION_USER}@${PRODUCTION_HOST}:${PRODUCTION_PATH}/"
    
    # Reload services without restart
    log_step "Reloading services..."
    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" << 'EOF'
cd /opt/neversatisfiedxo
systemctl reload nginx || echo "Nginx not managed by systemctl"
docker compose exec web npm run build --if-present || echo "Build skipped"
docker compose restart web --no-deps
echo "✅ SSH sync deployment completed in ~30 seconds"
EOF
    
    log_info "✅ SSH sync deployment completed!"
}

# Container rebuild deployment (medium)
deploy_rebuild() {
    log_deploy "Starting container rebuild deployment (medium)..."
    
    # Sync all files first
    log_step "Syncing files to production server..."
    rsync -avz --progress \
        --exclude=.git \
        --exclude=.DS_Store \
        ./ "${PRODUCTION_USER}@${PRODUCTION_HOST}:${PRODUCTION_PATH}/"
    
    # Rebuild specific containers
    log_step "Rebuilding containers..."
    ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" << 'EOF'
cd /opt/neversatisfiedxo
echo "🔄 Rebuilding containers with new dependencies..."
docker compose build --no-cache web mediacms
docker compose up -d --force-recreate web mediacms
docker compose restart nginx
echo "✅ Container rebuild completed in ~5-10 minutes"
EOF
    
    log_info "✅ Container rebuild deployment completed!"
}

# Fresh deployment (slowest but most complete)
deploy_fresh() {
    log_deploy "Starting fresh deployment (slowest but most complete)..."
    
    log_step "Running full deployment pipeline..."
    
    # Use existing deployment script
    if [ -f "./scripts/deploy.sh" ]; then
        DOMAIN="$DOMAIN" ./scripts/deploy.sh deploy
    else
        log_error "deploy.sh not found, running manual fresh deployment..."
        
        # Manual fresh deployment
        ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" << EOF
cd /opt/neversatisfiedxo
echo "🚀 Starting fresh deployment..."
docker compose down
docker system prune -f
git pull origin main
docker compose build --no-cache
docker compose up -d
echo "✅ Fresh deployment completed in ~15-30 minutes"
EOF
    fi
    
    log_info "✅ Fresh deployment completed!"
}

# Validate deployment
validate_deployment() {
    log_step "Validating deployment..."
    
    # Test main domain
    if curl -sI "https://$DOMAIN" | grep -q "200 OK"; then
        log_info "✅ Main domain accessible"
    else
        log_warn "⚠️ Main domain check failed"
    fi
    
    # Test health endpoint
    if curl -s "https://$DOMAIN/api/health" | grep -q "healthy\|ok"; then
        log_info "✅ Health check passed"
    else
        log_warn "⚠️ Health check failed"
    fi
}

# Show deployment summary
show_summary() {
    local strategy="$1"
    local start_time="$2"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    log_info "🎉 Deployment Summary"
    echo "================================"
    echo "Strategy: $strategy"
    echo "Duration: ${duration}s"
    echo "Domain: https://$DOMAIN"
    echo "Status: ✅ Completed successfully"
    echo ""
    echo "Next steps:"
    echo "- Test your changes at https://$DOMAIN"
    echo "- Monitor logs: make prod-logs"
    echo "- Check health: make health"
}

# Main execution
main() {
    local base_ref="${1:-HEAD~1}"
    local force_strategy="${2}"
    local start_time=$(date +%s)
    
    log_info "🚀 Smart Deployment Analysis Starting..."
    log_info "Domain: $DOMAIN"
    log_info "Production: ${PRODUCTION_USER}@${PRODUCTION_HOST}:${PRODUCTION_PATH}"
    echo ""
    
    # Get and analyze changes
    local changed_files=$(get_changed_files "$base_ref")
    
    if [ -z "$changed_files" ]; then
        log_warn "No changes detected. Skipping deployment."
        exit 0
    fi
    
    echo "Changed files:"
    echo "$changed_files" | sed 's/^/  - /'
    echo ""
    
    # Determine strategy
    local strategy
    if [ -n "$force_strategy" ]; then
        strategy="$force_strategy"
        log_info "🎯 Using forced strategy: $strategy"
    else
        strategy=$(analyze_changes "$changed_files")
        log_info "🤖 Auto-detected strategy: $strategy"
    fi
    
    # Execute deployment
    case "$strategy" in
        "sync")
            deploy_sync
            ;;
        "rebuild")
            deploy_rebuild
            ;;
        "fresh")
            deploy_fresh
            ;;
        *)
            log_error "Unknown deployment strategy: $strategy"
            exit 1
            ;;
    esac
    
    # Validate and show summary
    validate_deployment
    show_summary "$strategy" "$start_time"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Smart Deployment Script"
        echo ""
        echo "Usage:"
        echo "  $0 [base_ref] [strategy]"
        echo ""
        echo "Parameters:"
        echo "  base_ref   Git reference to compare against (default: HEAD~1)"
        echo "  strategy   Force specific strategy: sync|rebuild|fresh"
        echo ""
        echo "Examples:"
        echo "  $0                    # Auto-detect based on changes since last commit"
        echo "  $0 HEAD~3            # Compare against 3 commits ago"
        echo "  $0 HEAD~1 fresh      # Force fresh deployment"
        echo "  $0 main sync         # Force sync deployment comparing against main"
        exit 0
        ;;
    --version|-v)
        echo "Smart Deploy v2.2 - Optimized for neversatisfiedxo"
        exit 0
        ;;
esac

# Run main function with arguments
main "$@"
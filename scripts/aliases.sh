#!/bin/bash

# QuickSync Aliases for Easy Development
# Source this file to add convenient aliases
# Usage: source scripts/aliases.sh

# QuickSync aliases
alias qs='./scripts/quicksync.sh'
alias qs-web='./scripts/quicksync.sh web'
alias qs-mediacms='./scripts/quicksync.sh mediacms'
alias qs-all='./scripts/quicksync.sh all'

# Development workflow aliases
alias dev='./scripts/dev-workflow.sh'
alias dev-start='./scripts/dev-workflow.sh start'
alias dev-stop='./scripts/dev-workflow.sh stop'
alias dev-restart='./scripts/dev-workflow.sh restart'
alias dev-status='./scripts/dev-workflow.sh status'
alias dev-logs='./scripts/dev-workflow.sh logs'
alias dev-shell='./scripts/dev-workflow.sh shell'
alias dev-deploy='./scripts/dev-workflow.sh deploy'
alias dev-clean='./scripts/dev-workflow.sh clean'

# Watch and sync aliases
alias watch='./scripts/watch-and-sync.sh'
alias watch-web='./scripts/watch-and-sync.sh web'
alias watch-mediacms='./scripts/watch-and-sync.sh mediacms'
alias watch-all='./scripts/watch-and-sync.sh all'

# Common QuickSync commands
alias qs-sync-web='./scripts/quicksync.sh web sync'
alias qs-sync-mediacms='./scripts/quicksync.sh mediacms sync'
alias qs-sync-all='./scripts/quicksync.sh all sync'
alias qs-logs-web='./scripts/quicksync.sh web logs'
alias qs-logs-mediacms='./scripts/quicksync.sh mediacms logs'
alias qs-logs-nginx='./scripts/quicksync.sh nginx logs'
alias qs-shell-web='./scripts/quicksync.sh web shell'
alias qs-shell-mediacms='./scripts/quicksync.sh mediacms shell'
alias qs-shell-vps='./scripts/quicksync.sh all shell'
alias qs-status='./scripts/quicksync.sh status'

echo "🚀 QuickSync aliases loaded!"
echo
echo "Quick Commands:"
echo "  qs-sync-web      - Sync web changes to VPS"
echo "  qs-sync-mediacms - Sync MediaCMS changes to VPS"
echo "  qs-sync-all      - Sync all changes to VPS"
echo "  qs-logs-web      - View web container logs"
echo "  qs-logs-mediacms - View MediaCMS container logs"
echo "  qs-status        - Check all container status"
echo "  qs-shell-web     - Open shell in web container"
echo "  qs-shell-vps     - Open VPS shell"
echo
echo "Development Workflow:"
echo "  dev-start        - Start development with auto-sync"
echo "  dev-status       - Check service status"
echo "  dev-restart      - Restart all services"
echo "  dev-deploy       - Full deployment"
echo
echo "Watch and Sync:"
echo "  watch-web        - Watch web files and auto-sync"
echo "  watch-all        - Watch all files and auto-sync"
echo

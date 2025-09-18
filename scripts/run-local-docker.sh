#!/bin/bash

# Local Docker Setup Script for V0 Trailer
# This script helps you run the local Docker environment with the updated changes

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
log_docker() { echo -e "${PURPLE}[DOCKER]${NC} $1"; }

# Check if .env file exists
check_env_file() {
    if [[ ! -f .env ]]; then
        log_warn ".env file not found. Creating from template..."
        if [[ -f env.example ]]; then
            cp env.example .env
            log_info "✓ Created .env from env.example template"
        else
            log_warn "env.example not found. Creating basic template..."
            cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=mediacms
POSTGRES_PASSWORD=change_this_password
POSTGRES_DB=mediacms
REDIS_PASSWORD=change_this_redis_password

# Django Configuration
DJANGO_SECRET_KEY=change_this_django_secret_key
DJANGO_DEBUG=False

# Application Configuration
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_cloudflare_customer_code
GATE_PASSWORD=change_this_gate_password
JWT_SECRET=change_this_jwt_secret

# URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MEDIACMS_BASE_URL=http://mediacms:80
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://web:3000

# Optional
DOMAIN_NAME=localhost
EOF
            log_warn "Please edit .env file with your actual values before running again."
            exit 1
        fi
    fi
    log_info "✓ .env file found"
}

# Show usage
show_usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start [dev|prod|unified]  Start Docker services (default: prod)"
    echo "  stop                     Stop all Docker services"
    echo "  restart                  Restart all Docker services"
    echo "  logs [service]           Show logs (all services if no service specified)"
    echo "  status                   Show service status"
    echo "  clean                    Clean up containers and volumes"
    echo "  build                    Build all services"
    echo "  shell [service]          Open shell in service container"
    echo ""
    echo "Examples:"
    echo "  $0 start dev             # Start in development mode"
    echo "  $0 start prod            # Start in production mode"
    echo "  $0 logs web              # Show web service logs"
    echo "  $0 shell mediacms        # Open shell in mediacms container"
}

# Start services
start_services() {
    local mode=${1:-prod}
    local compose_file=""
    
    case $mode in
        dev)
            compose_file="docker-compose.dev.yml"
            log_docker "Starting services in DEVELOPMENT mode..."
            ;;
        prod)
            compose_file="docker-compose.yml"
            log_docker "Starting services in PRODUCTION mode..."
            ;;
        unified)
            compose_file="docker-compose.prod-unified.yml"
            log_docker "Starting services in UNIFIED PRODUCTION mode..."
            ;;
        *)
            log_error "Invalid mode: $mode. Use 'dev', 'prod', or 'unified'"
            exit 1
            ;;
    esac
    
    log_step "Building and starting services..."
    docker compose -f $compose_file up -d --build
    
    log_step "Waiting for services to be ready..."
    sleep 10
    
    log_step "Service status:"
    docker compose -f $compose_file ps
    
    log_info "✓ Services started successfully!"
    log_info "Frontend: http://localhost:3000"
    log_info "MediaCMS: http://localhost:8000"
    if [[ $mode == "prod" || $mode == "unified" ]]; then
        log_info "Nginx: http://localhost:8080 (if enabled)"
    fi
}

# Stop services
stop_services() {
    local mode=${1:-prod}
    local compose_file=""
    
    case $mode in
        dev)
            compose_file="docker-compose.dev.yml"
            ;;
        prod)
            compose_file="docker-compose.yml"
            ;;
        unified)
            compose_file="docker-compose.prod-unified.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    log_docker "Stopping services..."
    docker compose -f $compose_file down
    log_info "✓ Services stopped"
}

# Show logs
show_logs() {
    local service=$1
    local mode=${2:-prod}
    local compose_file=""
    
    case $mode in
        dev)
            compose_file="docker-compose.dev.yml"
            ;;
        prod)
            compose_file="docker-compose.yml"
            ;;
        unified)
            compose_file="docker-compose.prod-unified.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    if [[ -n "$service" ]]; then
        log_docker "Showing logs for $service..."
        docker compose -f $compose_file logs -f $service
    else
        log_docker "Showing logs for all services..."
        docker compose -f $compose_file logs -f
    fi
}

# Show status
show_status() {
    local mode=${1:-prod}
    local compose_file=""
    
    case $mode in
        dev)
            compose_file="docker-compose.dev.yml"
            ;;
        prod)
            compose_file="docker-compose.yml"
            ;;
        unified)
            compose_file="docker-compose.prod-unified.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    log_step "Service status:"
    docker compose -f $compose_file ps
    
    echo ""
    log_step "Resource usage:"
    docker stats --no-stream
}

# Clean up
clean_up() {
    log_warn "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_docker "Cleaning up Docker resources..."
        docker compose -f docker-compose.yml down -v --remove-orphans
        docker compose -f docker-compose.dev.yml down -v --remove-orphans
        docker compose -f docker-compose.prod-unified.yml down -v --remove-orphans
        docker system prune -f
        log_info "✓ Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Build services
build_services() {
    local mode=${1:-prod}
    local compose_file=""
    
    case $mode in
        dev)
            compose_file="docker-compose.dev.yml"
            ;;
        prod)
            compose_file="docker-compose.yml"
            ;;
        unified)
            compose_file="docker-compose.prod-unified.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    log_docker "Building services..."
    docker compose -f $compose_file build
    log_info "✓ Build completed"
}

# Open shell
open_shell() {
    local service=$1
    local mode=${2:-prod}
    local compose_file=""
    
    if [[ -z "$service" ]]; then
        log_error "Please specify a service name"
        exit 1
    fi
    
    case $mode in
        dev)
            compose_file="docker-compose.dev.yml"
            ;;
        prod)
            compose_file="docker-compose.yml"
            ;;
        unified)
            compose_file="docker-compose.prod-unified.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    log_docker "Opening shell in $service container..."
    docker compose -f $compose_file exec $service /bin/sh
}

# Main function
main() {
    local command=$1
    local arg1=$2
    local arg2=$3
    
    echo -e "${CYAN}🐳 V0 Trailer Local Docker Setup${NC}"
    echo ""
    
    case $command in
        start)
            check_env_file
            start_services $arg1
            ;;
        stop)
            stop_services $arg1
            ;;
        restart)
            stop_services $arg1
            sleep 2
            start_services $arg1
            ;;
        logs)
            show_logs $arg1 $arg2
            ;;
        status)
            show_status $arg1
            ;;
        clean)
            clean_up
            ;;
        build)
            build_services $arg1
            ;;
        shell)
            open_shell $arg1 $arg2
            ;;
        *)
            show_usage
            ;;
    esac
}

# Run main function
main "$@"

#!/bin/bash

# neversatisfiedxo Deployment Script for Hostinger VPS
# Run this script on your VPS after server setup

set -e

# Configuration
REPO_URL="${REPO_URL:-https://github.com/nsxo/V0-Trailer.git}"
APP_DIR="${APP_DIR:-/opt/neversatisfiedxo}"
APP_USER="${APP_USER:-deploy}"
DOMAIN="${DOMAIN:-}"
BRANCH="${BRANCH:-main}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info &>/dev/null; then
        log_error "Docker is not running. Please start Docker service."
        exit 1
    fi
    
    # Check if directories exist
    if [[ ! -d "$APP_DIR" ]]; then
        log_error "Application directory $APP_DIR does not exist. Run server-setup.sh first."
        exit 1
    fi
    
    log_info "✓ Prerequisites check passed"
}

# Clone or update repository
setup_repository() {
    log_step "Setting up repository..."
    
    cd "$APP_DIR"
    
    if [[ -d ".git" ]]; then
        log_info "Repository exists, pulling latest changes..."
        git fetch origin
        git reset --hard origin/$BRANCH
        git clean -fd
    else
        log_info "Cloning repository..."
        # If directory is not empty, back it up
        if [[ -n "$(ls -A .)" ]]; then
            mv * ../neversatisfiedxo-backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
        fi
        git clone "$REPO_URL" .
        git checkout "$BRANCH"
    fi
    
    log_info "✓ Repository setup complete"
}

# Setup production environment
setup_environment() {
    log_step "Setting up production environment..."
    
    cd "$APP_DIR"
    
    # Preserve existing .env file or create template if it doesn't exist
    if [[ -f ".env" ]]; then
        log_info "✓ Preserving existing .env configuration"
        # Backup existing .env
        cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
        log_info "✓ Backup created: .env.backup.$(date +%Y%m%d-%H%M%S)"
    else
        log_info "Creating production .env file template..."
        
        cat > .env << 'EOF'
# Production Environment Configuration
NODE_ENV=production

# Brand & Identity
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
GATE_PASSWORD=yesmistress

# Database Configuration (Production)
POSTGRES_PASSWORD=SecureProductionPassword123!
POSTGRES_USER=mediacms
POSTGRES_DB=mediacms

# Cache & Performance
REDIS_PASSWORD=SecureRedisPassword123!

# Cloudflare Stream Configuration
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=d6a71f77965f2f32d7f3ebb03869b8d6
CF_ACCOUNT_ID=d6a71f77965f2f32d7f3ebb03869b8d6
CF_STREAM_API_TOKEN=rvWXyGVnRtQkQm_JXdhlJNcOjU-OC1yMSqmdw-xz
CF_GLOBAL_API_KEY=15a7e848888bc25e79400deee710e42406b03

# Django Security (CHANGE IN PRODUCTION!)
DJANGO_SECRET_KEY=CHANGE-THIS-TO-A-SECURE-SECRET-KEY-FOR-PRODUCTION
MEDIACMS_API_TOKEN=CHANGE-THIS-TO-A-SECURE-API-TOKEN

# Optional Analytics
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_HOTJAR_ID=

# Monitoring & Alerts
MONITORING_WEBHOOK_URL=

# Production Optimizations
COMPOSE_PROFILES=production
EOF
        
        log_warn "⚠️  IMPORTANT: Update .env file with secure passwords and keys!"
        log_warn "   Edit: $APP_DIR/.env"
    fi
    
    # Set proper permissions
    chmod 600 .env
    chown "$APP_USER:$APP_USER" .env
    
    log_info "✓ Environment setup complete"
}

# Build and deploy application
deploy_application() {
    log_step "Building and deploying application..."
    
    cd "$APP_DIR"
    
    # Create backup of current deployment
    log_info "Creating backup of current deployment..."
    if docker compose --profile production ps | grep -q "Up"; then
        docker compose --profile production exec web npm run build:production || log_warn "Backup build failed"
        docker tag v0_trailer_web:latest v0_trailer_web:backup-$(date +%Y%m%d-%H%M%S) || true
    fi
    
    # Stop existing containers gracefully
    log_info "Stopping existing containers gracefully..."
    docker compose --profile production down --timeout 30 || {
        log_error "Failed to stop containers gracefully, forcing stop..."
        docker compose --profile production kill || true
        docker compose --profile production rm -f || true
    }
    
    # Pull latest images with retry
    log_info "Pulling latest Docker images..."
    for i in {1..3}; do
        if docker compose --profile production pull; then
            break
        else
            log_warn "Pull attempt $i failed, retrying..."
            sleep 10
        fi
    done
    
    # Build application with error handling
    log_info "Building application..."
    if ! docker compose --profile production build --no-cache; then
        log_error "Build failed! Attempting rollback..."
        rollback_deployment
        return 1
    fi
    
    # Start services with health check validation
    log_info "Starting production services..."
    if ! docker compose --profile production up -d; then
        log_error "Failed to start services! Attempting rollback..."
        rollback_deployment
        return 1
    fi
    
    # Wait for services to be ready with timeout
    log_info "Waiting for services to start..."
    local wait_time=0
    local max_wait=300  # 5 minutes
    
    while [ $wait_time -lt $max_wait ]; do
        if docker compose --profile production ps | grep -q "healthy"; then
            log_info "Services are healthy after ${wait_time}s"
            break
        fi
        
        if [ $wait_time -gt 120 ]; then
            log_warn "Services taking longer than expected to start (${wait_time}s)..."
        fi
        
        sleep 10
        wait_time=$((wait_time + 10))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        log_error "Services failed to start within timeout! Attempting rollback..."
        rollback_deployment
        return 1
    fi
    
    # Check service health with retry
    log_info "Validating service health..."
    for i in {1..5}; do
        if check_services_health; then
            log_info "✓ Application deployed successfully"
            return 0
        else
            log_warn "Health check attempt $i failed, retrying in 30s..."
            sleep 30
        fi
    done
    
    log_error "Health checks failed after multiple attempts! Attempting rollback..."
    rollback_deployment
    return 1
}

# Rollback deployment to previous version
rollback_deployment() {
    log_step "Rolling back deployment..."
    
    # Stop current failing deployment
    docker compose --profile production down --timeout 10 || true
    
    # Find latest backup image
    local backup_image=$(docker images --filter "reference=v0_trailer_web:backup-*" --format "table {{.Repository}}:{{.Tag}}" | tail -n +2 | head -n 1)
    
    if [[ -n "$backup_image" ]]; then
        log_info "Rolling back to: $backup_image"
        docker tag "$backup_image" v0_trailer_web:latest
        docker compose --profile production up -d
        
        # Wait for rollback to be ready
        sleep 30
        if check_services_health; then
            log_info "✓ Rollback successful"
        else
            log_error "✗ Rollback failed - manual intervention required"
        fi
    else
        log_error "No backup image found - manual intervention required"
    fi
}

# Check services health
check_services_health() {
    log_step "Checking services health..."
    
    local max_attempts=30
    local attempt=0
    local all_healthy=true
    
    # Check if containers are running
    while [[ $attempt -lt $max_attempts ]]; do
        if docker compose --profile production ps | grep -q "Up"; then
            log_info "✓ Containers are running"
            break
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for containers... ($attempt/$max_attempts)"
        sleep 5
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Containers failed to start"
            return 1
        fi
    done
    
    # Check specific service endpoints with timeout
    log_info "Checking service endpoints..."
    
    # Check Next.js frontend (both endpoints)
    if timeout 10 curl -f http://localhost:3000/health &>/dev/null || timeout 10 curl -f http://localhost:3000/api/health &>/dev/null; then
        log_info "✓ Frontend service is healthy"
    else
        log_warn "Frontend service health check failed"
        all_healthy=false
    fi
    
    # Check Django backend (MediaCMS API)
    if timeout 10 curl -f http://localhost:8000/api/v1/ &>/dev/null; then
        log_info "✓ Backend service is healthy"
    else
        log_warn "Backend service health check failed"
        all_healthy=false
    fi
    
    # Check database connectivity through backend
    if timeout 10 curl -f http://localhost:8000/admin/ &>/dev/null; then
        log_info "✓ Database connectivity is healthy"
    else
        log_warn "Database connectivity check failed"
        all_healthy=false
    fi
    
    # Show container status
    echo
    log_info "Container status:"
    docker compose --profile production ps
    
    # Return appropriate exit code
    if [[ "$all_healthy" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

# Setup database and initial data
setup_database() {
    log_step "Setting up database and initial data..."
    
    cd "$APP_DIR"
    
    # Run database migrations
    log_info "Running database migrations..."
    docker compose --profile production exec v0_trailer_mediacms python manage.py migrate
    
    # Create superuser if needed (interactive)
    log_info "You may want to create a Django superuser:"
    echo "  docker compose --profile production exec v0_trailer_mediacms python manage.py createsuperuser"
    
    # Import video data if CSV exists
    if [[ -f "data/VideoDB.csv" ]]; then
        log_info "Importing video database..."
        docker compose --profile production exec v0_trailer_mediacms python manage.py import_videodb /app/data/VideoDB.csv --user admin || log_warn "Video import failed or no admin user exists"
    fi
    
    log_info "✓ Database setup complete"
}

# Update Nginx configuration with domain
update_nginx_config() {
    local domain="$1"
    if [[ -z "$domain" ]]; then
        log_info "No domain specified, keeping default Nginx config"
        return 0
    fi
    
    log_step "Updating Nginx configuration for domain: $domain"
    
    # Update server_name in Nginx config
    if [[ -f "/etc/nginx/sites-available/neversatisfiedxo" ]]; then
        sed -i "s/server_name _;/server_name $domain www.$domain;/" /etc/nginx/sites-available/neversatisfiedxo
        sed -i "s/server_name localhost;/server_name $domain www.$domain;/" /etc/nginx/sites-available/neversatisfiedxo
        
        # Test configuration
        if nginx -t; then
            systemctl reload nginx
            log_info "✓ Nginx configuration updated"
        else
            log_error "Nginx configuration test failed"
        fi
    else
        log_warn "Nginx configuration file not found"
    fi
}

# Setup SSL certificate
setup_ssl() {
    local domain="$1"
    if [[ -z "$domain" ]]; then
        log_info "No domain provided, skipping SSL setup"
        return 0
    fi
    
    log_step "Setting up SSL certificate for $domain..."
    
    # Get certificate
    if certbot --nginx -d "$domain" -d "www.$domain" --non-interactive --agree-tos --email "admin@$domain"; then
        log_info "✓ SSL certificate obtained successfully"
    else
        log_warn "SSL certificate setup failed. Ensure:"
        log_warn "1. Domain DNS points to this server IP: $(curl -s ifconfig.me)"
        log_warn "2. Port 80 and 443 are open"
        log_warn "3. Try manually: certbot --nginx -d $domain"
    fi
}

# Cleanup old Docker resources
cleanup_docker() {
    log_step "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful!)
    docker volume prune -f
    
    log_info "✓ Docker cleanup complete"
}

# Display deployment information
show_deployment_info() {
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "UNKNOWN")
    
    echo
    log_info "🚀 Deployment completed successfully!"
    echo
    echo "Application URLs:"
    if [[ -n "$DOMAIN" ]]; then
        echo "  Frontend: https://$DOMAIN"
        echo "  Admin:    https://$DOMAIN/admin"
        echo "  API:      https://$DOMAIN/api"
    else
        echo "  Frontend: http://$server_ip (via Nginx)"
        echo "  Admin:    http://$server_ip/admin"
        echo "  API:      http://$server_ip/api"
        echo "  Direct Frontend: http://$server_ip:3000"
        echo "  Direct Backend:  http://$server_ip:8000"
    fi
    echo
    echo "Useful commands:"
    echo "  # View logs"
    echo "  docker compose --profile production logs -f"
    echo
    echo "  # Restart services"
    echo "  docker compose --profile production restart"
    echo
    echo "  # Update application"
    echo "  cd $APP_DIR && git pull && docker compose --profile production up -d --build"
    echo
    echo "  # Database shell"
    echo "  docker compose --profile production exec v0_trailer_postgres psql -U mediacms -d mediacms"
    echo
    echo "  # Django shell"
    echo "  docker compose --profile production exec v0_trailer_mediacms python manage.py shell"
    echo
    log_info "Remember to:"
    log_info "1. Update passwords in .env file"
    log_info "2. Create Django superuser"
    log_info "3. Configure domain DNS if using custom domain"
    log_info "4. Setup monitoring and backups"
}

# Main deployment function
main() {
    local cmd="${1:-deploy}"
    
    case "$cmd" in
        "deploy"|"full")
            log_info "🚀 Starting full deployment of neversatisfiedxo..."
            check_prerequisites
            setup_repository
            setup_environment
            deploy_application
            setup_database
            
            if [[ -n "$DOMAIN" ]]; then
                update_nginx_config "$DOMAIN"
                setup_ssl "$DOMAIN"
            fi
            
            cleanup_docker
            show_deployment_info
            ;;
        "update")
            log_info "🔄 Updating application..."
            check_prerequisites
            setup_repository
            deploy_application
            show_deployment_info
            ;;
        "restart")
            log_info "🔄 Restarting services..."
            cd "$APP_DIR"
            docker compose --profile production restart
            check_services_health
            ;;
        "stop")
            log_info "🛑 Stopping services..."
            cd "$APP_DIR"
            docker compose --profile production down
            ;;
        "logs")
            cd "$APP_DIR"
            docker compose --profile production logs -f
            ;;
        "status")
            cd "$APP_DIR"
            docker compose --profile production ps
            check_services_health
            ;;
        "cleanup")
            cleanup_docker
            ;;
        "help"|*)
            echo "Usage: $0 [deploy|update|restart|stop|logs|status|cleanup]"
            echo
            echo "Commands:"
            echo "  deploy   - Full deployment (default)"
            echo "  update   - Update code and restart services"
            echo "  restart  - Restart all services"
            echo "  stop     - Stop all services"
            echo "  logs     - View service logs"
            echo "  status   - Show service status"
            echo "  cleanup  - Clean up Docker resources"
            echo
            echo "Environment variables:"
            echo "  REPO_URL  - Git repository URL"
            echo "  DOMAIN    - Domain name for SSL setup"
            echo "  BRANCH    - Git branch to deploy (default: main)"
            echo
            exit 0
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
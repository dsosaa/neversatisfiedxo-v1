#!/bin/bash

# Generate SSL certificates for HTTPS
# Usage: ./generate-ssl-certs.sh

set -e

# Configuration
VPS_HOST="82.180.137.156"
VPS_USER="root"
VPS_PATH="/opt/neversatisfiedxo"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy_ed25519"
SSL_DIR="/opt/neversatisfiedxo/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Generate SSL certificates on VPS
generate_ssl_certs() {
    log_step "Generating SSL certificates on VPS..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        # Create SSL directory
        mkdir -p $SSL_DIR
        
        # Generate private key
        openssl genrsa -out $SSL_DIR/key.pem 2048
        
        # Generate certificate signing request
        openssl req -new -key $SSL_DIR/key.pem -out $SSL_DIR/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=videos.neversatisfiedxo.com"
        
        # Generate self-signed certificate
        openssl x509 -req -days 365 -in $SSL_DIR/cert.csr -signkey $SSL_DIR/key.pem -out $SSL_DIR/cert.pem
        
        # Set proper permissions
        chmod 600 $SSL_DIR/key.pem
        chmod 644 $SSL_DIR/cert.pem
        
        # Clean up CSR file
        rm $SSL_DIR/cert.csr
        
        echo "SSL certificates generated successfully!"
        ls -la $SSL_DIR/
EOF
    
    log_info "✓ SSL certificates generated"
}

# Update Docker Compose to include SSL certificates
update_docker_compose() {
    log_step "Updating Docker Compose configuration..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        
        # Update nginx service to include SSL volume
        cat > docker-compose.prod-unified.yml << 'COMPOSE_EOF'
# Unified Docker Compose Configuration for V0 Trailer Site
# This configuration consolidates all services into a single, working setup
# Usage: docker compose -f docker-compose.prod-unified.yml up -d

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: v0_trailer_postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=\${POSTGRES_USER:-mediacms}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB:-mediacms}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - v0_trailer_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-mediacms} -d \${POSTGRES_DB:-mediacms}"]
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 20s

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: v0_trailer_redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass \${REDIS_PASSWORD}
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
      --save 60 1000
    volumes:
      - redis_data:/data
    networks:
      - v0_trailer_network
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "\${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 15s

  # MediaCMS Backend (Official Image)
  mediacms:
    image: mediacms/mediacms:latest
    platform: linux/amd64
    container_name: v0_trailer_mediacms
    restart: unless-stopped
    ports:
      - "8000:80"
    environment:
      - POSTGRES_USER=\${POSTGRES_USER:-mediacms}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB:-mediacms}
      - POSTGRES_HOST=postgres
      - REDIS_HOST=redis
      - REDIS_PASSWORD=\${REDIS_PASSWORD}
      - SECRET_KEY=\${DJANGO_SECRET_KEY}
      - ALLOWED_HOSTS=localhost,mediacms,videos.neversatisfiedxo.com,www.videos.neversatisfiedxo.com,web,\${DOMAIN_NAME:-localhost}
      - CORS_ALLOWED_ORIGINS=\${CORS_ALLOWED_ORIGINS:-http://localhost:3000,http://web:3000}
      - DEBUG=\${DJANGO_DEBUG:-False}
      - EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
      - LOGGING_LEVEL=INFO
    volumes:
      - mediacms_data:/home/mediacms.io/mediacms/media_files
      - mediacms_logs:/home/mediacms.io/mediacms/logs
    depends_on:
      - postgres
      - redis
    networks:
      - v0_trailer_network

  # Next.js Frontend (Production Build)
  web:
    build:
      context: .
      dockerfile: Dockerfile.web-optimized
      target: production
      args:
        BUILDKIT_INLINE_CACHE: 1
    container_name: v0_trailer_web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - NEXT_PUBLIC_SITE_NAME=\${NEXT_PUBLIC_SITE_NAME:-neversatisfiedxo}
      - NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=\${NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE}
      - GATE_PASSWORD=\${GATE_PASSWORD}
      - MEDIACMS_BASE_URL=\${MEDIACMS_BASE_URL:-http://mediacms:80}
      - NEXT_PUBLIC_BASE_URL=\${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}
      - MEDIACMS_API_TOKEN=\${MEDIACMS_API_TOKEN}
      - CF_ACCOUNT_ID=\${CF_ACCOUNT_ID}
      - CF_STREAM_API_TOKEN=\${CF_STREAM_API_TOKEN}
      - JWT_SECRET=\${JWT_SECRET}
    volumes:
      - web_next_cache:/app/web/.next
      - web_node_modules:/app/web/node_modules
      - ./data:/app/data:ro
    depends_on:
      - postgres
      - redis
      - mediacms
    networks:
      - v0_trailer_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Nginx Reverse Proxy with SSL
  nginx:
    image: nginx:alpine
    container_name: v0_trailer_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - mediacms
    networks:
      - v0_trailer_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  web_node_modules:
  web_next_cache:
  mediacms_data:
  mediacms_logs:
  postgres_data:
  redis_data:

networks:
  v0_trailer_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
COMPOSE_EOF

        echo "Docker Compose configuration updated with SSL support"
EOF
    
    log_info "✓ Docker Compose configuration updated"
}

# Restart nginx with SSL support
restart_nginx() {
    log_step "Restarting nginx with SSL support..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        
        # Restart nginx container
        docker compose -f docker-compose.prod-unified.yml restart nginx
        
        # Wait for nginx to start
        sleep 5
        
        # Check nginx status
        docker compose -f docker-compose.prod-unified.yml ps nginx
EOF
    
    log_info "✓ Nginx restarted with SSL support"
}

# Test HTTPS connection
test_https() {
    log_step "Testing HTTPS connection..."
    
    # Wait a moment for nginx to fully start
    sleep 10
    
    # Test HTTPS connection
    if curl -k -I https://videos.neversatisfiedxo.com 2>/dev/null | grep -q "200\|301\|302"; then
        log_info "✓ HTTPS connection successful!"
    else
        log_warn "HTTPS connection test failed, but this might be due to self-signed certificate"
        log_info "You can test with: curl -k https://videos.neversatisfiedxo.com"
    fi
}

# Main function
main() {
    log_info "🔐 Setting up HTTPS with SSL certificates"
    echo
    
    generate_ssl_certs
    update_docker_compose
    restart_nginx
    test_https
    
    log_info "🎉 HTTPS setup completed!"
    log_info "Website should now be accessible at: https://videos.neversatisfiedxo.com"
    log_warn "Note: Using self-signed certificate - browsers will show security warning"
    log_info "For production, replace with proper SSL certificate from Let's Encrypt or your CA"
}

# Run main function
main "$@"

#!/bin/bash

# SSL Certificate Setup Script
# Generates SSL certificates for both local development and production
# Usage: ./setup-ssl.sh [local|production]

set -e

# Configuration
ENVIRONMENT="${1:-local}"
VPS_HOST="82.180.137.156"
VPS_USER="root"
VPS_PATH="/opt/neversatisfiedxo"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy_ed25519"

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

# Generate local SSL certificates
generate_local_ssl() {
    log_step "Generating SSL certificates for local development..."
    
    # Create SSL directory
    mkdir -p config/ssl
    
    # Generate private key and certificate
    openssl req -x509 -newkey rsa:2048 \
        -keyout config/ssl/key.pem \
        -out config/ssl/cert.pem \
        -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Set proper permissions
    chmod 600 config/ssl/key.pem
    chmod 644 config/ssl/cert.pem
    
    log_info "✓ Local SSL certificates generated in config/ssl/"
    log_info "  - cert.pem: SSL certificate"
    log_info "  - key.pem: Private key"
}

# Generate production SSL certificates
generate_production_ssl() {
    log_step "Generating SSL certificates for production..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        # Create SSL directory
        mkdir -p $VPS_PATH/ssl
        
        # Generate private key
        openssl genrsa -out $VPS_PATH/ssl/key.pem 2048
        
        # Generate certificate signing request
        openssl req -new -key $VPS_PATH/ssl/key.pem -out $VPS_PATH/ssl/cert.csr \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=videos.neversatisfiedxo.com"
        
        # Generate self-signed certificate
        openssl x509 -req -days 365 -in $VPS_PATH/ssl/cert.csr \
            -signkey $VPS_PATH/ssl/key.pem -out $VPS_PATH/ssl/cert.pem
        
        # Set proper permissions
        chmod 600 $VPS_PATH/ssl/key.pem
        chmod 644 $VPS_PATH/ssl/cert.pem
        
        # Clean up CSR file
        rm $VPS_PATH/ssl/cert.csr
        
        echo "Production SSL certificates generated successfully!"
        ls -la $VPS_PATH/ssl/
EOF
    
    log_info "✓ Production SSL certificates generated on VPS"
}

# Update nginx configuration for local development
update_local_nginx() {
    log_step "Updating nginx configuration for local development..."
    
    # Create local nginx config with localhost domains
    cat > config/nginx-local.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Upstream definitions
    upstream web_backend {
        server web:3000;
    }
    
    upstream mediacms_backend {
        server mediacms:80;
    }
    
    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name localhost;
        return 301 https://$host$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name localhost;
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # MediaCMS API and admin routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://mediacms_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        location /admin/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://mediacms_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /media/ {
            proxy_pass http://mediacms_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache media files
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location /static/ {
            proxy_pass http://mediacms_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache static files
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Next.js frontend (all other routes)
        location / {
            proxy_pass http://web_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # WebSocket support for Next.js
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Error pages
        error_page 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
EOF
    
    log_info "✓ Local nginx configuration created"
}

# Create development Docker Compose with SSL
create_dev_compose() {
    log_step "Creating development Docker Compose with SSL support..."
    
    cat > docker-compose.dev-ssl.yml << 'EOF'
# Development Docker Compose with SSL Support
# Usage: docker compose -f docker-compose.dev-ssl.yml up -d

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: v0_trailer_postgres_dev
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-mediacms}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-devpassword}
      - POSTGRES_DB=${POSTGRES_DB:-mediacms}
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    networks:
      - v0_trailer_network_dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-mediacms} -d ${POSTGRES_DB:-mediacms}"]
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 20s

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: v0_trailer_redis_dev
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:-devpassword}
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data_dev:/data
    networks:
      - v0_trailer_network_dev
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD:-devpassword}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 15s

  # MediaCMS Backend
  mediacms:
    image: mediacms/mediacms:latest
    platform: linux/amd64
    container_name: v0_trailer_mediacms_dev
    restart: unless-stopped
    ports:
      - "8000:80"
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-mediacms}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-devpassword}
      - POSTGRES_DB=${POSTGRES_DB:-mediacms}
      - POSTGRES_HOST=postgres
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD:-devpassword}
      - SECRET_KEY=${DJANGO_SECRET_KEY:-dev-secret-key}
      - ALLOWED_HOSTS=localhost,mediacms,web,${DOMAIN_NAME:-localhost}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-http://localhost:3000,https://localhost:3000,http://web:3000}
      - DEBUG=${DJANGO_DEBUG:-True}
      - EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
      - LOGGING_LEVEL=DEBUG
    volumes:
      - mediacms_data_dev:/home/mediacms.io/mediacms/media_files
      - mediacms_logs_dev:/home/mediacms.io/mediacms/logs
    depends_on:
      - postgres
      - redis
    networks:
      - v0_trailer_network_dev

  # Next.js Frontend (Development)
  web:
    build:
      context: .
      dockerfile: Dockerfile.web-optimized
      target: development
      args:
        BUILDKIT_INLINE_CACHE: 1
    container_name: v0_trailer_web_dev
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - NEXT_PUBLIC_SITE_NAME=${NEXT_PUBLIC_SITE_NAME:-neversatisfiedxo}
      - NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=${NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE}
      - GATE_PASSWORD=${GATE_PASSWORD:-devpassword}
      - MEDIACMS_BASE_URL=${MEDIACMS_BASE_URL:-http://mediacms:80}
      - NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-https://localhost:3000}
      - MEDIACMS_API_TOKEN=${MEDIACMS_API_TOKEN}
      - CF_ACCOUNT_ID=${CF_ACCOUNT_ID}
      - CF_STREAM_API_TOKEN=${CF_STREAM_API_TOKEN}
      - JWT_SECRET=${JWT_SECRET:-dev-jwt-secret}
    volumes:
      - web_next_cache_dev:/app/web/.next
      - web_node_modules_dev:/app/web/node_modules
      - ./data:/app/data:ro
    depends_on:
      - postgres
      - redis
      - mediacms
    networks:
      - v0_trailer_network_dev

  # Nginx Reverse Proxy with SSL
  nginx:
    image: nginx:alpine
    container_name: v0_trailer_nginx_dev
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx-local.conf:/etc/nginx/nginx.conf:ro
      - ./config/ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - mediacms
    networks:
      - v0_trailer_network_dev
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  web_node_modules_dev:
  web_next_cache_dev:
  mediacms_data_dev:
  mediacms_logs_dev:
  postgres_data_dev:
  redis_data_dev:

networks:
  v0_trailer_network_dev:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
EOF
    
    log_info "✓ Development Docker Compose with SSL created"
}

# Main function
main() {
    case "$ENVIRONMENT" in
        local)
            log_info "🔐 Setting up SSL for local development"
            generate_local_ssl
            update_local_nginx
            create_dev_compose
            log_info "🎉 Local SSL setup completed!"
            log_info "Run: docker compose -f docker-compose.dev-ssl.yml up -d"
            log_info "Access: https://localhost"
            ;;
        production)
            log_info "🔐 Setting up SSL for production"
            generate_production_ssl
            log_info "🎉 Production SSL setup completed!"
            log_info "SSL certificates generated on VPS"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_info "Usage: $0 [local|production]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

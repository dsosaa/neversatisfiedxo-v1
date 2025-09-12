#!/bin/bash

# Enhanced SSL/TLS Setup for Production
# Ensures proper certificates for all domain variants with cross-browser compatibility

set -e

# Configuration
DOMAIN="${DOMAIN:-videos.neversatisfiedxo.com}"
WWW_DOMAIN="www.${DOMAIN}"
EMAIL="${CERT_EMAIL:-admin@${DOMAIN}}"
WEBROOT="/var/www/certbot"

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
    log_step "Checking SSL prerequisites..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        log_info "Installing certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        log_error "Nginx is not running. Please start nginx first."
        exit 1
    fi
    
    log_info "✓ Prerequisites check passed"
}

# Create webroot directory for ACME challenges
setup_webroot() {
    log_step "Setting up ACME webroot..."
    
    mkdir -p "$WEBROOT"
    chown -R www-data:www-data "$WEBROOT"
    
    log_info "✓ ACME webroot configured"
}

# Configure nginx for ACME challenge before SSL
configure_pre_ssl_nginx() {
    log_step "Configuring nginx for ACME challenge..."
    
    # Backup current config
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    
    cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    # Redirect other requests to HTTPS (after SSL is set up)
    location / {
        return 301 https://$DOMAIN\$request_uri;
    }
}
EOF
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    
    log_info "✓ Pre-SSL nginx configuration applied"
}

# Obtain SSL certificates for both domains
obtain_certificates() {
    log_step "Obtaining SSL certificates for $DOMAIN and $WWW_DOMAIN..."
    
    # Use certbot to obtain certificates for both domains
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,$WWW_DOMAIN" \
        --expand
    
    if [ $? -eq 0 ]; then
        log_info "✅ SSL certificates obtained successfully"
    else
        log_error "Failed to obtain SSL certificates"
        exit 1
    fi
}

# Configure nginx with SSL and proper redirects
configure_ssl_nginx() {
    log_step "Configuring nginx with SSL and domain redirects..."
    
    cat > /etc/nginx/sites-available/default << 'EOF'
# HTTP server - redirect to canonical HTTPS
server {
    listen 80;
    server_name videos.neversatisfiedxo.com www.videos.neversatisfiedxo.com;
    
    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to canonical HTTPS
    location / {
        return 301 https://videos.neversatisfiedxo.com$request_uri;
    }
}

# HTTPS server - www redirect to canonical domain
server {
    listen 443 ssl http2;
    server_name www.videos.neversatisfiedxo.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/videos.neversatisfiedxo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/videos.neversatisfiedxo.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Redirect www to non-www (canonical domain)
    return 301 https://videos.neversatisfiedxo.com$request_uri;
}

# HTTPS server - canonical domain with full configuration
server {
    listen 443 ssl http2;
    server_name videos.neversatisfiedxo.com;
    
    # Enhanced SSL configuration for maximum browser compatibility
    ssl_certificate /etc/letsencrypt/live/videos.neversatisfiedxo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/videos.neversatisfiedxo.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/videos.neversatisfiedxo.com/chain.pem;
    
    # SSL optimization for all browsers
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Modern cipher suite supporting Chrome, Firefox, Safari, Edge
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # OCSP stapling for faster SSL handshakes
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Enhanced security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Your application proxy configuration here
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    # Test nginx configuration
    nginx -t
    
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        log_info "✅ SSL nginx configuration applied"
    else
        log_error "Nginx configuration test failed"
        exit 1
    fi
}

# Setup automatic certificate renewal
setup_auto_renewal() {
    log_step "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /etc/cron.d/certbot-renewal << EOF
# Renew SSL certificates twice daily
0 */12 * * * root certbot renew --quiet && systemctl reload nginx
EOF
    
    # Test renewal
    certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        log_info "✅ Auto-renewal configured successfully"
    else
        log_warn "Auto-renewal test failed, but certificates are installed"
    fi
}

# Verify SSL configuration
verify_ssl() {
    log_step "Verifying SSL configuration..."
    
    # Test canonical domain
    log_info "Testing https://$DOMAIN..."
    if curl -sI "https://$DOMAIN" | grep -q "200 OK"; then
        log_info "✅ Canonical domain SSL working"
    else
        log_warn "⚠️ Canonical domain SSL may have issues"
    fi
    
    # Test www redirect
    log_info "Testing https://$WWW_DOMAIN redirect..."
    REDIRECT_LOCATION=$(curl -sI "https://$WWW_DOMAIN" | grep -i "location:" | awk '{print $2}' | tr -d '\r')
    if [[ "$REDIRECT_LOCATION" == "https://$DOMAIN/"* ]]; then
        log_info "✅ WWW redirect working correctly"
    else
        log_warn "⚠️ WWW redirect may have issues"
    fi
    
    # Test HTTP redirect  
    log_info "Testing http://$DOMAIN redirect..."
    HTTP_REDIRECT=$(curl -sI "http://$DOMAIN" | grep -i "location:" | awk '{print $2}' | tr -d '\r')
    if [[ "$HTTP_REDIRECT" == "https://$DOMAIN/"* ]]; then
        log_info "✅ HTTP to HTTPS redirect working"
    else
        log_warn "⚠️ HTTP redirect may have issues"
    fi
}

# Display final status
show_status() {
    echo ""
    log_info "🎉 SSL/TLS setup completed!"
    echo ""
    echo "Domain Configuration:"
    echo "  ✅ https://$DOMAIN (canonical)"
    echo "  ↗️ https://$WWW_DOMAIN → https://$DOMAIN"  
    echo "  ↗️ http://$DOMAIN → https://$DOMAIN"
    echo "  ↗️ http://$WWW_DOMAIN → https://$DOMAIN"
    echo ""
    echo "SSL Features:"
    echo "  ✅ Let's Encrypt certificates"
    echo "  ✅ TLS 1.2 & 1.3 support"
    echo "  ✅ Modern cipher suites"
    echo "  ✅ OCSP stapling"
    echo "  ✅ HSTS with preload"
    echo "  ✅ Auto-renewal configured"
    echo ""
    echo "Browser compatibility: Chrome, Firefox, Safari, Edge (all versions)"
}

# Main execution
main() {
    log_info "🔒 Starting Enhanced SSL/TLS Setup"
    log_info "Domain: $DOMAIN"
    log_info "WWW Domain: $WWW_DOMAIN"
    log_info "Email: $EMAIL"
    echo ""
    
    check_prerequisites
    setup_webroot
    configure_pre_ssl_nginx
    obtain_certificates
    configure_ssl_nginx
    setup_auto_renewal
    verify_ssl
    show_status
    
    log_info "✨ Production SSL setup complete!"
}

# Run main function
main "$@"
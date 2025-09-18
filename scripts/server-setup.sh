#!/bin/bash

# Hostinger VPS Server Setup Script for neversatisfiedxo
# Run this script on your VPS after SSH key setup

set -e

# Configuration
DOMAIN="${DOMAIN:-neversatisfiedxo.com}"
APP_USER="${APP_USER:-deploy}"
APP_DIR="/opt/neversatisfiedxo"
DOCKER_COMPOSE_VERSION="2.24.5"

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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Update system packages
update_system() {
    log_step "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    log_info "✓ System updated"
}

# Install Docker
install_docker() {
    log_step "Installing Docker..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Test Docker
    docker --version
    log_info "✓ Docker installed successfully"
}

# Install Node.js 18
install_nodejs() {
    log_step "Installing Node.js 18..."
    
    # Using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    log_info "✓ Node.js installed successfully"
}

# Install Nginx
install_nginx() {
    log_step "Installing Nginx..."
    
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Test Nginx
    nginx -v
    log_info "✓ Nginx installed successfully"
}

# Install Certbot for SSL
install_certbot() {
    log_step "Installing Certbot for SSL certificates..."
    
    apt install -y certbot python3-certbot-nginx
    log_info "✓ Certbot installed successfully"
}

# Setup firewall
setup_firewall() {
    log_step "Configuring UFW firewall..."
    
    # Enable UFW
    ufw --force enable
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful!)
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow Docker ports (internal)
    ufw allow 3000/tcp
    ufw allow 8000/tcp
    
    ufw status
    log_info "✓ Firewall configured"
}

# Create deploy user
create_deploy_user() {
    log_step "Creating deploy user..."
    
    # Create user if doesn't exist
    if ! id "$APP_USER" &>/dev/null; then
        useradd -m -s /bin/bash -G docker "$APP_USER"
        log_info "✓ User '$APP_USER' created"
    else
        # Add to docker group if exists
        usermod -aG docker "$APP_USER"
        log_info "✓ User '$APP_USER' updated"
    fi
    
    # Create app directory
    mkdir -p "$APP_DIR"
    chown "$APP_USER:$APP_USER" "$APP_DIR"
    
    # Setup SSH for deploy user (copy from root)
    if [[ -d "/root/.ssh" ]]; then
        mkdir -p "/home/$APP_USER/.ssh"
        cp /root/.ssh/authorized_keys "/home/$APP_USER/.ssh/" 2>/dev/null || true
        chown -R "$APP_USER:$APP_USER" "/home/$APP_USER/.ssh"
        chmod 700 "/home/$APP_USER/.ssh"
        chmod 600 "/home/$APP_USER/.ssh/authorized_keys" 2>/dev/null || true
        log_info "✓ SSH keys copied to deploy user"
    fi
}

# Configure Nginx reverse proxy
configure_nginx() {
    log_step "Configuring Nginx reverse proxy..."
    
    # Create Nginx config for the app
    cat > /etc/nginx/sites-available/neversatisfiedxo << 'EOF'
# neversatisfiedxo Nginx Configuration
server {
    listen 80;
    server_name _;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Main application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API endpoints proxy to Django
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files (if served directly by Nginx)
    location /static/ {
        alias /opt/neversatisfiedxo/apps/mediacms/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /opt/neversatisfiedxo/apps/mediacms/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/neversatisfiedxo /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    systemctl reload nginx
    
    log_info "✓ Nginx reverse proxy configured"
}

# Setup SSL certificate
setup_ssl() {
    local domain="$1"
    if [[ -z "$domain" ]]; then
        log_warn "No domain provided, skipping SSL setup"
        log_info "To setup SSL later, run: certbot --nginx -d yourdomain.com"
        return 0
    fi
    
    log_step "Setting up SSL certificate for $domain..."
    
    # Update Nginx config with domain
    sed -i "s/server_name _;/server_name $domain;/" /etc/nginx/sites-available/neversatisfiedxo
    nginx -t && systemctl reload nginx
    
    # Get certificate
    certbot --nginx -d "$domain" --non-interactive --agree-tos --email admin@"$domain" || {
        log_warn "SSL certificate setup failed. You may need to:"
        log_warn "1. Ensure DNS is pointing to this server"
        log_warn "2. Run manually: certbot --nginx -d $domain"
    }
    
    log_info "✓ SSL setup attempted"
}

# Create systemd service for auto-renewal
setup_ssl_renewal() {
    log_step "Setting up SSL certificate auto-renewal..."
    
    # Test renewal
    certbot renew --dry-run || log_warn "SSL renewal test failed"
    
    log_info "✓ SSL auto-renewal configured"
}

# Setup monitoring and logging
setup_monitoring() {
    log_step "Setting up basic monitoring..."
    
    # Install htop for monitoring
    apt install -y htop iotop
    
    # Setup log rotation for Docker
    cat > /etc/logrotate.d/docker << 'EOF'
/var/lib/docker/containers/*/*.log {
    daily
    copytruncate
    rotate 7
    delaycompress
    compress
    notifempty
    missingok
}
EOF
    
    log_info "✓ Basic monitoring setup complete"
}

# Display final information
show_completion_info() {
    echo
    log_info "🎉 Server setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Clone your repository to $APP_DIR"
    echo "2. Configure environment variables"
    echo "3. Run Docker Compose deployment"
    echo "4. Setup SSL certificate if domain is ready"
    echo
    echo "Useful commands:"
    echo "  sudo systemctl status docker nginx"
    echo "  sudo docker ps"
    echo "  sudo nginx -t"
    echo "  sudo ufw status"
    echo
    echo "SSH as deploy user:"
    echo "  ssh -i ~/.ssh/hostinger_deploy $APP_USER@$(hostname -I | awk '{print $1}')"
    echo
}

# Main execution
main() {
    log_info "Starting Hostinger VPS setup for neversatisfiedxo..."
    
    check_root
    update_system
    install_docker
    install_nodejs
    install_nginx
    install_certbot
    setup_firewall
    create_deploy_user
    configure_nginx
    setup_monitoring
    
    # SSL setup (optional, requires domain)
    if [[ -n "$DOMAIN" && "$DOMAIN" != "neversatisfiedxo.com" ]]; then
        setup_ssl "$DOMAIN"
        setup_ssl_renewal
    fi
    
    show_completion_info
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
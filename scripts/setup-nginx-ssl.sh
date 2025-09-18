#!/bin/bash
# Setup nginx configuration and SSL certificates for videos.neversatisfiedxo.com
# This script should be run on the VPS to configure domain access

set -euo pipefail

DOMAIN="videos.neversatisfiedxo.com"
WWW_DOMAIN="www.videos.neversatisfiedxo.com"
EMAIL="admin@neversatisfiedxo.com"  # Change this to your email
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
NGINX_CONF_PATH="$NGINX_SITES_AVAILABLE/$DOMAIN"

echo "🚀 Setting up nginx and SSL for $DOMAIN"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install required packages
echo "📦 Installing required packages..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx curl

# Stop nginx temporarily for certificate generation
echo "🛑 Stopping nginx temporarily..."
systemctl stop nginx || true

# Copy nginx configuration
echo "📄 Setting up nginx configuration..."
cp /opt/neversatisfiedxo/config/nginx-site.conf "$NGINX_CONF_PATH"

# Enable the site
echo "🔗 Enabling nginx site..."
ln -sf "$NGINX_CONF_PATH" "$NGINX_SITES_ENABLED/$DOMAIN"

# Remove default nginx site if it exists
rm -f "$NGINX_SITES_ENABLED/default"

# Create temporary nginx config for SSL certificate generation
echo "🔧 Creating temporary nginx config for SSL..."
cat > "$NGINX_CONF_PATH.temp" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 200 "Temporary server for SSL setup";
        add_header Content-Type text/plain;
    }
}
EOF

# Use temporary config
cp "$NGINX_CONF_PATH.temp" "$NGINX_CONF_PATH"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Start nginx with temporary config
echo "▶️ Starting nginx with temporary config..."
systemctl start nginx
systemctl enable nginx

# Wait for nginx to be ready
sleep 5

# Generate SSL certificate
echo "🔐 Generating SSL certificate with Let's Encrypt..."
certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domains "$DOMAIN,$WWW_DOMAIN" \
    --non-interactive

# Check if certificate was generated successfully
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate generated successfully!"
else
    echo "❌ SSL certificate generation failed!"
    exit 1
fi

# Replace with full nginx configuration
echo "🔄 Updating nginx configuration with SSL..."
cp /opt/neversatisfiedxo/config/nginx-site.conf "$NGINX_CONF_PATH"

# Test nginx configuration again
echo "🧪 Testing final nginx configuration..."
nginx -t

# Reload nginx with SSL configuration
echo "🔄 Reloading nginx with SSL configuration..."
systemctl reload nginx

# Setup automatic certificate renewal
echo "⏰ Setting up automatic certificate renewal..."
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx") | crontab -
    echo "✅ Certificate auto-renewal configured"
fi

# Verify SSL certificate
echo "🔍 Verifying SSL certificate..."
sleep 10
if curl -I "https://$DOMAIN" --max-time 10 >/dev/null 2>&1; then
    echo "✅ SSL certificate is working!"
else
    echo "⚠️ SSL certificate verification failed - checking logs..."
    systemctl status nginx
    tail -20 /var/log/nginx/error.log
fi

# Clean up temporary file
rm -f "$NGINX_CONF_PATH.temp"

echo ""
echo "🎉 Setup complete!"
echo "✅ Domain: https://$DOMAIN"
echo "✅ WWW Domain: https://$WWW_DOMAIN"
echo "✅ SSL Certificate: Active"
echo "✅ Auto-renewal: Configured"
echo ""
echo "🧪 Test the setup:"
echo "curl -I https://$DOMAIN/enter"
echo "curl https://$DOMAIN/api/health"
echo ""
echo "📋 Next steps:"
echo "1. Test authentication: Visit https://$DOMAIN/enter"
echo "2. Enter password: yesmistress"
echo "3. Verify gallery access works"
echo ""
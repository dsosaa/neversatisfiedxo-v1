#!/bin/bash
# Complete deployment script with nginx and SSL configuration
# Integrates nginx setup into the main deployment process

set -euo pipefail

DOMAIN="${1:-videos.neversatisfiedxo.com}"
VPS_HOST="82.180.137.156"
VPS_USER="root"
PROJECT_PATH="/opt/neversatisfiedxo"

echo "🚀 Starting complete deployment with nginx for $DOMAIN"

# Function to execute commands on VPS
vps_exec() {
    ssh "$VPS_USER@$VPS_HOST" "$@"
}

# Function to copy files to VPS
vps_copy() {
    local src="$1"
    local dest="$2"
    rsync -avz --progress "$src" "$VPS_USER@$VPS_HOST:$dest"
}

# Step 1: Sync project files
echo "📁 Syncing project files to VPS..."
vps_copy . "$PROJECT_PATH/"

# Step 2: Build and start Docker containers
echo "🐳 Building and starting Docker containers..."
vps_exec "cd $PROJECT_PATH && docker compose -f docker-compose.production.yml down || true"
vps_exec "cd $PROJECT_PATH && docker compose -f docker-compose.production.yml build --no-cache"
vps_exec "cd $PROJECT_PATH && docker compose -f docker-compose.production.yml up -d"

# Step 3: Wait for containers to be healthy
echo "⏳ Waiting for containers to be healthy..."
sleep 30

# Check container health
vps_exec "cd $PROJECT_PATH && docker compose -f docker-compose.production.yml ps"

# Step 4: Setup nginx and SSL
echo "🌐 Setting up nginx and SSL certificates..."
vps_exec "cd $PROJECT_PATH && chmod +x scripts/setup-nginx-ssl.sh"
vps_exec "cd $PROJECT_PATH && ./scripts/setup-nginx-ssl.sh"

# Step 5: Test the deployment
echo "🧪 Testing deployment..."
vps_exec "cd $PROJECT_PATH && chmod +x scripts/test-website.sh"
vps_exec "cd $PROJECT_PATH && ./scripts/test-website.sh"

# Step 6: Final validation
echo "✅ Running final validation..."

# Test local connectivity
echo "Testing from local machine..."
if curl -I "https://$DOMAIN/enter" --max-time 10 >/dev/null 2>&1; then
    echo "✅ Website is accessible from external networks"
else
    echo "⚠️ Website may not be accessible externally yet - DNS propagation may take time"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "🌐 Website: https://$DOMAIN"
echo "🔐 Password: yesmistress"
echo "🛠️ Admin: https://$DOMAIN/admin/"
echo ""
echo "📋 Next steps:"
echo "1. Visit https://$DOMAIN/enter"
echo "2. Enter password 'yesmistress'"
echo "3. Verify gallery access and video playback"
echo "4. Test admin interface if needed"
echo ""
echo "🔍 Troubleshooting commands:"
echo "ssh $VPS_USER@$VPS_HOST 'systemctl status nginx'"
echo "ssh $VPS_USER@$VPS_HOST 'docker compose -f $PROJECT_PATH/docker-compose.production.yml logs'"
echo "ssh $VPS_USER@$VPS_HOST 'tail -f /var/log/nginx/error.log'"
echo ""
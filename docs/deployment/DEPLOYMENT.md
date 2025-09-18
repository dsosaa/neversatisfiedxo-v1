# Production Deployment Guide

## 🚀 Hostinger VPS Deployment for videos.neversatisfiedxo.com

This guide covers the complete deployment process for the neversatisfiedxo Premium Trailer Gallery v2.6.3 to the Hostinger VPS production environment, including the latest duration badges feature.

## 📋 **Prerequisites**

### **Server Requirements**
- **VPS**: Hostinger VPS with root access
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **Network**: Public IP with port 80/443 access

### **Domain Setup**
- **Domain**: `videos.neversatisfiedxo.com`
- **DNS**: A record pointing to VPS IP
- **SSL**: Let's Encrypt certificate (automated)

### **Local Requirements**
- **Git**: Latest version
- **SSH**: Key-based authentication to VPS
- **Docker**: For local testing (optional)

## 🔧 **Initial Server Setup**

### **1. SSH Access Configuration**
```bash
# Generate SSH key (if not exists)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id root@YOUR_VPS_IP

# Test SSH connection
ssh root@YOUR_VPS_IP
```

### **2. Server Environment Setup**
```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Add user to docker group
usermod -aG docker $USER
```

### **3. Firewall Configuration**
```bash
# Configure UFW firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Verify firewall status
ufw status
```

## 📦 **Application Deployment**

### **1. Clone Repository**
```bash
# Create application directory
mkdir -p /opt/neversatisfiedxo
cd /opt/neversatisfiedxo

# Clone repository
git clone <repository-url> .
```

### **2. Environment Configuration**
```bash
# Create production environment file
cp env.example .env.production

# Edit environment variables
nano .env.production
```

**Required Environment Variables:**
```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://videos.neversatisfiedxo.com

# Cloudflare Stream
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code
CF_STREAM_API_TOKEN=your_api_token

# Database (if using external DB)
DATABASE_URL=your_database_url

# Security
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://videos.neversatisfiedxo.com
```

### **3. Data Setup**
```bash
# Ensure data directory exists
mkdir -p /opt/neversatisfiedxo/data

# Copy video database
cp data/VideoDB.csv /opt/neversatisfiedxo/data/

# Set proper permissions
chown -R 1000:1000 /opt/neversatisfiedxo/data
```

### **4. Docker Deployment**
```bash
# Use production Docker Compose
docker-compose -f docker-compose.prod-unified.yml up -d

# Verify containers are running
docker-compose -f docker-compose.prod-unified.yml ps

# Check logs
docker-compose -f docker-compose.prod-unified.yml logs -f
```

## 🌐 **Nginx Configuration**

### **1. Nginx Site Configuration**
```bash
# Create Nginx site configuration
cat > /etc/nginx/sites-available/videos.neversatisfiedxo.com << 'EOF'
server {
    listen 80;
    server_name videos.neversatisfiedxo.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name videos.neversatisfiedxo.com;
    
    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/videos.neversatisfiedxo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/videos.neversatisfiedxo.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to Next.js application
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files caching
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 5m;
        proxy_cache_valid 404 1m;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/videos.neversatisfiedxo.com /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### **2. SSL Certificate Setup**
```bash
# Obtain SSL certificate
certbot --nginx -d videos.neversatisfiedxo.com

# Test certificate renewal
certbot renew --dry-run

# Setup automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## 🔄 **Deployment Scripts**

### **1. Main Deployment Script**
```bash
#!/bin/bash
# deploy-v2.6.0.sh

set -e

echo "🚀 Starting deployment to videos.neversatisfiedxo.com..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build application
echo "🔨 Building application..."
cd apps/web
npm ci --production
npm run build

# Restart services
echo "🔄 Restarting services..."
cd ../..
docker-compose -f docker-compose.prod-unified.yml down
docker-compose -f docker-compose.prod-unified.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Verify deployment
echo "✅ Verifying deployment..."
./scripts/validate-environment.sh

echo "🎉 Deployment completed successfully!"
```

### **2. Environment Validation Script**
```bash
#!/bin/bash
# validate-environment.sh

set -e

echo "🔍 Validating production environment..."

# Check if containers are running
if ! docker-compose -f docker-compose.prod-unified.yml ps | grep -q "Up"; then
    echo "❌ Docker containers are not running"
    exit 1
fi

# Check if application is responding
if ! curl -f -s http://localhost:3000 > /dev/null; then
    echo "❌ Application is not responding on port 3000"
    exit 1
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx is not running"
    exit 1
fi

# Check SSL certificate
if ! openssl s_client -connect videos.neversatisfiedxo.com:443 -servername videos.neversatisfiedxo.com < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "❌ SSL certificate is not valid"
    exit 1
fi

echo "✅ All checks passed!"
```

## 📊 **Monitoring & Maintenance**

### **1. Health Checks**
```bash
# Application health
curl -f https://videos.neversatisfiedxo.com/api/health

# Container status
docker-compose -f docker-compose.prod-unified.yml ps

# System resources
htop
df -h
free -h
```

### **2. Log Monitoring**
```bash
# Application logs
docker-compose -f docker-compose.prod-unified.yml logs -f web

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### **3. Backup Procedures**
```bash
# Backup application data
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/neversatisfiedxo/data/

# Backup database (if applicable)
pg_dump your_database > database-backup-$(date +%Y%m%d).sql

# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/sites-available/ /etc/letsencrypt/
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Application Not Starting**
```bash
# Check container logs
docker-compose -f docker-compose.prod-unified.yml logs web

# Check if port is in use
netstat -tulpn | grep :3000

# Restart services
docker-compose -f docker-compose.prod-unified.yml restart
```

#### **SSL Certificate Issues**
```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew --force-renewal

# Check Nginx configuration
nginx -t
```

#### **Performance Issues**
```bash
# Check system resources
htop
iostat -x 1

# Check Docker resource usage
docker stats

# Monitor application performance
curl -w "@curl-format.txt" -o /dev/null -s https://videos.neversatisfiedxo.com
```

## 🔐 **Security Considerations**

### **1. Firewall Rules**
```bash
# Only allow necessary ports
ufw allow ssh
ufw allow 'Nginx Full'
ufw deny 3000  # Block direct access to app port
```

### **2. Regular Updates**
```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod-unified.yml pull
docker-compose -f docker-compose.prod-unified.yml up -d
```

### **3. Monitoring**
```bash
# Install monitoring tools
apt install -y fail2ban logwatch

# Configure fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban
```

## 📈 **Performance Optimization**

### **1. Nginx Caching**
```nginx
# Add to Nginx configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache app_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
}
```

### **2. Docker Optimization**
```yaml
# Add to docker-compose.prod-unified.yml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## 🎯 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Server setup completed
- [ ] Domain DNS configured
- [ ] SSL certificate obtained
- [ ] Environment variables configured
- [ ] Data files uploaded

### **Deployment**
- [ ] Repository cloned
- [ ] Docker containers started
- [ ] Nginx configured and reloaded
- [ ] SSL certificate active
- [ ] Application responding

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Performance monitoring active
- [ ] Backup procedures configured
- [ ] Security measures in place
- [ ] Documentation updated

---

**Deployment Status**: ✅ Production Ready  
**Last Updated**: January 2025  
**Version**: 2.6.3
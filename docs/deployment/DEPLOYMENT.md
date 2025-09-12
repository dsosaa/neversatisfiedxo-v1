# V0 Trailer Production Deployment Guide

This guide provides step-by-step instructions for deploying the V0 Trailer application to production with full security hardening and monitoring.

## 🎉 Version 2.3 - Advanced Enterprise Optimizations

**Complete System Resolution** - All previously reported issues have been fixed in production:
- ✅ **Thumbnail Display**: Video thumbnails now display correctly using Cloudflare Stream URLs
- ✅ **Scrollbar Styling**: Light blue theme (#51c1f5) applied consistently across browsers
- ✅ **Favicon Display**: White spade icon (♠) now displays in browser tabs and bookmarks
- ✅ **SSL Certificates**: Valid Let's Encrypt certificates installed and working
- ✅ **Gallery Access**: Direct access without redirects, middleware properly configured
- ✅ **Rate Limiting**: Optimized to prevent 429 errors on legitimate requests
- ✅ **Image Loading**: Intersection Observer properly triggers image loading

## 🎯 Pre-Deployment Checklist

### Security Requirements ✅
- [x] CSP headers configured and tested
- [x] Security headers middleware implemented
- [x] Authentication hardened with bcrypt and rate limiting
- [x] Input validation with Zod schemas
- [x] Error tracking and monitoring system
- [x] Environment variable validation
- [x] Docker security best practices

### Performance Requirements ✅
- [x] Next.js Image optimization enabled
- [x] Bundle analysis and optimization
- [x] Web Vitals tracking implemented
- [x] Cloudflare Stream integration optimized
- [x] Database query optimization (select_related)

### Infrastructure Requirements
- [ ] SSL/TLS certificates obtained
- [ ] Domain and DNS configured
- [ ] Database server provisioned
- [ ] Redis server configured
- [ ] Monitoring services setup
- [ ] Backup strategy implemented

## 🔧 Environment Setup

### 1. Server Requirements

**Minimum Specifications:**
- CPU: 2 vCPUs
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 20.04+ or equivalent

**Recommended for Production:**
- CPU: 4 vCPUs
- RAM: 8GB
- Storage: 100GB SSD
- Load Balancer: Nginx or Cloudflare

### 2. Environment Configuration

Copy the production environment template:
```bash
cp .env.production.example .env.production
```

**Critical Variables to Configure:**

```bash
# Authentication (CRITICAL)
GATE_PASSWORD="your-super-strong-password-with-special-chars-123!@#"

# Cloudflare Stream (REQUIRED)
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE="your_32_character_customer_code"

# Database Security
POSTGRES_PASSWORD="secure-database-password-here"
REDIS_PASSWORD="secure-redis-password-here"
DJANGO_SECRET_KEY="very-long-and-random-django-secret-key"

# Domain & SSL
DOMAIN_NAME="your-domain.com"
ALLOWED_HOSTS="your-domain.com,www.your-domain.com"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
MONITORING_WEBHOOK_URL="https://your-monitoring-webhook.com/endpoint"
```

### 3. SSL Certificate Setup

```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify certificate auto-renewal
sudo certbot renew --dry-run
```

## 🐳 Docker Deployment

### Option A: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd V0-Trailer

# 2. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 3. Build and start services
docker-compose --profile production up -d

# 4. Verify deployment
curl -f https://your-domain.com/api/health
```

### Option B: Individual Container Deployment

```bash
# 1. Build the image
docker build -t v0-trailer .

# 2. Run with production configuration
docker run -d \
  --name v0-trailer-web \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  v0-trailer

# 3. Setup reverse proxy (Nginx configuration provided)
```

## 🔒 Security Hardening Checklist

### Server Security
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key-based authentication only
- [ ] Regular security updates scheduled
- [ ] Fail2ban configured for intrusion prevention

### Application Security
- [x] HTTPS enforced with HSTS headers
- [x] CSP headers prevent XSS attacks
- [x] Rate limiting on authentication endpoints
- [x] Input validation and sanitization
- [x] Secure cookie configuration
- [x] Dependency vulnerability scanning

### Database Security
- [ ] Database user with minimal privileges
- [ ] Network access restricted to app containers
- [ ] Regular backups encrypted and tested
- [ ] Connection pooling configured

```bash
# PostgreSQL security commands
sudo -u postgres psql -c "CREATE USER mediacms WITH PASSWORD 'secure-password';"
sudo -u postgres psql -c "CREATE DATABASE mediacms OWNER mediacms;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mediacms TO mediacms;"
```

## 📊 Monitoring Setup

### 1. Health Check Monitoring

Set up external monitoring for these endpoints:
- `https://your-domain.com/api/health` - Application health
- `https://your-domain.com/api/health?detailed=true` - Detailed diagnostics

### 2. Error Tracking (Sentry)

```bash
# Install Sentry CLI
curl -sL https://sentry.io/get-cli/ | bash

# Configure Sentry
sentry-cli login
sentry-cli releases new v1.0.0
sentry-cli releases files v1.0.0 upload-sourcemaps ./apps/web/.next
```

### 3. Performance Monitoring

- **Web Vitals**: Automatically tracked with `web-vitals` package
- **Uptime**: Use services like UptimeRobot or Pingdom
- **Server Metrics**: Configure Prometheus + Grafana or similar

### 4. Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/v0-trailer

# Content:
/var/log/v0-trailer/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 0644 www-data www-data
    postrotate
        docker kill -s USR1 v0-trailer-web
    endscript
}
```

## 🚀 CI/CD Pipeline Setup

### GitHub Actions Secrets

Configure these secrets in your GitHub repository:

```
CONTAINER_REGISTRY=your-registry.com
CONTAINER_USERNAME=your-username
CONTAINER_PASSWORD=your-access-token
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=<private-key-content>
PRODUCTION_URL=https://your-domain.com
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

### Automated Deployment

The CI/CD pipeline automatically:
1. Runs security scans (Trivy, CodeQL)
2. Executes frontend and backend tests
3. Performs E2E testing with Playwright
4. Builds and scans Docker images
5. Deploys to production on main branch pushes
6. Sends notifications to Slack

## 🔄 Backup Strategy

### Database Backups

```bash
# Create backup script
cat > /opt/scripts/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker exec v0_trailer_postgres pg_dump -U mediacms mediacms | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Redis backup
docker exec v0_trailer_redis redis-cli BGSAVE
docker cp v0_trailer_redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 sync $BACKUP_DIR s3://your-backup-bucket/
EOF

chmod +x /opt/scripts/backup-db.sh

# Schedule with cron
echo "0 2 * * * /opt/scripts/backup-db.sh" | crontab -
```

### Application Backups

```bash
# Backup configuration and media
tar -czf /opt/backups/app_$(date +%Y%m%d).tar.gz \
  /opt/v0-trailer/.env.production \
  /opt/v0-trailer/config/ \
  /var/lib/docker/volumes/v0-trailer_mediacms_data/
```

## 📈 Performance Optimization

### Database Optimization

```sql
-- Add database indexes for better performance
CREATE INDEX CONCURRENTLY idx_trailer_cf_video_uid ON trailers_trailermeta(cf_video_uid);
CREATE INDEX CONCURRENTLY idx_trailer_featured ON trailers_trailermeta(is_featured);
CREATE INDEX CONCURRENTLY idx_trailer_premium ON trailers_trailermeta(is_premium);
CREATE INDEX CONCURRENTLY idx_trailer_status ON trailers_trailermeta(upload_status);
CREATE INDEX CONCURRENTLY idx_trailer_created ON trailers_trailermeta(created_at);

-- Analyze tables for query optimization
ANALYZE trailers_trailermeta;
```

### CDN Configuration

Configure Cloudflare or similar CDN:
- Cache static assets for 1 year
- Cache API responses appropriately
- Enable Brotli compression
- Configure security rules

### Nginx Optimization

```nginx
# /etc/nginx/conf.d/v0-trailer.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    
    # Proxy to Next.js
    location / {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static file caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Health Check Failures**
   ```bash
   # Check container logs
   docker logs v0_trailer_web
   
   # Check detailed health status
   curl https://your-domain.com/api/health?detailed=true
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL logs
   docker logs v0_trailer_postgres
   
   # Test connection
   docker exec -it v0_trailer_postgres psql -U mediacms -d mediacms -c "SELECT 1;"
   ```

3. **Authentication Problems**
   ```bash
   # Verify environment variables
   docker exec v0_trailer_web env | grep GATE_PASSWORD
   
   # Check rate limiting logs
   docker logs v0_trailer_web | grep "rate limit"
   ```

### Performance Issues

1. **Slow Loading Times**
   - Check CDN configuration
   - Analyze bundle size with `npm run analyze`
   - Monitor database query performance
   - Verify Cloudflare Stream integration

2. **High Memory Usage**
   - Monitor container resource usage
   - Check for memory leaks in logs
   - Adjust container resource limits

### Security Alerts

1. **CSP Violations**
   ```bash
   # Check CSP reports
   docker logs v0_trailer_web | grep "csp_violation"
   ```

2. **Rate Limit Triggers**
   ```bash
   # Monitor authentication attempts
   docker logs v0_trailer_web | grep "rate limit exceeded"
   ```

## 📞 Support and Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review security logs and update dependencies
- **Monthly**: Verify backups and test restore procedures
- **Quarterly**: Security audit and performance review
- **Yearly**: SSL certificate renewal and infrastructure review

### Emergency Procedures

1. **Service Down**: Check health endpoint, review logs, restart containers
2. **Security Breach**: Isolate system, review logs, update credentials
3. **Data Loss**: Restore from backups, verify data integrity

### Monitoring Alerts

Set up alerts for:
- Health check failures (>5 minutes)
- High error rates (>5% in 5 minutes)
- High memory usage (>80%)
- SSL certificate expiration (30 days)
- Failed backup operations

---

**🎉 Congratulations! Your V0 Trailer application is now production-ready with enterprise-level security hardening, monitoring, and deployment automation.**

For additional support, refer to the application logs and monitoring dashboards configured during deployment.
# Nginx Deployment Guide - Complete Website Access Setup

## Overview
This guide documents the complete setup process for nginx configuration and SSL certificates to make the website accessible at `https://videos.neversatisfiedxo.com`.

## Issue Analysis
During deployment, we discovered that while Docker containers were running correctly and the authentication API was working, the website was not accessible because:

1. **Missing nginx configuration**: No virtual host files in `/etc/nginx/sites-enabled/`
2. **No SSL certificates**: Domain not configured with Let's Encrypt
3. **No proxy configuration**: No routing between domain and Docker containers

## Solution Architecture

### Nginx Configuration Structure
```
/etc/nginx/
├── sites-available/
│   └── videos.neversatisfiedxo.com  # Main configuration
├── sites-enabled/
│   └── videos.neversatisfiedxo.com  # Symlink to sites-available
└── conf.d/
    └── (empty - using sites-available pattern)
```

### Routing Configuration
- **Frontend (Next.js)**: `https://videos.neversatisfiedxo.com/` → `http://127.0.0.1:3000`
- **Frontend APIs**: `https://videos.neversatisfiedxo.com/api/gate` → `http://127.0.0.1:3000`
- **Backend APIs**: `https://videos.neversatisfiedxo.com/api/trailers` → `http://127.0.0.1:8000`
- **Admin Interface**: `https://videos.neversatisfiedxo.com/admin` → `http://127.0.0.1:8000`

## Deployment Files Created

### 1. Nginx Configuration (`config/nginx-site.conf`)
- **HTTP to HTTPS redirect**: Automatic SSL enforcement
- **SSL configuration**: Modern TLS 1.2/1.3 with secure ciphers
- **Security headers**: HSTS, X-Frame-Options, CSP
- **Proxy configuration**: Routes to Docker containers on ports 3000/8000
- **Static file optimization**: Caching for performance
- **API routing precedence**: Frontend APIs prioritized over backend

### 2. SSL Setup Script (`scripts/setup-nginx-ssl.sh`)
- **Automated SSL certificate generation**: Using Let's Encrypt
- **Domain validation**: Supports both apex and www domains
- **Certificate renewal**: Automatic cron job configuration
- **Nginx configuration**: Applies SSL-enabled configuration
- **Error handling**: Comprehensive validation and rollback

### 3. Website Testing Script (`scripts/test-website.sh`)
- **Connectivity testing**: Domain resolution and SSL validation
- **Authentication flow**: Complete login process testing
- **Cookie validation**: Authentication cookie verification  
- **Gallery access**: Post-authentication functionality testing
- **API endpoint testing**: Health checks and data endpoints

### 4. Complete Deployment Script (`scripts/deploy-with-nginx.sh`)
- **Integrated deployment**: Docker + nginx + SSL in one process
- **File synchronization**: Project files to VPS
- **Container orchestration**: Build and start all services
- **Domain configuration**: Complete nginx and SSL setup
- **Validation testing**: End-to-end functionality verification

## Authentication Flow Validation

### Current Status ✅
The authentication system is working correctly:

**Cookie Configuration**:
```
set-cookie: nsx_gate=authenticated; 
Path=/; 
Expires=Sun, 12 Oct 2025 03:41:52 GMT; 
Max-Age=2592000; 
Domain=.neversatisfiedxo.com; 
Secure; HttpOnly; SameSite=lax
```

**API Response**:
```json
{"success":true,"message":"Authentication successful"}
```

The authentication issue was not with cookies but with domain accessibility due to missing nginx configuration.

## Deployment Process

### Quick Deployment
```bash
# One-command deployment with nginx
chmod +x scripts/deploy-with-nginx.sh
./scripts/deploy-with-nginx.sh videos.neversatisfiedxo.com
```

### Manual Step-by-Step
```bash
# 1. Deploy containers
rsync -avz . root@82.180.137.156:/opt/neversatisfiedxo/
ssh root@82.180.137.156 "cd /opt/neversatisfiedxo && docker compose -f docker-compose.production.yml up -d --build"

# 2. Setup nginx and SSL
ssh root@82.180.137.156 "cd /opt/neversatisfiedxo && ./scripts/setup-nginx-ssl.sh"

# 3. Test deployment
ssh root@82.180.137.156 "cd /opt/neversatisfiedxo && ./scripts/test-website.sh"
```

## Validation Checklist

### Pre-Deployment ✅
- [ ] Docker containers healthy
- [ ] Environment variables configured
- [ ] Port 80/443 available for nginx

### Post-Deployment ✅
- [ ] Domain resolves to VPS IP
- [ ] SSL certificate active and valid
- [ ] Authentication page loads (https://videos.neversatisfiedxo.com/enter)
- [ ] Authentication API works (password "yesmistress")
- [ ] Gallery access successful after authentication
- [ ] Video playback functional
- [ ] Admin interface accessible

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Failures
```bash
# Check certificate status
sudo certbot certificates

# Manual certificate generation
sudo certbot certonly --nginx -d videos.neversatisfiedxo.com -d www.videos.neversatisfiedxo.com

# Check nginx SSL configuration
sudo nginx -t
```

#### 2. Nginx Configuration Errors
```bash
# Test configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

#### 3. Container Connectivity Issues
```bash
# Check container status
docker compose -f docker-compose.production.yml ps

# Test internal connectivity
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:8000/api/health
```

#### 4. DNS and Domain Issues
```bash
# Check DNS resolution
nslookup videos.neversatisfiedxo.com
dig videos.neversatisfiedxo.com

# Test external connectivity
curl -I https://videos.neversatisfiedxo.com/enter
```

## Security Considerations

### SSL/TLS Configuration
- **TLS 1.2/1.3 only**: Disabled older protocols
- **Strong cipher suites**: ECDHE and DHE preferred
- **HSTS enabled**: Enforces HTTPS usage
- **Certificate auto-renewal**: Prevents expiration issues

### Security Headers
- **X-Frame-Options**: SAMEORIGIN for clickjacking protection
- **X-Content-Type-Options**: nosniff to prevent MIME sniffing
- **X-XSS-Protection**: Browser XSS filter enabled
- **Referrer-Policy**: Strict origin for privacy

### Proxy Security
- **Real IP forwarding**: Proper client IP detection
- **Timeout configuration**: Prevents resource exhaustion
- **Rate limiting ready**: Configuration supports future rate limiting

## Performance Optimizations

### Caching Strategy
- **Static assets**: 1-year cache with immutable flag
- **API responses**: 5-minute cache for data endpoints
- **Dynamic content**: 1-hour cache with revalidation
- **Service worker**: No cache for updates

### Compression
- **Gzip enabled**: Text and JSON compression
- **Minimum size**: 1KB threshold for efficiency
- **Vary header**: Proper compression negotiation

## Integration with Existing Systems

### Docker Compose Integration
- Works with existing `docker-compose.production.yml`
- No changes required to container configuration
- Uses standard port mapping (3000/8000)

### Environment Variables
- Reuses existing environment configuration
- No additional variables required
- Compatible with current authentication system

### Monitoring Integration
- Health check endpoints preserved
- Logging configuration maintained
- Error handling aligned with existing patterns

## Future Considerations

### High Availability
- Load balancer integration ready
- Multiple backend server support
- SSL certificate sharing preparation

### Monitoring Enhancement
- Nginx access log analysis
- SSL certificate expiration monitoring
- Performance metrics collection

### Security Hardening
- Rate limiting implementation
- DDoS protection configuration
- Web Application Firewall integration

## Maintenance Procedures

### Regular Maintenance
```bash
# Monthly SSL certificate check
sudo certbot renew --dry-run

# Nginx configuration validation
sudo nginx -t && sudo systemctl reload nginx

# Log rotation check
sudo logrotate -f /etc/logrotate.d/nginx
```

### Emergency Procedures
```bash
# Disable SSL temporarily
sudo rm /etc/nginx/sites-enabled/videos.neversatisfiedxo.com
echo "server { listen 80; server_name videos.neversatisfiedxo.com; location / { return 503; } }" > /etc/nginx/sites-enabled/maintenance
sudo systemctl reload nginx

# Restore from backup
sudo cp /etc/nginx/sites-available/videos.neversatisfiedxo.com.backup /etc/nginx/sites-available/videos.neversatisfiedxo.com
sudo systemctl reload nginx
```

---

**Documentation Status**: Complete  
**Last Updated**: January 12, 2025  
**Version**: 1.0 - Initial nginx deployment integration
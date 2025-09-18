# 🚀 Production Deployment Guide v2.6.3

## Overview
This guide provides the best method to clean up and deploy the latest version of neversatisfiedxo Premium Trailer Gallery to Hostinger VPS.

## 🎯 Recommended Deployment Method

### **Option 1: Complete Clean Deployment (Recommended)**
This is the safest and most reliable method for production deployment.

```bash
# 1. Clean VPS completely
./scripts/clean-vps-v2.6.3.sh

# 2. Deploy fresh version
./scripts/deploy-production-v2.6.3.sh
```

### **Option 2: GitHub-based Deployment**
If you prefer to pull from GitHub instead of local sync:

```bash
# 1. Clean VPS
./scripts/clean-vps-v2.6.3.sh

# 2. Clone from GitHub on VPS
ssh root@82.180.137.156 "cd /root && git clone https://github.com/dsosaa/neversatisfiedxo-v1.git v0-trailer"

# 3. Deploy
./scripts/deploy-production-v2.6.3.sh
```

## 🔧 What's Included in v2.6.3

### **Essential Files Verified:**
- ✅ **neversatisfiedxo-logo.png** (268KB) - Main brand logo
- ✅ **SSL Certificates** (cert.pem, key.pem) - HTTPS encryption
- ✅ **Favicon & Icons** - Browser icons and PWA support
- ✅ **VideoDB.csv** - Video metadata database
- ✅ **Service Worker** (sw.js) - PWA functionality

### **Enhanced Features:**
- 🕒 **Duration Badges** - Clock icons on trailer cards
- 🏥 **Robust Health Checks** - wget/curl fallback options
- 🐳 **Enhanced Docker Assets** - Complete asset inclusion
- 🔒 **SSL Certificate Management** - Proper certificate mounting
- 📱 **PWA Support** - Service worker and manifest

## 🛠️ Deployment Process

### **Step 1: Pre-deployment Checklist**
- [ ] Ensure you have SSH access to VPS
- [ ] Verify SSH key is in `~/.ssh/` directory
- [ ] Confirm all changes are committed to GitHub
- [ ] Test locally with `npm run dev`

### **Step 2: Clean VPS**
```bash
# Run cleanup script
./scripts/clean-vps-v2.6.3.sh
```

**What this does:**
- Stops all running containers
- Removes all Docker images, volumes, and networks
- Clears system caches and Nginx cache
- Creates backup before cleanup
- Restarts Docker service

### **Step 3: Deploy New Version**
```bash
# Run deployment script
./scripts/deploy-production-v2.6.3.sh
```

**What this does:**
- Syncs latest code to VPS
- Verifies essential files are present
- Builds new containers with no cache
- Starts services with robust health checks
- Runs comprehensive health checks
- Tests key features

## 🔍 Health Check Improvements

### **MediaCMS Health Checks:**
- **Primary**: `wget --no-verbose --tries=1 --spider http://localhost/`
- **Fallback**: `curl -f http://localhost/`
- **Retries**: 5 attempts
- **Timeout**: 15 seconds
- **Start Period**: 180 seconds

### **Web Service Health Checks:**
- **Primary**: `node healthcheck.js`
- **Fallback**: `curl -f http://localhost:3000/api/health`
- **Retries**: 5 attempts
- **Timeout**: 10 seconds
- **Start Period**: 90 seconds

## 📊 Verification Steps

### **After Deployment, Verify:**
1. **Gallery Access**: https://videos.neversatisfiedxo.com/gallery
2. **API Endpoints**: https://videos.neversatisfiedxo.com/api/trailers
3. **Duration Badges**: Check trailer cards for clock icons
4. **SSL Certificates**: Verify HTTPS is working
5. **Health Check**: https://videos.neversatisfiedxo.com/api/health

### **Container Status:**
```bash
# Check running containers
ssh root@82.180.137.156 "cd /root/v0-trailer && docker compose -f docker-compose.production.yml ps"

# Check logs if issues
ssh root@82.180.137.156 "cd /root/v0-trailer && docker compose -f docker-compose.production.yml logs web"
```

## 🚨 Troubleshooting

### **If MediaCMS is Unhealthy:**
- The new health checks are more robust but may take longer
- Check logs: `docker compose -f docker-compose.production.yml logs mediacms`
- MediaCMS may need up to 3 minutes to fully start

### **If Web Service Fails:**
- Check logs: `docker compose -f docker-compose.production.yml logs web`
- Verify all essential files are present
- Check SSL certificates are properly mounted

### **If Health Checks Fail:**
- The new health checks have fallback options
- Check if both wget and curl are available
- Verify network connectivity

## 🔄 Rollback Process

If deployment fails, you can rollback:

```bash
# Restore from backup
ssh root@82.180.137.156 "cd /root && cp -r /root/backups/v0-trailer-[timestamp] /root/v0-trailer"

# Start previous version
ssh root@82.180.137.156 "cd /root/v0-trailer && docker compose -f docker-compose.production.yml up -d"
```

## 📝 Environment Variables

Ensure these are set on the VPS:
- `NEXT_PUBLIC_SITE_NAME=neversatisfiedxo`
- `NEXT_PUBLIC_BASE_URL=https://videos.neversatisfiedxo.com`
- `JWT_SECRET` (your JWT secret)
- `POSTGRES_PASSWORD` (your database password)
- `REDIS_PASSWORD` (your Redis password)
- `DJANGO_SECRET_KEY` (your Django secret key)

## 🎉 Success Indicators

You'll know deployment is successful when:
- ✅ All containers show "Up" status
- ✅ Health checks pass
- ✅ Gallery loads with duration badges
- ✅ SSL certificates work
- ✅ API endpoints respond
- ✅ No error logs in containers

## 📞 Support

If you encounter issues:
1. Check container logs first
2. Verify all essential files are present
3. Ensure environment variables are set
4. Check VPS disk space and resources
5. Verify network connectivity

---

**Last Updated**: September 18, 2025  
**Version**: 2.6.3  
**Target**: Hostinger VPS (82.180.137.156)

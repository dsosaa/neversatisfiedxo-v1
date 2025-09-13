# Production Deployment Guide v2.6.0

## Overview

This guide covers deploying the neversatisfiedxo Premium Trailer Gallery v2.6.0 to production VPS with complete cache clearing and container updates.

## Prerequisites

- SSH access to VPS (82.180.137.156)
- Docker and Docker Compose installed on VPS
- Local machine with rsync and curl
- Environment variables configured

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Clean VPS and deploy v2.6.0
./scripts/clean-vps-v2.6.0.sh
./scripts/deploy-production-v2.6.0.sh
```

### Option 2: Manual Step-by-Step

```bash
# 1. Clean VPS
./scripts/clean-vps-v2.6.0.sh

# 2. Deploy to production
./scripts/deploy-production-v2.6.0.sh
```

## What the Scripts Do

### Clean VPS Script (`clean-vps-v2.6.0.sh`)
- Creates backup of current deployment
- Stops all running containers
- Removes all Docker containers, images, volumes, and networks
- Clears Docker system cache
- Clears Nginx cache
- Clears system caches
- Cleans up old logs and backups
- Restarts Docker service

### Deploy Production Script (`deploy-production-v2.6.0.sh`)
- Creates backup of current production
- Stops and cleans current containers
- Clears Docker cache
- Syncs latest code to VPS
- Sets proper permissions
- Builds new containers with no cache
- Starts services
- Runs health checks
- Tests key features
- Clears Nginx cache

## Manual Deployment Steps

If you prefer to run commands manually:

### 1. Connect to VPS
```bash
ssh root@82.180.137.156
```

### 2. Create Backup
```bash
mkdir -p /root/backups/v0-trailer-$(date +%Y%m%d-%H%M%S)
cp -r /root/v0-trailer /root/backups/v0-trailer-$(date +%Y%m%d-%H%M%S)/
```

### 3. Stop and Clean Containers
```bash
cd /root/v0-trailer
docker compose -f docker-compose.production.yml down --remove-orphans --volumes
docker system prune -af --volumes
docker builder prune -af
```

### 4. Sync Code (from local machine)
```bash
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'venv' \
    --exclude '__pycache__' \
    --exclude '*.log' \
    --exclude '.env.local' \
    ./ root@82.180.137.156:/root/v0-trailer/
```

### 5. Build and Start
```bash
# On VPS
cd /root/v0-trailer
chmod +x scripts/*.sh
docker compose -f docker-compose.production.yml build --no-cache --pull
docker compose -f docker-compose.production.yml up -d
```

### 6. Verify Deployment
```bash
# Check container status
docker compose -f docker-compose.production.yml ps

# Check health
curl -k https://videos.neversatisfiedxo.com/api/health

# Check gallery
curl -k https://videos.neversatisfiedxo.com/gallery
```

## Environment Variables

Ensure these are set on the VPS:

```bash
# Core application
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code
NEXT_PUBLIC_BASE_URL=https://videos.neversatisfiedxo.com
GATE_PASSWORD=yesmistress

# Cloudflare
CF_ACCOUNT_ID=your_account_id
CF_STREAM_API_TOKEN=your_stream_token
CF_GLOBAL_API_KEY=your_global_key

# Security
JWT_SECRET=your_jwt_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/trailer_db
REDIS_URL=redis://localhost:6379
```

## Verification Checklist

After deployment, verify:

- [ ] Gallery accessible at https://videos.neversatisfiedxo.com/gallery
- [ ] Password "yesmistress" works
- [ ] Video streaming works with 4K support
- [ ] High-quality thumbnails display (15ms timestamps)
- [ ] Blue scrollbar theme is active
- [ ] API endpoints respond correctly
- [ ] Health check passes
- [ ] No console errors
- [ ] Performance is optimal

## Troubleshooting

### Common Issues

1. **Health Check Fails**
   ```bash
   # Check container logs
   docker compose -f docker-compose.production.yml logs web
   
   # Check container status
   docker compose -f docker-compose.production.yml ps
   ```

2. **Video Not Loading**
   - Verify Cloudflare Stream customer code
   - Check video UIDs in database
   - Verify API endpoints

3. **Images Not Displaying**
   - Check thumbnail URL generation
   - Verify Cloudflare access
   - Check browser console for errors

4. **Performance Issues**
   - Check Docker resource usage
   - Verify Nginx configuration
   - Check system resources

### Rollback

If issues occur, rollback to backup:

```bash
# Stop current containers
docker compose -f docker-compose.production.yml down

# Restore from backup
cp -r /root/backups/v0-trailer-YYYYMMDD-HHMMSS/* /root/v0-trailer/

# Start previous version
docker compose -f docker-compose.production.yml up -d
```

## Post-Deployment

### Monitor Performance
- Check container health: `docker compose -f docker-compose.production.yml ps`
- Monitor logs: `docker compose -f docker-compose.production.yml logs -f`
- Check system resources: `htop` or `docker stats`

### Clean Up
- Remove old backups after 7 days
- Monitor disk space
- Check for any error logs

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs
3. Verify environment variables
4. Check VPS system resources
5. Contact support if needed

---

**Version**: 2.6.0 - Premium Visual Experience & Performance Optimization  
**Last Updated**: January 15, 2025  
**Status**: Production-ready with 4K video support, high-quality media, and enhanced user experience

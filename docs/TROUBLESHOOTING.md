# Troubleshooting Guide - Version 2.3

This guide covers common issues and their solutions for the neversatisfiedxo Premium Trailer Gallery.

## 🎉 Recently Resolved Issues

All major issues reported in previous versions have been resolved in v2.3:

### ✅ Thumbnail Display Issue
**Problem**: Video thumbnails showing loading spinners instead of actual images
**Root Cause**: Intersection Observer not properly triggering image loading
**Solution**: Fixed `OptimizedImage` component with proper Intersection Observer implementation
**Status**: ✅ **RESOLVED** - All thumbnails now display correctly

### ✅ Scrollbar Styling Issue
**Problem**: Scrollbar not showing light blue theme color
**Root Cause**: CSS scrollbar styling not being applied consistently
**Solution**: Updated `globals.css` with explicit hex color values (#51c1f5)
**Status**: ✅ **RESOLVED** - Light blue scrollbar now visible across all browsers

### ✅ Favicon Display Issue
**Problem**: White spade icon not displaying in browser tabs
**Root Cause**: Missing explicit favicon metadata configuration
**Solution**: Added `metadata.icons` configuration in `layout.tsx`
**Status**: ✅ **RESOLVED** - White spade favicon now displays correctly

### ✅ SSL Certificate Issue
**Problem**: "Your connection is not private" errors
**Root Cause**: Self-signed certificates causing browser security warnings
**Solution**: Generated and installed valid Let's Encrypt certificates
**Status**: ✅ **RESOLVED** - Valid SSL certificates now active

### ✅ Gallery Access Issue
**Problem**: Gallery page redirecting to home page
**Root Cause**: Explicit redirect in `gallery/page.tsx` and middleware configuration
**Solution**: Fixed page component and middleware to allow direct access
**Status**: ✅ **RESOLVED** - Gallery page now accessible directly

### ✅ Rate Limiting Issue
**Problem**: "Too Many Requests" (429) errors preventing content loading
**Root Cause**: Aggressive rate limiting configuration
**Solution**: Increased rate limits and added debugging mechanisms
**Status**: ✅ **RESOLVED** - Rate limiting now optimized for legitimate requests

## 🔧 Current Troubleshooting

### Thumbnail Images Not Displaying
**Symptoms**: Gallery shows loading spinners instead of video thumbnails
**Possible Causes**:
1. Browser cache issues
2. JavaScript errors preventing Intersection Observer
3. Cloudflare Stream customer code not set
4. Network connectivity issues

**Solutions**:
1. **Clear browser cache**: Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Check browser console**: Look for JavaScript errors
3. **Verify environment variables**: Ensure `NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE` is set
4. **Test image loading**: Visit `/test-image` page to verify basic functionality
5. **Check network tab**: Verify image requests are being made

### SSL Certificate Warnings
**Symptoms**: "Your connection is not private" or certificate warnings
**Possible Causes**:
1. Accessing site with `www` subdomain
2. Browser cache with old certificate
3. Certificate not properly installed

**Solutions**:
1. **Use correct URL**: Access `https://videos.neversatisfiedxo.com` (without www)
2. **Clear browser cache**: Remove all cached data
3. **Check certificate**: Run `curl -I https://videos.neversatisfiedxo.com`
4. **Try different browser**: Test in incognito/private mode

### Gallery Page Redirects
**Symptoms**: Gallery page redirects to home page or login
**Possible Causes**:
1. Not logged in with correct password
2. Middleware configuration issues
3. Browser cookie problems

**Solutions**:
1. **Login correctly**: Use password `yesmistress`
2. **Clear cookies**: Remove all site cookies
3. **Check middleware**: Verify `/gallery` is in `PUBLIC_PATHS`
4. **Try direct access**: Go directly to `/gallery` after login

### Rate Limiting Issues
**Symptoms**: "Too Many Requests" (429) errors
**Possible Causes**:
1. Too many requests in short time
2. Rate limit configuration too strict
3. Browser making excessive requests

**Solutions**:
1. **Wait and retry**: Wait 5-10 minutes before retrying
2. **Clear browser cache**: Remove cached data
3. **Check rate limits**: Verify configuration in middleware
4. **Use different browser**: Test in incognito mode

## 🔍 Health Check Endpoints

### Basic Health Check
```bash
curl https://videos.neversatisfiedxo.com/api/health
```
**Expected Response**: `{"status":"ok","timestamp":"..."}`

### Detailed Health Check
```bash
curl https://videos.neversatisfiedxo.com/api/health?detailed=true
```
**Expected Response**: Detailed system status including database, Redis, and services

### Test Image Loading
```bash
curl https://videos.neversatisfiedxo.com/test-image
```
**Expected Response**: HTML page with test image (should load without errors)

## 🐛 Debugging Steps

### 1. Check Application Logs
```bash
# View web container logs
docker logs v0_trailer_web

# View specific service logs
docker logs v0_trailer_mediacms
docker logs v0_trailer_nginx
```

### 2. Verify Environment Variables
```bash
# Check if required variables are set
docker exec v0_trailer_web env | grep -E "(CF_STREAM|GATE_PASSWORD)"
```

### 3. Test Database Connection
```bash
# Test PostgreSQL connection
docker exec v0_trailer_postgres psql -U mediacms -d mediacms -c "SELECT 1;"
```

### 4. Check Container Status
```bash
# View all container status
docker ps

# Check specific container health
docker inspect v0_trailer_web | grep -A 5 "Health"
```

## 📊 Performance Monitoring

### Check Response Times
```bash
# Test API response time
curl -w "@curl-format.txt" -o /dev/null -s https://videos.neversatisfiedxo.com/api/health

# Create curl-format.txt with:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect:    %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total:       %{time_total}\n
```

### Monitor Resource Usage
```bash
# Check container resource usage
docker stats v0_trailer_web v0_trailer_mediacms v0_trailer_nginx

# Check system resources
htop
```

## 🚨 Emergency Procedures

### Service Down
1. **Check container status**: `docker ps`
2. **Restart services**: `docker compose restart`
3. **Check logs**: `docker logs <container_name>`
4. **Verify health**: `curl https://videos.neversatisfiedxo.com/api/health`

### Database Issues
1. **Check PostgreSQL**: `docker logs v0_trailer_postgres`
2. **Test connection**: `docker exec v0_trailer_postgres psql -U mediacms -d mediacms -c "SELECT 1;"`
3. **Restart database**: `docker restart v0_trailer_postgres`

### SSL Certificate Issues
1. **Check certificate**: `openssl s_client -connect videos.neversatisfiedxo.com:443 -servername videos.neversatisfiedxo.com`
2. **Renew certificate**: `sudo certbot renew --dry-run`
3. **Restart nginx**: `docker restart v0_trailer_nginx`

## 📞 Getting Help

### Before Contacting Support
1. **Check this guide** for your specific issue
2. **Review application logs** for error messages
3. **Test health endpoints** to verify system status
4. **Clear browser cache** and try again
5. **Check browser console** for JavaScript errors

### Information to Provide
When reporting issues, include:
- **Error message**: Exact error text
- **Steps to reproduce**: What you were doing when the error occurred
- **Browser information**: Browser type and version
- **Screenshot**: If applicable
- **Console logs**: Any JavaScript errors
- **Health check results**: Output from `/api/health`

### Contact Information
- **Documentation**: Check this guide and main README
- **Health Status**: Visit `/api/health` for system status
- **Test Endpoints**: Use `/test-image` for image loading tests

---

**Last Updated**: January 2025  
**Version**: 2.3 - Advanced Enterprise Optimizations  
**Status**: All major issues resolved, system fully operational

# Troubleshooting Guide

## 🔧 Common Issues & Solutions for neversatisfiedxo Premium Trailer Gallery

This guide covers common issues, error messages, and their solutions for the neversatisfiedxo Premium Trailer Gallery v2.6.3.

## 🚨 **Critical Issues**

### **Application Won't Start**

#### **Issue**: `EADDRINUSE: address already in use :::3000`
**Symptoms**: Server fails to start, port 3000 already in use
**Solution**:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Alternative method
sudo fuser -k 3000/tcp

# Restart development server
npm run dev
```

#### **Issue**: `npm error Missing script: "dev"`
**Symptoms**: npm script not found error
**Solution**:
```bash
# Ensure you're in the correct directory
cd apps/web

# Verify package.json exists
ls package.json

# Install dependencies if needed
npm install

# Run dev script
npm run dev
```

#### **Issue**: Docker containers not starting
**Symptoms**: Docker Compose fails to start services
**Solution**:
```bash
# Check Docker daemon
docker --version
systemctl status docker  # On Linux

# Clean up Docker resources
docker system prune -f
docker-compose down
docker-compose up -d

# Check logs for specific errors
docker-compose logs -f web
```

### **Authentication Issues**

#### **Issue**: Password authentication not working
**Symptoms**: "Invalid access code" error with correct password
**Solution**:
```bash
# Check authentication API
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"password": "yesmistress"}'

# Verify middleware configuration
cat apps/web/src/middleware.ts

# Check environment variables
echo $NEXTAUTH_SECRET
```

#### **Issue**: Infinite redirect loops
**Symptoms**: Page keeps redirecting between /enter and /gallery
**Solution**:
```typescript
// Check middleware logic in apps/web/src/middleware.ts
// Ensure proper authentication state handling
```

### **Video Playback Issues**

#### **Issue**: Videos showing white/black screens
**Symptoms**: Video iframes display blank screens instead of content
**Solution**:
```bash
# Verify Cloudflare Stream configuration
echo $NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE

# Test direct video URL
curl -I "https://iframe.videodelivery.net/VIDEO_UID"

# Check video UID mapping
cat data/VideoDB.csv | head -5
```

#### **Issue**: Thumbnails not loading
**Symptoms**: Image placeholders instead of video thumbnails
**Solution**:
```typescript
// Verify thumbnail URL format in OptimizedThumbnail component
// Check 5ms timestamp parameter: time=0.005s
// Ensure WebP format is supported
```

## 🐛 **Development Issues**

### **TypeScript Errors**

#### **Issue**: `TS1005: ';' expected`
**Symptoms**: TypeScript compilation errors
**Solution**:
```bash
# Check syntax in affected files
npx tsc --noEmit

# Fix syntax errors (missing semicolons, brackets)
# Use VS Code TypeScript extension for real-time feedback
```

#### **Issue**: `TS2307: Cannot find module`
**Symptoms**: Import resolution errors
**Solution**:
```bash
# Verify file paths and exports
# Check tsconfig.json paths configuration
# Ensure proper file extensions (.ts, .tsx)

# Clear TypeScript cache
rm -rf apps/web/.next
rm -rf apps/web/tsconfig.tsbuildinfo
npm run build
```

#### **Issue**: `TS6133: Variable is declared but never used`
**Symptoms**: Unused variable warnings
**Solution**:
```typescript
// Remove unused imports/variables
// Or prefix with underscore: _unusedVariable
// Or disable for specific line: // eslint-disable-next-line @typescript-eslint/no-unused-vars
```

### **React/Hydration Issues**

#### **Issue**: `Hydration failed because the server rendered HTML didn't match the client`
**Symptoms**: React hydration mismatch errors
**Solution**:
```typescript
// Ensure consistent rendering between server and client
// Avoid browser-only APIs in server components
// Use useEffect for client-only code

// Example fix:
const [isClient, setIsClient] = useState(false)
useEffect(() => {
  setIsClient(true)
}, [])

return isClient ? <ClientComponent /> : <ServerComponent />
```

#### **Issue**: `Warning: Missing Description for DialogContent`
**Symptoms**: Accessibility warnings in console
**Solution**:
```typescript
// Add proper ARIA labels to dialog components
<DialogContent aria-describedby="dialog-description">
  <DialogDescription id="dialog-description">
    Description text here
  </DialogDescription>
</DialogContent>
```

### **Build Issues**

#### **Issue**: `Parsing ecmascript source code failed`
**Symptoms**: Build fails with parsing errors
**Solution**:
```bash
# Check for syntax errors in source files
# Look for missing brackets, parentheses, or quotes
# Use ESLint to identify issues
npm run lint

# Clear build cache
rm -rf apps/web/.next
npm run build
```

#### **Issue**: Bundle size too large
**Symptoms**: Slow loading times, large JavaScript bundles
**Solution**:
```bash
# Analyze bundle size
npm run analyze

# Implement code splitting
# Use dynamic imports for large components
# Remove unused dependencies
```

## 🌐 **Production Issues**

### **Deployment Problems**

#### **Issue**: SSL certificate not working
**Symptoms**: HTTPS not accessible, certificate errors
**Solution**:
```bash
# Check certificate status
certbot certificates

# Renew certificate
certbot renew --force-renewal

# Verify Nginx configuration
nginx -t
systemctl reload nginx
```

#### **Issue**: Domain not resolving
**Symptoms**: videos.neversatisfiedxo.com not accessible
**Solution**:
```bash
# Check DNS resolution
nslookup videos.neversatisfiedxo.com

# Verify A record points to correct IP
dig videos.neversatisfiedxo.com

# Check firewall settings
ufw status
```

#### **Issue**: Docker containers not starting on VPS
**Symptoms**: Services fail to start in production
**Solution**:
```bash
# Check Docker daemon status
systemctl status docker

# Verify Docker Compose file
docker-compose -f docker-compose.prod-unified.yml config

# Check system resources
free -h
df -h

# View container logs
docker-compose -f docker-compose.prod-unified.yml logs -f
```

### **Performance Issues**

#### **Issue**: Slow page loading
**Symptoms**: Long load times, poor performance scores
**Solution**:
```bash
# Check server resources
htop
iostat -x 1

# Analyze bundle size
npm run analyze

# Implement caching strategies
# Optimize images and assets
# Use CDN for static content
```

#### **Issue**: High memory usage
**Symptoms**: Server running out of memory
**Solution**:
```bash
# Monitor memory usage
free -h
docker stats

# Optimize Docker resource limits
# Implement memory-efficient caching
# Review application memory usage
```

## 🔍 **Debugging Tools**

### **Browser DevTools**
```javascript
// Console debugging
console.log('Debug info:', data)
console.table(arrayData)
console.group('Group name')
console.time('Operation name')

// Performance monitoring
performance.mark('start')
// ... operation ...
performance.mark('end')
performance.measure('operation', 'start', 'end')
```

### **Network Debugging**
```bash
# Check API responses
curl -v http://localhost:3000/api/trailers

# Monitor network requests
# Use browser Network tab
# Check for failed requests or slow responses
```

### **Database Debugging**
```bash
# Check database connection (if using external DB)
psql -h hostname -U username -d database

# SQLite debugging
sqlite3 apps/mediacms/db.sqlite3
.tables
.schema trailers_trailermeta
```

## 📊 **Monitoring & Logs**

### **Application Logs**
```bash
# Frontend logs
docker-compose logs -f web

# Backend logs
docker-compose logs -f mediacms

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### **System Monitoring**
```bash
# System resources
htop
iotop
netstat -tulpn

# Disk usage
df -h
du -sh /opt/neversatisfiedxo/*

# Process monitoring
ps aux | grep node
ps aux | grep nginx
```

## 🛠️ **Recovery Procedures**

### **Complete Reset**
```bash
# Stop all services
docker-compose down
systemctl stop nginx

# Clean up Docker
docker system prune -af
docker volume prune -f

# Restore from backup
tar -xzf backup-YYYYMMDD.tar.gz -C /

# Restart services
docker-compose up -d
systemctl start nginx
```

### **Database Recovery**
```bash
# Backup current database
cp apps/mediacms/db.sqlite3 db-backup-$(date +%Y%m%d).sqlite3

# Restore from backup
cp db-backup-YYYYMMDD.sqlite3 apps/mediacms/db.sqlite3

# Run migrations
cd apps/mediacms
python manage.py migrate
```

### **Configuration Recovery**
```bash
# Restore Nginx configuration
cp /etc/nginx/sites-available/videos.neversatisfiedxo.com.backup \
   /etc/nginx/sites-available/videos.neversatisfiedxo.com

# Restore SSL certificates
cp -r /etc/letsencrypt.backup/* /etc/letsencrypt/

# Test and reload
nginx -t
systemctl reload nginx
```

## 🆘 **Emergency Contacts**

### **Critical Issues**
- **Server Down**: Check Hostinger VPS status
- **SSL Issues**: Verify Let's Encrypt service
- **Domain Issues**: Check DNS provider settings

### **Support Resources**
- **Documentation**: `/docs` directory
- **Logs**: Application and system logs
- **Monitoring**: Performance metrics and health checks

## 📝 **Issue Reporting**

When reporting issues, include:
1. **Error Message**: Complete error text
2. **Steps to Reproduce**: Detailed reproduction steps
3. **Environment**: OS, Node.js version, Docker version
4. **Logs**: Relevant log entries
5. **Screenshots**: Visual evidence if applicable

### **Issue Template**
```
**Issue**: Brief description
**Environment**: 
- OS: 
- Node.js: 
- Docker: 
- Browser: 

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:

**Actual Behavior**:

**Logs**:
```

---

**Troubleshooting Guide**: ✅ Comprehensive Coverage  
**Last Updated**: January 2025  
**Version**: 2.6.3
# Docker Deployment Issues & Solutions

## Summary
This document captures all issues encountered during the v2.4 full VPS deployment and their solutions to prevent future deployment problems.

## Critical Issues Resolved

### 1. Next.js Experimental Features Configuration Error
**Error**: 
```
The experimental feature 'experimental.ppr' can only be enabled when using the latest canary version of Next.js
```

**Root Cause**: Using experimental features not available in stable Next.js 15.5.2
**Files Affected**: `apps/web/next.config.ts`
**Solution**: Disabled experimental features for stable release
```typescript
// Fixed configuration
experimental: {
  // Next.js 15 stable features (experimental features disabled for stable release)
  // ppr: true, // Partial Prerendering - requires canary version
  // reactCompiler: true, // React 19 compiler - requires canary version
  // cacheComponents: true, // Enhanced component caching - requires canary version
}
```

### 2. Docker Compose Container Name Conflicts
**Error**:
```
services.deploy.replicas: can't set container_name and web as container name must be unique
```

**Root Cause**: Deploy sections with replicas conflicting with container_name in single-instance deployment
**Files Affected**: `docker-compose.yml`, `docker-compose.dev.yml`
**Solution**: 
- Removed all deploy sections from main docker-compose.yml
- Created separate docker-compose.production.yml for production deployment
- Updated development compose to use single container configuration

### 3. Missing Dockerfile Reference
**Error**:
```
failed to read dockerfile: open Dockerfile.web-ultra-fast: no such file or directory
```

**Root Cause**: Docker Compose referencing non-existent Dockerfile variant
**Files Affected**: `docker-compose.dev.yml`
**Solution**: Updated dockerfile reference to existing `Dockerfile`
```yaml
# Fixed configuration
build:
  context: .
  dockerfile: Dockerfile  # Changed from Dockerfile.web-ultra-fast
  target: runner          # Changed from development
```

### 4. Invalid Docker Build Target
**Error**:
```
target stage 'development' could not be found
```

**Root Cause**: Docker Compose referencing non-existent build target
**Files Affected**: `docker-compose.dev.yml`
**Solution**: Changed target to existing `runner` stage

### 5. Missing Health Check File
**Error**:
```
CMD ["node", "healthcheck.js"]: executable file not found
```

**Root Cause**: healthcheck.js file missing from Docker build context
**Files Affected**: Missing `healthcheck.js` at project root
**Solution**: Created healthcheck.js file
```javascript
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};
const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log('Health check failed with status:', res.statusCode);
    process.exit(1);
  }
});
req.on('timeout', () => {
  console.log('Health check timeout');
  req.destroy();
  process.exit(1);
});
req.on('error', (e) => {
  console.log('Health check error:', e.message);
  process.exit(1);
});
req.end();
```

## Successful Infrastructure Components

### ✅ PostgreSQL 16-alpine
- Database service deployed successfully
- Health checks passing
- Connection validation working

### ✅ Redis 7-alpine  
- Cache service operational
- Authentication configured
- Connection pooling active

### ✅ SSL Certificates
- Let's Encrypt certificates installed
- HTTPS redirection working
- Multi-domain support (videos.neversatisfiedxo.com, www variant)

### ✅ Nginx Reverse Proxy
- SSL termination configured
- API routing configured
- Static file serving optimized

## Prevention Strategies

### 1. Pre-Deployment Validation
```bash
# Add these checks before deployment
npm run type-check          # TypeScript validation
npm run build              # Production build test
npm run security:check     # Security audit
docker compose config      # Validate compose files
```

### 2. Docker Configuration Best Practices
- Keep deploy sections separate in production-specific compose files
- Use consistent dockerfile references across all compose files
- Ensure all referenced files exist in build context
- Test build targets exist in Dockerfiles before referencing

### 3. Environment Management
- Use .env.production.template for consistent production setup
- Validate all required environment variables before deployment
- Generate secure passwords/keys for production
- Test environment variable interpolation in compose files

### 4. File Structure Requirements
Essential files for Docker deployment:
- `healthcheck.js` - Container health monitoring
- `Dockerfile` - Primary container build instructions
- `.env` - Environment configuration
- `docker-compose.yml` - Base service configuration
- `docker-compose.production.yml` - Production-specific overrides

## Deployment Order
1. **Infrastructure First**: PostgreSQL, Redis, Nginx
2. **Validate Database**: Connection tests and health checks
3. **Application Services**: Web frontend, MediaCMS backend
4. **Final Validation**: End-to-end testing

## Quick Fix Checklist
Before any Docker deployment:
- [ ] All experimental Next.js features commented out for stable release
- [ ] Docker Compose files reference existing Dockerfile
- [ ] Build targets exist in referenced Dockerfiles
- [ ] healthcheck.js file exists in project root
- [ ] No deploy sections in single-instance configurations
- [ ] All environment variables defined in .env
- [ ] Docker build context includes all referenced files

## Files Modified/Created
- ✅ `healthcheck.js` (created)
- ✅ `docker-compose.yml` (deploy sections removed)
- ✅ `docker-compose.dev.yml` (dockerfile references fixed)  
- ✅ `docker-compose.production.yml` (created)
- ✅ `.env.production.template` (created)
- ✅ `apps/web/next.config.ts` (experimental features disabled)

## Result
All Docker configuration issues resolved. Infrastructure deployed successfully. Application containers ready for deployment with fixed configurations.
# 🚀 Development Workflow Guide

Optimized development and deployment workflows for **neversatisfiedxo Premium Trailer Gallery**.

## 📋 **Quick Start**

```bash
# Clone and setup
git clone https://github.com/nsxo/V0-Trailer.git
cd V0-Trailer
make setup

# Start development
make dev

# Access services
# Frontend: http://localhost:3000
# Backend: http://localhost:8000  
# Admin: http://localhost:8000/admin/
```

## 🛠️ **Development Commands**

### **Daily Development**
```bash
make dev              # Start development environment
make dev-logs         # Show live logs
make dev-clean        # Clean restart (rebuild containers)
make health           # Check system health
```

### **Code Quality**
```bash
make lint             # TypeScript + ESLint
make test             # Complete test suite
make test-e2e         # Playwright end-to-end tests
make security         # Security audit
```

### **Performance & Analysis**
```bash
make build-analyze    # Bundle analysis
make perf             # Lighthouse performance test
make monitor          # Resource monitoring
```

### **Database Operations**
```bash
make db-backup        # Create database backup
make db-restore FILE=backup.sql  # Restore from backup
```

## 🏗️ **Development Architecture**

### **Hot Reload Development**
- **Frontend**: Next.js with Turbopack for ultra-fast HMR
- **Backend**: Django with debug mode and auto-reload
- **Database**: PostgreSQL 16-alpine with persistent volumes
- **Cache**: Redis 7-alpine for session management

### **Development vs Production**
| Feature | Development | Production |
|---------|-------------|------------|
| **Hot Reload** | ✅ Enabled | ❌ Disabled |
| **Debug Mode** | ✅ Full debugging | ❌ Security focused |
| **Resource Limits** | ❌ Unlimited | ✅ Strict limits |
| **Replicas** | 1 instance | 2 instances (HA) |
| **Volumes** | Dev-specific | Production-optimized |
| **Security Headers** | ⚠️ Relaxed | ✅ Strict CSP |

## 🔄 **Development Workflow**

### **Feature Development**
```bash
# 1. Start development environment
make dev

# 2. Make code changes (hot reload active)
# Frontend: apps/web/src/
# Backend: apps/mediacms/

# 3. Run tests during development
make lint              # Quick feedback
make test-e2e          # Full user journey testing

# 4. Performance check
make perf              # Lighthouse audit

# 5. Security validation
make security          # Dependency audit
```

### **Pre-Commit Workflow**
```bash
# Complete validation before commit
make test              # Full test suite
make build             # Production build test
make security          # Security scan

# If all pass, commit and push
git add .
git commit -m "feat: implement new feature"
git push origin feature-branch
```

## 🚀 **Deployment Workflow**

### **Staging Deployment**
```bash
# Deploy to staging environment
make deploy-staging

# Test staging
curl -I https://staging.videos.neversatisfiedxo.com/
```

### **Production Deployment**
```bash
# Deploy to production
make deploy DOMAIN=videos.neversatisfiedxo.com

# Monitor deployment
make prod-logs
make health
```

## 🔧 **Configuration Management**

### **Environment Files**
```
.env                    # Local development
.env.production        # Production settings
apps/web/.env.local    # Frontend-specific
```

### **Docker Profiles**
```bash
# Development (default)
docker compose up

# Development with specific file  
docker compose -f docker-compose.dev.yml up

# Production
docker compose --profile production up

# Production with monitoring
docker compose --profile monitoring up
```

## 📊 **Performance Optimization**

### **Next.js 15 Features Enabled**
- ✅ **Partial Prerendering (PPR)**: Optimal performance
- ✅ **React Compiler**: React 19 optimization  
- ✅ **Dynamic I/O**: New I/O optimization
- ✅ **Turbopack**: Ultra-fast development builds

### **Production Optimizations**
- ✅ **Bundle Splitting**: Optimized chunk strategy
- ✅ **Image Optimization**: WebP/AVIF with lazy loading
- ✅ **Caching Strategy**: Multi-layer with TanStack Query
- ✅ **Security Headers**: CSP with nonces, HSTS, COEP/COOP
- ✅ **High Availability**: 2 replicas with rolling updates

## 🛡️ **Security Features**

### **Development Security**
- Rate limiting with Redis backend
- Request correlation IDs for debugging
- Security pattern detection
- Dependency vulnerability scanning

### **Production Security**
- Strict Content Security Policy with nonces
- Cross-origin isolation (COEP/COOP)
- JWT authentication with Web Crypto API
- Automated security audits in CI/CD

## 🧪 **Testing Strategy**

### **Test Pyramid**
```bash
# Unit Tests (Fast)
cd apps/web && npm run test:types

# Integration Tests
cd apps/web && npm run test:lint

# End-to-End Tests (Comprehensive)
make test-e2e
```

### **Continuous Testing**
- **Pre-commit**: Lint + type check
- **CI/CD**: Full test suite + security scan
- **Production**: Health checks + performance monitoring

## 🔍 **Debugging & Monitoring**

### **Local Debugging**
```bash
# View logs
make dev-logs                    # All services
docker compose logs -f web       # Frontend only
docker compose logs -f mediacms  # Backend only

# Debug ports (when containers running)
# Node.js: http://localhost:9229 (Chrome DevTools)
# Django: Port 5678 (Python debugger)
```

### **Health Monitoring**
```bash
# Quick health check
make health

# Detailed monitoring
make monitor

# Service-specific health
curl http://localhost:3000/api/health
curl http://localhost:8000/api/health
```

## 📈 **Performance Monitoring**

### **Core Web Vitals**
```bash
# Lighthouse audit
make perf

# Bundle analysis  
make build-analyze

# Resource monitoring
make monitor
```

### **Production Metrics**
- **LCP**: <2.5s (Large Contentful Paint)
- **FID**: <100ms (First Input Delay)  
- **CLS**: <0.1 (Cumulative Layout Shift)
- **Bundle Size**: <500KB initial, <2MB total

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```bash
# Check port usage
lsof -i :3000
lsof -i :8000

# Solution: Kill conflicting processes or change ports
```

#### **Database Connection Issues**
```bash
# Check PostgreSQL health
docker compose exec postgres pg_isready -U mediacms

# Solution: Restart database service
docker compose restart postgres
```

#### **Redis Connection Issues**
```bash
# Check Redis health  
docker compose exec redis redis-cli ping

# Solution: Verify REDIS_PASSWORD environment variable
```

#### **Build Failures**
```bash
# Clean rebuild
make dev-clean

# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
cd apps/web && npm cache clean --force
```

### **Getting Help**
1. Check this guide first
2. Review container logs: `make dev-logs`
3. Run health check: `make health`
4. Check GitHub Issues for similar problems

---

**Last Updated**: January 11, 2025  
**Version**: 2.3 with advanced enterprise optimizations
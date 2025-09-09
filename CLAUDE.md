# neversatisfiedxo Premium Trailer Gallery - Technical Documentation

## Project Overview

**neversatisfiedxo** is an enterprise-grade, premium media streaming platform built with modern web technologies. This full-stack application provides a password-protected gallery for premium video content with professional streaming capabilities, comprehensive security, and advanced performance optimization.

### Core Features
- **Premium Gallery**: Password-protected access with sophisticated authentication
- **Professional Streaming**: Cloudflare Stream integration with adaptive bitrate
- **Enterprise Security**: CSP headers, rate limiting, security monitoring
- **Modern UI/UX**: Dark theme, responsive design, smooth animations
- **Advanced Administration**: Enhanced Django admin with Cloudflare integration
- **Performance Optimization**: Caching, lazy loading, bundle optimization
- **Production Ready**: CI/CD pipeline, health monitoring, automated deployment

## Technical Architecture

### Frontend Stack
- **Next.js 15**: Latest App Router with Turbopack for fast development
- **React 19**: Modern hooks and concurrent features
- **TypeScript 5**: Strict mode with comprehensive type safety
- **Tailwind CSS 4**: Modern utility-first styling with custom design system
- **Framer Motion**: Advanced animations and transitions
- **TanStack Query**: Intelligent data fetching and caching
- **Radix UI**: Accessible, customizable component primitives

### Backend Stack
- **MediaCMS**: Django-based media management with custom trailer extensions
- **PostgreSQL 15**: Robust relational database with Alpine optimization
- **Redis 7**: High-performance caching and session management
- **Django REST Framework**: RESTful API with advanced filtering and pagination
- **Cloudflare Stream**: Professional video delivery with global CDN

### Infrastructure & DevOps
- **Docker Compose**: Multi-container orchestration with production profiles
- **Health Monitoring**: Comprehensive health checks and error reporting
- **Security Hardening**: CSP headers, rate limiting, vulnerability scanning
- **Performance Monitoring**: Core Web Vitals, Lighthouse CI, bundle analysis
- **CI/CD Pipeline**: Automated testing, security checks, and deployment validation

## Development Workflow

### Frontend Development
**Primary Commands:**
```bash
cd apps/web
npm run dev              # Start development server with Turbopack
npm run dev:secure       # Development with security validation
npm run dev:debug        # Development with Node.js inspector
```

**Build & Testing:**
```bash
npm run build            # Production build with security & type checks
npm run build:analyze    # Build with bundle analysis
npm run build:ci         # CI/CD build with strict validation
npm run type-check       # TypeScript validation
npm run lint             # ESLint with caching
npm run test             # Complete test suite
npm run test:e2e         # Playwright end-to-end tests
```

**Performance & Security:**
```bash
npm run security:check   # Security audit
npm run perf:lighthouse  # Lighthouse performance testing
npm run production:test  # Full production validation
```

### Backend Development
```bash
cd apps/mediacms
python manage.py runserver                    # Django development server
python manage.py migrate                      # Database migrations
python manage.py import_videodb <csv>         # Import video data
python manage.py test trailers               # Run trailer app tests
python manage.py test_cloudflare --check-config  # Cloudflare integration test
```

### Docker Operations
```bash
# Development
docker compose up -d                          # Start all services
docker compose --profile development up      # Development profile
docker compose logs -f web                   # View frontend logs

# Production
docker compose --profile production up -d    # Production deployment
docker compose --profile monitoring up -d    # With monitoring stack

# Maintenance
docker compose down -v                       # Stop and remove volumes
docker compose exec postgres psql -U mediacms -d mediacms  # Database access
```

## API Documentation

### Core Endpoints
- **Health Check**: `GET /api/health` - System status and diagnostics
- **Authentication**: `POST /api/gate` - Password verification
- **Trailers**: `GET /api/trailers/` - Video content with filtering
- **Featured**: `GET /api/trailers/featured/` - Premium featured content
- **Admin**: `GET /admin/trailers/trailermeta/` - Enhanced admin interface

### Query Parameters
```bash
# Search and filtering
/api/trailers/?search=title&creator=name&price_min=0&price_max=50
/api/trailers/?length_min=10&length_max=60&ordering=-created_date
/api/trailers/?is_featured=true&is_premium=false
```

### Health Monitoring
```bash
GET /api/health                    # Basic status
GET /api/health?detailed=true      # Comprehensive diagnostics
GET /api/health?check=database     # Specific service check
```

## Known Issues & Solutions

### 1. Production Build Optimization (RESOLVED)
**Issue**: Build process optimization for production deployment
**Solution**: Implemented comprehensive build pipeline with:
- Security validation (`npm run security:check`)
- Type checking (`npm run type-check`) 
- Linting with strict warnings (`npm run lint:strict`)
- Bundle analysis and optimization
- CI/CD integration with automated validation

### 2. Performance Optimization (ENHANCED)
**Previous**: Basic Docker setup without optimization
**Current**: Enterprise-grade performance stack:
- Turbopack for fast development builds
- Bundle analysis and code splitting
- Lighthouse CI integration
- Core Web Vitals monitoring
- Advanced caching strategies with TanStack Query

### 3. Security Hardening (IMPLEMENTED)
**Enhancement**: Added comprehensive security features:
- Content Security Policy (CSP) headers
- Rate limiting and DDoS protection
- Security audit automation
- Vulnerability scanning in CI/CD
- Environment variable validation

## Environment Configuration

### Core Application Settings
```env
# Brand & Identity
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
GATE_PASSWORD=yesmistress                    # Gallery access password

# Database Configuration
POSTGRES_PASSWORD=LasVegas123456
POSTGRES_USER=mediacms                       # Required for MediaCMS compatibility
POSTGRES_DB=mediacms

# Cache & Performance  
REDIS_PASSWORD=LasVegas123456
```

### Cloudflare Integration
```env
# Stream Configuration
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=d6a71f77965f2f32d7f3ebb03869b8d6
CF_ACCOUNT_ID=d6a71f77965f2f32d7f3ebb03869b8d6
CF_STREAM_API_TOKEN=rvWXyGVnRtQkQm_JXdhlJNcOjU-OC1yMSqmdw-xz
CF_GLOBAL_API_KEY=15a7e848888bc25e79400deee710e42406b03

# Optional Performance Optimization
NEXT_PUBLIC_GA_ID=                           # Google Analytics (optional)
NEXT_PUBLIC_HOTJAR_ID=                       # Hotjar tracking (optional)
```

### Security & API Configuration
```env
# Django Security
DJANGO_SECRET_KEY=super-secret-key-for-testing-only-change-in-production
MEDIACMS_API_TOKEN=8f4e2d1c9b7a6f3e5d2c8a4b6e1f9d7c5a8b2e4f

# Monitoring & Alerts
MONITORING_WEBHOOK_URL=                      # Webhook for system alerts
```

### Production Security Notes
⚠️ **Important**: All keys and passwords shown are for development only. For production deployment:
- Generate new secure passwords (minimum 32 characters)
- Use proper Django secret key generation
- Create new Cloudflare API tokens with minimal required permissions
- Enable environment variable validation in CI/CD pipeline

## Container Management

### Development Operations
```bash
# Start services
docker compose up -d                                    # All services
docker compose --profile development up -d             # Development profile
docker compose up -d postgres redis mediacms          # Backend only

# Monitoring & Logs
docker compose logs -f web                              # Frontend logs
docker compose logs -f mediacms                        # Backend logs  
docker compose exec postgres pg_isready -U mediacms    # Database health
docker compose exec redis redis-cli ping               # Cache health

# Maintenance
docker compose down                                     # Stop services
docker compose down -v                                 # Stop and remove volumes
docker compose restart web                             # Restart frontend
```

### Production Deployment
```bash
# Production services
docker compose --profile production up -d              # Production stack
docker compose --profile monitoring up -d              # With monitoring

# Security validation
docker compose exec web npm run security:check         # Frontend security
docker compose exec mediacms python manage.py check --deploy  # Django security

# Performance monitoring  
docker compose exec web npm run perf:lighthouse        # Performance check
```

### Database Operations
```bash
# Access database
docker compose exec postgres psql -U mediacms -d mediacms

# Backup & restore
docker compose exec postgres pg_dump -U mediacms mediacms > backup.sql
docker compose exec -T postgres psql -U mediacms -d mediacms < backup.sql

# Import video data
docker compose exec mediacms python manage.py import_videodb /app/data/VideoDB.csv --user admin
```

## System Health & Monitoring

### Health Check Endpoints
```bash
# Frontend health (Next.js)
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health?detailed=true

# Backend health (Django)
curl http://localhost:8000/api/health
curl http://localhost:8000/api/health?check=database

# Component health
curl http://localhost:8000/admin/                      # MediaCMS admin
curl http://localhost:3000/                           # Frontend gallery
```

### Service Status Validation
```bash
# Database connectivity
docker compose exec postgres pg_isready -U mediacms
docker compose exec postgres psql -U mediacms -d mediacms -c "SELECT 1;"

# Cache functionality  
docker compose exec redis redis-cli ping
docker compose exec redis redis-cli set test "health_check"

# Application services
docker compose ps                                      # Service status
docker compose top                                     # Resource usage
```

### Performance Monitoring
```bash
# Frontend performance
npm run perf:lighthouse                                # Lighthouse audit
npm run build:analyze                                  # Bundle analysis

# Backend performance
docker compose exec mediacms python manage.py diffsettings  # Django config
docker compose stats                                   # Resource usage

# End-to-end testing
npm run test:e2e                                      # Playwright tests
```

## Security & Compliance

### Security Validation
```bash
# Frontend security audit
npm run security:check                                # NPM audit
npm run lint:strict                                   # Code quality

# Backend security
python manage.py check --deploy                       # Django security
python manage.py test trailers                       # Application tests

# Container security
docker compose exec web npm audit --audit-level high  # Dependency scan
```

### Access Control
- **Gallery Access**: Password-protected via `GATE_PASSWORD` environment variable
- **Admin Access**: Django admin with user authentication
- **API Access**: Token-based authentication for admin operations
- **Database Access**: Restricted to application containers only

## Troubleshooting Guide

### Common Issues

#### 1. Container Startup Failures
**Symptoms**: Services fail to start or crash immediately
**Diagnostics**:
```bash
docker compose logs [service_name]                    # Check logs
docker compose ps                                     # Service status  
docker compose config                                 # Validate configuration
```
**Solutions**:
- Verify all environment variables are set correctly
- Check port availability (3000, 8000, 5432, 6379)
- Ensure Docker daemon has sufficient resources

#### 2. Database Connection Issues
**Symptoms**: Django cannot connect to PostgreSQL
**Diagnostics**:
```bash
docker compose exec postgres pg_isready -U mediacms   # Database readiness
docker compose logs postgres                          # Database logs
docker compose exec mediacms python manage.py dbshell  # Test connection
```
**Solutions**:
- Verify `POSTGRES_USER=mediacms` in environment
- Check database initialization completed successfully
- Restart services in correct order: `postgres` → `redis` → `mediacms` → `web`

#### 3. Frontend Build Failures  
**Symptoms**: Next.js build or development server fails
**Diagnostics**:
```bash
npm run type-check                                    # TypeScript validation
npm run lint                                          # Code quality check
npm run security:check                                # Dependency security
```
**Solutions**:
- Clear build cache: `npm run clean`
- Verify Node.js version compatibility (18+)
- Check TypeScript configuration and dependencies

#### 4. Video Playback Issues
**Symptoms**: Videos fail to load or play properly
**Diagnostics**:
```bash
# Verify Cloudflare configuration
curl "https://videodelivery.net/${CF_VIDEO_UID}/thumbnails/thumbnail.jpg"
# Check API integration
python manage.py test_cloudflare --check-config
```
**Solutions**:
- Verify Cloudflare Stream credentials are correct
- Check video UID format and availability
- Validate CORS configuration for video domains

## Production Deployment

### Pre-Deployment Checklist
```bash
# Security validation
npm run security:check                                # Frontend dependencies
python manage.py check --deploy                      # Django security settings
docker compose --profile production config           # Validate production config

# Performance validation
npm run build:ci                                     # Production build validation
npm run perf:lighthouse                              # Performance benchmarks
npm run test                                         # Complete test suite

# Configuration validation
docker compose exec web npm run production:validate  # Full validation
```

### Deployment Profiles
```bash
# Development
docker compose --profile development up -d           # Development services

# Production  
docker compose --profile production up -d            # Production-optimized stack
docker compose --profile monitoring up -d            # Production + monitoring

# CI/CD
docker compose --profile ci up -d                    # CI/CD pipeline services
```

### Environment-Specific Settings
- **Development**: Debug enabled, verbose logging, development database
- **Production**: Debug disabled, security headers, production database, monitoring
- **CI/CD**: Test database, coverage reporting, security scanning

## Advanced Configuration

### Performance Optimization
- **Frontend**: Turbopack, bundle splitting, image optimization, lazy loading
- **Backend**: Database connection pooling, Redis caching, query optimization
- **Infrastructure**: CDN integration, container resource limits, health checks

### Security Features
- **Content Security Policy (CSP)**: Strict CSP headers with nonce-based inline scripts
- **Rate Limiting**: API endpoint protection against abuse
- **Authentication**: Secure password hashing, session management
- **Vulnerability Scanning**: Automated dependency and container scanning

### Monitoring & Observability
- **Health Endpoints**: Comprehensive system health reporting
- **Performance Metrics**: Core Web Vitals, server response times
- **Error Tracking**: Structured logging with error aggregation
- **Resource Monitoring**: Container and service resource usage

## Documentation Structure

### Core Documentation
- **[README.md](./README.md)** - Main project overview and quick start
- **[docs/README.md](./docs/README.md)** - Comprehensive documentation index
- **[CLAUDE.md](./CLAUDE.md)** - Technical reference (this document)

### Specialized Guides
- **[Development Guide](./docs/development/DEVELOPMENT.md)** - Development workflows
- **[Deployment Guide](./docs/deployment/DEPLOYMENT.md)** - Production deployment
- **[Security Guide](./docs/deployment/SECURITY.md)** - Security implementation
- **[Architecture Guide](./docs/architecture/)** - System design documentation

### Setup & Configuration
- **[Setup Scripts](./scripts/)** - Automated setup and utility scripts
- **[AUTOMATED_SETUP_COMPLETE.md](./AUTOMATED_SETUP_COMPLETE.md)** - Setup automation status
- **[SETUP_ADMIN.md](./SETUP_ADMIN.md)** - Admin panel setup guide
- **[CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)** - Cloudflare optimization guide

## Project Structure
```
neversatisfiedxo/
├── apps/
│   ├── web/                    # Next.js 15 frontend with React 19
│   │   ├── src/app/           # App Router pages and components
│   │   ├── src/components/    # Reusable UI components
│   │   ├── src/lib/           # API client and utilities
│   │   └── package.json       # Frontend dependencies and scripts
│   └── mediacms/              # Django backend with MediaCMS
│       ├── trailers/          # Custom trailer management app
│       └── requirements.txt   # Backend dependencies
├── docs/                      # Comprehensive documentation
│   ├── README.md             # Documentation index
│   ├── development/          # Development guides
│   ├── deployment/           # Production deployment guides
│   ├── architecture/         # System design documentation
│   └── legacy/               # Historical documentation
├── scripts/                   # Setup and utility scripts
├── data/                     # Sample data and imports
├── docker-compose.yml        # Multi-environment orchestration
├── Dockerfile               # Production container definition
├── .env                     # Environment configuration
└── CLAUDE.md               # Technical reference (this document)
```

## Support & Maintenance

### Getting Help
1. **Check Documentation**: Start with [docs/README.md](./docs/README.md)
2. **Health Checks**: Use `/api/health` endpoints for diagnostics
3. **Log Analysis**: Review container logs for detailed error information
4. **Troubleshooting**: Follow systematic troubleshooting guides above

### Maintenance Operations
- **Regular Updates**: Keep dependencies updated with security patches
- **Performance Monitoring**: Regular Lighthouse audits and performance reviews
- **Security Scanning**: Automated vulnerability scanning in CI/CD
- **Backup Strategy**: Regular database backups and disaster recovery testing

---

**Project Status**: ✅ Production Ready with Enterprise Security  
**Last Updated**: January 2025  
**Version**: 2.0 - Enterprise Edition with Advanced Security & Performance

**Built with**: Next.js 15, React 19, TypeScript 5, Django, PostgreSQL, Redis, Docker
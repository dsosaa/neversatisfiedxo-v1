# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a premium trailer gallery site for "neversatisfiedxo" built as a monorepo with:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion
- **Backend**: Django extension for MediaCMS with Cloudflare Stream integration
- **Authentication**: Password-protected gallery with cookie-based authentication
- **Video Delivery**: Cloudflare Stream iframe embedding with thumbnail support
- **Security**: Enterprise-grade security hardening with CSP headers, rate limiting, and comprehensive monitoring

## Architecture

### Monorepo Structure
- `apps/web/` - Next.js frontend application
- `apps/mediacms/` - Django backend extension for MediaCMS
- `data/` - CSV data files for bulk import
- `docs/` - Organized documentation (setup, development, deployment, architecture)
- `scripts/` - Utility scripts for deployment and maintenance

### Key Integration Points

**Frontend ↔ Backend Communication:**
- Frontend calls Django REST API at `/api/trailers/`
- Authentication via `/api/gate` endpoint that sets HttpOnly cookies
- Middleware redirects unauthenticated users to `/enter` password gate

**MediaCMS Integration:**
- `TrailerMeta` model extends MediaCMS `Media` with OneToOneField relationship
- Cloudflare Stream UIDs stored in `cf_video_uid` and `cf_thumb_uid` fields
- API lookups use `cf_video_uid` as primary identifier (not Django pk)

**Cloudflare Stream Integration:**
- Video player uses iframe embedding: `https://iframe.videodelivery.net/{cf_video_uid}`
- Thumbnails auto-generated: `https://videodelivery.net/{cf_video_uid}/thumbnails/thumbnail.jpg`
- Customer code required in environment: `NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE`

## Common Development Commands

### Frontend Development (apps/web/)
```bash
npm run dev                 # Start development server
npm run build              # Production build  
npm run type-check         # TypeScript validation
npm run lint               # ESLint checking
npm run preview            # Build and start locally
```

### Backend Development (apps/mediacms/)
```bash
python manage.py runserver                    # Start Django dev server
python manage.py migrate                      # Apply database migrations
python manage.py makemigrations trailers     # Create new migrations
python manage.py import_videodb <csv> --dry-run  # Preview CSV import
python manage.py import_videodb <csv> --user admin --update  # Import CSV data
python manage.py test trailers               # Run Django tests
python manage.py shell                       # Django shell
python manage.py createsuperuser             # Create admin user
python manage.py collectstatic               # Collect static files for production
```

## Data Model Architecture

### Core Relationship
`TrailerMeta` ↔ `Media` (MediaCMS) via OneToOneField
- TrailerMeta extends Media with premium content fields
- cf_video_uid is unique identifier used by API (not Django primary key)
- Price stored as string ("$20", "FREE") with computed numeric parsing
- Duration stored as string ("25 Minutes") with computed minute parsing

### API Design Pattern
- ViewSet uses `cf_video_uid` as lookup_field instead of pk
- Serializer exposes `cf_video_uid` as `id` for frontend compatibility
- Filtering supports text search, price ranges, duration ranges
- Special endpoints: `/featured/`, `/free/`, `/premium/`, `/by_creator/`

## Authentication Flow

1. User visits protected route → middleware redirects to `/enter`
2. Password submitted to `/api/gate` → sets HttpOnly cookie on success
3. Subsequent requests include cookie → middleware allows access
4. Frontend uses TanStack Query for API caching with authentication

## Environment Configuration

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code
MEDIACMS_BASE_URL=http://localhost:8000
GATE_PASSWORD=your_secure_password

# Optional for production
SENTRY_DSN=your_sentry_dsn
MONITORING_WEBHOOK_URL=your_monitoring_webhook
```

### Backend (MediaCMS settings.py)
Must add `trailers` to INSTALLED_APPS and configure CORS:
```python
INSTALLED_APPS = [
    # ... existing apps
    'trailers',
    'rest_framework', 
    'django_filters',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... existing middleware
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://your-domain.com",  # Production
]

# Security settings for production
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
```

## Design System

### Theme Configuration
- **Dark mode by default** with zinc color palette
- **Rounded 2xl borders** (16px) for premium aesthetic
- **Motion timing**: 150-250ms transitions for smooth interactions
- **Responsive breakpoints**: Mobile < 768px, Tablet 768-1024px, Desktop > 1024px

### Key Components
- `CloudflarePlayer`: Handles video iframe embedding with error states
- `TrailerCard`: Hover effects with scale/shadow animations
- `QuickPreview`: Modal dialog with autoplay video
- `TrailerGrid`: Responsive grid with skeleton loading states

## Data Import Process

CSV format expected:
- `Video Number`: "Video 0", "Video 1", etc.
- `Description`: Video title
- `Video ID`: Cloudflare Stream UID
- `Thumbnail ID`: Cloudflare Stream thumbnail UID  
- `Price`: "$20" or "FREE"
- `Length`: "25 Minutes" or "1 Hour 15 Minutes"
- `Creators`: Creator name(s)
- `Upload Status`: Complete, Pending, Processing

Import creates both MediaCMS Media object and TrailerMeta extension.

## Security Features

### Authentication & Authorization
- **bcrypt password hashing** with 12 rounds
- **Rate limiting**: 5 attempts per IP per 15 minutes for auth endpoints
- **Secure cookies**: HttpOnly, SameSite, Secure flags
- **Constant-time comparison** to prevent timing attacks
- **Session management** with proper expiration

### Security Headers
- **CSP (Content Security Policy)**: Prevents XSS and code injection
- **HSTS**: Enforces HTTPS with 2-year max-age
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information

### Input Validation & Protection
- **Zod schemas** for comprehensive input validation
- **XSS prevention** with content sanitization
- **Path traversal protection** in middleware
- **SQL injection prevention** via parameterized queries

### Monitoring & Observability
- **Error tracking** with Sentry integration
- **Security event logging** for authentication failures
- **Performance monitoring** with Web Vitals
- **Health checks** at `/api/health` endpoint
- **Rate limit monitoring** and alerting

## Performance Considerations

### Frontend Optimizations
- TanStack Query with 5-minute stale time for trailer data
- Skeleton loaders during API calls
- Debounced search (300ms delay)
- Image lazy loading for thumbnails
- Next.js Image optimization with WebP support
- Bundle splitting and code optimization

### Backend Optimizations
- Database indexes on cf_video_uid, video_number, upload_status, is_featured
- select_related('media') for API queries to avoid N+1 problems
- Pagination with 20 items per page default
- Computed fields for price/duration parsing instead of database storage
- Redis caching for frequently accessed data
- Database connection pooling

## Documentation

Comprehensive documentation is organized in the `docs/` folder:
- **Setup**: [`docs/setup/`] - Installation and configuration guides
- **Development**: [`docs/development/`] - Development workflows and guidelines
- **Deployment**: [`docs/deployment/`] - Production deployment and security
- **Architecture**: [`docs/architecture/`] - System design and technical specifications
- **Legacy**: [`docs/legacy/`] - Archived documentation and historical references

## Health Monitoring

### Health Check Endpoints
- `GET /api/health` - Basic application health status
- `GET /api/health?detailed=true` - Detailed diagnostics including database, memory, and security status

### Production Monitoring
- **Uptime monitoring** with external services
- **Error rate monitoring** via Sentry
- **Performance metrics** with Web Vitals tracking
- **Security event monitoring** with automated alerting
- **Database performance monitoring**

## Deployment

For production deployment instructions, see [`docs/deployment/DEPLOYMENT.md`]. Key considerations:
- **SSL/TLS certificates** with auto-renewal
- **Environment variable validation** at startup
- **Docker security** with non-root user and minimal image
- **Database migrations** and backup strategies
- **Monitoring setup** with health checks and alerting
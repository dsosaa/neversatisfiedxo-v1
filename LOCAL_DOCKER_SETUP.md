# Local Docker Setup with Updated Changes

## Overview
The local Docker files have been updated to incorporate the design changes made to the V0 Trailer application:

1. ✅ **Spade Icon**: Filter sidebar now displays a spade symbol (♠) instead of the funnel icon
2. ✅ **Video Vault Title**: Page title changed from "Premium Gallery" to "Video Vault"  
3. ✅ **Light Blue Scrollbar**: Scrollbar color updated to match the application's light blue theme

## Quick Start

### 1. Environment Setup
Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
POSTGRES_USER=mediacms
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=mediacms
REDIS_PASSWORD=your_redis_password_here

# Django Configuration
DJANGO_SECRET_KEY=your_django_secret_key_here
DJANGO_DEBUG=False

# Application Configuration
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_cloudflare_customer_code
GATE_PASSWORD=your_gate_password
JWT_SECRET=your_jwt_secret_here

# URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MEDIACMS_BASE_URL=http://mediacms:80
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://web:3000

# Optional
DOMAIN_NAME=localhost
MEDIACMS_API_TOKEN=your_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_STREAM_API_TOKEN=your_stream_token
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id
MONITORING_WEBHOOK_URL=your_webhook_url
```

### 2. Available Docker Compose Configurations

#### Production Setup (Recommended)
```bash
docker compose -f docker-compose.yml up -d
```
- **Services**: web, mediacms, postgres, redis, nginx
- **Ports**: 
  - Web: http://localhost:3000
  - MediaCMS: http://localhost:8000
  - Nginx: http://localhost:8080 (optional)

#### Development Setup (Faster builds)
```bash
docker compose -f docker-compose.dev.yml up -d
```
- **Services**: web, mediacms, postgres, redis
- **Features**: Live code reloading, development optimizations
- **Ports**: 
  - Web: http://localhost:3000
  - MediaCMS: http://localhost:8000

#### Unified Production Setup
```bash
docker compose -f docker-compose.prod-unified.yml up -d
```
- **Services**: web, mediacms, postgres, redis, nginx
- **Features**: Optimized for production deployment
- **Ports**: 
  - Web: http://localhost:3000
  - MediaCMS: http://localhost:8000
  - Nginx: http://localhost:80, https://localhost:443

### 3. Build and Run Commands

#### Build all services
```bash
docker compose -f docker-compose.yml build
```

#### Start services in background
```bash
docker compose -f docker-compose.yml up -d
```

#### View logs
```bash
# All services
docker compose -f docker-compose.yml logs -f

# Specific service
docker compose -f docker-compose.yml logs -f web
```

#### Stop services
```bash
docker compose -f docker-compose.yml down
```

#### Clean rebuild (removes volumes)
```bash
docker compose -f docker-compose.yml down -v
docker compose -f docker-compose.yml up -d --build
```

### 4. Service Health Checks

All services include health checks. Check status with:
```bash
docker compose -f docker-compose.yml ps
```

### 5. Accessing the Application

- **Frontend**: http://localhost:3000
- **MediaCMS Admin**: http://localhost:8000/admin
- **API Health**: http://localhost:3000/api/health

### 6. Development Workflow

For active development with live reloading:
```bash
# Use development compose file
docker compose -f docker-compose.dev.yml up -d

# The web service will automatically reload when you make changes
# to files in the apps/web/ directory
```

### 7. Troubleshooting

#### Check service logs
```bash
docker compose -f docker-compose.yml logs [service_name]
```

#### Restart a specific service
```bash
docker compose -f docker-compose.yml restart [service_name]
```

#### Rebuild a specific service
```bash
docker compose -f docker-compose.yml up -d --build [service_name]
```

#### Check resource usage
```bash
docker stats
```

## Changes Included

The Docker setup automatically includes all the design changes:

1. **Spade Icon**: Updated in `apps/web/src/components/filter-sidebar.tsx`
2. **Video Vault Title**: Updated in `apps/web/src/app/layout.tsx`
3. **Light Blue Scrollbar**: Updated in `apps/web/src/components/ui/scroll-area.tsx`

These changes are automatically copied into the Docker containers during the build process, so no additional configuration is needed.

## Notes

- The Docker setup uses multi-stage builds for optimal performance
- All services include proper health checks and restart policies
- Resource limits are configured for production stability
- The setup includes proper networking between services
- Data persistence is handled through Docker volumes

# Development Guide

## 🛠️ Local Development Setup for neversatisfiedxo Premium Trailer Gallery

This guide covers the complete local development setup for the neversatisfiedxo Premium Trailer Gallery v2.6.3.

## 📋 **Prerequisites**

### **System Requirements**
- **Node.js**: 22.17.1 or higher
- **npm**: 10.x or higher
- **Docker**: 24.x or higher
- **Docker Compose**: 2.x or higher
- **Git**: Latest version

### **Operating Systems**
- **macOS**: 10.15+ (Catalina or later)
- **Linux**: Ubuntu 20.04+ or similar
- **Windows**: Windows 10+ with WSL2 (recommended)

## 🚀 **Quick Start**

### **1. Clone Repository**
```bash
git clone <repository-url>
cd V0\ Trailer
```

### **2. Environment Setup**
```bash
# Copy environment template
cp env.example .env.local

# Install dependencies
npm install
cd apps/web && npm install
cd ../mediacms && pip install -r requirements.txt
```

### **3. Start Development Environment**
```bash
# Option 1: Start all services with Docker
docker-compose -f docker-compose.dev.yml up -d

# Option 2: Direct Next.js development (recommended)
cd apps/web
npm run dev  # Frontend only

# Option 3: Individual services
npm run dev  # Frontend only
```

### **4. Access Application**
- **Frontend**: http://localhost:3000
- **MediaCMS Admin**: http://localhost:8000/admin
- **API**: http://localhost:3000/api

## 🏗️ **Project Architecture**

### **Monorepo Structure**
```
V0 Trailer/
├── apps/
│   ├── web/                    # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router (pages & API)
│   │   │   ├── components/    # React Components
│   │   │   ├── lib/           # Utilities & Hooks
│   │   │   └── types/         # TypeScript Definitions
│   │   ├── public/            # Static Assets
│   │   └── package.json       # Frontend Dependencies
│   └── mediacms/              # Django Backend
│       ├── trailers/          # Trailer Management App
│       ├── settings.py        # Django Configuration
│       └── requirements.txt   # Python Dependencies
├── data/
│   └── VideoDB.csv           # Video Metadata Database
├── docs/                      # Documentation
├── scripts/                   # Deployment Scripts
└── docker-compose.yml         # Container Orchestration
```

### **Technology Stack**

#### **Frontend (apps/web)**
- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS 4 with custom design system
- **Animations**: Framer Motion 12.23.12
- **Icons**: Lucide React 0.542.0
- **State Management**: React Query (TanStack Query)
- **Authentication**: Custom middleware-based system

#### **Backend (apps/mediacms)**
- **Framework**: Django 4.2+
- **Language**: Python 3.11+
- **Database**: SQLite (development) / PostgreSQL (production)
- **API**: Django REST Framework
- **Media**: Cloudflare Stream integration

#### **Infrastructure**
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **CDN**: Cloudflare Stream
- **Monitoring**: Custom performance monitoring

## 🔧 **Development Environment**

### **Environment Variables**
Create `.env.local` in the root directory:

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare Stream (Development)
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_dev_customer_code
CF_STREAM_API_TOKEN=your_dev_api_token

# Database
DATABASE_URL=sqlite:///db.sqlite3

# Security
NEXTAUTH_SECRET=your_dev_secret_key
NEXTAUTH_URL=http://localhost:3000

# Development Features
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITOR=true
```

### **Docker Development Setup**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: dev
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

  mediacms:
    build:
      context: ./apps/mediacms
      dockerfile: Dockerfile.mediacms-ultra
    ports:
      - "8000:8000"
    volumes:
      - ./apps/mediacms:/app
      - ./data:/app/data
    environment:
      - DEBUG=true
      - DATABASE_URL=sqlite:///db.sqlite3
```

## 🎨 **Frontend Development**

### **Component Structure**
```
src/components/
├── ui/                        # Base UI Components
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── input.tsx
├── trailer-card.tsx           # Main Trailer Display with Duration Badges
├── gallery-provider.tsx       # Gallery State Management
├── modern-filter-chips.tsx    # Filter Interface
├── quick-preview.tsx          # Modal Preview
└── optimized-thumbnail.tsx    # Image Optimization
```

### **Page Structure**
```
src/app/
├── page.tsx                   # Home/Gallery Page
├── enter/page.tsx             # Authentication
├── gallery/page.tsx           # Gallery View
├── video/[id]/page.tsx        # Individual Video
├── api/                       # API Routes
│   ├── auth/
│   ├── trailers/
│   └── cloudflare/
└── layout.tsx                 # Root Layout
```

### **Development Commands**
```bash
# Frontend Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run type-check             # TypeScript type checking

# Testing
npm run test                   # Run test suite
npm run test:watch             # Watch mode testing
npm run test:coverage          # Coverage report

# Code Quality
npm run format                 # Format code with Prettier
npm run lint:fix               # Fix linting issues
npm run analyze                # Bundle analysis
```

### **Key Development Features**

#### **1. Duration Badges**
- **Component**: `EnhancedBadge` with `duration` variant
- **Features**: Clock icons, formatted time display, bottom-left positioning
- **Styling**: Dark zinc background with light text, hover effects

#### **2. Docker Health Checks**
- **Robust Health Checks**: Enhanced health checks with wget/curl fallback options
- **MediaCMS Reliability**: Improved MediaCMS startup reliability with extended timeouts
- **Web Service Monitoring**: Enhanced Next.js service health monitoring
- **Asset Management**: Complete Docker asset inclusion with SSL certificates and logos

#### **3. Modern Filter System**
- **Component**: `ModernFilterChips`
- **Features**: Horizontal layout, progressive disclosure, blue theme
- **State**: Centralized filter management via `GalleryProvider`

#### **4. Optimized Image Loading**
- **Component**: `OptimizedThumbnail`
- **Features**: 5ms timestamps, WebP format, lazy loading
- **Performance**: Progressive loading with error handling

#### **5. Authentication Flow**
- **Page**: `/enter`
- **Features**: Password protection, auto-redirect, mobile optimization
- **Security**: Middleware-based route protection

#### **6. Video Streaming**
- **Integration**: Cloudflare Stream
- **Features**: 4K support, adaptive quality, thumbnail generation
- **Performance**: Optimized iframe embedding

## 🐍 **Backend Development**

### **Django Setup**
```bash
cd apps/mediacms

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### **Model Structure**
```python
# trailers/models.py
class TrailerMeta(models.Model):
    video_number = models.IntegerField(unique=True)
    cf_video_uid = models.CharField(max_length=255)
    title = models.CharField(max_length=500)
    description = models.TextField()
    price = models.CharField(max_length=50)
    length = models.CharField(max_length=100)
    creators = models.CharField(max_length=200)
    upload_status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
```

### **API Endpoints**
```python
# trailers/views.py
@api_view(['GET'])
def trailer_list(request):
    """List all trailers with filtering and pagination"""
    pass

@api_view(['GET'])
def trailer_detail(request, video_id):
    """Get specific trailer details"""
    pass

@api_view(['GET'])
def related_trailers(request, video_id):
    """Get related trailers for a video"""
    pass
```

## 🎯 **Development Workflow**

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... develop feature ...

# Test changes
npm run test
npm run lint
npm run type-check

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### **2. Code Quality Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates

### **3. Testing Strategy**
```bash
# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e

# Performance Tests
npm run test:performance
```

## 🔍 **Debugging**

### **Frontend Debugging**
```bash
# Enable debug mode
NEXT_PUBLIC_ENABLE_DEBUG=true npm run dev

# Browser DevTools
# - React DevTools
# - Redux DevTools
# - Performance Profiler
```

### **Backend Debugging**
```python
# Django Debug Toolbar
INSTALLED_APPS = [
    'debug_toolbar',
]

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### **Performance Monitoring**
```typescript
// Performance monitoring component
import { PerformanceMonitor } from '@/components/performance-monitor'

// Usage in development
{process.env.NODE_ENV === 'development' && (
  <PerformanceMonitor />
)}
```

## 🚀 **Build & Deployment**

### **Local Production Build**
```bash
# Build frontend
cd apps/web
npm run build

# Test production build
npm run start

# Build Docker image
docker build -t neversatisfiedxo-web .

# Test Docker container
docker run -p 3000:3000 neversatisfiedxo-web
```

### **Docker Development**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild services
docker-compose -f docker-compose.dev.yml up -d --build
```

## 📊 **Performance Optimization**

### **Frontend Optimization**
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component with WebP
- **Bundle Analysis**: `npm run analyze`
- **Lazy Loading**: React.lazy for components
- **Caching**: React Query for API responses

### **Backend Optimization**
- **Database**: Query optimization and indexing
- **Caching**: Redis for session and data caching
- **Static Files**: Nginx serving with compression
- **API**: Response caching and pagination

## 🛡️ **Security Considerations**

### **Development Security**
- **Environment Variables**: Never commit secrets
- **Input Validation**: Sanitize all user inputs
- **CORS**: Configure for development origins
- **HTTPS**: Use in development with self-signed certs

### **Authentication Testing**
```bash
# Test authentication flow
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"password": "yesmistress"}'
```

## 📚 **Useful Resources**

### **Documentation**
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Features](https://react.dev/blog)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [Django Documentation](https://docs.djangoproject.com/)

### **Tools & Extensions**
- **VS Code Extensions**: ES7+ React/Redux, Tailwind CSS IntelliSense
- **Browser Extensions**: React DevTools, Redux DevTools
- **API Testing**: Postman, Insomnia
- **Database**: SQLite Browser, pgAdmin

### **Development Tips**
- Use TypeScript strict mode for better type safety
- Leverage React Query for efficient data fetching
- Implement proper error boundaries for better UX
- Use Tailwind's responsive design utilities
- Follow the established component patterns

---

**Development Status**: ✅ Ready for Development  
**Last Updated**: September 2025  
**Version**: 2.6.3
# 📚 Documentation Index

Welcome to the neversatisfiedxo Premium Trailer Gallery documentation. This guide will help you navigate through all aspects of the project from setup to production deployment.

## 🚀 Quick Start

**New to the project?** Start here:
1. [Project Overview](../README.md) - High-level project description
2. [Setup Guide](./setup/) - Get up and running quickly
3. [Development Guide](./development/DEVELOPMENT.md) - Development workflows

## 📖 Documentation Sections

### 🔧 Setup & Configuration
- **Installation Guide** - Coming soon
- **Environment Configuration** - See [CLAUDE.md](./development/CLAUDE.md#environment-configuration)
- **Database Setup** - Coming soon

### 💻 Development
- **[Development Guide](./development/DEVELOPMENT.md)** - Comprehensive development documentation
  - Development environment setup
  - Code style and standards
  - Testing strategies
  - Performance optimization
  - Debugging guides

### 🚀 Deployment & Production
- **[Deployment Guide](./deployment/DEPLOYMENT.md)** - Complete production deployment guide
  - Pre-deployment checklist
  - Docker deployment
  - Security hardening
  - Monitoring setup
  - CI/CD pipeline
  - Backup strategies

- **[Security Implementation](./deployment/SECURITY.md)** - Security features and hardening
  - Authentication security
  - Content Security Policy
  - Rate limiting and protection
  - Monitoring and incident response

### 🏗️ Architecture & Design
- **[Refactoring Plan](./architecture/Refactor_Modularity_Plan.md)** - Future architecture improvements
  - Feature-first structure
  - Repository patterns
  - Modular design principles

### 📜 Legacy & Reference
- **[Original Instructions](./legacy/MediaCMS_Cloudflare_TrailerSite_Instructions.md)** - Initial project requirements
  - Original architectural decisions
  - Feature specifications
  - Implementation guidelines

## 🔍 Quick Reference

### Key Files
- **[CLAUDE.md](./development/CLAUDE.md)** - Claude Code guidance and project overview
- **[README.md](../README.md)** - Main project documentation
- **[Docker Configuration](../docker-compose.yml)** - Container orchestration
- **[Environment Examples](../.env.production.example)** - Configuration templates

### API Documentation
- **Frontend API Client**: `apps/web/src/lib/api.ts`
- **Backend Models**: `apps/mediacms/trailers/models.py`
- **Serializers**: `apps/mediacms/trailers/serializers.py`
- **ViewSets**: `apps/mediacms/trailers/views.py`

### Common Commands

**Frontend Development**:
```bash
cd apps/web
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # ESLint checking
```

**Backend Development**:
```bash
cd apps/mediacms
python manage.py runserver              # Start Django server
python manage.py import_videodb <csv>   # Import data
python manage.py test trailers         # Run tests
```

**Docker Operations**:
```bash
docker-compose up -d                    # Start all services
docker-compose --profile production up # Production deployment
docker-compose logs -f web             # View logs
```

## 🆘 Troubleshooting

### Common Issues
- **CORS Errors**: Check `CORS_ALLOWED_ORIGINS` in Django settings
- **Authentication Issues**: Verify `GATE_PASSWORD` environment variable
- **Video Playback**: Confirm `NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE` is set
- **Import Failures**: Validate CSV format and encoding (UTF-8)

### Getting Help
1. **Check the documentation** in this folder first
2. **Review error messages** carefully - they often contain the solution
3. **Check health endpoints**: 
   - `/api/health` - Basic status
   - `/api/health?detailed=true` - Detailed diagnostics
4. **Review logs**: Application logs contain detailed error information

## 🔄 Documentation Updates

This documentation is continuously updated. Key areas:

- **Setup guides** - Installation and configuration improvements
- **Security documentation** - Latest security implementations
- **Performance guides** - Optimization strategies and monitoring
- **API documentation** - Endpoint specifications and examples

## 📞 Support

For technical support:
1. Check the relevant documentation section above
2. Review the troubleshooting guides
3. Check application logs and health endpoints
4. Create an issue with detailed information about your problem

---

**📝 Last Updated**: January 2025  
**📊 Project Status**: Production Ready with Enterprise Security
# Development Guide

Guide for developing and extending the neversatisfiedxo premium trailer gallery.

## 🛠️ Development Environment Setup

### Prerequisites
- **Node.js 18+** with npm
- **Python 3.8+** with pip
- **Git** for version control
- **Code editor** (VS Code recommended)

### Initial Setup

1. **Clone and setup the project:**
```bash
git clone <repository>
cd V0\ Trailer
```

2. **Frontend setup:**
```bash
cd apps/web
npm install
cp .env.local.example .env.local
# Edit .env.local with your configuration
npm run dev
```

3. **Backend setup:**
```bash
cd apps/mediacms
pip install -r requirements.txt
python manage.py migrate
python manage.py import_videodb ../../data/VideoDB.csv --user admin
python manage.py runserver
```

## 🔧 Development Workflow

### Frontend Development

**Start development server:**
```bash
cd apps/web
npm run dev
```

**Available scripts:**
- `npm run dev` - Development server with hot reload
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - ESLint checking
- `npm run type-check` - TypeScript type checking
- `npm run preview` - Build and preview locally

**Development URLs:**
- Frontend: http://localhost:3000
- Password gate: http://localhost:3000/enter
- Gallery: http://localhost:3000 (after auth)

### Backend Development

**Start Django development server:**
```bash
cd apps/mediacms
python manage.py runserver
```

**Useful commands:**
- `python manage.py shell` - Django shell
- `python manage.py migrate` - Run migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py import_videodb <csv>` - Import trailer data

**Development URLs:**
- API: http://localhost:8000/api/trailers/
- Admin: http://localhost:8000/admin/
- API Browser: http://localhost:8000/api/trailers/?format=json

## 📝 Code Style & Standards

### Frontend (TypeScript/React)

**File organization:**
```
src/
├── app/          # Next.js App Router pages
├── components/   # React components
│   ├── ui/       # shadcn/ui components
│   └── *.tsx     # Custom components
├── lib/          # Utilities and API client
└── types/        # TypeScript type definitions
```

**Naming conventions:**
- Components: PascalCase (`TrailerCard.tsx`)
- Hooks: camelCase starting with 'use' (`useTrailers`)
- Utilities: camelCase (`parsePrice`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

**TypeScript:**
- Always define proper types/interfaces
- Use strict mode (`strict: true` in tsconfig.json)
- Avoid `any` types
- Export types from centralized locations

### Backend (Python/Django)

**File organization:**
```
trailers/
├── models.py       # Data models
├── serializers.py  # DRF serializers  
├── views.py        # API views
├── urls.py         # URL routing
├── admin.py        # Admin interface
└── management/     # Management commands
```

**Naming conventions:**
- Models: PascalCase (`TrailerMeta`)
- Functions: snake_case (`get_price_numeric`)
- Constants: UPPER_SNAKE_CASE (`UPLOAD_STATUS_CHOICES`)
- URLs: kebab-case (`trailer-meta`)

## 🎨 Design Guidelines

### UI/UX Principles
- **Dark theme by default** with premium aesthetic
- **Rounded 2xl** for all interactive elements (16px border radius)
- **Smooth animations** using Framer Motion (150-250ms transitions)
- **Consistent spacing** using Tailwind scale
- **Accessibility first** with proper ARIA labels and keyboard navigation

### Animation Guidelines
- **Hover effects**: Subtle scale (1.02-1.05) and shadow
- **Page transitions**: Fade + slide combinations
- **Loading states**: Skeleton loaders with pulse animation
- **Micro-interactions**: Button press feedback, form validation

### Component Architecture
- **Atomic design**: Build small, reusable components
- **Props interface**: Always define TypeScript interfaces
- **Error boundaries**: Handle component errors gracefully
- **Loading states**: Show loading/skeleton states
- **Empty states**: Provide helpful empty state messages

## 🔍 Testing Strategy

### Frontend Testing
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

### Backend Testing
```bash
# Run tests
python manage.py test trailers

# Check for issues
python manage.py check

# Validate migrations
python manage.py makemigrations --check
```

### Manual Testing Checklist
- [ ] Password gate works with correct/incorrect passwords
- [ ] Gallery loads with skeleton states
- [ ] Search and filtering work correctly
- [ ] Quick preview opens and plays videos
- [ ] Detail pages load with sticky player
- [ ] Mobile responsive design
- [ ] Dark theme consistency

## 🚀 Performance Optimization

### Frontend Performance
- **Image optimization**: Use Next.js Image component
- **Code splitting**: Implement route-based splitting
- **Caching**: TanStack Query with appropriate stale times
- **Bundle analysis**: Use `npm run build` to check bundle size
- **Lazy loading**: Implement for non-critical components

### Backend Performance
- **Database indexes**: Ensure proper indexing on query fields
- **Query optimization**: Use `select_related`/`prefetch_related`
- **Caching**: Implement Redis caching for API responses
- **Pagination**: Always paginate large datasets
- **API optimization**: Return only necessary data in responses

## 🔐 Security Considerations

### Frontend Security
- **Environment variables**: Never expose secrets in client-side code
- **Authentication**: Use secure cookie-based authentication
- **Input validation**: Validate all user inputs on client and server
- **XSS prevention**: Sanitize any user-generated content

### Backend Security  
- **CORS configuration**: Restrict to specific origins
- **Authentication**: Require auth for write operations
- **Input validation**: Use Django forms/serializers
- **SQL injection**: Use Django ORM, avoid raw queries
- **File uploads**: Validate file types and sizes

## 📊 Data Management

### CSV Import Process
1. **Prepare CSV**: Ensure proper encoding (UTF-8) and column names
2. **Dry run**: Always test with `--dry-run` flag first
3. **Backup**: Create database backup before large imports
4. **Validation**: Check import logs for errors
5. **Verification**: Verify data in admin interface

### Database Migrations
```bash
# Create migration
python manage.py makemigrations trailers

# Check migration
python manage.py sqlmigrate trailers 0001

# Apply migration
python manage.py migrate
```

## 🐛 Debugging

### Frontend Debugging
- **Browser DevTools**: Use React DevTools extension
- **Network tab**: Monitor API calls and responses  
- **Console logs**: Check for JavaScript errors
- **TanStack Query DevTools**: Monitor cache state

### Backend Debugging
- **Django Debug Toolbar**: Install for development
- **Logging**: Add logging to views and models
- **Django shell**: Test queries and logic
- **Admin interface**: Verify data and relationships

### Common Issues
1. **CORS errors**: Check middleware order and origins
2. **404 on API**: Verify URL patterns include
3. **Authentication redirect loops**: Check middleware configuration
4. **Import failures**: Validate CSV format and encoding
5. **Video not loading**: Verify Cloudflare Stream UIDs

## 📦 Deployment Preparation

### Frontend Deployment
```bash
# Production build
npm run build

# Environment variables
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=production_code
MEDIACMS_BASE_URL=https://api.yourdomain.com
GATE_PASSWORD=secure_production_password
```

### Backend Deployment
```bash
# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## 🤝 Contributing

### Pull Request Process
1. **Create feature branch** from main
2. **Implement changes** following code standards
3. **Add/update tests** for new functionality
4. **Update documentation** if needed
5. **Submit PR** with clear description

### Code Review Checklist
- [ ] Code follows established patterns
- [ ] TypeScript types are properly defined
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met

### Git Conventions
**Commit messages:**
- `feat:` New features
- `fix:` Bug fixes  
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/updates
- `chore:` Build/tooling changes

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Cloudflare Stream](https://developers.cloudflare.com/stream/)

### Tools & Extensions
- **VS Code Extensions**:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Auto Rename Tag
  - Python extensions for Django

### Community
- Create issues for bugs and feature requests
- Join discussions for architecture decisions
- Share improvements and optimizations

---

Happy coding! 🚀
# neversatisfiedxo Premium Trailer Gallery - Web Frontend

This is the Next.js 15 frontend application for the neversatisfiedxo Premium Trailer Gallery v2.6.3, featuring duration badges, 4K video streaming, and premium visual design.

## 🚀 Features

- **Duration Badges**: Clock icons with formatted duration display on trailer cards
- **4K Video Streaming**: Cloudflare Stream integration with adaptive quality
- **Premium Design**: Sky-blue theme with modern UI components
- **Authentication**: Password-protected access with middleware-based security
- **Performance**: Optimized with Next.js 15, Turbopack, and advanced caching
- **Responsive**: Mobile-first design with Tailwind CSS 4

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run dev:secure       # Start with secure environment
npm run dev:debug        # Start with debugging enabled

# Building
npm run build            # Build for production
npm run build:production # Build without security checks
npm run build:analyze    # Build with bundle analysis

# Quality Assurance
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript type checking
npm run test             # Run test suite

# Utilities
npm run clean            # Clean build artifacts
npm run clean:cache      # Clean cache directories
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page (redirects to /enter)
│   ├── enter/             # Authentication page
│   ├── gallery/           # Main gallery view
│   ├── video/[id]/        # Individual video pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── trailer-card.tsx  # Trailer cards with duration badges
│   └── gallery-provider.tsx # State management
├── lib/                  # Utilities and hooks
└── types/                # TypeScript definitions
```

## 🎨 Key Components

### Duration Badges
- **Component**: `EnhancedBadge` with `duration` variant
- **Features**: Clock icons, formatted time display, bottom-left positioning
- **Styling**: Dark zinc background with light text

### Trailer Cards
- **Component**: `TrailerCard` and `TrailerListItem`
- **Features**: Duration badges, price badges, video number badges
- **Responsive**: Grid and list layouts

### Authentication
- **Page**: `/enter`
- **Features**: Password protection, auto-redirect, mobile optimization
- **Security**: Middleware-based route protection

## 🔧 Configuration

### Environment Variables
```env
# Required
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code
NEXT_PUBLIC_SITE_NAME=neversatisfiedxo
NEXT_PUBLIC_BASE_URL=https://videos.neversatisfiedxo.com

# Optional
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id
```

### Next.js Configuration
- **Framework**: Next.js 15.5.2 with App Router
- **Build Tool**: Turbopack for faster development
- **Styling**: Tailwind CSS 4 with custom design system
- **TypeScript**: Strict mode enabled

## 🚀 Deployment

### Production Build
```bash
npm run build:production
npm run start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t neversatisfiedxo-web .

# Run container
docker run -p 3000:3000 neversatisfiedxo-web
```

## 📚 Documentation

- [Development Guide](../../docs/development/DEVELOPMENT.md)
- [Deployment Guide](../../docs/deployment/DEPLOYMENT.md)
- [Main README](../../README.md)

## 🤝 Contributing

1. Follow the established component patterns
2. Use TypeScript strict mode
3. Run quality checks before committing
4. Update documentation for new features

---

**Version**: 2.6.3  
**Last Updated**: September 2025  
**Status**: Production Ready ✅

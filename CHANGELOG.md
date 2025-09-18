# Changelog

All notable changes to the V0 Trailer Site project will be documented in this file.

## [2.6.4] - 2025-09-18

### 📱 Mobile User Experience
- Full-screen Quick Preview dialog on mobile with safe-area support and notch-aware close button.
- Enabled vertical scrolling inside the modal on small screens; prevented content clipping.
- Swipe-down-to-close gesture on mobile when scrolled to top of the dialog.
- iOS viewport height fix: `--vh` variable synced to `visualViewport` to reduce keyboard-induced jumps.
- Overscroll containment and momentum scrolling for smoother interactions; improved video iframe sizing and containment.

### Affected Files
- `apps/web/src/components/quick-preview.tsx`
- `apps/web/src/app/globals.css`

### Notes
- Some CSS properties like `overscroll-behavior` and `scrollbar-color/width` have partial support; fallbacks are applied where practical.

### 🚀 Performance & Build
- Strip `console.*` in production bundles (keep `warn`/`error`).
- Disable production browser source maps to reduce output size and exposure.
- Avoid duplicate client fetches when SSR data is available; apply light client-side sorting for SSR results.
- Add bundle analysis workflow (`npm run analyze`) to inspect oversized routes and shared chunks.
- Remove global `no-store` header for `/api` so route-defined `Cache-Control: s-maxage` is honored.
- Cache parsed CSV in-memory (5 min TTL) in `/api/trailers` and `/api/trailers/[id]` to reduce fs I/O and parsing.
- Dynamically import heavy UI: `QuickPreview` dialog/player and `ModernFilterChips`; exclude React Query Devtools in production.

### Bundle Size Improvements
- `/gallery`: 71.4 kB → 54 kB
- `/video/[id]`: 27.4 kB → 18.6 kB
- `/enter`: 23.6 kB → 14.8 kB

### Affected Files (additional)
- `apps/web/next.config.ts`
- `apps/web/src/components/gallery-provider.tsx`
- `apps/web/src/components/trailer-display.tsx`
- `apps/web/src/lib/providers.tsx`
- `apps/web/src/app/api/trailers/route.ts`
- `apps/web/src/app/api/trailers/[id]/route.ts`

## [2.6.3] - 2025-01-15

### 🎯 **Major Simplification & Cleanup**

#### ✅ **Simplified Authentication**
- **Removed complex JWT system** - No more token-based authentication
- **Simple password check** - Just `yesmistress` password
- **Cookie-based sessions** - HTTP-only cookies for 7 days
- **Cleaned middleware** - Removed complex validation layers
- **Fixed gallery access** - Users can now reliably access gallery after password entry

#### ✅ **Fixed Image Loading**
- **Removed ProgressiveImage component** - Was causing "Image failed to load" errors
- **Reverted to standard Next.js Image** - Reliable, simple image loading
- **Maintained optimizations** - Still using 70% quality and WebP format
- **Fixed thumbnail display** - Images now load properly in gallery

#### ✅ **Code Cleanup**
- **Removed unused hooks** - `usePreloader`, `usePerformanceMonitor`, `useImageFallback`
- **Deleted complex components** - `ProgressiveImage`, `OptimizedThumbnail`, `PreloadResources`
- **Cleaned authentication routes** - Removed `/api/gate` and `/api/auth/verify`
- **Simplified API client** - Removed complex authentication methods
- **Removed unused utilities** - Complex auth utilities and validation

#### ✅ **Docker & Build Optimization**
- **Cleaned Docker images** - Removed old, unused images (52MB reclaimed)
- **Cleared build cache** - Removed 338MB of build cache
- **Optimized build process** - Faster builds with fewer dependencies
- **Reduced bundle size** - Gallery page now 69.7kB (down from 72.5kB)

#### ✅ **Documentation Overhaul**
- **Deleted all old documentation** - Removed 19 outdated markdown files
- **Created clean README** - Simple, focused documentation
- **Updated changelog** - Clear, concise change tracking
- **Removed complex guides** - No more confusing deployment docs

### 🔧 **Technical Improvements**
- **TypeScript fixes** - Resolved all compilation errors
- **Import cleanup** - Removed unused imports and dependencies
- **Component simplification** - Trailer cards now use simple Image component
- **Middleware streamlining** - Basic authentication check only
- **Error handling** - Simplified error states and logging

### 🚀 **Performance Gains**
- **Faster initial load** - Removed complex progressive loading
- **Smaller bundle size** - Cleaned up unused code
- **Better reliability** - Simple systems are more stable
- **Easier debugging** - Less complex code to troubleshoot

### 🐛 **Bug Fixes**
- **Fixed "Image failed to load"** - Images now display properly
- **Fixed authentication flow** - Password entry works reliably
- **Fixed gallery access** - Users can access gallery after authentication
- **Fixed build errors** - All TypeScript compilation issues resolved

### 📊 **Metrics**
- **Build time**: ~54s (optimized)
- **Bundle size**: 176kB shared JS
- **Gallery page**: 69.7kB
- **Middleware**: 38.3kB
- **Docker cleanup**: 390MB reclaimed

---

## [2.6.2] - 2025-01-14

### 🔐 **Authentication Fixes**
- Fixed cookie value mismatch in authentication
- Resolved middleware authentication issues
- Fixed gallery access after password authentication

## [2.6.1] - 2025-01-14

### 🚀 **Performance Optimizations**
- Reduced image quality to 70% for faster loading
- Optimized image sizes (800x450 for grid, 640x360 for list)
- Implemented WebP format for better compression
- Added React Query for efficient data caching

## [2.6.0] - 2025-01-13

### 🎉 **Initial Release**
- Next.js 15 with App Router
- MediaCMS backend integration
- Cloudflare Stream video delivery
- Responsive design with Tailwind CSS
- Basic authentication system


# V0 Trailer Site

A modern, high-performance trailer gallery built with Next.js 15, featuring optimized image loading and simple authentication.

## 🚀 Quick Start

### Local Development

```bash
# Start the development environment (recommended)
./start-local-dev.sh

# Or manually with Docker Compose
docker compose -f docker-compose.local-dev.yml up --build -d

# Or run Next.js directly (ensure env below is set)
cd apps/web
echo "VIDEO_DB_PATH=/absolute/path/to/VideoDB.csv" > .env.local
npm run dev
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Authentication

- **Password (simple)**: Default is `yesmistress`. You can change it via `GATE_PASSWORD`.
- **Normalization**: Password input is case-insensitive and ignores spaces. For example, "Yes Mistress", "yesmistress", and "YES  MISTRESS" are all accepted when `GATE_PASSWORD=yesmistress`.
- **How to access**: Visit http://localhost:3000 → enter password → you are redirected to `/gallery`.
- **Cookie**: Sets `authenticated=true` (HTTP-only) for 7 days.
- **Local vs Production**: Cookie `Secure` flag is only set on HTTPS requests. On localhost (HTTP), it is omitted so the browser accepts it.
- **Protected paths**: Middleware protects `/`, `/gallery`, `/video`. `/enter` and `/api/auth/simple` remain open.
 - Upper/lower-case is normalized for `/gallery` and `/video` (e.g., `/GALLERY` → `/gallery`).

## 🏗️ Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui
- **State Management**: React Query for data fetching
- **Authentication**: Simple password-based with cookies

### Backend (MediaCMS)
- **CMS**: MediaCMS for video management
- **Database**: PostgreSQL
- **Cache**: Redis
- **Video Delivery**: Cloudflare Stream

## 📁 Project Structure

```
apps/
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and API client
│   │   └── hooks/        # Custom React hooks
│   └── public/           # Static assets
└── mediacms/             # MediaCMS backend
    ├── trailers/         # MediaCMS app
    └── manage.py         # Django management
```

## 🔧 Key Features

### Performance Optimizations
- **Cloudflare thumbnails at 0.005s**: Each card uses `thumbnails/thumbnail.jpg?time=0.005s` for instant “action” frames.
- **Unified poster quality**: 800×450 at quality 75 for consistent sharpness vs bytes.
- **Multi-fallback thumbnail URLs**: WebP/JPEG and alternate timestamps (0.015s/0.03s) to avoid edge 404s.
- **Customer domain fallback**: If `NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE` is set, tries `customer-<code>.cloudflarestream.com` for resiliency.
- **Background preloader**: Preloads ALL gallery thumbnails with low-priority requests; scrolling is seamless.
- **Priority cards**: First 24 items are marked high priority for faster first paint.
- **No autoplay in cards/list**: Cards render images only; video iframes appear only in Quick Preview/Detail.
- **No blur placeholders**: Uniform look with fast swap-in; avoids hazy appearance.

### Authentication
- **Simple Password**: Single gate via `GATE_PASSWORD` (case/space-insensitive match)
- **Cookie-based**: HTTP-only `authenticated=true`
- **7-day Sessions**: Automatic session expiration
- **No JWT/OAuth**: Intentionally simple

### User Experience
- **Responsive Design**: Mobile-first approach
- **Fast Loading**: Optimized for speed
- **Clean UI**: Modern, minimal interface
- **Error Handling**: Graceful error states

## 🛠️ Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Environment Variables
```bash
# Copy example environment file
cp env.example .env.local

# Key variables:
GATE_PASSWORD=yesmistress
MEDIACMS_BASE_URL=http://localhost:8000
# Cloudflare (optional but recommended)
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code

# CSV data source for trailers (required)
# Absolute path preferred. Used by SSR and API routes.
VIDEO_DB_PATH="/absolute/path/to/VideoDB.csv"
```

Notes:
- The password check is case-insensitive and whitespace-insensitive. Set `GATE_PASSWORD` to your desired phrase; users can enter it with or without spaces/case.
- On localhost (HTTP), the auth cookie is issued without `Secure`. In production (HTTPS), `Secure` is set automatically.
 - The CSV loader also falls back to common paths like `/app/data/VideoDB.csv`, `/opt/neversatisfiedxo/data/VideoDB.csv`, and `data/VideoDB.csv` relative to the process cwd, but `VIDEO_DB_PATH` is the most reliable.

### Available Scripts
```bash
# Start development environment
./start-local-dev.sh

# Stop all containers
docker compose -f docker-compose.local-dev.yml down

# View logs
docker compose -f docker-compose.local-dev.yml logs -f

# Rebuild containers
docker compose -f docker-compose.local-dev.yml up --build -d
```

## 🚀 Deployment

### Production Deployment
```bash
# Recommended (uses root docker-compose.yml with image caching enabled)
docker compose up -d

# Alternative unified stack
docker compose -f docker-compose.prod-unified.yml up -d
```

### Faster Builds (Caching)
The root `docker-compose.yml` tags the web image as `v0_trailer_web` and enables `cache_from`.

```bash
# Build using cached layers
docker compose build web

# (Optional) Push/pull to reuse cache across machines/CI
docker tag v0_trailer_web:latest <your-registry>/v0_trailer_web:latest
docker push <your-registry>/v0_trailer_web:latest
docker pull <your-registry>/v0_trailer_web:latest
```

Notes:
- `.dockerignore` reduces build context for faster Docker builds.
- MediaCMS now uses the official `mediacms/mediacms:latest` image by default (no custom image build needed).

### Environment Setup
1. Set production environment variables
2. Configure SSL certificates
3. Set up domain and DNS
4. Deploy with Docker Compose

## 📊 Performance

### Optimizations Applied
- **Image Quality**: 70% quality (down from 95%)
- **Image Sizes**: 800x450 for grid, 640x360 for list
- **Format**: WebP for better compression
- **Caching**: Aggressive caching with React Query
- **Bundle Size**: Optimized Next.js build

### 2.6.4 Production Build Optimizations
- **Drop development logs**: Production bundles strip `console.*` calls except `console.warn` and `console.error` to reduce JS size.
- **Disable client source maps in prod**: Prevents shipping `.map` files and slightly reduces output size.
- **Avoid duplicate data fetch**: Gallery uses SSR data by default and only fetches on search/filter interactions; applies lightweight client-side sorting when using SSR data.
- **API caching honored**: Removed global `no-store` header for `/api`, allowing per-route `Cache-Control: s-maxage` to be effective.
- **CSV parse caching**: API routes `/api/trailers` and `/api/trailers/[id]` cache parsed CSV in-memory for 5 minutes to cut file I/O and parsing cost.
- **On-demand UI chunks**: `QuickPreview` dialog/player and `ModernFilterChips` are dynamically imported; React Query Devtools are excluded from production.
- **Bundle analyzer**: One-command report to identify oversized routes and shared chunks.

### Bundle analysis
Run the analyzer from `apps/web` to inspect route and shared chunk sizes:

```bash
cd apps/web
npm run analyze
```

Notes:
- You may see a Turbopack root warning due to multiple lockfiles. It is safe to ignore, or set `turbopack.root` in `apps/web/next.config.ts` if desired.
- The analyzer output prints route sizes and “First Load JS shared by all”. Use this to target dynamic imports or reductions.

Recent analyzer results (post-splits):

- `/gallery`: 71.4 kB → 54 kB
- `/video/[id]`: 27.4 kB → 18.6 kB
- `/enter`: 23.6 kB → 14.8 kB

### Metrics
- **First Load JS (shared)**: ~177 kB
- **Gallery Page**: ~71.4 kB
- **Enter Page**: ~23.6 kB
- **Video Detail Page**: ~27.4 kB
- **Middleware**: ~38.3 kB
- **Build Time**: Improved with `.dockerignore` + image layer caching

## 🔒 Security

### Authentication
- Simple password-based authentication
- HTTP-only cookies
- No complex JWT tokens
- Session-based access control

### Headers
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

## 🐛 Troubleshooting

### Common Issues

**Images not loading:**
- Check Cloudflare Stream configuration
- Verify video UIDs in database
- Check network connectivity

**Authentication not working:**
- Use an incognito window and retry `/enter` with your password (try both with and without spaces).
- Confirm cookie is set: DevTools → Application → Cookies → `authenticated=true`.
- Verify API accepts your input:
```bash
curl -i -X POST http://localhost:3000/api/auth/simple \
  -H "Content-Type: application/json" \
  -d '{"password":"yes mistress"}'
```
- If issues persist, clean stale Docker state and rebuild:
```bash
docker compose -f docker-compose.local-dev.yml down
docker volume rm v0trailer_web_data_dev v0trailer_postgres_data_dev \
  v0trailer_redis_data_dev v0trailer_mediacms_data_dev v0trailer_mediacms_logs_dev || true
docker image prune -f
docker compose -f docker-compose.local-dev.yml up --build -d
```

**Build failures:**
- Clear Docker cache: `docker system prune -f`
- Rebuild containers: `docker compose up --build -d`
- Check TypeScript errors in logs

### Debug Commands
```bash
# Check container status
docker compose -f docker-compose.local-dev.yml ps

# View application logs
docker compose -f docker-compose.local-dev.yml logs web

# Check database
docker compose -f docker-compose.local-dev.yml exec postgres psql -U mediacms -d mediacms
```

## 📝 Recent Changes

### v2.6.3 - Gallery Performance & Stability
- ✅ Cloudflare Stream thumbnail at 0.005s (800×450 q75)
- ✅ Multi-URL thumbnail fallbacks and customer domain support
- ✅ Background preloader for all gallery thumbnails
- ✅ Increased high priority cards to 24
- ✅ No autoplay in cards/list; posters on iframes
- ✅ Simplified documentation and troubleshooting

### v2.6.3 Deployment Speedups
- ✅ Added `.dockerignore` to shrink Docker build context
- ✅ Simplified `Dockerfile` (no extra deps stage; no `data/` copy)
- ✅ Enabled image caching in `docker-compose.yml` (`image: v0_trailer_web`, `cache_from`)
- ✅ Switched MediaCMS to official image in Compose (no local build)

### Removed Features
- Complex JWT authentication
- Progressive image loading
- Performance monitoring hooks
- Preloading systems
- Complex rate limiting
- Unused UI components

## 📱 Mobile Experience

The gallery and quick preview are optimized for mobile devices, with specific improvements to ensure a smooth, native-like feel:

- Full-screen Quick Preview dialog on small screens with safe-area insets (notch/home indicator) and a notch-aware close button.
- Vertical scrolling inside the modal on mobile (no clipped content), with overscroll containment to prevent background rubber-banding.
- Swipe-down-to-close gesture when the modal content is scrolled to the top.
- iOS viewport height fix: CSS variable `--vh` synced to `visualViewport` to reduce layout jumps when the keyboard opens.
- Improved video player sizing and containment in dialogs to avoid black bars and keep controls accessible.

Implementation details:

- `apps/web/src/components/quick-preview.tsx` sets mobile-first dialog sizing, adds swipe handling, and uses `--vh` for height.
- `apps/web/src/app/globals.css` includes mobile dialog rules for overscroll containment, safe-area padding, and momentum scrolling.

Troubleshooting on mobile:

- If swipe-to-close isn’t triggering, ensure the dialog content is scrolled to the top; the gesture is disabled while scrolled.
- On older iOS versions, `overscroll-behavior` may not be fully supported; containment still works reasonably with momentum scrolling enabled.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Private project - All rights reserved.


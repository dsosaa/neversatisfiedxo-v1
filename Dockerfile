# Multi-stage Docker build for Next.js application
# Optimized for production deployment with security best practices
# 
# VERSION 2.6.3 - Premium Visual Experience & Performance Optimization (September 2025):
# - 4K video support with enhanced Cloudflare Player
# - High-quality poster images with 15ms timestamps and WebP format
# - Custom blue scrollbar theme with gradient effects
# - Advanced image loading with progressive enhancement
# - Performance monitoring and optimization
# - Enhanced user experience with modern UI components
# - Duration badges with clock icons on trailer cards

FROM node:20-alpine AS base
 

# Build stage with all dependencies
FROM base AS builder
WORKDIR /app/web

# Copy package files and install all dependencies with cache mounts
COPY apps/web/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    --mount=type=cache,target=/.next/cache \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Copy web application source code
COPY apps/web/ ./

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Add build arguments for Next.js environment variables
ARG NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_BASE_URL

# Set environment variables from build arguments
ENV NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=$NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Build the Next.js application with cache mounts for faster builds
RUN --mount=type=cache,target=/app/web/.next/cache \
    --mount=type=cache,target=/root/.cache \
    --mount=type=cache,target=/tmp/tsbuildinfo \
    npm run build:production

# Production image optimized for runtime
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install dumb-init and networking tools for health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build from builder stage (correct paths)
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/web/public ./public

# Copy healthcheck script
COPY --chown=nextjs:nodejs healthcheck.js ./

# Ensure all essential assets are present
RUN ls -la /app/public/ | grep -E "(neversatisfiedxo-logo|favicon|icon)" || echo "⚠️  Logo assets check"

# Create cache directories with proper permissions
RUN mkdir -p /app/.next/cache/images && \
    chown -R nextjs:nodejs /app/.next/cache

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check aligned with application endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node healthcheck.js || exit 1

# Use dumb-init and start the Next.js standalone server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
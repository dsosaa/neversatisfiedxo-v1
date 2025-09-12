# Multi-stage Docker build for Next.js application
# Optimized for production deployment with security best practices
# 
# DEPLOYMENT FIXES INCORPORATED (January 2025):
# - healthcheck.js file properly copied to container
# - Correct build context and file paths verified
# - Compatible with docker-compose.production.yml (no HA conflicts)
# - Proper user permissions and security practices
# - Health check endpoint aligned with Next.js API routes

FROM node:20-alpine AS base

# Install system dependencies and security updates
FROM base AS deps
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    openssh-client \
    && apk upgrade --no-cache

# Set working directory in web app context
WORKDIR /app/web

# Copy package files for dependency installation (correct path)
COPY apps/web/package*.json ./

# Install production dependencies with cache mounts for faster builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
  if [ -f package-lock.json ]; then \
    npm ci --omit=dev --no-audit --no-fund; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

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

# Copy data directory to root for access
COPY data/ /app/data/

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application with cache mounts for faster builds
RUN --mount=type=cache,target=/app/web/.next/cache \
    --mount=type=cache,target=/root/.cache \
    --mount=type=cache,target=/tmp/tsbuildinfo \
    npm run build

# Production image optimized for runtime
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build from builder stage (correct paths)
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/web/public ./public

# Copy data directory for API access
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Copy healthcheck script
COPY --chown=nextjs:nodejs healthcheck.js ./

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
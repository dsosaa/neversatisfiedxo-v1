# Multi-stage Docker build for Next.js application
# Optimized for production deployment with security best practices and Context7 recommendations

FROM node:20-alpine AS base

# Install system dependencies and security updates
FROM base AS deps
# Install build tools and security updates
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    && apk upgrade --no-cache

WORKDIR /app

# Copy package files for dependency installation
COPY apps/web/package*.json ./

# Install dependencies with security audit
RUN \
  if [ -f package-lock.json ]; then \
    npm ci --only=production --no-audit --no-fund && \
    npm audit fix --audit-level=high; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Build stage with development dependencies
FROM base AS builder
WORKDIR /app

# Install development dependencies for build
COPY apps/web/package*.json ./
RUN \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Copy source code
COPY apps/web/ ./

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application with production optimizations
RUN \
  if [ -f package-lock.json ]; then \
    npm run build:production; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

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

# Create non-root user for security (following Context7 best practices)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/public ./public

# Create .next directory with proper permissions
RUN mkdir .next && \
    chown nextjs:nodejs .next

# Copy standalone application and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy healthcheck script
COPY --chown=nextjs:nodejs healthcheck.js ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Enhanced health check with better parameters
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1

# Use dumb-init for proper signal handling and start the server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
#!/bin/bash

# Enhanced startup script for web container
# Handles MediaCMS being unavailable gracefully

set -e

echo "🚀 Starting web container..."

# Wait for essential services (PostgreSQL and Redis)
echo "⏳ Waiting for PostgreSQL and Redis..."
timeout 60 bash -c 'until curl -f http://postgres:5432 >/dev/null 2>&1; do sleep 2; done' || echo "⚠️  PostgreSQL not ready, continuing anyway"
timeout 60 bash -c 'until redis-cli -h redis ping >/dev/null 2>&1; do sleep 2; done' || echo "⚠️  Redis not ready, continuing anyway"

# Check MediaCMS availability (non-blocking)
echo "🔍 Checking MediaCMS availability..."
if curl -f http://mediacms:80/ >/dev/null 2>&1; then
    echo "✅ MediaCMS is available"
    export MEDIACMS_AVAILABLE=true
else
    echo "⚠️  MediaCMS is not available, running in standalone mode"
    export MEDIACMS_AVAILABLE=false
fi

# Set environment variables based on MediaCMS availability
if [ "$MEDIACMS_AVAILABLE" = "false" ]; then
    export MEDIACMS_BASE_URL=""
    export MEDIACMS_API_TOKEN=""
fi

echo "🌐 Starting Next.js application..."
exec node server.js

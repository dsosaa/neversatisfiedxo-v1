#!/bin/bash

# Local Development Startup Script
# This script starts the V0 Trailer site with optimized settings for faster loading

echo "🚀 Starting V0 Trailer Local Development Environment"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env.local exists, if not create from dev-config.env
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from dev-config.env..."
    cp dev-config.env .env.local
    echo "✅ Created .env.local with default development settings"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.local-dev.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker compose -f docker-compose.local-dev.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker exec v0_trailer_postgres_dev pg_isready -U mediacms -d mediacms > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Redis
if docker exec v0_trailer_redis_dev redis-cli --pass devpassword123 ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
fi

# Check MediaCMS
if curl -f http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ MediaCMS is ready at http://localhost:8000"
else
    echo "❌ MediaCMS is not ready"
fi

# Check Next.js
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js is ready at http://localhost:3000"
else
    echo "❌ Next.js is not ready"
fi

echo ""
echo "🎉 Development environment is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "📊 To view logs:"
echo "   docker compose -f docker-compose.local-dev.yml logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker compose -f docker-compose.local-dev.yml down"
echo ""
echo "⚡ Optimizations applied:"
echo "   - Reduced thumbnail resolution (1280x720 → 800x450)"
echo "   - Lowered image quality (95% → 70%)"
echo "   - Disabled DPR scaling for faster loading"
echo "   - Enabled development mode optimizations"


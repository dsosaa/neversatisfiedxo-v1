# neversatisfiedxo Development & Deployment Makefile
# Optimized workflow with deployment issue fixes and comprehensive validation

.PHONY: help dev build test deploy clean setup validate-env validate-docker

# Default target
help:
	@echo "🚀 neversatisfiedxo Development Commands"
	@echo "=====================================\n"
	@echo "Development:"
	@echo "  dev              Start local development environment"
	@echo "  dev-secure       Start development with security validation"
	@echo "  dev-clean        Clean restart (rebuild containers)"
	@echo "  dev-logs         Show development logs"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  test             Run complete test suite"
	@echo "  test-e2e         Run end-to-end tests"
	@echo "  lint             Run linting and type checks"
	@echo "  security         Run security audit"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  build            Build for production"
	@echo "  build-analyze    Build with bundle analysis"
	@echo "  deploy           Deploy to production (smart strategy)"
	@echo "  deploy-production Deploy to production with validation"
	@echo "  deploy-complete  Complete deployment with nginx and SSL"
	@echo "  deploy-staging   Deploy to staging environment"
	@echo ""
	@echo "Validation:"
	@echo "  validate-env     Validate environment configuration"
	@echo "  validate-docker  Validate Docker configurations"
	@echo "  deploy-validate  Validate production deployment"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean            Clean all containers and volumes"
	@echo "  setup            Initial project setup"
	@echo "  health           Check system health"
	@echo ""
	@echo "Issue Prevention & Troubleshooting (v2.4.1):"
	@echo "  validate-env           Validate environment variables"
	@echo "  validate-deployment    Run deployment validation tests"
	@echo "  deploy-validated       Deploy with comprehensive validation"
	@echo "  fix-cloudflare-env     Fix Cloudflare environment variable loading"
	@echo "  fix-nginx-images       Fix nginx image optimization routing"
	@echo "  test-video-player      Test video player configuration"
	@echo "  test-image-optimization Test Next.js image optimization"
	@echo "  troubleshoot-all       Run comprehensive troubleshooting"

# Development Commands
dev:
	@echo "🚀 Starting development environment..."
	@if [ ! -f .env ]; then \
		echo "⚠️  Creating .env from example..."; \
		cp .env.production.example .env; \
	fi
	docker compose --profile development up -d
	@echo "✅ Development environment started!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8000"
	@echo "📊 Admin: http://localhost:8000/admin/"

dev-secure:
	@echo "🔒 Starting secure development environment..."
	cd apps/web && npm run dev:secure

dev-clean:
	@echo "🧹 Clean restart development environment..."
	docker compose down -v
	docker compose build --no-cache
	make dev

dev-logs:
	docker compose logs -f web mediacms

# Testing & Quality
test:
	@echo "🧪 Running complete test suite..."
	cd apps/web && npm run test

test-e2e:
	@echo "🎭 Running end-to-end tests..."
	cd apps/web && npm run test:e2e

lint:
	@echo "🔍 Running lint and type checks..."
	cd apps/web && npm run lint && npm run type-check

security:
	@echo "🛡️  Running security audit..."
	cd apps/web && npm run security:check

# Build & Deploy
build:
	@echo "🏗️  Building for production..."
	cd apps/web && npm run build:production

build-analyze:
	@echo "📊 Building with bundle analysis..."
	cd apps/web && npm run build:analyze

# Smart deployment - automatically chooses strategy
deploy:
	@echo "🤖 Smart deployment - analyzing changes..."
	@./scripts/smart-deploy.sh

# Force specific deployment strategies
deploy-sync:
	@echo "⚡ Force SSH sync deployment..."
	@./scripts/smart-deploy.sh HEAD~1 sync

deploy-rebuild:
	@echo "🔄 Force container rebuild deployment..."
	@./scripts/smart-deploy.sh HEAD~1 rebuild

deploy-fresh:
	@echo "🚀 Force fresh deployment..."
	@if [ -z "$(DOMAIN)" ]; then \
		echo "❌ DOMAIN environment variable required"; \
		echo "Usage: make deploy-fresh DOMAIN=videos.neversatisfiedxo.com"; \
		exit 1; \
	fi
	@./scripts/deploy.sh deploy

# Legacy deployment (full pipeline)
deploy-full:
	@echo "🚀 Full deployment pipeline..."
	@if [ -z "$(DOMAIN)" ]; then \
		echo "❌ DOMAIN environment variable required"; \
		echo "Usage: make deploy-full DOMAIN=videos.neversatisfiedxo.com"; \
		exit 1; \
	fi
	@./scripts/deploy.sh deploy

deploy-staging:
	@echo "🧪 Deploying to staging..."
	BRANCH=staging ./scripts/smart-deploy.sh

# Maintenance
clean:
	@echo "🧹 Cleaning containers and volumes..."
	docker compose down -v
	docker system prune -f
	cd apps/web && npm run clean

setup:
	@echo "⚙️  Setting up project..."
	@if [ ! -f .env ]; then \
		cp .env.production.example .env; \
		echo "📝 Created .env file - please update with your values"; \
	fi
	cd apps/web && npm install
	@echo "✅ Project setup complete!"

health:
	@echo "🩺 Checking system health..."
	@echo "Docker status:"
	@docker info --format '{{.ServerVersion}}' || echo "❌ Docker not running"
	@echo ""
	@echo "Container status:"
	@docker compose ps || echo "❌ No containers running"
	@echo ""
	@echo "Service health:"
	@curl -s http://localhost:3000/api/health || echo "❌ Frontend health check failed"
	@curl -s http://localhost:8000/api/health || echo "❌ Backend health check failed"

# Production shortcuts
prod-start:
	docker compose --profile production up -d

prod-logs:
	docker compose --profile production logs -f

prod-stop:
	docker compose --profile production down

# Database operations
db-backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	docker compose exec postgres pg_dump -U mediacms mediacms > backups/db-backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "✅ Backup created in backups/"

db-restore:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ FILE parameter required"; \
		echo "Usage: make db-restore FILE=backups/db-backup-20240101-120000.sql"; \
		exit 1; \
	fi
	@echo "🔄 Restoring database from $(FILE)..."
	docker compose exec -T postgres psql -U mediacms -d mediacms < $(FILE)
	@echo "✅ Database restored!"

# Performance monitoring
perf:
	@echo "⚡ Running performance tests..."
	cd apps/web && npm run perf:lighthouse

monitor:
	@echo "📊 Monitoring system resources..."
	docker stats --no-stream

# Validation targets (incorporates deployment fixes)
validate-env:
	@echo "🔍 Validating environment configuration..."
	@test -f .env || (echo "❌ .env file not found. Copy from .env.production.template" && exit 1)
	@grep -q "POSTGRES_PASSWORD" .env || (echo "❌ POSTGRES_PASSWORD not set" && exit 1)
	@grep -q "REDIS_PASSWORD" .env || (echo "❌ REDIS_PASSWORD not set" && exit 1)
	@grep -q "GATE_PASSWORD" .env || (echo "❌ GATE_PASSWORD not set" && exit 1)
	@grep -q "DJANGO_SECRET_KEY" .env || (echo "❌ DJANGO_SECRET_KEY not set" && exit 1)
	@echo "✅ Environment configuration valid"

validate-docker:
	@echo "🐳 Validating Docker configurations..."
	@test -f healthcheck.js || (echo "❌ healthcheck.js file missing - run 'node -e \"console.log(require('fs').readFileSync('./healthcheck.js'))\"' to check" && exit 1)
	@test -f Dockerfile || (echo "❌ Dockerfile missing" && exit 1)
	@docker compose -f docker-compose.yml config > /dev/null || (echo "❌ docker-compose.yml invalid" && exit 1)
	@docker compose -f docker-compose.dev.yml config > /dev/null || (echo "❌ docker-compose.dev.yml invalid" && exit 1)
	@docker compose -f docker-compose.production.yml config > /dev/null || (echo "❌ docker-compose.production.yml invalid" && exit 1)
	@echo "✅ Docker configurations valid"

# Production deployment with comprehensive validation
deploy-production: validate-env validate-docker
	@echo "🚀 Deploying to production VPS with validation..."
	@echo "🔍 Pre-deployment validation..."
	$(MAKE) test
	$(MAKE) security
	@echo "📦 Syncing files to production server..."
	rsync -avz -e "ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no" \
		--exclude=node_modules --exclude=.git --exclude=.next --exclude=.env.local \
		./ root@82.180.137.156:/opt/neversatisfiedxo/
	@echo "🐳 Deploying containers with fixed configuration..."
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 \
		"cd /opt/neversatisfiedxo && docker compose -f docker-compose.production.yml up -d --build"
	@echo "✅ Production deployment complete"
	$(MAKE) deploy-validate

# Sync to VPS and reload web container with cleanup
prod-sync-reload:
	@echo "🚀 Syncing repo to Hostinger VPS and reloading services (safe cleanup)..."
	chmod +x scripts/prod-sync-reload.sh
	SSH_KEY_PATH=${SSH_KEY_PATH} PRODUCTION_HOST=${PRODUCTION_HOST} PRODUCTION_USER=${PRODUCTION_USER} PRODUCTION_PATH=${PRODUCTION_PATH} \
		./scripts/prod-sync-reload.sh

deploy-validate:
	@echo "🔍 Validating production deployment..."
	@echo "Testing SSL certificate..."
	curl -I https://videos.neversatisfiedxo.com/enter || echo "❌ SSL/HTTPS test failed"
	@echo "Testing health endpoints..."
	curl -f https://videos.neversatisfiedxo.com/api/health || echo "❌ Health check failed"
	@echo "Testing authentication endpoint..."
	curl -X POST https://videos.neversatisfiedxo.com/api/gate \
		-H "Content-Type: application/json" \
		-d '{"password": "yesmistress"}' || echo "❌ Authentication test failed"
	@echo "✅ Production validation complete"

# Production helpers for VPS management
production-logs:
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 \
		"cd /opt/neversatisfiedxo && docker compose -f docker-compose.production.yml logs -f"

production-status:
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 \
		"cd /opt/neversatisfiedxo && docker compose -f docker-compose.production.yml ps"

production-health:
	@echo "🏥 Production health checks:"
	curl -f https://videos.neversatisfiedxo.com/api/health && echo "✅ Production healthy" || echo "❌ Production unhealthy"

# Complete deployment with nginx and SSL
deploy-complete:
	@echo "🚀 Starting complete deployment with nginx and SSL..."
	chmod +x scripts/deploy-with-nginx.sh
	./scripts/deploy-with-nginx.sh videos.neversatisfiedxo.com

# Setup nginx and SSL on existing deployment
setup-nginx:
	@echo "🌐 Setting up nginx and SSL certificates..."
	rsync -avz -e "ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no" config/nginx-site.conf root@82.180.137.156:/opt/neversatisfiedxo/config/
	rsync -avz -e "ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no" scripts/setup-nginx-ssl.sh root@82.180.137.156:/opt/neversatisfiedxo/scripts/
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "cd /opt/neversatisfiedxo && chmod +x scripts/setup-nginx-ssl.sh && ./scripts/setup-nginx-ssl.sh"

# Test website functionality
test-website:
	@echo "🧪 Testing website functionality..."
	rsync -avz -e "ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no" scripts/test-website.sh root@82.180.137.156:/opt/neversatisfiedxo/scripts/
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "cd /opt/neversatisfiedxo && chmod +x scripts/test-website.sh && ./scripts/test-website.sh"

# Nginx-specific operations
nginx-status:
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "systemctl status nginx"

nginx-logs:
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "tail -f /var/log/nginx/error.log"

nginx-reload:
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "nginx -t && systemctl reload nginx"

# SSL certificate operations
ssl-status:
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "certbot certificates"

ssl-renew:
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "certbot renew --dry-run"

# Issue prevention and troubleshooting commands (v2.4.1)
validate-env:
	@echo "🔍 Validating environment variables..."
	@./scripts/validate-environment.sh

validate-deployment:
	@echo "🧪 Running deployment validation tests..."
	@./scripts/test-deployment-fixes.sh

deploy-validated:
	@echo "🚀 Deploying with comprehensive validation..."
	@./scripts/deploy-with-validation.sh

# Troubleshooting commands for known issues
fix-cloudflare-env:
	@echo "🔧 Fixing Cloudflare environment variable loading..."
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "cd /opt/neversatisfiedxo && docker compose restart web"
	@echo "✅ Web service restarted to reload environment variables"

fix-nginx-images:
	@echo "🔧 Fixing nginx image optimization routing..."
	rsync -avz -e "ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no" config/nginx-site.conf root@82.180.137.156:/etc/nginx/sites-available/videos.neversatisfiedxo.com
	ssh -i ~/.ssh/hostinger_deploy_ed25519 -o StrictHostKeyChecking=no root@82.180.137.156 "nginx -t && systemctl reload nginx"
	@echo "✅ Nginx configuration updated and reloaded"

test-video-player:
	@echo "🎥 Testing video player configuration..."
	@echo "Testing Cloudflare customer code accessibility..."
	@curl -s 'https://videos.neversatisfiedxo.com/test-video' -b /tmp/test_cookies.txt | grep -o 'NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE[^<]*' || echo "⚠️  Need to authenticate first"
	@echo ""
	@echo "To authenticate: curl -X POST 'https://videos.neversatisfiedxo.com/api/gate' -H 'Content-Type: application/json' -d '{\"password\": \"yesmistress\"}' -c /tmp/test_cookies.txt"

test-image-optimization:
	@echo "🖼️  Testing Next.js image optimization..."
	@curl -I 'https://videos.neversatisfiedxo.com/_next/image?url=/neversatisfiedxo-logo.png&w=200&q=75' | grep -E "(HTTP|Cache-Control)" || echo "❌ Image optimization not working"

troubleshoot-all:
	@echo "🔍 Running comprehensive troubleshooting..."
	@echo ""
	@echo "1. Environment Variables:"
	@make validate-env
	@echo ""
	@echo "2. Container Status:"
	@make production-status
	@echo ""
	@echo "3. Nginx Status:"
	@make nginx-status
	@echo ""
	@echo "4. Deployment Validation:"
	@make validate-deployment

# Quick development validation (prevents deployment issues)
dev-validate: validate-env validate-docker
	@echo "🔍 Validating development environment..."
	@echo "Testing Docker Compose configurations..."
	docker compose -f docker-compose.dev.yml config
	@echo "Testing build process..."
	cd apps/web && npm run build
	@echo "✅ Development validation complete"

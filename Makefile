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

# Quick development validation (prevents deployment issues)
dev-validate: validate-env validate-docker
	@echo "🔍 Validating development environment..."
	@echo "Testing Docker Compose configurations..."
	docker compose -f docker-compose.dev.yml config
	@echo "Testing build process..."
	cd apps/web && npm run build
	@echo "✅ Development validation complete"
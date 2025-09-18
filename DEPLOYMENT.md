# Deployment Guide

Simple deployment guide for the V0 Trailer Site.

## 🚀 Quick Deployment

### Local Development
```bash
# Start development environment
./start-local-dev.sh

# Access the site
open http://localhost:3000
```

### Production Deployment
```bash
# Recommended (uses root compose with image caching enabled)
docker compose up -d

# Alternative unified stack
docker compose -f docker-compose.prod-unified.yml up -d
```

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Authentication
GATE_PASSWORD=yesmistress  # Case/space-insensitive matching

# Backend URL
MEDIACMS_BASE_URL=http://localhost:8000

# Database (if using external)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis (if using external)
REDIS_URL=redis://host:port

# CSV data source for trailers (required in both dev and prod)
# This should point to the VideoDB.csv containing trailer metadata.
VIDEO_DB_PATH=/absolute/path/to/VideoDB.csv
```

### SSL Configuration
1. Place SSL certificates in `config/ssl/`
2. Update nginx configuration in `config/nginx.conf`
3. Set `NODE_ENV=production`

## 📦 Docker Commands

### Development
```bash
# Start all services
docker compose -f docker-compose.local-dev.yml up -d

# View logs
docker compose -f docker-compose.local-dev.yml logs -f

# Stop services
docker compose -f docker-compose.local-dev.yml down

# Rebuild and start
docker compose -f docker-compose.local-dev.yml up --build -d
```

### Production
```bash
# Start production services (root compose)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## 🔍 Health Checks

### Check Service Status
```bash
# Check all containers
docker compose ps

# Check specific service
docker compose logs web
docker compose logs mediacms
docker compose logs postgres
```

### Test Endpoints
```bash
# Frontend health
curl http://localhost:3000/api/health

# Backend health
curl http://localhost:8000/api/health

# Database connection
docker compose exec postgres pg_isready
```

## 🐛 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using port 3000
lsof -ti:3000

# Kill process if needed
kill -9 $(lsof -ti:3000)
```

**Build failures:**
```bash
# Clean Docker cache
docker system prune -f

# Rebuild from scratch
docker compose down
docker compose up --build -d
```

**Database issues:**
```bash
# Reset database
docker compose down -v
docker compose up -d
```

**Image loading problems:**
- Check Cloudflare Stream configuration
- Verify video UIDs in database
- Check network connectivity to videodelivery.net
 - If thumbnails 404 intermittently, set `NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE` and restart; the app will fallback to `customer-<code>.cloudflarestream.com`.
 - Thumbnails are requested at `time=0.005s` (and fallback to 0.015s/0.03s) at 800×450 q75.

**Auth not working / redirect loops:**
1) Try incognito and re-enter the password at `/enter` (with or without spaces).
2) Verify the API accepts your input:
```bash
curl -i -X POST http://localhost:3000/api/auth/simple \
  -H "Content-Type: application/json" \
  -d '{"password":"yes mistress"}'
```
3) Check cookie presence: DevTools → Application → Cookies → `authenticated=true`.
4) Clean stale Docker state and rebuild:
5) Ensure `VIDEO_DB_PATH` is set and readable by the web container/process.
6) Verify trailers API returns data:
```bash
curl http://localhost:3000/api/trailers | jq '.count'
```
```bash
docker compose -f docker-compose.local-dev.yml down
docker volume rm v0trailer_web_data_dev v0trailer_postgres_data_dev \
  v0trailer_redis_data_dev v0trailer_mediacms_data_dev v0trailer_mediacms_logs_dev || true
docker image prune -f
docker compose -f docker-compose.local-dev.yml up --build -d
```

## 📊 Monitoring

### Logs
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f web
docker compose logs -f mediacms
```

### Performance
- Monitor container resource usage: `docker stats`
- Check application performance in browser dev tools
- Monitor database performance with PostgreSQL tools

## 🔒 Security

### Production Checklist
- [ ] Set strong `GATE_PASSWORD`
- [ ] Configure SSL certificates
- [ ] Set `NODE_ENV=production`
- [ ] Use secure database credentials
- [ ] Enable firewall rules
- [ ] Regular security updates

### Authentication
- Password gate via `GATE_PASSWORD` (case/space-insensitive)
- Session: 7 days via HTTP-only cookie `authenticated=true`
- Cookie `Secure` flag
  - Enabled automatically on HTTPS (production)
  - Omitted on HTTP (localhost) so browsers accept it

## 📈 Scaling

### Horizontal Scaling
- Use load balancer for multiple web instances
- Scale database with read replicas
- Use Redis cluster for caching

### Vertical Scaling
- Increase container memory limits
- Optimize database configuration
- Use CDN for static assets

## 🔄 Updates

### Rolling Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose up --build -d
```

## 🧰 Build Performance

### Faster Docker Builds
- `.dockerignore` greatly reduces build context size.
- The root `docker-compose.yml` tags the web image (`v0_trailer_web`) and enables `cache_from` for layer reuse.
- MediaCMS now uses the official `mediacms/mediacms:latest` image, avoiding a local image build.

#### Optional registry cache
```bash
docker build -t v0_trailer_web:latest .
docker tag v0_trailer_web:latest <your-registry>/v0_trailer_web:latest
docker push <your-registry>/v0_trailer_web:latest
```

### Database Migrations
```bash
# Run migrations
docker compose exec mediacms python manage.py migrate
```

## 📞 Support

For issues or questions:
1. Check this deployment guide
2. Review application logs
3. Check Docker container status
4. Verify environment variables
5. Test network connectivity


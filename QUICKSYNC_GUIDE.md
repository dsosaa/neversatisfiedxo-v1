# QuickSync SSH Development System

A comprehensive system for efficient VPS development that automatically syncs your local changes to the remote VPS without full redeployment.

## 🚀 Quick Start

### 1. Load Aliases (Recommended)
```bash
source scripts/aliases.sh
```

### 2. Start Development
```bash
# Option 1: Start with auto-sync (requires fswatch)
dev-start

# Option 2: Manual sync mode
qs-sync-all
```

## 📋 Available Commands

### QuickSync Commands
```bash
# Sync specific services
qs-sync-web          # Sync web changes to VPS
qs-sync-mediacms     # Sync MediaCMS changes to VPS
qs-sync-all          # Sync all changes to VPS

# View logs
qs-logs-web          # View web container logs
qs-logs-mediacms     # View MediaCMS container logs
qs-logs-nginx        # View nginx container logs

# Open shells
qs-shell-web         # Open shell in web container
qs-shell-mediacms    # Open shell in MediaCMS container
qs-shell-vps         # Open VPS shell

# Check status
qs-status            # Check all container status
```

### Development Workflow Commands
```bash
dev-start            # Start development with auto-sync
dev-stop             # Stop all services
dev-restart          # Restart all services
dev-status           # Check service status
dev-logs [service]   # View logs (specify service)
dev-shell [service]  # Open shell (specify service)
dev-deploy           # Full deployment
dev-clean            # Clean up and restart
```

### Watch and Sync Commands
```bash
watch-web            # Watch web files and auto-sync
watch-mediacms       # Watch MediaCMS files and auto-sync
watch-all            # Watch all files and auto-sync
```

## 🔧 Manual Commands

If you prefer not to use aliases:

```bash
# QuickSync
./scripts/quicksync.sh [service] [action]
./scripts/quicksync.sh web sync
./scripts/quicksync.sh mediacms logs
./scripts/quicksync.sh all status

# Development Workflow
./scripts/dev-workflow.sh [command]
./scripts/dev-workflow.sh start
./scripts/dev-workflow.sh logs web

# Watch and Sync
./scripts/watch-and-sync.sh [service]
./scripts/watch-and-sync.sh web
./scripts/watch-and-sync.sh all
```

## 📁 What Gets Synced

### Web Application (`apps/web/`)
- All source code files
- Package files (`package.json`, `package-lock.json`)
- Configuration files
- Excludes: `node_modules`, `.next`, logs

### MediaCMS Application (`apps/mediacms/`)
- All Python source code
- Templates and static files
- Excludes: `__pycache__`, `*.pyc`, `venv`

### Configuration Files
- Docker Compose files
- Dockerfiles
- Nginx configuration
- Environment files

### Data Directory
- CSV files and other data
- Static assets

## 🔄 How It Works

1. **File Watching**: Monitors local files for changes
2. **Smart Syncing**: Only syncs relevant files based on what changed
3. **Service Restart**: Automatically restarts affected containers
4. **Health Checks**: Ensures services are running properly

## 🛠️ Prerequisites

### Required
- SSH access to VPS (configured)
- Docker and Docker Compose on VPS
- `rsync` for file syncing

### Optional (for auto-sync)
- `fswatch` for file watching
  - macOS: `brew install fswatch`
  - Ubuntu: `apt-get install fswatch`

## 📊 Current VPS Status

Your VPS is running:
- ✅ **Web Container**: Next.js frontend (Port 3000)
- ✅ **MediaCMS Container**: Django backend (Port 8000)
- ✅ **PostgreSQL**: Database (Port 5432)
- ✅ **Redis**: Cache (Port 6379)
- ✅ **Nginx**: Reverse proxy (Port 80)

## 🎯 Development Workflow

### 1. Make Local Changes
Edit your files locally in `apps/web/` or `apps/mediacms/`

### 2. Auto-Sync (if fswatch installed)
Files are automatically synced when you save them

### 3. Manual Sync (if needed)
```bash
qs-sync-web          # For web changes
qs-sync-mediacms     # For MediaCMS changes
qs-sync-all          # For all changes
```

### 4. Check Status
```bash
qs-status            # See if everything is running
qs-logs-web          # Check for errors
```

### 5. Test Changes
Visit `https://videos.neversatisfiedxo.com` to see your changes

## 🚨 Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh -i ~/.ssh/hostinger_deploy_ed25519 root@82.180.137.156

# Check SSH key permissions
chmod 600 ~/.ssh/hostinger_deploy_ed25519
```

### Container Issues
```bash
# Check container status
qs-status

# View container logs
qs-logs-web
qs-logs-mediacms

# Restart specific service
qs-web restart
qs-mediacms restart
```

### Sync Issues
```bash
# Force full sync
qs-sync-all

# Check what's being synced
rsync -avz --dry-run -e "ssh -i ~/.ssh/hostinger_deploy_ed25519" ./apps/web/ root@82.180.137.156:/opt/neversatisfiedxo/apps/web/
```

### Full Reset
```bash
# Clean everything and redeploy
dev-clean
```

## 📝 Tips

1. **Use aliases**: Load `scripts/aliases.sh` for convenient commands
2. **Monitor logs**: Use `qs-logs-web` to watch for errors
3. **Check status**: Use `qs-status` to ensure services are healthy
4. **Incremental changes**: Make small changes and sync frequently
5. **Test locally first**: Use `docker compose -f docker-compose.dev-unified.yml up -d` for local testing

## 🔗 Related Files

- `scripts/quicksync.sh` - Main QuickSync script
- `scripts/watch-and-sync.sh` - Auto-sync file watcher
- `scripts/dev-workflow.sh` - Development workflow commands
- `scripts/aliases.sh` - Convenient aliases
- `docker-compose.prod-unified.yml` - Production configuration
- `docker-compose.dev-unified.yml` - Development configuration

## 🎉 Benefits

- ⚡ **Fast Development**: No full redeployment needed
- 🔄 **Auto-Sync**: Changes sync automatically
- 🎯 **Targeted Updates**: Only affected services restart
- 📊 **Real-time Monitoring**: Easy status and log checking
- 🛠️ **Easy Debugging**: Quick access to containers and logs
- 🚀 **Production Ready**: Same environment as production

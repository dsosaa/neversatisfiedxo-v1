#!/bin/bash

# Smart Dependency Installation Script for V0 Trailer Site
# Checks what's already installed and only installs missing dependencies
# Usage: ./install-dependencies-ssh.sh [production|development]

set -e

# Configuration
VPS_HOST="82.180.137.156"
VPS_USER="root"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy"
MODE="${1:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_skip() { echo -e "${YELLOW}[SKIP]${NC} $1"; }

# Check if SSH key exists
check_ssh_key() {
    if [ ! -f "$SSH_KEY_PATH" ]; then
        log_error "SSH key not found at $SSH_KEY_PATH"
        log_info "Please run: ./setup-ssh-keys.sh first"
        exit 1
    fi
    chmod 600 "$SSH_KEY_PATH"
}

# Test SSH connection
test_ssh_connection() {
    log_step "Testing SSH connection to $VPS_HOST..."
    if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Failed to connect to VPS via SSH"
        exit 1
    fi
    log_info "✓ SSH connection established"
}

# Check if command exists on remote server
check_remote_command() {
    local cmd="$1"
    local name="$2"
    
    if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "command -v $cmd >/dev/null 2>&1"; then
        local version=$(ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$cmd --version 2>/dev/null | head -1" || echo "installed")
        log_skip "$name is already installed: $version"
        return 0
    else
        log_info "$name is not installed, will install..."
        return 1
    fi
}

# Check if package is installed via package manager
check_remote_package() {
    local package="$1"
    local name="$2"
    
    if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "dpkg -l | grep -q '^ii.*$package'"; then
        local version=$(ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "dpkg -l | grep '^ii.*$package' | awk '{print \$3}'" | head -1)
        log_skip "$name is already installed: $version"
        return 0
    else
        log_info "$name is not installed, will install..."
        return 1
    fi
}

# Update system packages
update_system() {
    log_step "Updating system packages..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Update package lists
        apt update -y
        
        # Install essential packages if not present
        apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release build-essential
        
        echo "System packages updated"
EOF
    log_info "✓ System packages updated"
}

# Install Docker
install_docker() {
    if check_remote_command "docker" "Docker"; then
        return 0
    fi
    
    log_step "Installing Docker..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Remove old Docker versions
        apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Update package index
        apt update
        
        # Install Docker
        apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        # Start and enable Docker
        systemctl start docker
        systemctl enable docker
        
        # Add current user to docker group
        usermod -aG docker $USER
        
        echo "Docker installed successfully"
EOF
    log_info "✓ Docker installed"
}

# Install Docker Compose
install_docker_compose() {
    if check_remote_command "docker" "Docker"; then
        # Check if docker compose works
        if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "docker compose version >/dev/null 2>&1"; then
            log_skip "Docker Compose is already available"
            return 0
        fi
    fi
    
    log_step "Installing Docker Compose..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Install docker-compose-plugin (modern approach)
        apt install -y docker-compose-plugin
        
        # Alternative: Install standalone docker-compose if needed
        if ! command -v docker-compose >/dev/null 2>&1; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        echo "Docker Compose installed successfully"
EOF
    log_info "✓ Docker Compose installed"
}

# Install Node.js
install_nodejs() {
    if check_remote_command "node" "Node.js"; then
        # Check if it's version 18 or higher
        local node_version=$(ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "node --version | sed 's/v//' | cut -d. -f1")
        if [ "$node_version" -ge 18 ]; then
            log_skip "Node.js version $node_version is sufficient"
            return 0
        else
            log_info "Node.js version $node_version is too old, will upgrade..."
        fi
    fi
    
    log_step "Installing Node.js 18..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Remove old Node.js versions
        apt remove -y nodejs npm 2>/dev/null || true
        
        # Install Node.js 18 from NodeSource
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
        
        # Verify installation
        node --version
        npm --version
        
        echo "Node.js installed successfully"
EOF
    log_info "✓ Node.js installed"
}

# Install Python and pip
install_python() {
    if check_remote_command "python3" "Python 3"; then
        # Check if it's version 3.8 or higher
        local python_version=$(ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "python3 --version | cut -d' ' -f2 | cut -d. -f1,2")
        if [ "$(echo "$python_version >= 3.8" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
            log_skip "Python $python_version is sufficient"
        else
            log_info "Python version $python_version may be too old, will check pip..."
        fi
    fi
    
    if ! check_remote_command "pip3" "pip3"; then
        log_step "Installing Python and pip..."
        
        ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
            # Install Python 3 and pip
            apt install -y python3 python3-pip python3-venv python3-dev
            
            # Install build dependencies for Python packages
            apt install -y build-essential libssl-dev libffi-dev python3-dev
            
            # Upgrade pip
            python3 -m pip install --upgrade pip
            
            echo "Python and pip installed successfully"
EOF
        log_info "✓ Python and pip installed"
    else
        log_skip "Python and pip are already installed"
    fi
}

# Install PostgreSQL client
install_postgresql_client() {
    if check_remote_package "postgresql-client" "PostgreSQL client"; then
        return 0
    fi
    
    log_step "Installing PostgreSQL client..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Install PostgreSQL client
        apt install -y postgresql-client-15
        
        echo "PostgreSQL client installed successfully"
EOF
    log_info "✓ PostgreSQL client installed"
}

# Install Redis tools
install_redis_tools() {
    if check_remote_command "redis-cli" "Redis CLI"; then
        return 0
    fi
    
    log_step "Installing Redis tools..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Install Redis tools
        apt install -y redis-tools
        
        echo "Redis tools installed successfully"
EOF
    log_info "✓ Redis tools installed"
}

# Install Nginx
install_nginx() {
    if check_remote_command "nginx" "Nginx"; then
        return 0
    fi
    
    log_step "Installing Nginx..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Install Nginx
        apt install -y nginx
        
        # Start and enable Nginx
        systemctl start nginx
        systemctl enable nginx
        
        echo "Nginx installed successfully"
EOF
    log_info "✓ Nginx installed"
}

# Install additional development tools
install_dev_tools() {
    if [ "$MODE" = "development" ]; then
        log_step "Installing development tools..."
        
        ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
            # Install development tools
            apt install -y htop iotop tree vim nano git-lfs jq
            
            # Install additional Python development packages
            python3 -m pip install --upgrade pip setuptools wheel
            
            echo "Development tools installed successfully"
EOF
        log_info "✓ Development tools installed"
    else
        log_skip "Skipping development tools (production mode)"
    fi
}

# Install application dependencies
install_app_dependencies() {
    log_step "Installing application dependencies..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Navigate to project directory (if it exists)
        if [ -d "/opt/neversatisfiedxo" ]; then
            cd /opt/neversatisfiedxo
            
            # Install Node.js dependencies for web app
            if [ -f "apps/web/package.json" ]; then
                echo "Installing Node.js dependencies..."
                cd apps/web
                npm ci --production
                cd ../..
            fi
            
            # Install Python dependencies for MediaCMS
            if [ -f "apps/mediacms/requirements.txt" ]; then
                echo "Installing Python dependencies..."
                cd apps/mediacms
                python3 -m venv venv
                source venv/bin/activate
                pip install -r requirements.txt
                deactivate
                cd ../..
            fi
            
            echo "Application dependencies installed successfully"
        else
            echo "Project directory not found, skipping application dependencies"
            echo "Please clone your repository first"
        fi
EOF
    log_info "✓ Application dependencies installed"
}

# Verify all installations
verify_installations() {
    log_step "Verifying all installations..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        echo "=== System Information ==="
        echo "OS: $(lsb_release -d | cut -f2)"
        echo "Kernel: $(uname -r)"
        echo "Architecture: $(uname -m)"
        echo
        
        echo "=== Installed Software ==="
        echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
        echo "Docker Compose: $(docker compose version 2>/dev/null || echo 'Not installed')"
        echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
        echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
        echo "Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
        echo "pip: $(pip3 --version 2>/dev/null || echo 'Not installed')"
        echo "PostgreSQL client: $(psql --version 2>/dev/null || echo 'Not installed')"
        echo "Redis CLI: $(redis-cli --version 2>/dev/null || echo 'Not installed')"
        echo "Nginx: $(nginx -v 2>&1 || echo 'Not installed')"
        echo
        
        echo "=== System Resources ==="
        echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
        echo "Disk: $(df -h / | tail -1 | awk '{print $2}')"
        echo "CPU: $(nproc) cores"
        echo
        
        echo "=== Docker Status ==="
        systemctl is-active docker || echo "Docker service not running"
        echo
        
        echo "=== Nginx Status ==="
        systemctl is-active nginx || echo "Nginx service not running"
EOF
    
    log_info "✓ Verification completed"
}

# Main installation function
main() {
    log_info "🚀 Starting smart dependency installation for V0 Trailer Site"
    log_info "Mode: $MODE"
    echo
    
    check_ssh_key
    test_ssh_connection
    
    # Install system dependencies
    update_system
    install_docker
    install_docker_compose
    install_nodejs
    install_python
    install_postgresql_client
    install_redis_tools
    install_nginx
    install_dev_tools
    
    # Install application dependencies
    install_app_dependencies
    
    # Verify everything
    verify_installations
    
    log_info "🎉 Dependency installation completed successfully!"
    echo
    log_info "Next steps:"
    log_info "1. Clone your repository: git clone <your-repo> /opt/neversatisfiedxo"
    log_info "2. Configure environment variables"
    log_info "3. Run: docker compose up -d"
    echo
}

# Run main function
main "$@"

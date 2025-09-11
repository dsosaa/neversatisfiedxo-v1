#!/bin/bash

# QuickSync Development Dependencies Installation Script
# Installs TypeScript and other missing dependencies for development containers
# Usage: ./quicksync-dev-deps.sh [VPS_IP] [VPS_USER]

set -e

# Configuration
VPS_HOST="${1:-82.180.137.156}"
VPS_USER="${2:-root}"
VPS_PATH="/opt/neversatisfiedxo"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy_ed25519"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_quicksync() { echo -e "${PURPLE}[QUICKSYNC]${NC} $1"; }

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
    if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Failed to connect to VPS via SSH with ED25519 key"
        log_info "Trying RSA key as fallback..."
        if ! ssh -i "$HOME/.ssh/hostinger_deploy" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
            log_error "Both SSH keys failed. Please check your SSH key setup."
            exit 1
        else
            SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy"
            log_info "✓ Using RSA SSH key as fallback"
        fi
    else
        log_info "✓ SSH connection established with ED25519 key"
    fi
}

# Check if project directory exists
check_project_directory() {
    log_step "Checking project directory..."
    
    if ! ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" "[ -d '$VPS_PATH' ]"; then
        log_error "Project directory $VPS_PATH not found on VPS"
        log_info "Please clone your repository first or check the path"
        exit 1
    fi
    log_info "✓ Project directory found"
}

# Install Node.js dependencies (including TypeScript)
install_node_dependencies() {
    log_quicksync "Installing Node.js dependencies including TypeScript..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        
        # Check if web app directory exists
        if [ ! -d "apps/web" ]; then
            echo "Web app directory not found, creating structure..."
            mkdir -p apps/web
        fi
        
        cd apps/web
        
        # Check if package.json exists
        if [ ! -f "package.json" ]; then
            echo "package.json not found, creating basic one..."
            cat > package.json << 'PACKAGE_EOF'
{
  "name": "web",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3000",
    "build": "next build --turbopack",
    "start": "next start",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.5.2",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "typescript": "5.9.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  }
}
PACKAGE_EOF
        fi
        
        # Install dependencies with development packages
        echo "Installing Node.js dependencies..."
        npm install --include=dev --no-audit --no-fund
        
        # Verify TypeScript installation
        if npx tsc --version; then
            echo "✓ TypeScript installed successfully"
        else
            echo "✗ TypeScript installation failed"
            exit 1
        fi
        
        # Install additional development dependencies if needed
        echo "Installing additional development dependencies..."
        npm install --save-dev @types/js-cookie @types/papaparse eslint eslint-config-next
        
        echo "Node.js dependencies installation completed"
EOF
    
    log_info "✓ Node.js dependencies installed"
}

# Install Python dependencies for MediaCMS
install_python_dependencies() {
    log_quicksync "Installing Python dependencies for MediaCMS..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        
        # Check if MediaCMS directory exists
        if [ ! -d "apps/mediacms" ]; then
            echo "MediaCMS directory not found, creating structure..."
            mkdir -p apps/mediacms
        fi
        
        cd apps/mediacms
        
        # Create basic requirements.txt if it doesn't exist
        if [ ! -f "requirements.txt" ]; then
            echo "Creating basic requirements.txt..."
            cat > requirements.txt << 'REQUIREMENTS_EOF'
Django>=4.2.0,<5.0
djangorestframework>=3.14.0
django-cors-headers>=4.0.0
Pillow>=10.0.0
celery>=5.3.0
redis>=4.5.0
psycopg2-binary>=2.9.0
python-decouple>=3.8
REQUIREMENTS_EOF
        fi
        
        # Create virtual environment
        if [ ! -d "venv" ]; then
            echo "Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        # Activate virtual environment and install dependencies
        echo "Installing Python dependencies..."
        source venv/bin/activate
        python3 -m pip install --upgrade pip
        python3 -m pip install -r requirements.txt
        deactivate
        
        echo "Python dependencies installation completed"
EOF
    
    log_info "✓ Python dependencies installed"
}

# Create TypeScript configuration if missing
setup_typescript_config() {
    log_quicksync "Setting up TypeScript configuration..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH/apps/web
        
        # Create tsconfig.json if it doesn't exist
        if [ ! -f "tsconfig.json" ]; then
            echo "Creating tsconfig.json..."
            cat > tsconfig.json << 'TSCONFIG_EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "strictFunctionTypes": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "tsBuildInfoFile": ".next/cache/tsconfig.tsbuildinfo",
    "removeComments": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "*.ts",
    "*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "build",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
TSCONFIG_EOF
        fi
        
        # Create next-env.d.ts if it doesn't exist
        if [ ! -f "next-env.d.ts" ]; then
            echo "Creating next-env.d.ts..."
            cat > next-env.d.ts << 'NEXTENV_EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
NEXTENV_EOF
        fi
        
        echo "TypeScript configuration setup completed"
EOF
    
    log_info "✓ TypeScript configuration setup completed"
}

# Verify all installations
verify_installations() {
    log_step "Verifying all installations..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH
        
        echo "=== Node.js Dependencies ==="
        if [ -d "apps/web" ]; then
            cd apps/web
            echo "Node.js version: \$(node --version 2>/dev/null || echo 'Not installed')"
            echo "npm version: \$(npm --version 2>/dev/null || echo 'Not installed')"
            echo "TypeScript version: \$(npx tsc --version 2>/dev/null || echo 'Not installed')"
            echo "Next.js version: \$(npx next --version 2>/dev/null || echo 'Not installed')"
            echo "Dependencies installed: \$(ls node_modules 2>/dev/null | wc -l || echo '0') packages"
            cd ..
        else
            echo "Web app directory not found"
        fi
        
        echo
        echo "=== Python Dependencies ==="
        if [ -d "apps/mediacms" ]; then
            cd apps/mediacms
            echo "Python version: \$(python3 --version 2>/dev/null || echo 'Not installed')"
            echo "pip version: \$(pip3 --version 2>/dev/null || echo 'Not installed')"
            if [ -d "venv" ]; then
                echo "Virtual environment: ✓ Created"
                source venv/bin/activate
                echo "Installed packages: \$(pip list | wc -l) packages"
                deactivate
            else
                echo "Virtual environment: ✗ Not created"
            fi
            cd ..
        else
            echo "MediaCMS directory not found"
        fi
        
        echo
        echo "=== Project Structure ==="
        echo "Project root: \$(pwd)"
        echo "Web app: \$(ls -la apps/web/ 2>/dev/null | head -5 || echo 'Not found')"
        echo "MediaCMS: \$(ls -la apps/mediacms/ 2>/dev/null | head -5 || echo 'Not found')"
        
        echo
        echo "=== TypeScript Configuration ==="
        if [ -f "apps/web/tsconfig.json" ]; then
            echo "tsconfig.json: ✓ Found"
            echo "Configuration preview:"
            head -10 apps/web/tsconfig.json
        else
            echo "tsconfig.json: ✗ Not found"
        fi
EOF
    
    log_info "✓ Verification completed"
}

# Test TypeScript compilation
test_typescript_compilation() {
    log_step "Testing TypeScript compilation..."
    
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o PubkeyAuthentication=yes "$VPS_USER@$VPS_HOST" << EOF
        cd $VPS_PATH/apps/web
        
        # Create a simple test TypeScript file
        echo "Creating test TypeScript file..."
        mkdir -p src
        cat > src/test.ts << 'TEST_EOF'
// Test TypeScript compilation
interface TestInterface {
    name: string;
    value: number;
}

const testFunction = (input: TestInterface): string => {
    return \`Hello \${input.name}, value is \${input.value}\`;
};

export { testFunction };
export type { TestInterface };
TEST_EOF
        
        # Test TypeScript compilation
        echo "Testing TypeScript compilation..."
        if npx tsc --noEmit; then
            echo "✓ TypeScript compilation successful"
        else
            echo "✗ TypeScript compilation failed"
            exit 1
        fi
        
        # Clean up test file
        rm -f src/test.ts
        echo "Test completed and cleaned up"
EOF
    
    log_info "✓ TypeScript compilation test passed"
}

# Main function
main() {
    log_quicksync "🚀 QuickSync Development Dependencies Installation"
    log_info "Target: $VPS_USER@$VPS_HOST:$VPS_PATH"
    echo
    
    check_ssh_key
    test_ssh_connection
    check_project_directory
    
    # Install dependencies
    install_node_dependencies
    install_python_dependencies
    setup_typescript_config
    
    # Verify and test
    verify_installations
    test_typescript_compilation
    
    log_quicksync "🎉 QuickSync completed successfully!"
    echo
    log_info "Next steps:"
    log_info "1. Your development container should now have all dependencies"
    log_info "2. TypeScript is ready for development"
    log_info "3. Run: docker compose -f docker-compose.dev.yml up -d"
    log_info "4. Check logs: docker compose -f docker-compose.dev.yml logs web"
    echo
}

# Run main function
main "$@"


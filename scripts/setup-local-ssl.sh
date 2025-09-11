#!/bin/bash

# Local SSL Certificate Setup Script
# Generates SSL certificates for local development
# Usage: ./setup-local-ssl.sh

set -e

# Configuration
SSL_DIR="config/ssl"
DOMAIN="localhost"

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

# Generate local SSL certificates
generate_local_ssl() {
    log_step "Generating SSL certificates for local development..."
    
    # Create SSL directory
    mkdir -p "$SSL_DIR"
    
    # Generate private key
    log_info "Generating private key..."
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate
    log_info "Generating certificate..."
    openssl req -new -x509 -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Set proper permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    log_info "✓ SSL certificates generated successfully"
    log_info "  - Private key: $SSL_DIR/key.pem"
    log_info "  - Certificate: $SSL_DIR/cert.pem"
}

# Main execution
main() {
    log_step "Setting up local SSL certificates..."
    
    if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
        log_warn "SSL certificates already exist"
        read -p "Do you want to regenerate them? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            generate_local_ssl
        else
            log_info "Using existing SSL certificates"
        fi
    else
        generate_local_ssl
    fi
    
    log_info "✓ Local SSL setup complete"
    log_info "You can now run 'docker compose up' with HTTPS support"
}

# Run main function
main "$@"

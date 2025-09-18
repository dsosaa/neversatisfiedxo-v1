#!/bin/bash

# Hostinger VPS SSH Key Management Script
# Usage: ./hostinger-ssh-setup.sh [add|list|attach|test]

set -e

# Configuration
HOSTINGER_API_TOKEN="${HOSTINGER_API_TOKEN:-e9eIPvbXyVTkoqnW3Uyckum6CR5QbODyuWnh6eWa9890b99b}"
HOSTINGER_API_BASE="https://api.hostinger.com"
VPS_IP="82.180.137.156"
SSH_KEY_PATH="$HOME/.ssh/hostinger_deploy_ed25519"
SSH_KEY_NAME="neversatisfiedxo-deploy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if API token is set
check_api_token() {
    if [[ -z "$HOSTINGER_API_TOKEN" ]]; then
        log_error "HOSTINGER_API_TOKEN environment variable is not set"
        exit 1
    fi
}

# Add SSH key to Hostinger account
add_ssh_key() {
    check_api_token
    
    if [[ ! -f "${SSH_KEY_PATH}.pub" ]]; then
        log_error "Public key file not found: ${SSH_KEY_PATH}.pub"
        exit 1
    fi
    
    PUBLIC_KEY=$(cat "${SSH_KEY_PATH}.pub")
    
    log_info "Adding SSH key to Hostinger account..."
    
    # Note: This endpoint may vary - check Hostinger API documentation
    response=$(curl -s -X POST "${HOSTINGER_API_BASE}/v1/vps/ssh-keys" \
        -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${SSH_KEY_NAME}\",
            \"public_key\": \"${PUBLIC_KEY}\"
        }" 2>/dev/null || echo "API_ERROR")
    
    if [[ "$response" == "API_ERROR" ]]; then
        log_error "Failed to add SSH key via API"
        log_warn "Please add the SSH key manually through the Hostinger web interface:"
        echo
        echo "Key Name: ${SSH_KEY_NAME}"
        echo "Public Key:"
        echo "${PUBLIC_KEY}"
        return 1
    fi
    
    log_info "SSH key added successfully"
    echo "Response: $response"
}

# List SSH keys in account
list_ssh_keys() {
    check_api_token
    
    log_info "Listing SSH keys in account..."
    
    response=$(curl -s -X GET "${HOSTINGER_API_BASE}/v1/vps/ssh-keys" \
        -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
        -H "Content-Type: application/json" 2>/dev/null || echo "API_ERROR")
    
    if [[ "$response" == "API_ERROR" ]]; then
        log_error "Failed to list SSH keys via API"
        return 1
    fi
    
    echo "SSH Keys:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Get VPS information
get_vps_info() {
    check_api_token
    
    log_info "Getting VPS information..."
    
    response=$(curl -s -X GET "${HOSTINGER_API_BASE}/v1/vps/virtual-machines" \
        -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
        -H "Content-Type: application/json" 2>/dev/null || echo "API_ERROR")
    
    if [[ "$response" == "API_ERROR" ]]; then
        log_error "Failed to get VPS information"
        return 1
    fi
    
    echo "VPS Information:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Test SSH connection
test_ssh_connection() {
    if [[ ! -f "$SSH_KEY_PATH" ]]; then
        log_error "Private key file not found: $SSH_KEY_PATH"
        exit 1
    fi
    
    log_info "Testing SSH connection to $VPS_IP..."
    
    # Test connection with timeout
    if timeout 10 ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$VPS_IP" "echo 'SSH connection successful'" 2>/dev/null; then
        log_info "✓ SSH key authentication working!"
    else
        log_warn "SSH key authentication failed. Trying password authentication..."
        log_info "You may need to:"
        log_info "1. Add the SSH key manually through Hostinger web interface"
        log_info "2. Or use password authentication initially to set up the key"
        
        # Show manual SSH command
        echo
        echo "Manual SSH commands:"
        echo "  ssh root@$VPS_IP  # (password auth)"
        echo "  ssh -i $SSH_KEY_PATH root@$VPS_IP  # (key auth)"
    fi
}

# Manual setup instructions
show_manual_setup() {
    echo
    log_info "Manual SSH Key Setup Instructions:"
    echo
    echo "1. Copy the public key:"
    echo "   cat ~/.ssh/hostinger_deploy.pub"
    echo
    echo "2. Log into Hostinger VPS panel"
    echo "3. Go to Settings > SSH keys"
    echo "4. Click 'Add SSH key'"
    echo "5. Paste the public key and save"
    echo
    echo "3. Test connection:"
    echo "   ssh -i ~/.ssh/hostinger_deploy root@$VPS_IP"
    echo
}

# Main script logic
case "${1:-help}" in
    "add")
        add_ssh_key
        ;;
    "list")
        list_ssh_keys
        ;;
    "vps")
        get_vps_info
        ;;
    "test")
        test_ssh_connection
        ;;
    "manual")
        show_manual_setup
        ;;
    "help"|*)
        echo "Usage: $0 [add|list|vps|test|manual]"
        echo
        echo "Commands:"
        echo "  add     - Add SSH key to Hostinger account via API"
        echo "  list    - List SSH keys in account"
        echo "  vps     - Get VPS information"
        echo "  test    - Test SSH connection"
        echo "  manual  - Show manual setup instructions"
        echo
        echo "Environment variables:"
        echo "  HOSTINGER_API_TOKEN - Your Hostinger API token"
        echo
        exit 0
        ;;
esac
#!/bin/bash

# SSH Key Setup Script for Hostinger VPS
# This script will set up SSH key authentication to bypass password requirements

set -e

VPS_IP="82.180.137.156"
VPS_USER="root"
SSH_KEY_PATH="~/.ssh/hostinger_deploy"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Step 1: Check if SSH key exists
check_ssh_key() {
    log_step "Checking SSH key..."
    
    if [[ -f ~/.ssh/hostinger_deploy ]]; then
        log_info "✓ SSH key found: ~/.ssh/hostinger_deploy"
    else
        log_error "SSH key not found at ~/.ssh/hostinger_deploy"
        exit 1
    fi
}

# Step 2: Copy SSH key to VPS
copy_ssh_key() {
    log_step "Copying SSH key to VPS..."
    
    # Method 1: Try ssh-copy-id
    if command -v ssh-copy-id &> /dev/null; then
        log_info "Using ssh-copy-id..."
        ssh-copy-id -i ~/.ssh/hostinger_deploy.pub ${VPS_USER}@${VPS_IP} || {
            log_warn "ssh-copy-id failed, trying manual method..."
            manual_ssh_setup
        }
    else
        log_warn "ssh-copy-id not available, using manual method..."
        manual_ssh_setup
    fi
}

# Manual SSH key setup
manual_ssh_setup() {
    log_step "Setting up SSH key manually..."
    
    # Read the public key
    PUBLIC_KEY=$(cat ~/.ssh/hostinger_deploy.pub)
    
    # Create the command to run on the VPS
    cat << EOF | ssh ${VPS_USER}@${VPS_IP}
        # Create .ssh directory if it doesn't exist
        mkdir -p ~/.ssh
        chmod 700 ~/.ssh
        
        # Add the public key to authorized_keys
        echo "${PUBLIC_KEY}" >> ~/.ssh/authorized_keys
        
        # Set proper permissions
        chmod 600 ~/.ssh/authorized_keys
        chown -R ${VPS_USER}:${VPS_USER} ~/.ssh
        
        # Disable password authentication (optional)
        sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        
        # Restart SSH service
        systemctl restart sshd
        
        echo "SSH key setup completed"
EOF
}

# Step 3: Test SSH key authentication
test_ssh_connection() {
    log_step "Testing SSH key authentication..."
    
    if ssh -i ~/.ssh/hostinger_deploy -o PasswordAuthentication=no ${VPS_USER}@${VPS_IP} "echo 'SSH key authentication successful'"; then
        log_info "✓ SSH key authentication working!"
        return 0
    else
        log_error "SSH key authentication failed"
        return 1
    fi
}

# Step 4: Alternative method - use expect to automate password entry
setup_with_expect() {
    log_step "Setting up SSH key using expect..."
    
    # Check if expect is available
    if ! command -v expect &> /dev/null; then
        log_warn "expect not available, installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install expect
        else
            sudo apt-get install -y expect
        fi
    fi
    
    # Create expect script
    cat > /tmp/ssh_setup.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 30
set VPS_IP [lindex $argv 0]
set VPS_USER [lindex $argv 1]

spawn ssh-copy-id -i ~/.ssh/hostinger_deploy.pub ${VPS_USER}@${VPS_IP}
expect {
    "password:" {
        send_user "Please enter your VPS password: "
        expect_user -re "(.*)\n"
        send "$expect_out(1,string)\r"
        expect eof
    }
    "Are you sure you want to continue connecting" {
        send "yes\r"
        expect "password:"
        send_user "Please enter your VPS password: "
        expect_user -re "(.*)\n"
        send "$expect_out(1,string)\r"
        expect eof
    }
    eof
}
EOF
    
    chmod +x /tmp/ssh_setup.exp
    /tmp/ssh_setup.exp ${VPS_IP} ${VPS_USER}
    rm /tmp/ssh_setup.exp
}

# Main function
main() {
    log_info "🔑 Setting up SSH key authentication for Hostinger VPS..."
    
    check_ssh_key
    
    # Try different methods
    if copy_ssh_key; then
        if test_ssh_connection; then
            log_info "🎉 SSH key setup successful!"
            log_info "You can now deploy without entering passwords"
            return 0
        fi
    fi
    
    log_warn "Standard methods failed, trying expect method..."
    setup_with_expect
    
    if test_ssh_connection; then
        log_info "🎉 SSH key setup successful with expect!"
    else
        log_error "All SSH key setup methods failed"
        log_info "You may need to manually copy the key:"
        log_info "1. Copy this public key:"
        cat ~/.ssh/hostinger_deploy.pub
        log_info "2. SSH to your VPS: ssh root@82.180.137.156"
        log_info "3. Run: echo '$(cat ~/.ssh/hostinger_deploy.pub)' >> ~/.ssh/authorized_keys"
        log_info "4. Run: chmod 600 ~/.ssh/authorized_keys"
        return 1
    fi
}

# Run main function
main "$@"

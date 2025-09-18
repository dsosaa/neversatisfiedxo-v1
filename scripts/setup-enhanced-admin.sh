#!/bin/bash

# Enhanced Admin Panel Setup Script
# Automates installation and configuration of Cloudflare Stream integration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/nsxo/Cursor/V0 Trailer"
MEDIACMS_DIR="$PROJECT_ROOT/apps/mediacms"
SETTINGS_FILE="$MEDIACMS_DIR/settings_trailer.py"
MAIN_SETTINGS_FILE="$MEDIACMS_DIR/settings.py"

echo -e "${BLUE}🚀 Enhanced Admin Panel Setup${NC}"
echo "=================================================="

# Step 1: Check Python environment
echo -e "${BLUE}Step 1: Checking Python environment...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python 3 found$(NC}"

# Step 2: Install Requirements
echo -e "${BLUE}Step 2: Installing requirements...${NC}"
cd "$MEDIACMS_DIR"

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo -e "${GREEN}✅ Virtual environment detected: $VIRTUAL_ENV${NC}"
else
    echo -e "${YELLOW}⚠️  No virtual environment detected. Consider using one.${NC}"
fi

# Install requests if not already installed
python3 -c "import requests" 2>/dev/null || {
    echo "Installing requests..."
    pip install requests>=2.28.0
}

# Install other optional dependencies
pip install django-filter>=23.0 django-cors-headers>=4.0.0
echo -e "${GREEN}✅ Requirements installed${NC}"

# Step 3: Configure Settings
echo -e "${BLUE}Step 3: Configuring Django settings...${NC}"

# Function to prompt for Cloudflare credentials
configure_cloudflare() {
    echo -e "${YELLOW}Cloudflare Stream Configuration${NC}"
    echo "You can find these values in your Cloudflare dashboard:"
    echo "• Account ID: Dashboard > Right sidebar"
    echo "• API Token: My Profile > API Tokens (needs Stream:Edit permission)"
    echo "• Customer Code: Stream dashboard > Settings (optional)"
    echo ""
    
    read -p "Enter your Cloudflare Account ID: " ACCOUNT_ID
    read -p "Enter your Cloudflare API Token: " API_TOKEN
    read -p "Enter your Customer Code (optional, press Enter to skip): " CUSTOMER_CODE
    
    # Validate inputs
    if [[ -z "$ACCOUNT_ID" || -z "$API_TOKEN" ]]; then
        echo -e "${RED}❌ Account ID and API Token are required${NC}"
        return 1
    fi
    
    if [[ ${#ACCOUNT_ID} -ne 32 ]]; then
        echo -e "${YELLOW}⚠️  Account ID should be 32 characters. Please verify.${NC}"
    fi
    
    if [[ ! "$API_TOKEN" =~ ^CF- ]]; then
        echo -e "${YELLOW}⚠️  API Token should start with 'CF-'. Please verify.${NC}"
    fi
    
    return 0
}

# Check if configuration already exists
if grep -q "CLOUDFLARE_ACCOUNT_ID" "$SETTINGS_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Cloudflare settings already configured in $SETTINGS_FILE${NC}"
    read -p "Do you want to reconfigure? (y/N): " RECONFIGURE
    if [[ $RECONFIGURE =~ ^[Yy]$ ]]; then
        configure_cloudflare
        UPDATE_CONFIG=true
    else
        UPDATE_CONFIG=false
    fi
else
    configure_cloudflare
    UPDATE_CONFIG=true
fi

# Update settings file
if [[ "$UPDATE_CONFIG" == "true" ]]; then
    # Create backup
    if [[ -f "$SETTINGS_FILE" ]]; then
        cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ Settings backup created${NC}"
    fi
    
    # Add Cloudflare configuration
    cat >> "$SETTINGS_FILE" << EOF

# Cloudflare Stream Configuration (Added by setup script)
CLOUDFLARE_ACCOUNT_ID = '$ACCOUNT_ID'
CLOUDFLARE_STREAM_API_TOKEN = '$API_TOKEN'
EOF
    
    if [[ -n "$CUSTOMER_CODE" ]]; then
        echo "CLOUDFLARE_STREAM_CUSTOMER_CODE = '$CUSTOMER_CODE'" >> "$SETTINGS_FILE"
    fi
    
    echo -e "${GREEN}✅ Cloudflare configuration added to settings${NC}"
fi

# Step 4: Check if trailers app is in INSTALLED_APPS
echo -e "${BLUE}Step 4: Checking INSTALLED_APPS configuration...${NC}"

if [[ -f "$MAIN_SETTINGS_FILE" ]]; then
    if grep -q "'trailers'" "$MAIN_SETTINGS_FILE"; then
        echo -e "${GREEN}✅ Trailers app already in INSTALLED_APPS${NC}"
    else
        echo -e "${YELLOW}⚠️  Adding trailers to INSTALLED_APPS${NC}"
        # Add trailers to INSTALLED_APPS (you may need to adjust this based on your settings structure)
        echo "Please manually add 'trailers' to your INSTALLED_APPS in $MAIN_SETTINGS_FILE"
    fi
else
    echo -e "${YELLOW}⚠️  Main settings file not found. Please ensure 'trailers' is in INSTALLED_APPS${NC}"
fi

# Step 5: Run Migrations
echo -e "${BLUE}Step 5: Running database migrations...${NC}"

if python3 manage.py showmigrations trailers &>/dev/null; then
    python3 manage.py migrate trailers
    echo -e "${GREEN}✅ Trailers migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  Trailers app not found in Django. Please check INSTALLED_APPS${NC}"
fi

# Step 6: Test Integration
echo -e "${BLUE}Step 6: Testing Cloudflare integration...${NC}"

if python3 manage.py test_cloudflare --check-config; then
    echo -e "${GREEN}✅ Cloudflare integration test passed${NC}"
else
    echo -e "${RED}❌ Cloudflare integration test failed${NC}"
    echo "Please check your configuration and try again."
fi

# Step 7: Create superuser if needed
echo -e "${BLUE}Step 7: Checking admin access...${NC}"
read -p "Do you need to create a superuser for admin access? (y/N): " CREATE_USER
if [[ $CREATE_USER =~ ^[Yy]$ ]]; then
    python3 manage.py createsuperuser
fi

# Step 8: Collect static files
echo -e "${BLUE}Step 8: Collecting static files...${NC}"
python3 manage.py collectstatic --noinput
echo -e "${GREEN}✅ Static files collected${NC}"

# Final instructions
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================================================="
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Start your Django development server:"
echo "   cd $MEDIACMS_DIR"
echo "   python3 manage.py runserver"
echo ""
echo "2. Access the enhanced admin panel:"
echo "   http://localhost:8000/admin/trailers/trailermeta/"
echo ""
echo "3. Try the admin dashboard:"
echo "   http://localhost:8000/admin/trailers/dashboard/"
echo ""
echo -e "${BLUE}Features Available:${NC}"
echo "✅ Direct video upload to Cloudflare Stream"
echo "✅ Automatic UID population and thumbnail generation"
echo "✅ Real-time video processing status monitoring"
echo "✅ Bulk CSV import with preview"
echo "✅ Admin dashboard with statistics"
echo "✅ Enhanced admin interface with custom actions"
echo ""
echo -e "${YELLOW}Configuration Files:${NC}"
echo "• Settings: $SETTINGS_FILE"
echo "• Backup: $SETTINGS_FILE.backup.*"
echo ""
echo -e "${BLUE}Troubleshooting:${NC}"
echo "• Run: python3 manage.py test_cloudflare --video-uid <your-uid>"
echo "• Check logs: tail -f trailers.log"
echo "• Admin help: $PROJECT_ROOT/apps/mediacms/trailers/README_ADMIN_ENHANCED.md"
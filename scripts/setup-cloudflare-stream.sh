#!/bin/bash

# Cloudflare Stream Setup and Optimization Script
# This script helps set up and optimize Cloudflare Stream for your video trailer website

set -e

echo "🎬 Cloudflare Stream Setup and Optimization"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating template..."
    cat > .env << EOF
# Cloudflare Configuration
CF_GLOBAL_API_KEY=your_global_api_key_here
CF_ACCOUNT_ID=your_account_id_here

# Cloudflare Stream Configuration
NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE=your_customer_code_here
CF_STREAM_API_TOKEN=your_stream_api_token_here

# Domain Configuration
NEXT_PUBLIC_DOMAIN=videos.neversatisfiedxo.com

# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://videos.neversatisfiedxo.com

# Security
JWT_SECRET=your_jwt_secret_here
EOF
    print_status ".env template created"
    echo ""
    print_info "Please edit .env file with your actual Cloudflare credentials:"
    echo "1. CF_GLOBAL_API_KEY - Get from https://dash.cloudflare.com/profile/api-tokens"
    echo "2. CF_ACCOUNT_ID - Found in right sidebar of Cloudflare dashboard"
    echo "3. NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE - Get from Stream dashboard"
    echo "4. CF_STREAM_API_TOKEN - Generate from Stream API tokens"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_status "Environment variables loaded"
else
    print_error "No .env file found. Please create one first."
    exit 1
fi

# Check if required environment variables are set
check_env_var() {
    if [ -z "${!1}" ] || [ "${!1}" = "your_${1,,}_here" ]; then
        print_error "$1 is not set or still has placeholder value"
        return 1
    fi
    return 0
}

echo ""
print_info "Checking environment variables..."

if ! check_env_var "CF_GLOBAL_API_KEY"; then
    print_error "Please set CF_GLOBAL_API_KEY in .env file"
    exit 1
fi

if ! check_env_var "CF_ACCOUNT_ID"; then
    print_error "Please set CF_ACCOUNT_ID in .env file"
    exit 1
fi

if ! check_env_var "NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE"; then
    print_error "Please set NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE in .env file"
    exit 1
fi

print_status "All required environment variables are set"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status "Node.js is installed"

# Check if domain is added to Cloudflare
echo ""
print_info "Checking if domain is added to Cloudflare..."

DOMAIN=${NEXT_PUBLIC_DOMAIN:-"videos.neversatisfiedxo.com"}

# Test API connection
if node -e "
const https = require('https');
const options = {
  hostname: 'api.cloudflare.com',
  port: 443,
  path: '/client/v4/zones',
  method: 'GET',
  headers: {
    'X-Auth-Email': 'nsxofilms@gmail.com',
    'X-Auth-Key': process.env.CF_GLOBAL_API_KEY,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        const zone = result.result.find(z => z.name === '$DOMAIN');
        if (zone) {
          console.log('SUCCESS: Domain found in Cloudflare');
          process.exit(0);
        } else {
          console.log('ERROR: Domain not found in Cloudflare');
          process.exit(1);
        }
      } else {
        console.log('ERROR: API authentication failed');
        process.exit(1);
      }
    } catch (e) {
      console.log('ERROR: Failed to parse API response');
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.log('ERROR: API request failed');
  process.exit(1);
});

req.end();
" 2>/dev/null; then
    print_status "Domain $DOMAIN is configured in Cloudflare"
else
    print_error "Domain $DOMAIN not found in Cloudflare"
    print_info "Please add your domain to Cloudflare first:"
    echo "1. Go to https://dash.cloudflare.com"
    echo "2. Click 'Add site'"
    echo "3. Enter your domain: $DOMAIN"
    echo "4. Follow the DNS setup instructions"
    echo ""
    read -p "Press Enter after adding domain to Cloudflare..."
fi

# Run the optimization script
echo ""
print_info "Running Cloudflare Stream optimization..."

if [ -f "scripts/cloudflare-stream-optimize.js" ]; then
    node scripts/cloudflare-stream-optimize.js "$DOMAIN"
    print_status "Optimization completed successfully!"
else
    print_error "Optimization script not found"
    exit 1
fi

# Display next steps
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
print_info "Next steps to maximize your video trailer website performance:"
echo ""
echo "1. 📊 Monitor Performance:"
echo "   • Check Cloudflare Analytics dashboard"
echo "   • Use GTmetrix or PageSpeed Insights for testing"
echo "   • Monitor Core Web Vitals in Google Search Console"
echo ""
echo "2. 🎬 Optimize Video Content:"
echo "   • Upload videos in 4K resolution for best quality"
echo "   • Use H.264 codec for maximum compatibility"
echo "   • Set appropriate thumbnail timestamps"
echo ""
echo "3. 🔧 Frontend Optimizations:"
echo "   • Implement lazy loading for video thumbnails"
echo "   • Use preload='metadata' for video elements"
echo "   • Consider implementing video preloading strategies"
echo ""
echo "4. 📱 Mobile Optimization:"
echo "   • Test video playback on various devices"
echo "   • Ensure responsive video player design"
echo "   • Optimize for different screen sizes"
echo ""
echo "5. 🚀 Advanced Features (Optional):"
echo "   • Set up Cloudflare Stream analytics"
echo "   • Configure webhooks for video events"
echo "   • Implement access control if needed"
echo ""

print_status "Your video trailer website is now optimized for Cloudflare Stream!"

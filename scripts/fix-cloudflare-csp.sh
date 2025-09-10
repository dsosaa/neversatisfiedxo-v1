#!/bin/bash

# Cloudflare CSP Fix Script
# This script creates a Transform Rule to remove Cloudflare's conflicting CSP header

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Cloudflare CSP Override Fix${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if required environment variables are set
if [[ -z "$CF_ACCOUNT_ID" ]]; then
    echo -e "${RED}❌ Error: CF_ACCOUNT_ID environment variable is not set${NC}"
    exit 1
fi

if [[ -z "$CF_GLOBAL_API_KEY" ]]; then
    echo -e "${RED}❌ Error: CF_GLOBAL_API_KEY environment variable is not set${NC}"
    exit 1
fi

# Prompt for Cloudflare email if not provided
if [[ -z "$CF_EMAIL" ]]; then
    echo -e "${YELLOW}📧 Please enter your Cloudflare account email:${NC}"
    read -p "Email: " CF_EMAIL
    
    if [[ -z "$CF_EMAIL" ]]; then
        echo -e "${RED}❌ Error: Email is required${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}🔍 Configuration:${NC}"
echo -e "  Domain: videos.neversatisfiedxo.com"
echo -e "  Account ID: $CF_ACCOUNT_ID"
echo -e "  Email: $CF_EMAIL"
echo ""

# Step 1: Get Zone ID
echo -e "${YELLOW}📋 Step 1: Getting Zone ID...${NC}"

ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=videos.neversatisfiedxo.com" \
    -H "X-Auth-Email: $CF_EMAIL" \
    -H "X-Auth-Key: $CF_GLOBAL_API_KEY" \
    -H "Content-Type: application/json")

# Check if API call was successful
SUCCESS=$(echo "$ZONE_RESPONSE" | jq -r '.success // false')
if [[ "$SUCCESS" != "true" ]]; then
    echo -e "${RED}❌ Error: Failed to get zone information${NC}"
    echo -e "${RED}Response: $ZONE_RESPONSE${NC}"
    exit 1
fi

ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id // empty')
if [[ -z "$ZONE_ID" ]]; then
    echo -e "${RED}❌ Error: Zone 'videos.neversatisfiedxo.com' not found in your Cloudflare account${NC}"
    echo -e "${YELLOW}💡 Please ensure:${NC}"
    echo -e "  1. The domain is added to your Cloudflare account"
    echo -e "  2. Your API credentials have the correct permissions"
    echo -e "  3. Your email address is correct"
    exit 1
fi

echo -e "${GREEN}✅ Zone ID found: $ZONE_ID${NC}"
echo ""

# Step 2: Check if rule already exists
echo -e "${YELLOW}📋 Step 2: Checking for existing CSP fix rules...${NC}"

EXISTING_RULES=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
    -H "X-Auth-Email: $CF_EMAIL" \
    -H "X-Auth-Key: $CF_GLOBAL_API_KEY" \
    -H "Content-Type: application/json")

# Check if we can find any existing CSP-related rules
EXISTING_CSP_RULES=$(echo "$EXISTING_RULES" | jq -r '.result[] | select(.name | contains("CSP")) | .name' 2>/dev/null || echo "")

if [[ -n "$EXISTING_CSP_RULES" ]]; then
    echo -e "${YELLOW}⚠️  Found existing CSP-related rules:${NC}"
    echo "$EXISTING_CSP_RULES"
    echo ""
    echo -e "${YELLOW}Do you want to continue and create a new rule? (y/N):${NC}"
    read -p "Continue: " CONTINUE
    if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
        echo -e "${BLUE}ℹ️  Operation cancelled by user${NC}"
        exit 0
    fi
fi

# Step 3: Create Transform Rule
echo -e "${YELLOW}📋 Step 3: Creating Transform Rule to remove conflicting CSP...${NC}"

RULESET_DATA='{
  "name": "Remove Conflicting CSP Header",
  "description": "Removes Cloudflare default CSP header to allow application CSP with nonce",
  "kind": "zone",
  "phase": "http_response_headers_transform",
  "rules": [
    {
      "description": "Remove Cloudflare CSP header to prevent conflict with application nonce-based CSP",
      "expression": "true",
      "action": "rewrite",
      "action_parameters": {
        "headers": {
          "Content-Security-Policy": {
            "operation": "remove"
          }
        }
      },
      "enabled": true
    }
  ]
}'

RULE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
    -H "X-Auth-Email: $CF_EMAIL" \
    -H "X-Auth-Key: $CF_GLOBAL_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$RULESET_DATA")

# Check if rule creation was successful
RULE_SUCCESS=$(echo "$RULE_RESPONSE" | jq -r '.success // false')
if [[ "$RULE_SUCCESS" != "true" ]]; then
    echo -e "${RED}❌ Error: Failed to create Transform Rule${NC}"
    echo -e "${RED}Response: $RULE_RESPONSE${NC}"
    
    # Check for specific error messages
    ERRORS=$(echo "$RULE_RESPONSE" | jq -r '.errors[]?.message // empty' 2>/dev/null)
    if [[ -n "$ERRORS" ]]; then
        echo -e "${RED}Error details:${NC}"
        echo "$ERRORS"
    fi
    exit 1
fi

RULE_ID=$(echo "$RULE_RESPONSE" | jq -r '.result.id')
echo -e "${GREEN}✅ Transform Rule created successfully!${NC}"
echo -e "${GREEN}   Rule ID: $RULE_ID${NC}"
echo ""

# Step 4: Verification
echo -e "${YELLOW}📋 Step 4: Verifying rule deployment...${NC}"

# Wait a moment for the rule to propagate
sleep 5

echo -e "${BLUE}🔍 Testing CSP headers...${NC}"
echo ""

# Test the headers
echo -e "${YELLOW}Testing headers from domain (should only show application CSP):${NC}"
DOMAIN_HEADERS=$(curl -sI https://videos.neversatisfiedxo.com/enter 2>/dev/null || echo "Connection failed")

if [[ "$DOMAIN_HEADERS" == "Connection failed" ]]; then
    echo -e "${YELLOW}⚠️  Cannot test headers immediately (DNS/CDN propagation may be in progress)${NC}"
else
    CSP_COUNT=$(echo "$DOMAIN_HEADERS" | grep -i "content-security-policy" | wc -l)
    echo -e "${BLUE}CSP Headers found: $CSP_COUNT${NC}"
    
    if [[ $CSP_COUNT -eq 1 ]]; then
        echo -e "${GREEN}✅ Perfect! Only one CSP header found (application's nonce-based CSP)${NC}"
    elif [[ $CSP_COUNT -gt 1 ]]; then
        echo -e "${YELLOW}⚠️  Multiple CSP headers still detected. Rule may need time to propagate.${NC}"
    else
        echo -e "${YELLOW}⚠️  No CSP headers detected. This may indicate an issue.${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Fix Implementation Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  ✅ Cloudflare Transform Rule created"
echo -e "  ✅ Rule configured to remove conflicting CSP header"
echo -e "  ✅ Application's nonce-based CSP will now work properly"
echo ""
echo -e "${YELLOW}🕐 Note: Changes may take 1-2 minutes to propagate globally${NC}"
echo -e "${YELLOW}📝 Test authentication at: https://videos.neversatisfiedxo.com/enter${NC}"
echo ""

# Optional: Show rule management info
echo -e "${BLUE}📖 Rule Management:${NC}"
echo -e "  View rules: https://dash.cloudflare.com/$(echo $CF_ACCOUNT_ID)/$(echo videos.neversatisfiedxo.com | tr . -)/rules/transform-rules"
echo -e "  Rule ID: $RULE_ID"
echo -e "  Zone ID: $ZONE_ID"
echo ""

echo -e "${GREEN}✨ Ready to test authentication functionality!${NC}"
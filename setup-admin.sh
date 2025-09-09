#!/bin/bash

# One-command setup launcher for Enhanced Admin Panel
echo "🚀 Starting Enhanced Admin Panel Setup..."
echo "Choose your setup method:"
echo "1. Bash script (recommended for Unix/Linux/macOS)"
echo "2. Python script (cross-platform)"
echo ""
read -p "Enter your choice (1 or 2): " CHOICE

case $CHOICE in
    1)
        echo "Running bash setup script..."
        bash "./scripts/setup-enhanced-admin.sh"
        ;;
    2)
        echo "Running Python setup script..."
        python3 "./scripts/setup_enhanced_admin.py"
        ;;
    *)
        echo "Invalid choice. Please run the setup script directly:"
        echo "  bash ./scripts/setup-enhanced-admin.sh"
        echo "  python3 ./scripts/setup_enhanced_admin.py"
        exit 1
        ;;
esac
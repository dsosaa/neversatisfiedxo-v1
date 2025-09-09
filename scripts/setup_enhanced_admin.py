#!/usr/bin/env python3
"""
Enhanced Admin Panel Setup Script
Automates installation and configuration of Cloudflare Stream integration
Cross-platform Python version of the bash setup script
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
from datetime import datetime
import re

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    BLUE = '\033[0;34m'
    YELLOW = '\033[1;33m'
    NC = '\033[0m'  # No Color

def print_colored(message, color=Colors.NC):
    """Print colored message to terminal"""
    print(f"{color}{message}{Colors.NC}")

def run_command(command, cwd=None):
    """Run shell command and return success status"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True,
            check=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_python_package(package_name):
    """Check if Python package is installed"""
    try:
        __import__(package_name)
        return True
    except ImportError:
        return False

def setup_enhanced_admin():
    """Main setup function"""
    
    print_colored("🚀 Enhanced Admin Panel Setup", Colors.BLUE)
    print("=" * 50)
    
    # Configuration
    project_root = Path("/Users/nsxo/Cursor/V0 Trailer")
    mediacms_dir = project_root / "apps" / "mediacms"
    settings_file = mediacms_dir / "settings_trailer.py"
    main_settings_file = mediacms_dir / "settings.py"
    
    if not mediacms_dir.exists():
        print_colored("❌ MediaCMS directory not found", Colors.RED)
        print_colored(f"Expected: {mediacms_dir}", Colors.RED)
        return False
    
    # Step 1: Check Python environment
    print_colored("Step 1: Checking Python environment...", Colors.BLUE)
    if sys.version_info < (3, 8):
        print_colored("❌ Python 3.8+ required", Colors.RED)
        return False
    print_colored(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} found", Colors.GREEN)
    
    # Step 2: Install Requirements
    print_colored("Step 2: Installing requirements...", Colors.BLUE)
    os.chdir(mediacms_dir)
    
    # Check virtual environment
    if os.environ.get('VIRTUAL_ENV'):
        print_colored(f"✅ Virtual environment detected: {os.environ['VIRTUAL_ENV']}", Colors.GREEN)
    else:
        print_colored("⚠️  No virtual environment detected. Consider using one.", Colors.YELLOW)
    
    # Install requirements
    packages_to_install = [
        "requests>=2.28.0",
        "django-filter>=23.0", 
        "django-cors-headers>=4.0.0"
    ]
    
    for package in packages_to_install:
        package_name = package.split('>=')[0].replace('-', '_')
        if not check_python_package(package_name):
            print(f"Installing {package}...")
            success, output = run_command(f"pip install {package}")
            if not success:
                print_colored(f"❌ Failed to install {package}", Colors.RED)
                print(output)
                return False
    
    print_colored("✅ Requirements installed", Colors.GREEN)
    
    # Step 3: Configure Settings
    print_colored("Step 3: Configuring Django settings...", Colors.BLUE)
    
    def configure_cloudflare():
        print_colored("Cloudflare Stream Configuration", Colors.YELLOW)
        print("You can find these values in your Cloudflare dashboard:")
        print("• Account ID: Dashboard > Right sidebar")
        print("• API Token: My Profile > API Tokens (needs Stream:Edit permission)")
        print("• Customer Code: Stream dashboard > Settings (optional)")
        print()
        
        account_id = input("Enter your Cloudflare Account ID: ").strip()
        api_token = input("Enter your Cloudflare API Token: ").strip()
        customer_code = input("Enter your Customer Code (optional, press Enter to skip): ").strip()
        
        # Validate inputs
        if not account_id or not api_token:
            print_colored("❌ Account ID and API Token are required", Colors.RED)
            return None
        
        if len(account_id) != 32:
            print_colored("⚠️  Account ID should be 32 characters. Please verify.", Colors.YELLOW)
        
        if not api_token.startswith('CF-'):
            print_colored("⚠️  API Token should start with 'CF-'. Please verify.", Colors.YELLOW)
        
        return {
            'account_id': account_id,
            'api_token': api_token,
            'customer_code': customer_code
        }
    
    # Check existing configuration
    update_config = True
    if settings_file.exists():
        with open(settings_file, 'r') as f:
            content = f.read()
            if 'CLOUDFLARE_ACCOUNT_ID' in content:
                print_colored(f"✅ Cloudflare settings already configured in {settings_file}", Colors.GREEN)
                reconfigure = input("Do you want to reconfigure? (y/N): ").strip().lower()
                update_config = reconfigure in ['y', 'yes']
    
    if update_config:
        credentials = configure_cloudflare()
        if not credentials:
            return False
        
        # Create backup
        if settings_file.exists():
            backup_name = f"{settings_file}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            shutil.copy2(settings_file, backup_name)
            print_colored("✅ Settings backup created", Colors.GREEN)
        
        # Add Cloudflare configuration
        config_text = f"""
# Cloudflare Stream Configuration (Added by setup script)
CLOUDFLARE_ACCOUNT_ID = '{credentials['account_id']}'
CLOUDFLARE_STREAM_API_TOKEN = '{credentials['api_token']}'
"""
        
        if credentials['customer_code']:
            config_text += f"CLOUDFLARE_STREAM_CUSTOMER_CODE = '{credentials['customer_code']}'\n"
        
        with open(settings_file, 'a') as f:
            f.write(config_text)
        
        print_colored("✅ Cloudflare configuration added to settings", Colors.GREEN)
    
    # Step 4: Check INSTALLED_APPS
    print_colored("Step 4: Checking INSTALLED_APPS configuration...", Colors.BLUE)
    
    if main_settings_file.exists():
        with open(main_settings_file, 'r') as f:
            content = f.read()
            if "'trailers'" in content:
                print_colored("✅ Trailers app already in INSTALLED_APPS", Colors.GREEN)
            else:
                print_colored("⚠️  Please manually add 'trailers' to your INSTALLED_APPS", Colors.YELLOW)
                print(f"   in {main_settings_file}")
    else:
        print_colored("⚠️  Main settings file not found. Please ensure 'trailers' is in INSTALLED_APPS", Colors.YELLOW)
    
    # Step 5: Run Migrations
    print_colored("Step 5: Running database migrations...", Colors.BLUE)
    
    success, output = run_command("python manage.py showmigrations trailers")
    if success:
        success, output = run_command("python manage.py migrate trailers")
        if success:
            print_colored("✅ Trailers migrations applied", Colors.GREEN)
        else:
            print_colored("❌ Migration failed", Colors.RED)
            print(output)
    else:
        print_colored("⚠️  Trailers app not found in Django. Please check INSTALLED_APPS", Colors.YELLOW)
    
    # Step 6: Test Integration
    print_colored("Step 6: Testing Cloudflare integration...", Colors.BLUE)
    
    success, output = run_command("python manage.py test_cloudflare --check-config")
    if success:
        print_colored("✅ Cloudflare integration test passed", Colors.GREEN)
    else:
        print_colored("❌ Cloudflare integration test failed", Colors.RED)
        print("Please check your configuration and try again.")
        print(output)
    
    # Step 7: Create superuser if needed
    print_colored("Step 7: Checking admin access...", Colors.BLUE)
    create_user = input("Do you need to create a superuser for admin access? (y/N): ").strip().lower()
    if create_user in ['y', 'yes']:
        success, output = run_command("python manage.py createsuperuser")
        if not success:
            print_colored("⚠️  Superuser creation failed or cancelled", Colors.YELLOW)
    
    # Step 8: Collect static files
    print_colored("Step 8: Collecting static files...", Colors.BLUE)
    success, output = run_command("python manage.py collectstatic --noinput")
    if success:
        print_colored("✅ Static files collected", Colors.GREEN)
    else:
        print_colored("⚠️  Static files collection failed", Colors.YELLOW)
        print(output)
    
    # Final instructions
    print()
    print_colored("🎉 Setup Complete!", Colors.GREEN)
    print("=" * 50)
    print_colored("Next Steps:", Colors.BLUE)
    print("1. Start your Django development server:")
    print(f"   cd {mediacms_dir}")
    print("   python manage.py runserver")
    print()
    print("2. Access the enhanced admin panel:")
    print("   http://localhost:8000/admin/trailers/trailermeta/")
    print()
    print("3. Try the admin dashboard:")
    print("   http://localhost:8000/admin/trailers/dashboard/")
    print()
    print_colored("Features Available:", Colors.BLUE)
    print("✅ Direct video upload to Cloudflare Stream")
    print("✅ Automatic UID population and thumbnail generation")
    print("✅ Real-time video processing status monitoring")
    print("✅ Bulk CSV import with preview")
    print("✅ Admin dashboard with statistics")
    print("✅ Enhanced admin interface with custom actions")
    print()
    print_colored("Configuration Files:", Colors.YELLOW)
    print(f"• Settings: {settings_file}")
    print(f"• Backup: {settings_file}.backup.*")
    print()
    print_colored("Troubleshooting:", Colors.BLUE)
    print("• Run: python manage.py test_cloudflare --video-uid <your-uid>")
    print("• Check logs: tail -f trailers.log")
    print(f"• Admin help: {project_root}/apps/mediacms/trailers/README_ADMIN_ENHANCED.md")
    
    return True

if __name__ == "__main__":
    try:
        success = setup_enhanced_admin()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_colored("\n❌ Setup cancelled by user", Colors.RED)
        sys.exit(1)
    except Exception as e:
        print_colored(f"❌ Setup failed with error: {str(e)}", Colors.RED)
        sys.exit(1)
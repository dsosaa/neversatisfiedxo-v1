#!/usr/bin/env python
import os
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cms.settings')
django.setup()

from users.models import User

try:
    # Create admin user with all required fields
    user = User(
        username="admin",
        email="admin@example.com", 
        first_name="Admin",
        last_name="User",
        is_superuser=True,
        is_staff=True,
        is_active=True,
        logo="",
        description="Administrator account",
        name="Admin User",
        title="Administrator",
        is_featured=False,
        date_added=datetime.now()
    )
    user.set_password("admin123")
    
    # Save without triggering post_save signals to avoid email issues
    user.save(using="default")
    print("Admin user created successfully")
    
except Exception as e:
    print(f"Error creating admin user: {e}")
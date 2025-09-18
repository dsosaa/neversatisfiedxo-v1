#!/usr/bin/env python3
"""Create test data for testing the update_from_finaldescription command"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth.models import User
from trailers.models import Media, TrailerMeta

def create_test_data():
    # Get the admin user (created earlier)
    try:
        admin_user = User.objects.get(username='admin')
    except User.DoesNotExist:
        print("Creating admin user...")
        admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')

    # Create a few test trailers based on the FINALDESCRIPTION CSV
    test_videos = [
        {
            'video_number': 1,
            'title': 'Video 1 - Test Title',
            'cf_video_uid': 'test-uid-1',
            'price': 'FREE',
            'length': '25 Minutes',
            'creators': 'Original Creator',
        },
        {
            'video_number': 2,
            'title': 'Video 2 - Test Title',
            'cf_video_uid': 'test-uid-2',
            'price': '$20',
            'length': '30 Minutes',
            'creators': 'Original Creator',
        },
        {
            'video_number': 3,
            'title': 'Video 3 - Test Title',
            'cf_video_uid': 'test-uid-3',
            'price': '$25',
            'length': '35 Minutes',
            'creators': 'Original Creator',
        }
    ]

    created_count = 0
    for video_data in test_videos:
        # Check if trailer already exists
        if TrailerMeta.objects.filter(video_number=video_data['video_number']).exists():
            print(f"Video {video_data['video_number']} already exists, skipping...")
            continue

        # Create Media object
        media = Media.objects.create(
            title=video_data['title'],
            description=video_data['title'],
            user=admin_user
        )

        # Create TrailerMeta object
        trailer = TrailerMeta.objects.create(
            media=media,
            video_number=video_data['video_number'],
            cf_video_uid=video_data['cf_video_uid'],
            price=video_data['price'],
            length=video_data['length'],
            creators=video_data['creators'],
            detailed_description=f"Original description for {video_data['title']}",
            upload_status='Complete'
        )

        print(f"Created Video {video_data['video_number']}: {video_data['title']}")
        created_count += 1

    print(f"\nCreated {created_count} test trailers")
    print(f"Total trailers in database: {TrailerMeta.objects.count()}")

if __name__ == '__main__':
    create_test_data()
#!/bin/bash
# MediaCMS Database Initialization Script
# This script pre-initializes the database to skip migrations on startup

set -e

echo "🚀 Initializing MediaCMS database for faster startup..."

# Wait for PostgreSQL to be ready
until pg_isready -h postgres -U ${POSTGRES_USER:-mediacms} -d ${POSTGRES_DB:-mediacms}; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready, initializing MediaCMS database..."

# Set Django environment
export PYTHONPATH=/home/mediacms.io/mediacms
export DJANGO_SETTINGS_MODULE=cms.settings

cd /home/mediacms.io/mediacms

# Run migrations (only once)
echo "📊 Running database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist
echo "👤 Creating superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("✅ Superuser 'admin' created with password 'admin123'")
else:
    print("✅ Superuser already exists")
EOF

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create initial data if needed
echo "🎬 Creating initial MediaCMS data..."
python manage.py shell << EOF
from cms.models import Category, Tag
from django.contrib.auth import get_user_model

User = get_user_model()

# Create default categories
if not Category.objects.exists():
    Category.objects.create(name='Trailers', description='Movie and TV show trailers')
    Category.objects.create(name='Clips', description='Short video clips')
    print("✅ Default categories created")

# Create default tags
if not Tag.objects.exists():
    Tag.objects.create(name='action')
    Tag.objects.create(name='comedy')
    Tag.objects.create(name='drama')
    Tag.objects.create(name='horror')
    print("✅ Default tags created")
EOF

echo "🎉 MediaCMS database initialization complete!"

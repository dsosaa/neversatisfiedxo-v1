# MediaCMS Trailer Extension

Django app extension for MediaCMS that adds premium trailer functionality with Cloudflare Stream integration.

## Features

- **TrailerMeta Model**: Extended metadata for premium video content
- **Cloudflare Stream Integration**: Direct video hosting and delivery  
- **REST API**: Full CRUD operations with filtering and search
- **Admin Interface**: Enhanced Django admin for content management
- **CSV Import**: Management command for bulk data import
- **Premium Content**: Pricing, creators, and premium features

## Installation

### 1. Add to MediaCMS

Copy the `trailers` app to your MediaCMS installation:

```bash
cp -r trailers/ /path/to/mediacms/apps/
```

### 2. Update Settings

Add to your MediaCMS `settings.py`:

```python
INSTALLED_APPS = [
    # ... existing apps
    'trailers',
    'rest_framework',
    'django_filters',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... existing middleware
]

# Add settings from settings_trailer.py
```

### 3. Update URLs

Add to your main `urls.py`:

```python
urlpatterns = [
    # ... existing patterns
    path('', include('trailers.urls')),
]
```

### 4. Install Dependencies

```bash
pip install djangorestframework django-filter django-cors-headers
```

### 5. Run Migrations

```bash
python manage.py makemigrations trailers
python manage.py migrate
```

### 6. Create Superuser (if needed)

```bash
python manage.py createsuperuser
```

## CSV Data Import

Import trailer data from `VideoDB.csv`:

```bash
# Preview import (dry run)
python manage.py import_videodb /path/to/VideoDB.csv --dry-run

# Import data
python manage.py import_videodb /path/to/VideoDB.csv --user admin

# Update existing trailers
python manage.py import_videodb /path/to/VideoDB.csv --update
```

### CSV Format

Expected CSV columns:
- `Video Number`: Sequential number (e.g., "Video 0", "Video 1")
- `Description`: Video title/description  
- `Price`: Price string (e.g., "$20", "FREE")
- `Length`: Duration (e.g., "25 Minutes", "1 Hour 15 Minutes")
- `Creators`: Creator name(s)
- `Detailed Description`: Extended description (optional)
- `Video ID`: Cloudflare Stream video UID
- `Thumbnail ID`: Cloudflare Stream thumbnail UID
- `Upload Status`: Status (Complete, Pending, Processing)

## API Endpoints

Base URL: `/api/trailers/`

### Trailers

- `GET /api/trailers/` - List all trailers
- `POST /api/trailers/` - Create new trailer
- `GET /api/trailers/{id}/` - Get trailer details
- `PUT /api/trailers/{id}/` - Update trailer
- `DELETE /api/trailers/{id}/` - Delete trailer

### Special Endpoints

- `GET /api/trailers/featured/` - Featured trailers
- `GET /api/trailers/free/` - Free trailers  
- `GET /api/trailers/premium/` - Premium trailers
- `GET /api/trailers/by_creator/?name={creator}` - Trailers by creator
- `GET /api/trailers/stats/` - Statistics
- `POST /api/trailers/{id}/toggle_featured/` - Toggle featured status

### Query Parameters

- `search` - Search across titles, descriptions, creators
- `creator` - Filter by creator name
- `price_min` / `price_max` - Price range filtering
- `length_min` / `length_max` - Duration filtering (minutes)
- `status` - Upload status filtering
- `is_featured` - Featured content filter
- `is_premium` - Premium content filter
- `ordering` - Sort by field (e.g., `-created_at`, `video_number`)

### Example API Calls

```bash
# Get all trailers
curl http://localhost:8000/api/trailers/

# Search trailers
curl "http://localhost:8000/api/trailers/?search=threesome"

# Filter by creator
curl "http://localhost:8000/api/trailers/?creator=NEVERSATISFIEDXO"

# Price range filter
curl "http://localhost:8000/api/trailers/?price_min=15&price_max=25"

# Get featured trailers
curl http://localhost:8000/api/trailers/featured/
```

## Environment Variables

Add to your environment:

```bash
CLOUDFLARE_STREAM_CUSTOMER_CODE=your_customer_code
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_STREAM_API_TOKEN=your_api_token
```

## Admin Interface

Access at `/admin/trailers/trailermeta/` to:

- View and edit trailer metadata
- Preview thumbnails and stream URLs
- Bulk actions (mark featured, set status)
- Filter and search content
- View pricing and duration statistics

## Model Overview

### TrailerMeta

Core model linking MediaCMS Media objects with premium content metadata:

- Links to MediaCMS `Media` model (OneToOne)
- Cloudflare Stream integration (`cf_video_uid`, `cf_thumb_uid`)
- Premium content fields (price, creators, detailed descriptions)
- Status tracking and featured content
- JSON tags for flexible categorization
- Computed fields for price/duration parsing

## CORS Configuration

For frontend integration, ensure CORS is configured:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev
    "https://yourdomain.com",  # Production
]
CORS_ALLOW_CREDENTIALS = True
```

## Troubleshooting

### Common Issues

1. **Import fails**: Check CSV encoding (UTF-8) and column names
2. **CORS errors**: Verify `corsheaders` middleware is first
3. **API 404**: Ensure `trailers.urls` is included in main URLs
4. **Missing thumbnails**: Check Cloudflare Stream UIDs and customer code

### Debug Mode

Enable debug logging:

```python
LOGGING = {
    'loggers': {
        'trailers': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}
```

## License

Same as MediaCMS project licensing.
"""
Django settings extension for MediaCMS Trailer functionality
Add these settings to your main MediaCMS settings.py file
"""

# Add trailers app to INSTALLED_APPS
INSTALLED_APPS = [
    # ... existing MediaCMS apps
    "trailers",  # Add this line
    "rest_framework",
    "django_filters",
    "corsheaders",  # For CORS support
]

# Add CORS middleware (add at the top of MIDDLEWARE)
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Add this line
    # ... existing middleware
]

# REST Framework configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

# CORS settings for frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev server
    "https://videos.neversatisfiedxo.com",  # Production domain
    "https://www.videos.neversatisfiedxo.com",  # Production domain with www
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Cloudflare Stream settings
CLOUDFLARE_STREAM_CUSTOMER_CODE = "d6a71f77965f2f32d7f3ebb03869b8d6"
CLOUDFLARE_ACCOUNT_ID = "d6a71f77965f2f32d7f3ebb03869b8d6"
CLOUDFLARE_STREAM_API_TOKEN = "rvWXyGVnRtQkQm_JXdhlJNcOjU-OC1yMSqmdw-xz"

# Trailer-specific settings
TRAILER_SETTINGS = {
    "DEFAULT_UPLOAD_STATUS": "Pending",
    "ENABLE_FEATURED_TRAILERS": True,
    "ENABLE_PREMIUM_CONTENT": True,
    "DEFAULT_PAGINATION_SIZE": 20,
    "MAX_PAGINATION_SIZE": 100,
    "ENABLE_THUMBNAIL_GENERATION": True,
    "CLOUDFLARE_THUMBNAILS": True,
}

# File upload settings (if needed)
FILE_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB

# Cache settings for API responses (Production Redis)
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://redis:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "retry_on_timeout": True,
                "password": None,  # Will be set via environment variable
            },
        },
        "TIMEOUT": 300,  # 5 minutes
        "KEY_PREFIX": "trailers",
    }
}

# Logging configuration for trailer app
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": "trailers.log",
        },
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "trailers": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": True,
        },
    },
}

# Database indexes for better performance
DATABASE_INDEXES = {
    "trailers_trailermeta": [
        ("cf_video_uid",),
        ("video_number",),
        ("upload_status",),
        ("is_featured",),
        ("created_at",),
        ("creators",),
        ("price",),
    ]
}

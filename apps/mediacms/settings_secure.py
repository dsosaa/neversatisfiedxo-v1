"""
Django secure settings configuration for MediaCMS Trailer functionality
This file contains production-ready security configurations
"""
import os
from django.core.exceptions import ImproperlyConfigured

def get_env_value(env_variable, default=None):
    """Get the environment variable or raise exception/use default."""
    try:
        return os.environ[env_variable]
    except KeyError:
        if default is not None:
            return default
        error_msg = f'Set the {env_variable} environment variable'
        raise ImproperlyConfigured(error_msg)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_env_value('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = get_env_value('DEBUG', 'False').lower() == 'true'

# Security Settings
ALLOWED_HOSTS = get_env_value('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Add trailers app to INSTALLED_APPS
INSTALLED_APPS = [
    # ... existing MediaCMS apps
    'trailers',  # Add this line
    'rest_framework',
    'django_filters',
    'corsheaders',  # For CORS support
]

# Security Middleware Configuration (Order is important!)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',  # Security headers
    'corsheaders.middleware.CorsMiddleware',  # CORS handling
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Database Configuration with Connection Pooling
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': get_env_value('DB_NAME'),
        'USER': get_env_value('DB_USER'),
        'PASSWORD': get_env_value('DB_PASSWORD'),
        'HOST': get_env_value('DB_HOST', 'localhost'),
        'PORT': get_env_value('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,  # Persistent connections for performance
        'OPTIONS': {
            'sslmode': get_env_value('DB_SSLMODE', 'prefer'),
        },
    }
}

# Security Headers Configuration
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# SSL Configuration (Production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# Session Security
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 3600  # 1 hour

# CSRF Security
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = get_env_value('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000').split(',')

# REST Framework configuration with security
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': get_env_value('THROTTLE_ANON', '100/hour'),
        'user': get_env_value('THROTTLE_USER', '1000/hour')
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# CORS settings with security
CORS_ALLOWED_ORIGINS = get_env_value('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-requested-with',
]

# Cloudflare Stream settings (from environment)
CLOUDFLARE_STREAM_CUSTOMER_CODE = get_env_value('CLOUDFLARE_STREAM_CUSTOMER_CODE')
CLOUDFLARE_ACCOUNT_ID = get_env_value('CLOUDFLARE_ACCOUNT_ID')
CLOUDFLARE_STREAM_API_TOKEN = get_env_value('CLOUDFLARE_STREAM_API_TOKEN')

# Cache configuration with Redis for production
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache' if not DEBUG 
                  else 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': get_env_value('REDIS_URL', 'redis://127.0.0.1:6379/1') if not DEBUG
                   else 'unique-snowflake',
        'TIMEOUT': 300,  # 5 minutes
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
            'CULL_FREQUENCY': 3,
        } if DEBUG else {
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 20,
                'retry_on_timeout': True,
            }
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Logging configuration with security focus
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': get_env_value('LOG_FILE', 'trailers.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO' if not DEBUG else 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'security': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': get_env_value('SECURITY_LOG_FILE', 'security.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'trailers': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.security': {
            'handlers': ['security'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# File upload security
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB (reduced for security)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB (reduced for security)
FILE_UPLOAD_PERMISSIONS = 0o644

# Media files security
MEDIA_ROOT = get_env_value('MEDIA_ROOT', '/var/media/')
STATIC_ROOT = get_env_value('STATIC_ROOT', '/var/static/')

# Template configuration with security
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
            'loaders': [
                ('django.template.loaders.cached.Loader', [
                    'django.template.loaders.filesystem.Loader',
                    'django.template.loaders.app_directories.Loader',
                ]) if not DEBUG else 'django.template.loaders.filesystem.Loader',
            ],
        },
    },
]

# Trailer-specific settings
TRAILER_SETTINGS = {
    'DEFAULT_UPLOAD_STATUS': 'Pending',
    'ENABLE_FEATURED_TRAILERS': True,
    'ENABLE_PREMIUM_CONTENT': True,
    'DEFAULT_PAGINATION_SIZE': 20,
    'MAX_PAGINATION_SIZE': 100,
    'ENABLE_THUMBNAIL_GENERATION': True,
    'CLOUDFLARE_THUMBNAILS': True,
    'MAX_VIDEO_SIZE_MB': int(get_env_value('MAX_VIDEO_SIZE_MB', '500')),
    'ALLOWED_VIDEO_FORMATS': ['mp4', 'mov', 'avi'],
    'ENABLE_RATE_LIMITING': True,
}

# Email configuration (for error reporting)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = get_env_value('EMAIL_HOST', '')
EMAIL_PORT = int(get_env_value('EMAIL_PORT', '587'))
EMAIL_USE_TLS = get_env_value('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = get_env_value('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = get_env_value('EMAIL_HOST_PASSWORD', '')

# Admin email for security notifications
ADMINS = [
    ('Admin', get_env_value('ADMIN_EMAIL', 'admin@example.com')),
]

# Security middleware settings
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'

# Additional security for production
if not DEBUG:
    # Content Security Policy would be configured here
    # Consider using django-csp package for full CSP support
    pass
"""
URL configuration extension for MediaCMS with trailer functionality
Add this to your main MediaCMS urls.py file
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # MediaCMS existing URLs
    # path('', include('files.urls')),  # Existing MediaCMS URLs
    # path('api/', include('api.urls')),  # Existing MediaCMS API
    
    # Trailer app URLs
    path('', include('trailers.urls')),  # Trailer API endpoints
    
    # REST Framework authentication URLs
    path('api-auth/', include('rest_framework.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin site customization
admin.site.site_header = "MediaCMS Trailer Administration"
admin.site.site_title = "MediaCMS Trailer Admin"
admin.site.index_title = "Welcome to MediaCMS Trailer Administration"
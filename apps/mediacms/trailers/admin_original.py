from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.shortcuts import render
from .models import TrailerMeta
from .forms import TrailerMetaAdminForm
from .services import get_cloudflare_service
import logging

logger = logging.getLogger('trailers')


@admin.register(TrailerMeta)
class TrailerMetaAdmin(admin.ModelAdmin):
    """
    Enhanced admin interface for TrailerMeta model with Cloudflare integration
    """
    form = TrailerMetaAdminForm
    list_display = [
        'video_number',
        'title',
        'creators',
        'price',
        'length',
        'upload_status',
        'is_featured',
        'is_premium',
        'thumbnail_preview',
        'created_at',
    ]
    
    list_filter = [
        'upload_status',
        'is_featured', 
        'is_premium',
        'creators',
        'created_at',
    ]
    
    search_fields = [
        'video_number',
        'media__title',
        'media__description',
        'detailed_description',
        'creators',
        'cf_video_uid',
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'thumbnail_preview',
        'stream_preview',
        'price_numeric_display',
        'duration_minutes_display',
        'video_status_display',
    ]
    
    fieldsets = [
        ('Video Upload', {
            'fields': [
                'video_upload',
                'video_status_display',
            ],
            'description': 'Upload video directly to Cloudflare Stream'
        }),
        ('Basic Information', {
            'fields': [
                'media_creation',
                'media',
                'video_number',
                'creators',
            ]
        }),
        ('Cloudflare Stream', {
            'fields': [
                'cf_video_uid',
                'cf_thumb_uid',
                'thumbnail_preview',
                'stream_preview',
            ],
            'description': 'Cloudflare Stream integration settings'
        }),
        ('Pricing & Duration', {
            'fields': [
                'price',
                'price_numeric_display',
                'length',
                'duration_minutes_display',
            ]
        }),
        ('Content', {
            'fields': [
                'detailed_description',
                'tags',
            ]
        }),
        ('Status & Features', {
            'fields': [
                'upload_status',
                'is_featured',
                'is_premium',
            ]
        }),
        ('Timestamps', {
            'fields': [
                'created_at',
                'updated_at',
            ],
            'classes': ['collapse'],
        }),
    ]
    
    list_editable = [
        'is_featured',
        'is_premium', 
        'upload_status',
    ]
    
    list_per_page = 25
    
    ordering = ['-created_at', 'video_number']
    
    actions = [
        'mark_as_featured',
        'mark_as_not_featured',
        'mark_as_complete',
        'mark_as_premium',
        'mark_as_free',
        'refresh_video_status',
        'sync_with_cloudflare',
    ]
    
    def title(self, obj):
        """Get title from related Media object"""
        return obj.media.title
    title.short_description = 'Title'
    title.admin_order_field = 'media__title'
    
    def thumbnail_preview(self, obj):
        """Show thumbnail preview in admin"""
        thumbnail_url = obj.get_cloudflare_thumbnail_url()
        if thumbnail_url:
            return format_html(
                '<img src="{}" width="120" height="68" style="border-radius: 4px;" />',
                thumbnail_url
            )
        return 'No thumbnail'
    thumbnail_preview.short_description = 'Thumbnail'
    
    def stream_preview(self, obj):
        """Show stream URL link in admin"""
        if obj.cf_video_uid:
            stream_url = f"https://iframe.videodelivery.net/{obj.cf_video_uid}"
            return format_html(
                '<a href="{}" target="_blank">View Stream</a>',
                stream_url
            )
        return 'No stream URL'
    stream_preview.short_description = 'Stream URL'
    
    def price_numeric_display(self, obj):
        """Show numeric price value"""
        return f"${obj.get_price_numeric():.2f}"
    price_numeric_display.short_description = 'Price (Numeric)'
    
    def duration_minutes_display(self, obj):
        """Show duration in minutes"""
        minutes = obj.get_duration_minutes()
        if minutes >= 60:
            hours = minutes // 60
            remaining_minutes = minutes % 60
            return f"{hours}h {remaining_minutes}m ({minutes} min total)"
        return f"{minutes} min"
    duration_minutes_display.short_description = 'Duration (Minutes)'
    
    # Admin actions
    def mark_as_featured(self, request, queryset):
        """Mark selected trailers as featured"""
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} trailer(s) marked as featured.')
    mark_as_featured.short_description = 'Mark selected as featured'
    
    def mark_as_not_featured(self, request, queryset):
        """Mark selected trailers as not featured"""
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} trailer(s) unmarked as featured.')
    mark_as_not_featured.short_description = 'Remove featured status'
    
    def mark_as_complete(self, request, queryset):
        """Mark selected trailers as complete"""
        updated = queryset.update(upload_status='Complete')
        self.message_user(request, f'{updated} trailer(s) marked as complete.')
    mark_as_complete.short_description = 'Mark upload as complete'
    
    def mark_as_premium(self, request, queryset):
        """Mark selected trailers as premium"""
        updated = queryset.update(is_premium=True)
        self.message_user(request, f'{updated} trailer(s) marked as premium.')
    mark_as_premium.short_description = 'Mark as premium content'
    
    def mark_as_free(self, request, queryset):
        """Mark selected trailers as free and update price"""
        updated = queryset.update(is_premium=False, price='FREE')
        self.message_user(request, f'{updated} trailer(s) marked as free.')
    mark_as_free.short_description = 'Mark as free content'
    
    def refresh_video_status(self, request, queryset):
        """Refresh video processing status from Cloudflare"""
        try:
            cf_service = get_cloudflare_service()
            updated_count = 0
            
            for trailer in queryset:
                if trailer.cf_video_uid:
                    status_result = cf_service.get_video_status(trailer.cf_video_uid)
                    if status_result['success']:
                        # Update status based on Cloudflare response
                        if status_result['ready']:
                            trailer.upload_status = 'Complete'
                        elif status_result['status'] == 'error':
                            trailer.upload_status = 'Error'
                        else:
                            trailer.upload_status = 'Processing'
                        
                        trailer.save()
                        updated_count += 1
            
            self.message_user(request, f'Refreshed status for {updated_count} trailer(s).')
            
        except Exception as e:
            self.message_user(request, f'Error refreshing status: {str(e)}', level=messages.ERROR)
    refresh_video_status.short_description = 'Refresh video processing status'
    
    def sync_with_cloudflare(self, request, queryset):
        """Sync metadata with Cloudflare Stream"""
        try:
            cf_service = get_cloudflare_service()
            synced_count = 0
            
            for trailer in queryset:
                if trailer.cf_video_uid:
                    # Update Cloudflare metadata
                    metadata = {
                        'name': trailer.media.title if trailer.media else f"Video {trailer.video_number}",
                        'description': trailer.detailed_description or trailer.media.description if trailer.media else '',
                    }
                    
                    result = cf_service.update_video_metadata(trailer.cf_video_uid, metadata)
                    if result['success']:
                        synced_count += 1
            
            self.message_user(request, f'Synced metadata for {synced_count} trailer(s).')
            
        except Exception as e:
            self.message_user(request, f'Error syncing metadata: {str(e)}', level=messages.ERROR)
    sync_with_cloudflare.short_description = 'Sync metadata with Cloudflare'
    
    def get_urls(self):
        """Add custom admin URLs"""
        urls = super().get_urls()
        custom_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='trailers_bulk_upload'),
            path('dashboard/', self.admin_site.admin_view(self.dashboard_view), name='trailers_dashboard'),
            path('video-status-check/', self.admin_site.admin_view(self.video_status_check_view), name='trailers_video_status_check'),
            path('cloudflare-settings/', self.admin_site.admin_view(self.cloudflare_settings_view), name='trailers_cloudflare_settings'),
        ]
        return custom_urls + urls
    
    def bulk_upload_view(self, request):
        """Handle bulk CSV upload"""
        from .admin_views import bulk_upload
        return bulk_upload(request)
    
    def dashboard_view(self, request):
        """Show trailer dashboard"""
        from .admin_views import trailer_dashboard
        return trailer_dashboard(request)
    
    def video_status_check_view(self, request):
        """Check video status"""
        from .admin_views import video_status_check
        return video_status_check(request)
    
    def cloudflare_settings_view(self, request):
        """Configure Cloudflare settings"""
        from .admin_views import cloudflare_settings
        return cloudflare_settings(request)
    
    def changelist_view(self, request, extra_context=None):
        """Enhanced changelist with custom buttons"""
        extra_context = extra_context or {}
        extra_context.update({
            'custom_buttons': [
                {
                    'url': reverse('admin:trailers_dashboard'),
                    'title': 'Dashboard',
                    'class': 'btn-info'
                },
                {
                    'url': reverse('admin:trailers_bulk_upload'),
                    'title': 'Bulk Upload',
                    'class': 'btn-success'
                },
                {
                    'url': reverse('admin:trailers_video_status_check'),
                    'title': 'Check Status',
                    'class': 'btn-warning'
                },
                {
                    'url': reverse('admin:trailers_cloudflare_settings'),
                    'title': 'CF Settings',
                    'class': 'btn-secondary'
                },
            ]
        })
        return super().changelist_view(request, extra_context)
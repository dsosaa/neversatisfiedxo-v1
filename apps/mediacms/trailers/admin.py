from django.contrib import admin
from django.utils.html import format_html
from .models import TrailerMeta, Media


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    """Simple admin for Media model"""
    list_display = ['title', 'user', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['title', 'description']


@admin.register(TrailerMeta)
class TrailerMetaAdmin(admin.ModelAdmin):
    """Simple admin interface for TrailerMeta model"""
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
        'price_numeric_display',
        'duration_minutes_display',
    ]
    
    fieldsets = [
        ('Basic Information', {
            'fields': [
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
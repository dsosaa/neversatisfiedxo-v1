from django.contrib import admin
from django.utils.html import format_html

from .models import TrailerMeta

@admin.register(TrailerMeta)
class TrailerMetaAdmin(admin.ModelAdmin):
    """
    Admin interface for TrailerMeta model
    """

    list_display = [
        "video_number",
        "title",
        "creators",
        "price",
        "length",
        "upload_status",
        "is_featured",
        "is_premium",
        "thumbnail_preview",
        "created_at",
    ]

    list_filter = [
        "upload_status",
        "is_featured",
        "is_premium",
        "creators",
        "created_at",
    ]

    search_fields = [
        "video_number",
        "media__title",
        "media__description",
        "detailed_description",
        "creators",
        "cf_video_uid",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
        "thumbnail_preview",
        "stream_preview",
        "price_numeric_display",
        "duration_minutes_display",
    ]

    fieldsets = [
        (
            "Basic Information",
            {
                "fields": [
                    "media",
                    "video_number",
                    "creators",
                ]
            },
        ),
        (
            "Cloudflare Stream",
            {
                "fields": [
                    "cf_video_uid",
                    "cf_thumb_uid",
                    "thumbnail_preview",
                    "stream_preview",
                ],
                "description": "Cloudflare Stream integration settings",
            },
        ),
        (
            "Pricing & Duration",
            {
                "fields": [
                    "price",
                    "price_numeric_display",
                    "length",
                    "duration_minutes_display",
                ]
            },
        ),
        (
            "Content",
            {
                "fields": [
                    "detailed_description",
                    "tags",
                ]
            },
        ),
        (
            "Status & Features",
            {
                "fields": [
                    "upload_status",
                    "is_featured",
                    "is_premium",
                ]
            },
        ),
        (
            "Timestamps",
            {
                "fields": [
                    "created_at",
                    "updated_at",
                ],
                "classes": ["collapse"],
            },
        ),
    ]

    list_editable = [
        "is_featured",
        "is_premium",
        "upload_status",
    ]

    list_per_page = 25

    ordering = ["-created_at", "video_number"]

    actions = [
        "mark_as_featured",
        "mark_as_not_featured",
        "mark_as_complete",
        "mark_as_premium",
        "mark_as_free",
    ]

    def title(self, obj):
        """Get title from related Media object"""
        return obj.media.title

    title.short_description = "Title"
    title.admin_order_field = "media__title"

    def thumbnail_preview(self, obj):
        """Show thumbnail preview in admin"""
        thumbnail_url = obj.get_cloudflare_thumbnail_url()
        if thumbnail_url:
            return format_html(
                '<img src="{}" width="120" height="68" style="border-radius: 4px;" />',
                thumbnail_url,
            )
        return "No thumbnail"

    thumbnail_preview.short_description = "Thumbnail"

    def stream_preview(self, obj):
        """Show stream URL link in admin"""
        if obj.cf_video_uid:
            stream_url = f"https://iframe.videodelivery.net/{obj.cf_video_uid}"
            return format_html(
                '<a href="{}" target="_blank">View Stream</a>', stream_url
            )
        return "No stream URL"

    stream_preview.short_description = "Stream URL"

    def price_numeric_display(self, obj):
        """Show numeric price value"""
        return f"${obj.get_price_numeric():.2f}"

    price_numeric_display.short_description = "Price (Numeric)"

    def duration_minutes_display(self, obj):
        """Show duration in minutes"""
        minutes = obj.get_duration_minutes()
        if minutes >= 60:
            hours = minutes // 60
            remaining_minutes = minutes % 60
            return f"{hours}h {remaining_minutes}m ({minutes} min total)"
        return f"{minutes} min"

    duration_minutes_display.short_description = "Duration (Minutes)"

    # Admin actions
    def mark_as_featured(self, request, queryset):
        """Mark selected trailers as featured"""
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} trailer(s) marked as featured.")

    mark_as_featured.short_description = "Mark selected as featured"

    def mark_as_not_featured(self, request, queryset):
        """Mark selected trailers as not featured"""
        updated = queryset.update(is_featured=False)
        self.message_user(request, f"{updated} trailer(s) unmarked as featured.")

    mark_as_not_featured.short_description = "Remove featured status"

    def mark_as_complete(self, request, queryset):
        """Mark selected trailers as complete"""
        updated = queryset.update(upload_status="Complete")
        self.message_user(request, f"{updated} trailer(s) marked as complete.")

    mark_as_complete.short_description = "Mark upload as complete"

    def mark_as_premium(self, request, queryset):
        """Mark selected trailers as premium"""
        updated = queryset.update(is_premium=True)
        self.message_user(request, f"{updated} trailer(s) marked as premium.")

    mark_as_premium.short_description = "Mark as premium content"

    def mark_as_free(self, request, queryset):
        """Mark selected trailers as free and update price"""
        updated = queryset.update(is_premium=False, price="FREE")
        self.message_user(request, f"{updated} trailer(s) marked as free.")

    mark_as_free.short_description = "Mark as free content"

from django.contrib.auth import get_user_model
from django.db import models
from django.conf import settings

class Media(models.Model):
    """
    Simplified Media model for standalone trailer functionality
    (replaces MediaCMS Media dependency)
    """

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trailer_media_set')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class TrailerMeta(models.Model):
    """
    Extended metadata for trailer videos
    Standalone version for local development
    """

    # Link to simplified Media model
    media = models.OneToOneField(
        Media,
        on_delete=models.CASCADE,
        related_name="trailer_meta",
        help_text="Associated media object",
    )

    # Video identification
    video_number = models.PositiveIntegerField(
        help_text="Sequential video number for organization"
    )

    # Cloudflare Stream integration
    cf_video_uid = models.CharField(
        max_length=255, unique=True, help_text="Cloudflare Stream video UID"
    )
    cf_thumb_uid = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Cloudflare Stream thumbnail UID",
    )

    # Premium content metadata
    price = models.CharField(
        max_length=50, default="FREE", help_text="Price as string (e.g., '$20', 'FREE')"
    )
    length = models.CharField(
        max_length=50,
        help_text="Video length as string (e.g., '25 Minutes', '1 Hour 15 Minutes')",
    )
    creators = models.CharField(max_length=200, help_text="Content creators/performers")

    # Extended descriptions
    detailed_description = models.TextField(
        blank=True, null=True, help_text="Extended description with more details"
    )

    # Upload and processing status
    UPLOAD_STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Processing", "Processing"),
        ("Complete", "Complete"),
        ("Error", "Error"),
    ]
    upload_status = models.CharField(
        max_length=20,
        choices=UPLOAD_STATUS_CHOICES,
        default="Pending",
        help_text="Current upload/processing status",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Additional metadata
    tags = models.JSONField(
        default=list, blank=True, help_text="Additional tags for categorization"
    )

    # Premium features
    is_featured = models.BooleanField(
        default=False, help_text="Feature this trailer prominently"
    )
    is_premium = models.BooleanField(
        default=True, help_text="Requires payment/subscription to view"
    )

    class Meta:
        db_table = "trailer_meta"
        verbose_name = "Trailer Metadata"
        verbose_name_plural = "Trailer Metadata"
        ordering = ["-created_at", "video_number"]
        indexes = [
            models.Index(fields=["cf_video_uid"]),
            models.Index(fields=["video_number"]),
            models.Index(fields=["upload_status"]),
            models.Index(fields=["is_featured"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Video {self.video_number}: {self.media.title}"

    @property
    def title(self):
        """Get title from associated Media object"""
        return self.media.title

    @property
    def description(self):
        """Get description from associated Media object"""
        return self.media.description

    def get_price_numeric(self):
        """Convert price string to numeric value"""
        if self.price.lower() == "free":
            return 0.0
        # Extract numeric value from price string like "$20"
        import re

        match = re.search(r"\$?(\d+(?:\.\d{2})?)", self.price)
        return float(match.group(1)) if match else 0.0

    def get_duration_minutes(self):
        """Convert length string to minutes"""
        import re

        # Handle formats like "25 Minutes", "1 Hour 15 Minutes"
        match = re.search(
            r"(\d+)\s*(?:Hour|Hr)?s?\s*(\d+)?\s*(?:Minute|Min)?s?",
            self.length,
            re.IGNORECASE,
        )
        if match:
            hours = int(match.group(1)) if "hour" in self.length.lower() else 0
            minutes = (
                int(match.group(2))
                if match.group(2)
                else (int(match.group(1)) if "hour" not in self.length.lower() else 0)
            )
            return hours * 60 + minutes
        return 0

    def get_cloudflare_thumbnail_url(self):
        """Generate Cloudflare Stream thumbnail URL"""
        if self.cf_video_uid:
            return f"https://videodelivery.net/{self.cf_video_uid}/thumbnails/thumbnail.jpg"
        return None

    def get_cloudflare_stream_url(self, customer_code=None):
        """Generate Cloudflare Stream iframe URL"""
        if self.cf_video_uid and customer_code:
            return f"https://iframe.videodelivery.net/{self.cf_video_uid}"
        return None
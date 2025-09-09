from rest_framework import serializers
from .models import TrailerMeta, Media


class TrailerMetaSerializer(serializers.ModelSerializer):
    """
    Serializer for TrailerMeta model with computed fields
    """
    
    # Add fields from related Media model
    title = serializers.CharField(source='media.title', read_only=True)
    description = serializers.CharField(source='media.description', read_only=True)
    media_id = serializers.IntegerField(source='media.id', read_only=True)
    
    # Computed fields
    price_numeric = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField() 
    thumbnail_url = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()
    
    # Frontend-friendly field names
    id = serializers.CharField(source='cf_video_uid', read_only=True)
    
    class Meta:
        model = TrailerMeta
        fields = [
            'id',  # cf_video_uid as id
            'media_id',
            'video_number',
            'title',
            'description', 
            'detailed_description',
            'cf_video_uid',
            'cf_thumb_uid',
            'price',
            'price_numeric',
            'length',
            'duration_minutes',
            'creators',
            'upload_status',
            'tags',
            'is_featured',
            'is_premium',
            'thumbnail_url',
            'stream_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'media_id', 
            'title',
            'description',
            'price_numeric',
            'duration_minutes',
            'thumbnail_url',
            'stream_url',
            'created_at',
            'updated_at',
        ]
    
    def get_price_numeric(self, obj):
        """Get numeric price value"""
        return obj.get_price_numeric()
    
    def get_duration_minutes(self, obj):
        """Get duration in minutes"""
        return obj.get_duration_minutes()
    
    def get_thumbnail_url(self, obj):
        """Get Cloudflare Stream thumbnail URL"""
        return obj.get_cloudflare_thumbnail_url()
    
    def get_stream_url(self, obj):
        """Get Cloudflare Stream URL (requires customer code in settings)"""
        from django.conf import settings
        customer_code = getattr(settings, 'CLOUDFLARE_STREAM_CUSTOMER_CODE', None)
        return obj.get_cloudflare_stream_url(customer_code)


class TrailerCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating TrailerMeta instances
    """
    media_title = serializers.CharField(write_only=True)
    media_description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = TrailerMeta
        fields = [
            'media_title',
            'media_description',
            'video_number',
            'cf_video_uid',
            'cf_thumb_uid', 
            'price',
            'length',
            'creators',
            'detailed_description',
            'upload_status',
            'tags',
            'is_featured',
            'is_premium',
        ]
    
    def create(self, validated_data):
        """Create Media and TrailerMeta objects"""
        media_title = validated_data.pop('media_title')
        media_description = validated_data.pop('media_description', '')
        
        # Create Media object first
        media = Media.objects.create(
            title=media_title,
            description=media_description,
            user=self.context['request'].user,
        )
        
        # Create TrailerMeta with reference to Media
        validated_data['media'] = media
        return super().create(validated_data)


class TrailerListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing trailers
    """
    title = serializers.CharField(source='media.title', read_only=True)
    description = serializers.CharField(source='media.description', read_only=True)
    price_numeric = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    # Use cf_video_uid as id for frontend compatibility
    id = serializers.CharField(source='cf_video_uid', read_only=True)
    
    class Meta:
        model = TrailerMeta
        fields = [
            'id',
            'video_number',
            'title',
            'description',
            'cf_video_uid',
            'price',
            'price_numeric',
            'length',
            'duration_minutes',
            'creators',
            'upload_status',
            'is_featured',
            'is_premium',
            'thumbnail_url',
            'created_at',
        ]
    
    def get_price_numeric(self, obj):
        return obj.get_price_numeric()
    
    def get_duration_minutes(self, obj):
        return obj.get_duration_minutes()
    
    def get_thumbnail_url(self, obj):
        return obj.get_cloudflare_thumbnail_url()
"""
Custom admin forms for Cloudflare Stream integration
"""
from django import forms
from django.core.exceptions import ValidationError
from django.contrib.admin import widgets as admin_widgets
from .models import TrailerMeta
from .widgets import CloudflareVideoUploadWidget, VideoStatusWidget, MediaCreationWidget
from .services import get_cloudflare_service
from files.models import Media
import logging

logger = logging.getLogger('trailers')


class TrailerMetaAdminForm(forms.ModelForm):
    """
    Enhanced admin form for TrailerMeta with Cloudflare integration
    """
    
    # Custom fields for video upload
    video_upload = forms.FileField(
        required=False,
        widget=CloudflareVideoUploadWidget(),
        help_text="Upload video directly to Cloudflare Stream",
        label="Video Upload"
    )
    
    # Enhanced media selection with inline creation
    media_creation = forms.IntegerField(
        required=False,
        widget=MediaCreationWidget(),
        help_text="Create or link MediaCMS Media object",
        label="Media Object"
    )
    
    # Video status display
    video_status_display = forms.CharField(
        required=False,
        widget=VideoStatusWidget(),
        help_text="Current video processing status",
        label="Processing Status"
    )
    
    class Meta:
        model = TrailerMeta
        fields = '__all__'
        widgets = {
            'detailed_description': forms.Textarea(attrs={'rows': 4}),
            'tags': admin_widgets.AdminTextareaWidget(attrs={'rows': 3}),
            'cf_video_uid': forms.TextInput(attrs={'readonly': True}),
            'cf_thumb_uid': forms.TextInput(attrs={'readonly': True}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Set initial values for custom fields
        if self.instance and self.instance.pk:
            if self.instance.cf_video_uid:
                self.fields['video_status_display'].initial = self.instance.cf_video_uid
                self.fields['video_upload'].widget.attrs['data-current-uid'] = self.instance.cf_video_uid
            
            if self.instance.media:
                self.fields['media_creation'].initial = self.instance.media.id
        
        # Make certain fields readonly based on context
        if self.instance and self.instance.cf_video_uid:
            self.fields['cf_video_uid'].widget.attrs['readonly'] = True
            self.fields['cf_thumb_uid'].widget.attrs['readonly'] = True
        
        # Add CSS classes for styling
        self.fields['price'].widget.attrs['class'] = 'form-control'
        self.fields['length'].widget.attrs['class'] = 'form-control'
        self.fields['creators'].widget.attrs['class'] = 'form-control'
        
        # Add help text for important fields
        self.fields['video_number'].help_text = "Sequential number for organizing videos"
        self.fields['price'].help_text = "Format: '$20' or 'FREE'"
        self.fields['length'].help_text = "Format: '25 Minutes' or '1 Hour 15 Minutes'"
    
    def clean_price(self):
        """Validate price format"""
        price = self.cleaned_data.get('price', '').strip()
        if not price:
            return 'FREE'
        
        if price.upper() == 'FREE':
            return 'FREE'
        
        # Check for valid price format
        import re
        if not re.match(r'^\$\d+(\.\d{2})?$', price):
            raise ValidationError("Price must be in format '$20' or '$20.00', or 'FREE'")
        
        return price
    
    def clean_length(self):
        """Validate length format"""
        length = self.cleaned_data.get('length', '').strip()
        if not length:
            raise ValidationError("Length is required")
        
        # Check for valid length format
        import re
        valid_formats = [
            r'^\d+\s*(?:Minutes?|Mins?)\s*$',  # "25 Minutes"
            r'^\d+\s*(?:Hours?|Hrs?)\s*(?:\d+\s*(?:Minutes?|Mins?))?\s*$',  # "1 Hour" or "1 Hour 15 Minutes"
        ]
        
        if not any(re.match(pattern, length, re.IGNORECASE) for pattern in valid_formats):
            raise ValidationError("Length must be in format '25 Minutes' or '1 Hour 15 Minutes'")
        
        return length
    
    def clean_cf_video_uid(self):
        """Validate Cloudflare video UID"""
        uid = self.cleaned_data.get('cf_video_uid', '').strip()
        
        if uid and len(uid) != 32:
            raise ValidationError("Cloudflare video UID must be 32 characters long")
        
        # Check for duplicates
        if uid:
            existing = TrailerMeta.objects.filter(cf_video_uid=uid)
            if self.instance and self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise ValidationError("This Cloudflare video UID is already in use")
        
        return uid
    
    def clean_video_number(self):
        """Validate video number uniqueness"""
        video_number = self.cleaned_data.get('video_number')
        
        if video_number is not None:
            existing = TrailerMeta.objects.filter(video_number=video_number)
            if self.instance and self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise ValidationError("This video number is already in use")
        
        return video_number
    
    def save(self, commit=True):
        """Enhanced save with Cloudflare integration"""
        instance = super().save(commit=False)
        
        # Handle video upload
        video_upload = self.cleaned_data.get('video_upload')
        if video_upload and hasattr(video_upload, 'file'):
            try:
                cf_service = get_cloudflare_service()
                
                # Upload to Cloudflare
                upload_result = cf_service.upload_video(
                    video_file=video_upload.file,
                    metadata={
                        'name': instance.media.title if instance.media else f"Video {instance.video_number}",
                        'description': instance.detailed_description or '',
                    }
                )
                
                if upload_result['success']:
                    instance.cf_video_uid = upload_result['video_uid']
                    
                    # Auto-generate thumbnail UID (same as video UID for Cloudflare)
                    instance.cf_thumb_uid = upload_result['video_uid']
                    
                    logger.info(f"Successfully uploaded video to Cloudflare: {instance.cf_video_uid}")
                else:
                    raise ValidationError(f"Failed to upload video: {upload_result['error']}")
                    
            except Exception as e:
                logger.error(f"Video upload failed: {str(e)}")
                raise ValidationError(f"Video upload failed: {str(e)}")
        
        # Handle media creation
        media_creation = self.cleaned_data.get('media_creation')
        if media_creation and not instance.media_id:
            try:
                media = Media.objects.get(id=media_creation)
                instance.media = media
            except Media.DoesNotExist:
                raise ValidationError("Selected media object does not exist")
        
        if commit:
            instance.save()
        
        return instance


class BulkUploadForm(forms.Form):
    """
    Form for bulk CSV upload with video processing
    """
    csv_file = forms.FileField(
        help_text="CSV file with trailer data (Video Number, Description, Video ID, etc.)"
    )
    
    process_videos = forms.BooleanField(
        required=False,
        initial=False,
        help_text="Automatically check video status and update processing information"
    )
    
    update_existing = forms.BooleanField(
        required=False,
        initial=True,
        help_text="Update existing records if video numbers match"
    )
    
    dry_run = forms.BooleanField(
        required=False,
        initial=True,
        help_text="Preview changes without actually importing"
    )
    
    def clean_csv_file(self):
        """Validate CSV file"""
        csv_file = self.cleaned_data.get('csv_file')
        
        if not csv_file:
            return csv_file
        
        # Check file extension
        if not csv_file.name.lower().endswith('.csv'):
            raise ValidationError("Please upload a CSV file")
        
        # Check file size (10MB max)
        if csv_file.size > 10 * 1024 * 1024:
            raise ValidationError("CSV file must be smaller than 10MB")
        
        return csv_file


class VideoStatusForm(forms.Form):
    """
    Form for checking video status
    """
    video_uid = forms.CharField(
        max_length=32,
        help_text="Cloudflare Stream video UID"
    )
    
    def clean_video_uid(self):
        """Validate video UID format"""
        uid = self.cleaned_data.get('video_uid', '').strip()
        
        if len(uid) != 32:
            raise ValidationError("Video UID must be 32 characters long")
        
        return uid


class CloudflareSettingsForm(forms.Form):
    """
    Form for configuring Cloudflare Stream settings
    """
    account_id = forms.CharField(
        max_length=100,
        help_text="Cloudflare Account ID"
    )
    
    api_token = forms.CharField(
        widget=forms.PasswordInput(render_value=True),
        help_text="Cloudflare API Token with Stream permissions"
    )
    
    customer_code = forms.CharField(
        required=False,
        max_length=50,
        help_text="Cloudflare Stream Customer Code (optional)"
    )
    
    def clean_api_token(self):
        """Validate API token format"""
        token = self.cleaned_data.get('api_token', '').strip()
        
        if not token.startswith('CF-'):
            raise ValidationError("Cloudflare API token should start with 'CF-'")
        
        return token
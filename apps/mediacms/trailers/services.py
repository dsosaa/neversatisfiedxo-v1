"""
Cloudflare Stream API Integration Service
Handles video uploads, thumbnail generation, and status monitoring
"""
import requests
import json
import logging
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from typing import Dict, Optional, Tuple, BinaryIO
import time

logger = logging.getLogger('trailers')


class CloudflareStreamService:
    """
    Service for interacting with Cloudflare Stream API
    """
    
    def __init__(self):
        self.account_id = getattr(settings, 'CLOUDFLARE_ACCOUNT_ID', None)
        self.api_token = getattr(settings, 'CLOUDFLARE_STREAM_API_TOKEN', None)
        self.customer_code = getattr(settings, 'CLOUDFLARE_STREAM_CUSTOMER_CODE', None)
        
        if not all([self.account_id, self.api_token]):
            raise ValidationError(
                "Cloudflare Stream configuration missing. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN in settings."
            )
        
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/stream"
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
    
    def upload_video(self, video_file: BinaryIO, metadata: Dict = None) -> Dict:
        """
        Upload video to Cloudflare Stream
        
        Args:
            video_file: File-like object containing video data
            metadata: Optional metadata dict with title, description, etc.
            
        Returns:
            Dict containing upload result with video UID and status
        """
        try:
            # Prepare upload request
            upload_url = f"{self.base_url}/direct_upload"
            
            # Default metadata
            default_metadata = {
                'requireSignedURLs': False,
                'allowedOrigins': [],
                'thumbnailTimestampPct': 0.1,  # Generate thumbnail at 10% of video
            }
            
            if metadata:
                default_metadata.update(metadata)
            
            # Create direct upload URL
            response = requests.post(
                upload_url,
                headers=self.headers,
                json={
                    'maxDurationSeconds': 3600,  # 1 hour max
                    'metadata': default_metadata
                }
            )
            response.raise_for_status()
            
            upload_data = response.json()
            if not upload_data.get('success'):
                raise Exception(f"Failed to create upload URL: {upload_data}")
            
            # Upload video file
            upload_url = upload_data['result']['uploadURL']
            video_file.seek(0)  # Reset file pointer
            
            upload_response = requests.post(
                upload_url,
                files={'file': video_file}
            )
            upload_response.raise_for_status()
            
            upload_result = upload_response.json()
            
            if upload_result.get('success'):
                video_uid = upload_result['result']['uid']
                logger.info(f"Successfully uploaded video with UID: {video_uid}")
                
                return {
                    'success': True,
                    'video_uid': video_uid,
                    'status': 'uploaded',
                    'result': upload_result['result']
                }
            else:
                raise Exception(f"Upload failed: {upload_result}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Cloudflare API request failed: {str(e)}")
            return {
                'success': False,
                'error': f"API request failed: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Video upload failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_video_status(self, video_uid: str) -> Dict:
        """
        Get video processing status from Cloudflare Stream
        
        Args:
            video_uid: Cloudflare Stream video UID
            
        Returns:
            Dict containing video status and metadata
        """
        try:
            response = requests.get(
                f"{self.base_url}/{video_uid}",
                headers=self.headers
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('success'):
                result = data['result']
                return {
                    'success': True,
                    'status': result.get('status', 'unknown'),
                    'duration': result.get('duration', 0),
                    'size': result.get('size', 0),
                    'ready': result.get('readyToStream', False),
                    'thumbnail': result.get('thumbnail'),
                    'preview': result.get('preview'),
                    'result': result
                }
            else:
                return {
                    'success': False,
                    'error': f"Failed to get video status: {data}"
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get video status: {str(e)}")
            return {
                'success': False,
                'error': f"API request failed: {str(e)}"
            }
    
    def get_thumbnail_url(self, video_uid: str, timestamp_pct: float = 0.1) -> str:
        """
        Generate thumbnail URL for video
        
        Args:
            video_uid: Cloudflare Stream video UID
            timestamp_pct: Percentage of video duration for thumbnail (0.0-1.0)
            
        Returns:
            Thumbnail URL string
        """
        return f"https://videodelivery.net/{video_uid}/thumbnails/thumbnail.jpg?time={timestamp_pct:.1f}s"
    
    def get_stream_url(self, video_uid: str) -> str:
        """
        Generate stream iframe URL for video
        
        Args:
            video_uid: Cloudflare Stream video UID
            
        Returns:
            Stream URL string
        """
        return f"https://iframe.videodelivery.net/{video_uid}"
    
    def wait_for_processing(self, video_uid: str, max_wait: int = 300, check_interval: int = 10) -> Dict:
        """
        Wait for video processing to complete
        
        Args:
            video_uid: Cloudflare Stream video UID
            max_wait: Maximum wait time in seconds
            check_interval: Check interval in seconds
            
        Returns:
            Dict with final processing status
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            status = self.get_video_status(video_uid)
            
            if not status['success']:
                return status
            
            if status['ready']:
                logger.info(f"Video {video_uid} processing completed")
                return status
            
            if status['status'] == 'error':
                logger.error(f"Video {video_uid} processing failed")
                return status
            
            logger.info(f"Video {video_uid} still processing, status: {status['status']}")
            time.sleep(check_interval)
        
        logger.warning(f"Video {video_uid} processing timeout after {max_wait} seconds")
        return {
            'success': False,
            'error': f"Processing timeout after {max_wait} seconds"
        }
    
    def delete_video(self, video_uid: str) -> Dict:
        """
        Delete video from Cloudflare Stream
        
        Args:
            video_uid: Cloudflare Stream video UID
            
        Returns:
            Dict containing deletion result
        """
        try:
            response = requests.delete(
                f"{self.base_url}/{video_uid}",
                headers=self.headers
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('success'):
                logger.info(f"Successfully deleted video {video_uid}")
                return {'success': True}
            else:
                return {
                    'success': False,
                    'error': f"Failed to delete video: {data}"
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete video: {str(e)}")
            return {
                'success': False,
                'error': f"API request failed: {str(e)}"
            }
    
    def update_video_metadata(self, video_uid: str, metadata: Dict) -> Dict:
        """
        Update video metadata in Cloudflare Stream
        
        Args:
            video_uid: Cloudflare Stream video UID
            metadata: Dict containing metadata updates
            
        Returns:
            Dict containing update result
        """
        try:
            response = requests.post(
                f"{self.base_url}/{video_uid}",
                headers=self.headers,
                json={'meta': metadata}
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('success'):
                logger.info(f"Successfully updated metadata for video {video_uid}")
                return {
                    'success': True,
                    'result': data['result']
                }
            else:
                return {
                    'success': False,
                    'error': f"Failed to update metadata: {data}"
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update metadata: {str(e)}")
            return {
                'success': False,
                'error': f"API request failed: {str(e)}"
            }


# Convenience function for easy access
def get_cloudflare_service() -> CloudflareStreamService:
    """
    Get configured Cloudflare Stream service instance
    """
    return CloudflareStreamService()


class VideoUploadHandler:
    """
    Handler for processing video uploads and creating database records
    """
    
    def __init__(self):
        self.cf_service = get_cloudflare_service()
    
    def process_upload(self, video_file: BinaryIO, trailer_data: Dict) -> Tuple[bool, Dict]:
        """
        Process video upload and create TrailerMeta record
        
        Args:
            video_file: Video file to upload
            trailer_data: Dict containing trailer metadata
            
        Returns:
            Tuple of (success: bool, result: Dict)
        """
        try:
            # Upload to Cloudflare
            upload_result = self.cf_service.upload_video(
                video_file=video_file,
                metadata={
                    'name': trailer_data.get('title', 'Untitled'),
                    'description': trailer_data.get('description', ''),
                }
            )
            
            if not upload_result['success']:
                return False, {'error': upload_result['error']}
            
            video_uid = upload_result['video_uid']
            
            # Wait for initial processing
            logger.info(f"Waiting for video {video_uid} to process...")
            status = self.cf_service.wait_for_processing(video_uid, max_wait=60)
            
            if not status['success'] and 'timeout' not in status.get('error', '').lower():
                # Delete uploaded video if processing failed
                self.cf_service.delete_video(video_uid)
                return False, {'error': status['error']}
            
            # Generate thumbnail URL
            thumbnail_url = self.cf_service.get_thumbnail_url(video_uid)
            
            return True, {
                'video_uid': video_uid,
                'thumbnail_url': thumbnail_url,
                'stream_url': self.cf_service.get_stream_url(video_uid),
                'status': status.get('status', 'processing'),
                'ready': status.get('ready', False)
            }
            
        except Exception as e:
            logger.error(f"Failed to process video upload: {str(e)}")
            return False, {'error': str(e)}
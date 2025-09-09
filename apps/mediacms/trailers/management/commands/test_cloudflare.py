"""
Management command to test Cloudflare Stream integration
"""
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from trailers.services import get_cloudflare_service, CloudflareStreamService
import json


class Command(BaseCommand):
    help = 'Test Cloudflare Stream API integration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--video-uid',
            type=str,
            help='Test with a specific video UID'
        )
        parser.add_argument(
            '--check-config',
            action='store_true',
            help='Check configuration only'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Testing Cloudflare Stream Integration...')
        )

        # Check configuration
        try:
            cf_service = get_cloudflare_service()
            self.stdout.write('✓ Service initialized successfully')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Failed to initialize service: {str(e)}')
            )
            return

        # Check required settings
        account_id = getattr(settings, 'CLOUDFLARE_ACCOUNT_ID', None)
        api_token = getattr(settings, 'CLOUDFLARE_STREAM_API_TOKEN', None)
        customer_code = getattr(settings, 'CLOUDFLARE_STREAM_CUSTOMER_CODE', None)

        self.stdout.write('\nConfiguration:')
        self.stdout.write(f'  Account ID: {"✓ Set" if account_id else "✗ Missing"}')
        self.stdout.write(f'  API Token: {"✓ Set" if api_token else "✗ Missing"}')
        self.stdout.write(f'  Customer Code: {"✓ Set" if customer_code else "⚠ Optional"}')

        if options['check_config']:
            return

        # Test API connectivity
        if options['video_uid']:
            self.test_video_status(cf_service, options['video_uid'])
        else:
            self.stdout.write(
                self.style.WARNING('\nNo video UID provided. Use --video-uid to test a specific video.')
            )

        # Test URL generation
        if customer_code:
            test_uid = 'test-video-uid-12345'
            stream_url = cf_service.get_stream_url(test_uid)
            thumbnail_url = cf_service.get_thumbnail_url(test_uid)
            
            self.stdout.write('\nURL Generation Test:')
            self.stdout.write(f'  Stream URL: {stream_url}')
            self.stdout.write(f'  Thumbnail URL: {thumbnail_url}')

        self.stdout.write(
            self.style.SUCCESS('\nCloudflare integration test completed!')
        )

    def test_video_status(self, cf_service, video_uid):
        """Test video status API call"""
        self.stdout.write(f'\nTesting video status for: {video_uid}')
        
        try:
            result = cf_service.get_video_status(video_uid)
            
            if result['success']:
                self.stdout.write('✓ API call successful')
                self.stdout.write(f'  Status: {result["status"]}')
                self.stdout.write(f'  Ready: {result["ready"]}')
                
                if result.get('duration'):
                    self.stdout.write(f'  Duration: {result["duration"]}s')
                
                if result.get('size'):
                    self.stdout.write(f'  Size: {result["size"]} bytes')
                    
            else:
                self.stdout.write(
                    self.style.ERROR(f'✗ API call failed: {result["error"]}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Exception occurred: {str(e)}')
            )
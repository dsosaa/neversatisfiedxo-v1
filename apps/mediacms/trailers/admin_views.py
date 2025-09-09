"""
Custom admin views for Cloudflare Stream integration
"""
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.contrib import messages
from django.shortcuts import render, redirect
from django.urls import reverse
from django.conf import settings
from files.models import Media
from .models import TrailerMeta
from .services import get_cloudflare_service, VideoUploadHandler
from .forms import BulkUploadForm, VideoStatusForm, CloudflareSettingsForm
import json
import csv
import io
import logging

logger = logging.getLogger('trailers')


@staff_member_required
@require_http_methods(["POST"])
def upload_video(request):
    """
    Handle video upload to Cloudflare Stream
    """
    try:
        if 'video' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No video file provided'
            })
        
        video_file = request.FILES['video']
        
        # Validate file type
        valid_types = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
        if video_file.content_type not in valid_types:
            return JsonResponse({
                'success': False,
                'error': 'Invalid file type. Please upload MP4, MOV, AVI, or WebM'
            })
        
        # Validate file size (2GB max)
        max_size = 2 * 1024 * 1024 * 1024  # 2GB
        if video_file.size > max_size:
            return JsonResponse({
                'success': False,
                'error': 'File size must be less than 2GB'
            })
        
        # Upload to Cloudflare
        cf_service = get_cloudflare_service()
        upload_result = cf_service.upload_video(
            video_file=video_file,
            metadata={
                'name': video_file.name,
                'description': f'Uploaded from admin panel'
            }
        )
        
        if upload_result['success']:
            video_uid = upload_result['video_uid']
            
            return JsonResponse({
                'success': True,
                'video_uid': video_uid,
                'thumbnail_url': f"https://videodelivery.net/{video_uid}/thumbnails/thumbnail.jpg",
                'stream_url': f"https://iframe.videodelivery.net/{video_uid}",
                'message': 'Video uploaded successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': upload_result['error']
            })
            
    except Exception as e:
        logger.error(f"Video upload error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        })


@staff_member_required
@require_http_methods(["GET"])
def video_status(request, video_uid):
    """
    Check video processing status from Cloudflare
    """
    try:
        cf_service = get_cloudflare_service()
        status_result = cf_service.get_video_status(video_uid)
        
        if status_result['success']:
            return JsonResponse({
                'success': True,
                'status': status_result['status'],
                'duration': status_result.get('duration', 0),
                'ready': status_result['ready'],
                'thumbnail': status_result.get('thumbnail'),
                'size': status_result.get('size', 0)
            })
        else:
            return JsonResponse({
                'success': False,
                'error': status_result['error']
            })
            
    except Exception as e:
        logger.error(f"Video status check error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Status check failed: {str(e)}'
        })


@staff_member_required
@require_http_methods(["POST"])
def create_media(request):
    """
    Create MediaCMS Media object
    """
    try:
        title = request.POST.get('title', '').strip()
        description = request.POST.get('description', '').strip()
        
        if not title:
            return JsonResponse({
                'success': False,
                'error': 'Title is required'
            })
        
        # Create Media object
        media = Media.objects.create(
            title=title,
            description=description,
            media_type='video',
            user=request.user,
            state='public',  # Default state
            is_reviewed=True,  # Auto-approve admin uploads
        )
        
        logger.info(f"Created Media object {media.id}: {title}")
        
        return JsonResponse({
            'success': True,
            'media_id': media.id,
            'title': media.title,
            'message': 'Media object created successfully'
        })
        
    except Exception as e:
        logger.error(f"Media creation error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Media creation failed: {str(e)}'
        })


@staff_member_required
def bulk_upload(request):
    """
    Bulk upload CSV data with video processing
    """
    if request.method == 'POST':
        form = BulkUploadForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                csv_file = form.cleaned_data['csv_file']
                process_videos = form.cleaned_data['process_videos']
                update_existing = form.cleaned_data['update_existing']
                dry_run = form.cleaned_data['dry_run']
                
                # Process CSV
                csv_content = csv_file.read().decode('utf-8')
                csv_reader = csv.DictReader(io.StringIO(csv_content))
                
                results = []
                cf_service = get_cloudflare_service() if process_videos else None
                
                for row in csv_reader:
                    try:
                        video_number = int(row.get('Video Number', '0').replace('Video ', ''))
                        title = row.get('Description', '').strip()
                        video_uid = row.get('Video ID', '').strip()
                        thumb_uid = row.get('Thumbnail ID', '').strip()
                        price = row.get('Price', 'FREE').strip()
                        length = row.get('Length', '').strip()
                        creators = row.get('Creators', '').strip()
                        upload_status = row.get('Upload Status', 'Pending').strip()
                        
                        if not title or not video_uid:
                            results.append({
                                'video_number': video_number,
                                'status': 'skipped',
                                'message': 'Missing title or video UID'
                            })
                            continue
                        
                        # Check video status if requested
                        video_info = {}
                        if process_videos and cf_service:
                            status_result = cf_service.get_video_status(video_uid)
                            if status_result['success']:
                                video_info = {
                                    'cf_status': status_result['status'],
                                    'cf_ready': status_result['ready'],
                                    'cf_duration': status_result.get('duration', 0)
                                }
                        
                        if not dry_run:
                            # Create or update record
                            existing = None
                            if update_existing:
                                try:
                                    existing = TrailerMeta.objects.get(video_number=video_number)
                                except TrailerMeta.DoesNotExist:
                                    pass
                            
                            if existing:
                                # Update existing
                                existing.cf_video_uid = video_uid
                                existing.cf_thumb_uid = thumb_uid
                                existing.price = price
                                existing.length = length
                                existing.creators = creators
                                existing.upload_status = upload_status
                                existing.save()
                                
                                results.append({
                                    'video_number': video_number,
                                    'status': 'updated',
                                    'message': f'Updated existing record',
                                    **video_info
                                })
                            else:
                                # Create Media object
                                media = Media.objects.create(
                                    title=title,
                                    description=title,  # Use title as description
                                    media_type='video',
                                    user=request.user,
                                    state='public',
                                    is_reviewed=True,
                                )
                                
                                # Create TrailerMeta
                                trailer = TrailerMeta.objects.create(
                                    media=media,
                                    video_number=video_number,
                                    cf_video_uid=video_uid,
                                    cf_thumb_uid=thumb_uid,
                                    price=price,
                                    length=length,
                                    creators=creators,
                                    upload_status=upload_status
                                )
                                
                                results.append({
                                    'video_number': video_number,
                                    'status': 'created',
                                    'message': f'Created new record',
                                    **video_info
                                })
                        else:
                            results.append({
                                'video_number': video_number,
                                'status': 'preview',
                                'message': f'Would {"update" if update_existing and TrailerMeta.objects.filter(video_number=video_number).exists() else "create"} record',
                                **video_info
                            })
                            
                    except Exception as e:
                        results.append({
                            'video_number': row.get('Video Number', 'Unknown'),
                            'status': 'error',
                            'message': f'Error: {str(e)}'
                        })
                
                # Show results
                context = {
                    'form': form,
                    'results': results,
                    'dry_run': dry_run,
                    'total_processed': len(results)
                }
                
                if not dry_run:
                    messages.success(request, f'Processed {len(results)} records')
                
                return render(request, 'admin/trailers/bulk_upload.html', context)
                
            except Exception as e:
                messages.error(request, f'Bulk upload failed: {str(e)}')
    else:
        form = BulkUploadForm()
    
    return render(request, 'admin/trailers/bulk_upload.html', {'form': form})


@staff_member_required
def video_status_check(request):
    """
    Check video status for multiple videos
    """
    if request.method == 'POST':
        form = VideoStatusForm(request.POST)
        if form.is_valid():
            video_uid = form.cleaned_data['video_uid']
            
            try:
                cf_service = get_cloudflare_service()
                status_result = cf_service.get_video_status(video_uid)
                
                context = {
                    'form': form,
                    'video_uid': video_uid,
                    'status_result': status_result
                }
                
                return render(request, 'admin/trailers/video_status_check.html', context)
                
            except Exception as e:
                messages.error(request, f'Status check failed: {str(e)}')
    else:
        form = VideoStatusForm()
    
    return render(request, 'admin/trailers/video_status_check.html', {'form': form})


@staff_member_required
def cloudflare_settings(request):
    """
    Configure Cloudflare Stream settings
    """
    if request.method == 'POST':
        form = CloudflareSettingsForm(request.POST)
        if form.is_valid():
            # In a real implementation, you'd save these to database or settings
            messages.success(request, 'Cloudflare settings updated successfully')
            return redirect('admin:trailers_trailermeta_changelist')
    else:
        # Load current settings
        form = CloudflareSettingsForm(initial={
            'account_id': getattr(settings, 'CLOUDFLARE_ACCOUNT_ID', ''),
            'customer_code': getattr(settings, 'CLOUDFLARE_STREAM_CUSTOMER_CODE', ''),
        })
    
    return render(request, 'admin/trailers/cloudflare_settings.html', {'form': form})


@staff_member_required
def trailer_dashboard(request):
    """
    Admin dashboard with trailer statistics
    """
    try:
        # Get statistics
        total_trailers = TrailerMeta.objects.count()
        completed_trailers = TrailerMeta.objects.filter(upload_status='Complete').count()
        featured_trailers = TrailerMeta.objects.filter(is_featured=True).count()
        premium_trailers = TrailerMeta.objects.filter(is_premium=True).count()
        
        # Recent uploads
        recent_trailers = TrailerMeta.objects.order_by('-created_at')[:10]
        
        # Status distribution
        status_counts = {}
        for status, _ in TrailerMeta.UPLOAD_STATUS_CHOICES:
            count = TrailerMeta.objects.filter(upload_status=status).count()
            status_counts[status] = count
        
        context = {
            'total_trailers': total_trailers,
            'completed_trailers': completed_trailers,
            'featured_trailers': featured_trailers,
            'premium_trailers': premium_trailers,
            'recent_trailers': recent_trailers,
            'status_counts': status_counts,
            'completion_rate': (completed_trailers / total_trailers * 100) if total_trailers > 0 else 0,
        }
        
        return render(request, 'admin/trailers/dashboard.html', context)
        
    except Exception as e:
        messages.error(request, f'Dashboard error: {str(e)}')
        return redirect('admin:index')
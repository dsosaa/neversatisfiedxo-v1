"""
Custom admin widgets for Cloudflare Stream integration
"""

import json

from django import forms
from django.conf import settings
from django.urls import reverse
from django.utils.safestring import mark_safe

class CloudflareVideoUploadWidget(forms.ClearableFileInput):
    """
    Custom widget for uploading videos directly to Cloudflare Stream
    """

    template_name = "admin/trailers/cloudflare_video_upload.html"

    def __init__(self, attrs=None):
        default_attrs = {
            "accept": "video/*",
            "class": "cloudflare-video-upload",
            "data-upload-url": (
                reverse("admin:trailers_upload_video")
                if hasattr(forms, "reverse")
                else "/admin/trailers/upload-video/"
            ),
        }
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    def render(self, name, value, attrs=None, renderer=None):
        """Render the upload widget with drag-and-drop functionality"""
        widget_html = super().render(name, value, attrs, renderer)

        # Get current video UID if exists
        current_uid = value if isinstance(value, str) else ""

        return mark_safe(
            f"""
        <div class="cloudflare-upload-container">
            <div class="current-video" style="{'display: block' if current_uid else 'display: none'}">
                <div class="video-info">
                    <strong>Current Video UID:</strong> <span class="video-uid">{current_uid}</span>
                    {f'<br><a href="https://iframe.videodelivery.net/{current_uid}" target="_blank">Preview Video</a>' if current_uid else ''}
                    {f'<br><img src="https://videodelivery.net/{current_uid}/thumbnails/thumbnail.jpg" width="120" height="68" style="border-radius: 4px; margin-top: 8px;" />' if current_uid else ''}
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="clearVideo(this)">Remove Video</button>
            </div>

            <div class="upload-area" style="{'display: none' if current_uid else 'display: block'}">
                <div class="drag-drop-area" ondrop="dropHandler(event)" ondragover="dragOverHandler(event)" ondragenter="dragEnterHandler(event)" ondragleave="dragLeaveHandler(event)">
                    <div class="upload-content">
                        <div class="upload-icon">📹</div>
                        <p><strong>Drop video file here or click to browse</strong></p>
                        <p class="text-muted">Supports MP4, MOV, AVI, WebM (Max: 2GB)</p>
                        {widget_html}
                    </div>
                    <div class="upload-progress" style="display: none;">
                        <div class="progress-bar"></div>
                        <div class="progress-text">Uploading...</div>
                    </div>
                </div>
            </div>

            <input type="hidden" name="{name}_uid" class="video-uid-input" value="{current_uid}" />
        </div>

        <style>
        .cloudflare-upload-container {{
            margin: 10px 0;
        }}

        .drag-drop-area {{
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 40px 20px;
            text-align: center;
            background-color: #fafafa;
            transition: all 0.3s ease;
            position: relative;
            min-height: 200px;
        }}

        .drag-drop-area.drag-over {{
            border-color: #007cba;
            background-color: #f0f8ff;
        }}

        .upload-content {{
            pointer-events: none;
        }}

        .upload-content input[type="file"] {{
            opacity: 0;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
            pointer-events: all;
        }}

        .upload-icon {{
            font-size: 48px;
            margin-bottom: 16px;
        }}

        .upload-progress {{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
        }}

        .progress-bar {{
            height: 20px;
            background-color: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
        }}

        .progress-bar::after {{
            content: '';
            display: block;
            height: 100%;
            background-color: #007cba;
            width: 0%;
            transition: width 0.3s ease;
        }}

        .current-video {{
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f9f9f9;
            margin-bottom: 15px;
        }}

        .video-info {{
            margin-bottom: 10px;
        }}
        </style>

        <script>
        function dragOverHandler(ev) {{
            ev.preventDefault();
            ev.currentTarget.classList.add('drag-over');
        }}

        function dragEnterHandler(ev) {{
            ev.preventDefault();
            ev.currentTarget.classList.add('drag-over');
        }}

        function dragLeaveHandler(ev) {{
            ev.preventDefault();
            ev.currentTarget.classList.remove('drag-over');
        }}

        function dropHandler(ev) {{
            ev.preventDefault();
            ev.currentTarget.classList.remove('drag-over');

            const files = ev.dataTransfer.files;
            if (files.length > 0) {{
                const fileInput = ev.currentTarget.querySelector('input[type="file"]');
                fileInput.files = files;
                uploadVideo(fileInput);
            }}
        }}

        function uploadVideo(fileInput) {{
            const file = fileInput.files[0];
            if (!file) return;

            // Validate file type
            const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'];
            if (!validTypes.includes(file.type)) {{
                alert('Please select a valid video file (MP4, MOV, AVI, WebM)');
                return;
            }}

            // Validate file size (2GB max)
            const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
            if (file.size > maxSize) {{
                alert('File size must be less than 2GB');
                return;
            }}

            const container = fileInput.closest('.cloudflare-upload-container');
            const uploadArea = container.querySelector('.upload-area');
            const uploadContent = container.querySelector('.upload-content');
            const uploadProgress = container.querySelector('.upload-progress');
            const progressBar = container.querySelector('.progress-bar');
            const progressText = container.querySelector('.progress-text');

            // Show progress
            uploadContent.style.display = 'none';
            uploadProgress.style.display = 'block';

            // Create FormData
            const formData = new FormData();
            formData.append('video', file);
            formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

            // Upload to server
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', function(e) {{
                if (e.lengthComputable) {{
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressBar.style.setProperty('--progress', percentComplete + '%');
                    progressText.textContent = `Uploading... ${{Math.round(percentComplete)}}%`;
                }}
            }});

            xhr.onload = function() {{
                if (xhr.status === 200) {{
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {{
                        // Update UI with video info
                        const currentVideo = container.querySelector('.current-video');
                        const videoUidSpan = currentVideo.querySelector('.video-uid');
                        const videoUidInput = container.querySelector('.video-uid-input');

                        videoUidSpan.textContent = response.video_uid;
                        videoUidInput.value = response.video_uid;

                        // Update preview
                        const videoInfo = currentVideo.querySelector('.video-info');
                        videoInfo.innerHTML = `
                            <strong>Current Video UID:</strong> <span class="video-uid">${{response.video_uid}}</span>
                            <br><a href="https://iframe.videodelivery.net/${{response.video_uid}}" target="_blank">Preview Video</a>
                            <br><img src="https://videodelivery.net/${{response.video_uid}}/thumbnails/thumbnail.jpg" width="120" height="68" style="border-radius: 4px; margin-top: 8px;" />
                        `;

                        // Show current video, hide upload area
                        currentVideo.style.display = 'block';
                        uploadArea.style.display = 'none';

                        alert('Video uploaded successfully!');
                    }} else {{
                        alert('Upload failed: ' + response.error);
                        // Reset upload area
                        uploadContent.style.display = 'block';
                        uploadProgress.style.display = 'none';
                    }}
                }} else {{
                    alert('Upload failed: Server error');
                    // Reset upload area
                    uploadContent.style.display = 'block';
                    uploadProgress.style.display = 'none';
                }}
            }};

            xhr.onerror = function() {{
                alert('Upload failed: Network error');
                // Reset upload area
                uploadContent.style.display = 'block';
                uploadProgress.style.display = 'none';
            }};

            xhr.open('POST', '/admin/trailers/upload-video/');
            xhr.send(formData);
        }}

        function clearVideo(button) {{
            const container = button.closest('.cloudflare-upload-container');
            const currentVideo = container.querySelector('.current-video');
            const uploadArea = container.querySelector('.upload-area');
            const videoUidInput = container.querySelector('.video-uid-input');

            // Clear UID
            videoUidInput.value = '';

            // Show upload area, hide current video
            currentVideo.style.display = 'none';
            uploadArea.style.display = 'block';
        }}

        // Handle file input change
        document.addEventListener('change', function(e) {{
            if (e.target.classList.contains('cloudflare-video-upload')) {{
                uploadVideo(e.target);
            }}
        }});
        </script>
        """
        )

class VideoStatusWidget(forms.Widget):
    """
    Widget to display video processing status from Cloudflare
    """

    def __init__(self, attrs=None):
        default_attrs = {"readonly": True}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    def render(self, name, value, attrs=None, renderer=None):
        """Render status display with refresh button"""
        if not value:
            return mark_safe("<em>No video UID</em>")

        return mark_safe(
            f"""
        <div class="video-status-container">
            <div class="status-display">
                <span class="status-value">Loading...</span>
                <button type="button" class="btn btn-sm btn-outline-primary refresh-status" data-video-uid="{value}">
                    Refresh Status
                </button>
            </div>
        </div>

        <script>
        function refreshVideoStatus(videoUid, button) {{
            const statusDisplay = button.parentNode.querySelector('.status-value');
            button.disabled = true;
            button.textContent = 'Loading...';

            fetch('/admin/trailers/video-status/' + videoUid + '/')
                .then(response => response.json())
                .then(data => {{
                    if (data.success) {{
                        const status = data.status;
                        const ready = data.ready;
                        let statusHtml = `Status: <strong>${{status}}</strong>`;

                        if (ready) {{
                            statusHtml += ' <span style="color: green;">✓ Ready</span>';
                        }} else if (status === 'error') {{
                            statusHtml += ' <span style="color: red;">✗ Error</span>';
                        }} else {{
                            statusHtml += ' <span style="color: orange;">⏳ Processing</span>';
                        }}

                        if (data.duration) {{
                            statusHtml += `<br>Duration: ${{Math.round(data.duration)}}s`;
                        }}

                        statusDisplay.innerHTML = statusHtml;
                    }} else {{
                        statusDisplay.innerHTML = 'Error: ' + data.error;
                    }}
                }})
                .catch(error => {{
                    statusDisplay.innerHTML = 'Error: ' + error.message;
                }})
                .finally(() => {{
                    button.disabled = false;
                    button.textContent = 'Refresh Status';
                }});
        }}

        document.addEventListener('click', function(e) {{
            if (e.target.classList.contains('refresh-status')) {{
                const videoUid = e.target.dataset.videoUid;
                refreshVideoStatus(videoUid, e.target);
            }}
        }});

        // Auto-refresh status on page load
        document.addEventListener('DOMContentLoaded', function() {{
            const refreshButtons = document.querySelectorAll('.refresh-status');
            refreshButtons.forEach(button => {{
                const videoUid = button.dataset.videoUid;
                if (videoUid) {{
                    refreshVideoStatus(videoUid, button);
                }}
            }});
        }});
        </script>
        """
        )

class MediaCreationWidget(forms.Widget):
    """
    Widget to create MediaCMS Media objects inline
    """

    template_name = "admin/trailers/media_creation_widget.html"

    def render(self, name, value, attrs=None, renderer=None):
        """Render media creation form"""
        return mark_safe(
            f"""
        <div class="media-creation-widget">
            <div class="existing-media" style="{'display: block' if value else 'display: none'}">
                <strong>Linked Media ID:</strong> <span class="media-id">{value or ''}</span>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="unlinkMedia(this)">Unlink</button>
            </div>

            <div class="create-media" style="{'display: none' if value else 'display: block'}">
                <h4>Create New Media Object</h4>
                <div class="form-group">
                    <label>Title:</label>
                    <input type="text" class="form-control media-title" placeholder="Enter video title">
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea class="form-control media-description" rows="3" placeholder="Enter video description"></textarea>
                </div>
                <button type="button" class="btn btn-primary" onclick="createMedia(this)">Create Media Object</button>
            </div>

            <input type="hidden" name="{name}" class="media-id-input" value="{value or ''}" />
        </div>

        <script>
        function createMedia(button) {{
            const widget = button.closest('.media-creation-widget');
            const title = widget.querySelector('.media-title').value;
            const description = widget.querySelector('.media-description').value;

            if (!title.trim()) {{
                alert('Please enter a title');
                return;
            }}

            button.disabled = true;
            button.textContent = 'Creating...';

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

            fetch('/admin/trailers/create-media/', {{
                method: 'POST',
                body: formData
            }})
            .then(response => response.json())
            .then(data => {{
                if (data.success) {{
                    // Update UI
                    const existingMedia = widget.querySelector('.existing-media');
                    const createMedia = widget.querySelector('.create-media');
                    const mediaIdSpan = existingMedia.querySelector('.media-id');
                    const mediaIdInput = widget.querySelector('.media-id-input');

                    mediaIdSpan.textContent = data.media_id;
                    mediaIdInput.value = data.media_id;

                    existingMedia.style.display = 'block';
                    createMedia.style.display = 'none';

                    alert('Media object created successfully!');
                }} else {{
                    alert('Failed to create media: ' + data.error);
                }}
            }})
            .catch(error => {{
                alert('Error: ' + error.message);
            }})
            .finally(() => {{
                button.disabled = false;
                button.textContent = 'Create Media Object';
            }});
        }}

        function unlinkMedia(button) {{
            const widget = button.closest('.media-creation-widget');
            const existingMedia = widget.querySelector('.existing-media');
            const createMedia = widget.querySelector('.create-media');
            const mediaIdInput = widget.querySelector('.media-id-input');

            mediaIdInput.value = '';
            existingMedia.style.display = 'none';
            createMedia.style.display = 'block';

            // Clear form
            widget.querySelector('.media-title').value = '';
            widget.querySelector('.media-description').value = '';
        }}
        </script>
        """
        )

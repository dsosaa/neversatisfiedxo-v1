-- Database optimization script for PostgreSQL
-- This script creates indexes to improve query performance

-- Connect to the database
\c mediacms;

-- Create indexes for common queries
-- Index on video title for search performance
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos_video(title);
CREATE INDEX IF NOT EXISTS idx_videos_title_trgm ON videos_video USING gin(title gin_trgm_ops);

-- Index on video creation date for sorting
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos_video(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_created_at_desc ON videos_video(created_at DESC);

-- Index on video duration for filtering
CREATE INDEX IF NOT EXISTS idx_videos_duration ON videos_video(duration);

-- Index on video status for filtering
CREATE INDEX IF NOT EXISTS idx_videos_state ON videos_video(state);

-- Index on video category for filtering
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos_video(category_id);

-- Index on video tags for filtering
CREATE INDEX IF NOT EXISTS idx_videos_tags ON videos_video USING gin(tags);

-- Index on video file size for filtering
CREATE INDEX IF NOT EXISTS idx_videos_file_size ON videos_video(file_size);

-- Index on video views for popularity sorting
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos_video(views);

-- Index on video likes for popularity sorting
CREATE INDEX IF NOT EXISTS idx_videos_likes ON videos_video(likes);

-- Index on video dislikes for popularity sorting
CREATE INDEX IF NOT EXISTS idx_videos_dislikes ON videos_video(dislikes);

-- Composite indexes for common query patterns
-- Title and creation date for search with sorting
CREATE INDEX IF NOT EXISTS idx_videos_title_created ON videos_video(title, created_at DESC);

-- State and creation date for active videos with sorting
CREATE INDEX IF NOT EXISTS idx_videos_state_created ON videos_video(state, created_at DESC);

-- Category and creation date for category pages with sorting
CREATE INDEX IF NOT EXISTS idx_videos_category_created ON videos_video(category_id, created_at DESC);

-- Duration and creation date for duration filtering with sorting
CREATE INDEX IF NOT EXISTS idx_videos_duration_created ON videos_video(duration, created_at DESC);

-- Views and creation date for popularity sorting
CREATE INDEX IF NOT EXISTS idx_videos_views_created ON videos_video(views DESC, created_at DESC);

-- Index on user uploads for user-specific queries
CREATE INDEX IF NOT EXISTS idx_videos_user_created ON videos_video(user_id, created_at DESC);

-- Index on video encoding status for processing queries
CREATE INDEX IF NOT EXISTS idx_videos_encoding_status ON videos_video(encoding_status);

-- Index on video file path for file operations
CREATE INDEX IF NOT EXISTS idx_videos_file_path ON videos_video(file);

-- Index on video thumbnail path for thumbnail operations
CREATE INDEX IF NOT EXISTS idx_videos_thumbnail ON videos_video(thumbnail);

-- Index on video poster path for poster operations
CREATE INDEX IF NOT EXISTS idx_videos_poster ON videos_video(poster);

-- Index on video subtitles for subtitle queries
CREATE INDEX IF NOT EXISTS idx_videos_subtitles ON videos_video USING gin(subtitles);

-- Index on video metadata for metadata queries
CREATE INDEX IF NOT EXISTS idx_videos_metadata ON videos_video USING gin(metadata);

-- Index on video description for search
CREATE INDEX IF NOT EXISTS idx_videos_description ON videos_video USING gin(description gin_trgm_ops);

-- Index on video slug for URL lookups
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos_video(slug);

-- Index on video UID for external references
CREATE INDEX IF NOT EXISTS idx_videos_uid ON videos_video(uid);

-- Index on video external ID for external system integration
CREATE INDEX IF NOT EXISTS idx_videos_external_id ON videos_video(external_id);

-- Index on video external URL for external references
CREATE INDEX IF NOT EXISTS idx_videos_external_url ON videos_video(external_url);

-- Index on video license for licensing queries
CREATE INDEX IF NOT EXISTS idx_videos_license ON videos_video(license);

-- Index on video language for language filtering
CREATE INDEX IF NOT EXISTS idx_videos_language ON videos_video(language);

-- Index on video country for country filtering
CREATE INDEX IF NOT EXISTS idx_videos_country ON videos_video(country);

-- Index on video age restriction for content filtering
CREATE INDEX IF NOT EXISTS idx_videos_age_restriction ON videos_video(age_restriction);

-- Index on video privacy for privacy filtering
CREATE INDEX IF NOT EXISTS idx_videos_privacy ON videos_video(privacy);

-- Index on video featured status for featured content
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos_video(featured);

-- Index on video published status for published content
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos_video(published);

-- Index on video scheduled publication
CREATE INDEX IF NOT EXISTS idx_videos_scheduled_at ON videos_video(scheduled_at);

-- Index on video last modified for update tracking
CREATE INDEX IF NOT EXISTS idx_videos_updated_at ON videos_video(updated_at);

-- Index on video last accessed for access tracking
CREATE INDEX IF NOT EXISTS idx_videos_last_accessed ON videos_video(last_accessed);

-- Index on video download count for download tracking
CREATE INDEX IF NOT EXISTS idx_videos_downloads ON videos_video(downloads);

-- Index on video share count for sharing tracking
CREATE INDEX IF NOT EXISTS idx_videos_shares ON videos_video(shares);

-- Index on video comment count for comment tracking
CREATE INDEX IF NOT EXISTS idx_videos_comments ON videos_video(comments);

-- Index on video rating for rating queries
CREATE INDEX IF NOT EXISTS idx_videos_rating ON videos_video(rating);

-- Index on video quality for quality filtering
CREATE INDEX IF NOT EXISTS idx_videos_quality ON videos_video(quality);

-- Index on video resolution for resolution filtering
CREATE INDEX IF NOT EXISTS idx_videos_resolution ON videos_video(resolution);

-- Index on video bitrate for bitrate filtering
CREATE INDEX IF NOT EXISTS idx_videos_bitrate ON videos_video(bitrate);

-- Index on video framerate for framerate filtering
CREATE INDEX IF NOT EXISTS idx_videos_framerate ON videos_video(framerate);

-- Index on video codec for codec filtering
CREATE INDEX IF NOT EXISTS idx_videos_codec ON videos_video(codec);

-- Index on video container for container filtering
CREATE INDEX IF NOT EXISTS idx_videos_container ON videos_video(container);

-- Index on video audio codec for audio filtering
CREATE INDEX IF NOT EXISTS idx_videos_audio_codec ON videos_video(audio_codec);

-- Index on video audio bitrate for audio filtering
CREATE INDEX IF NOT EXISTS idx_videos_audio_bitrate ON videos_video(audio_bitrate);

-- Index on video audio channels for audio filtering
CREATE INDEX IF NOT EXISTS idx_videos_audio_channels ON videos_video(audio_channels);

-- Index on video audio sample rate for audio filtering
CREATE INDEX IF NOT EXISTS idx_videos_audio_sample_rate ON videos_video(audio_sample_rate);

-- Index on video aspect ratio for aspect ratio filtering
CREATE INDEX IF NOT EXISTS idx_videos_aspect_ratio ON videos_video(aspect_ratio);

-- Index on video orientation for orientation filtering
CREATE INDEX IF NOT EXISTS idx_videos_orientation ON videos_video(orientation);

-- Index on video color space for color space filtering
CREATE INDEX IF NOT EXISTS idx_videos_color_space ON videos_video(color_space);

-- Index on video color depth for color depth filtering
CREATE INDEX IF NOT EXISTS idx_videos_color_depth ON videos_video(color_depth);

-- Index on video HDR for HDR filtering
CREATE INDEX IF NOT EXISTS idx_videos_hdr ON videos_video(hdr);

-- Index on video 3D for 3D filtering
CREATE INDEX IF NOT EXISTS idx_videos_3d ON videos_video(is_3d);

-- Index on video VR for VR filtering
CREATE INDEX IF NOT EXISTS idx_videos_vr ON videos_video(is_vr);

-- Index on video live for live filtering
CREATE INDEX IF NOT EXISTS idx_videos_live ON videos_video(is_live);

-- Index on video stream for stream filtering
CREATE INDEX IF NOT EXISTS idx_videos_stream ON videos_video(is_stream);

-- Index on video podcast for podcast filtering
CREATE INDEX IF NOT EXISTS idx_videos_podcast ON videos_video(is_podcast);

-- Index on video music for music filtering
CREATE INDEX IF NOT EXISTS idx_videos_music ON videos_video(is_music);

-- Index on video movie for movie filtering
CREATE INDEX IF NOT EXISTS idx_videos_movie ON videos_video(is_movie);

-- Index on video TV show for TV show filtering
CREATE INDEX IF NOT EXISTS idx_videos_tv_show ON videos_video(is_tv_show);

-- Index on video documentary for documentary filtering
CREATE INDEX IF NOT EXISTS idx_videos_documentary ON videos_video(is_documentary);

-- Index on video tutorial for tutorial filtering
CREATE INDEX IF NOT EXISTS idx_videos_tutorial ON videos_video(is_tutorial);

-- Index on video educational for educational filtering
CREATE INDEX IF NOT EXISTS idx_videos_educational ON videos_video(is_educational);

-- Index on video entertainment for entertainment filtering
CREATE INDEX IF NOT EXISTS idx_videos_entertainment ON videos_video(is_entertainment);

-- Index on video news for news filtering
CREATE INDEX IF NOT EXISTS idx_videos_news ON videos_video(is_news);

-- Index on video sports for sports filtering
CREATE INDEX IF NOT EXISTS idx_videos_sports ON videos_video(is_sports);

-- Index on video gaming for gaming filtering
CREATE INDEX IF NOT EXISTS idx_videos_gaming ON videos_video(is_gaming);

-- Index on video technology for technology filtering
CREATE INDEX IF NOT EXISTS idx_videos_technology ON videos_video(is_technology);

-- Index on video science for science filtering
CREATE INDEX IF NOT EXISTS idx_videos_science ON videos_video(is_science);

-- Index on video art for art filtering
CREATE INDEX IF NOT EXISTS idx_videos_art ON videos_video(is_art);

-- Index on video music for music filtering
CREATE INDEX IF NOT EXISTS idx_videos_music ON videos_video(is_music);

-- Index on video comedy for comedy filtering
CREATE INDEX IF NOT EXISTS idx_videos_comedy ON videos_video(is_comedy);

-- Index on video drama for drama filtering
CREATE INDEX IF NOT EXISTS idx_videos_drama ON videos_video(is_drama);

-- Index on video action for action filtering
CREATE INDEX IF NOT EXISTS idx_videos_action ON videos_video(is_action);

-- Index on video horror for horror filtering
CREATE INDEX IF NOT EXISTS idx_videos_horror ON videos_video(is_horror);

-- Index on video romance for romance filtering
CREATE INDEX IF NOT EXISTS idx_videos_romance ON videos_video(is_romance);

-- Index on video thriller for thriller filtering
CREATE INDEX IF NOT EXISTS idx_videos_thriller ON videos_video(is_thriller);

-- Index on video mystery for mystery filtering
CREATE INDEX IF NOT EXISTS idx_videos_mystery ON videos_video(is_mystery);

-- Index on video fantasy for fantasy filtering
CREATE INDEX IF NOT EXISTS idx_videos_fantasy ON videos_video(is_fantasy);

-- Index on video sci_fi for sci-fi filtering
CREATE INDEX IF NOT EXISTS idx_videos_sci_fi ON videos_video(is_sci_fi);

-- Index on video western for western filtering
CREATE INDEX IF NOT EXISTS idx_videos_western ON videos_video(is_western);

-- Index on video war for war filtering
CREATE INDEX IF NOT EXISTS idx_videos_war ON videos_video(is_war);

-- Index on video crime for crime filtering
CREATE INDEX IF NOT EXISTS idx_videos_crime ON videos_video(is_crime);

-- Index on video adventure for adventure filtering
CREATE INDEX IF NOT EXISTS idx_videos_adventure ON videos_video(is_adventure);

-- Index on video family for family filtering
CREATE INDEX IF NOT EXISTS idx_videos_family ON videos_video(is_family);

-- Index on video animation for animation filtering
CREATE INDEX IF NOT EXISTS idx_videos_animation ON videos_video(is_animation);

-- Index on video documentary for documentary filtering
CREATE INDEX IF NOT EXISTS idx_videos_documentary ON videos_video(is_documentary);

-- Index on video biography for biography filtering
CREATE INDEX IF NOT EXISTS idx_videos_biography ON videos_video(is_biography);

-- Index on video history for history filtering
CREATE INDEX IF NOT EXISTS idx_videos_history ON videos_video(is_history);

-- Index on video music for music filtering
CREATE INDEX IF NOT EXISTS idx_videos_music ON videos_video(is_music);

-- Index on video musical for musical filtering
CREATE INDEX IF NOT EXISTS idx_videos_musical ON videos_video(is_musical);

-- Index on video romance for romance filtering
CREATE INDEX IF NOT EXISTS idx_videos_romance ON videos_video(is_romance);

-- Index on video sport for sport filtering
CREATE INDEX IF NOT EXISTS idx_videos_sport ON videos_video(is_sport);

-- Index on video thriller for thriller filtering
CREATE INDEX IF NOT EXISTS idx_videos_thriller ON videos_video(is_thriller);

-- Index on video war for war filtering
CREATE INDEX IF NOT EXISTS idx_videos_war ON videos_video(is_war);

-- Index on video western for western filtering
CREATE INDEX IF NOT EXISTS idx_videos_western ON videos_video(is_western);

-- Update table statistics for better query planning
ANALYZE videos_video;

-- Show index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'videos_video'
ORDER BY idx_scan DESC;

-- Show table size and index size
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename = 'videos_video';

/**
 * Optimized Video Player Component for Cloudflare Stream
 * Implements performance best practices for video delivery
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoId: string;
  customerCode?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  className?: string;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (error: Error) => void;
  clientBandwidthHint?: number; // In bits per second
  quality?: 'auto' | '1080p' | '720p' | '480p' | '360p';
}

export function VideoPlayer({
  videoId,
  customerCode = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE,
  poster,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  preload = 'metadata', // Optimized default
  className,
  onLoadStart,
  onCanPlay,
  onError,
  clientBandwidthHint = 5000000, // 5 Mbps default
  quality = 'auto',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Generate optimized manifest URL with bandwidth hint
  const getManifestUrl = useCallback(() => {
    if (!customerCode || !videoId) return '';
    
    const baseUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
    const params = new URLSearchParams();
    
    // Add client bandwidth hint for adaptive bitrate
    if (clientBandwidthHint) {
      params.append('clientBandwidthHint', Math.round(clientBandwidthHint / 1000000).toString());
    }
    
    // Add quality hint if specified
    if (quality !== 'auto') {
      params.append('quality', quality);
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }, [customerCode, videoId, clientBandwidthHint, quality]);

  // Generate optimized poster URL
  const getPosterUrl = useCallback(() => {
    if (poster) return poster;
    if (!customerCode || !videoId) return undefined;
    
    // Use Cloudflare Stream thumbnail with optimization
    return `https://customer-${customerCode}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=0s&height=600&fit=crop`;
  }, [poster, customerCode, videoId]);

  // Handle video loading events
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    onCanPlay?.();
  }, [onCanPlay]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const error = new Error('Video failed to load');
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
    console.error('Video error:', e);
  }, [onError]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // Preload video manifest for faster startup
  useEffect(() => {
    const manifestUrl = getManifestUrl();
    if (manifestUrl && preload !== 'none') {
      // Prefetch manifest for faster loading
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = manifestUrl;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [getManifestUrl, preload]);

  // Performance monitoring
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(0);
        const progress = (buffered / video.duration) * 100;
        // Could emit buffering progress events here
        console.debug(`Video buffered: ${Math.round(progress)}%`);
      }
    };

    video.addEventListener('progress', handleProgress);
    return () => video.removeEventListener('progress', handleProgress);
  }, []);

  const manifestUrl = getManifestUrl();
  const posterUrl = getPosterUrl();

  if (!customerCode || !videoId) {
    return (
      <div className={cn("aspect-video bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground">Video configuration missing</p>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <video
        ref={videoRef}
        src={manifestUrl}
        poster={posterUrl}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        preload={preload}
        playsInline // Better mobile experience
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-cover"
        // Performance optimizations
        crossOrigin="anonymous"
        // Accessibility
        aria-label={`Video player for ${videoId}`}
      />
      
      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white p-4 text-center">
          <div>
            <p className="font-medium">Failed to load video</p>
            <p className="text-sm text-gray-300 mt-1">Please check your connection and try again</p>
          </div>
        </div>
      )}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
          {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
        </div>
      )}
    </div>
  );
}

// Hook for video performance metrics
export function useVideoPerformance(videoRef: React.RefObject<HTMLVideoElement>) {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    bufferingEvents: 0,
    qualityChanges: 0,
    stallTime: 0,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startTime = performance.now();
    let stallStartTime = 0;
    let totalStallTime = 0;

    const handleLoadedData = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, loadTime }));
    };

    const handleWaiting = () => {
      stallStartTime = performance.now();
      setMetrics(prev => ({ ...prev, bufferingEvents: prev.bufferingEvents + 1 }));
    };

    const handlePlaying = () => {
      if (stallStartTime > 0) {
        totalStallTime += performance.now() - stallStartTime;
        setMetrics(prev => ({ ...prev, stallTime: totalStallTime }));
        stallStartTime = 0;
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [videoRef]);

  return metrics;
}
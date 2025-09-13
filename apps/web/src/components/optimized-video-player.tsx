/**
 * Optimized Video Player Component for Cloudflare Stream
 * Implements advanced performance optimizations and Cloudflare-specific features
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedVideoPlayerProps {
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
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  // Performance optimization props
  clientBandwidthHint?: number; // In bits per second
  quality?: 'auto' | '1080p' | '720p' | '480p' | '360p';
  enableAdaptiveBitrate?: boolean;
  enablePreloading?: boolean;
  enableAnalytics?: boolean;
  // Cloudflare-specific optimizations
  enableCloudflareOptimizations?: boolean;
  cacheStrategy?: 'aggressive' | 'balanced' | 'conservative';
}

interface VideoMetrics {
  loadTime: number;
  bufferingEvents: number;
  qualityChanges: number;
  stallTime: number;
  averageBitrate: number;
  peakBitrate: number;
  droppedFrames: number;
}

export function OptimizedVideoPlayer({
  videoId,
  customerCode = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE,
  poster,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  preload = 'metadata',
  className,
  onLoadStart,
  onCanPlay,
  onError,
  onPlay,
  onPause,
  onEnded,
  clientBandwidthHint = 5000000, // 5 Mbps default
  quality = 'auto',
  enableAdaptiveBitrate = true,
  enablePreloading = true,
  enableAnalytics = false, // Disable heavy analytics by default
  enableCloudflareOptimizations = true,
  cacheStrategy = 'balanced',
}: OptimizedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [, setIsPlaying] = useState(false);
  const [metrics, setMetrics] = useState<VideoMetrics>({
    loadTime: 0,
    bufferingEvents: 0,
    qualityChanges: 0,
    stallTime: 0,
    averageBitrate: 0,
    peakBitrate: 0,
    droppedFrames: 0,
  });

  // Generate optimized manifest URL with Cloudflare-specific optimizations
  const getManifestUrl = useCallback(() => {
    if (!customerCode || !videoId) return '';
    
    const baseUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
    const params = new URLSearchParams();
    
    // Add client bandwidth hint for adaptive bitrate
    if (clientBandwidthHint && enableAdaptiveBitrate) {
      params.append('clientBandwidthHint', Math.round(clientBandwidthHint / 1000000).toString());
    }
    
    // Add quality hint if specified
    if (quality !== 'auto') {
      params.append('quality', quality);
    }
    
    // Cloudflare-specific optimizations
    if (enableCloudflareOptimizations) {
      // Enable Cloudflare's edge optimizations
      params.append('cf-edge-cache', 'on');
      params.append('cf-compression', 'on');
      
      // Cache strategy
      switch (cacheStrategy) {
        case 'aggressive':
          params.append('cf-cache-level', 'cache_everything');
          params.append('cf-edge-ttl', '86400'); // 24 hours
          break;
        case 'balanced':
          params.append('cf-cache-level', 'bypass_cache');
          params.append('cf-edge-ttl', '3600'); // 1 hour
          break;
        case 'conservative':
          params.append('cf-cache-level', 'bypass_cache');
          params.append('cf-edge-ttl', '300'); // 5 minutes
          break;
      }
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }, [customerCode, videoId, clientBandwidthHint, quality, enableAdaptiveBitrate, enableCloudflareOptimizations, cacheStrategy]);

  // Generate optimized poster URL with Cloudflare Image Resizing
  const getPosterUrl = useCallback(() => {
    if (poster) return poster;
    if (!customerCode || !videoId) return undefined;
    
    // Use Cloudflare Image Resizing for optimized thumbnails
    const baseUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
    const params = new URLSearchParams();
    
    // Optimize thumbnail for different screen sizes
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024;
    
    if (isMobile) {
      params.append('width', '400');
      params.append('height', '225');
    } else if (isTablet) {
      params.append('width', '800');
      params.append('height', '450');
    } else {
      params.append('width', '1200');
      params.append('height', '675');
    }
    
    params.append('fit', 'crop');
    params.append('time', '0s');
    params.append('quality', '85'); // Balanced quality/size
    
    return `${baseUrl}?${params.toString()}`;
  }, [poster, customerCode, videoId]);

  // Preload video manifest for faster startup
  useEffect(() => {
    if (!enablePreloading || preload === 'none') return;
    
    const manifestUrl = getManifestUrl();
    if (manifestUrl) {
      // Prefetch manifest for faster loading
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = manifestUrl;
      link.as = 'video';
      document.head.appendChild(link);
      
      // Also preload the poster image
      const posterUrl = getPosterUrl();
      let posterLink: HTMLLinkElement | null = null;
      if (posterUrl) {
        posterLink = document.createElement('link');
        posterLink.rel = 'preload';
        posterLink.href = posterUrl;
        posterLink.as = 'image';
        document.head.appendChild(posterLink);
      }
      
      return () => {
        document.head.removeChild(link);
        if (posterUrl && posterLink) {
          document.head.removeChild(posterLink);
        }
      };
    }
  }, [getManifestUrl, getPosterUrl, enablePreloading, preload]);

  // Performance monitoring
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enableAnalytics) return;

    const startTime = performance.now();
    let stallStartTime = 0;
    let totalStallTime = 0;
    let bitrateSamples: number[] = [];
    let lastTime = 0;

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

    const handleTimeUpdate = () => {
      // Throttle expensive calculations to reduce performance impact
      const currentTime = video.currentTime;
      const timeDiff = currentTime - lastTime;
      
      // Only calculate metrics every 2 seconds instead of every frame
      if (timeDiff > 2) {
        const buffered = video.buffered;
        if (buffered.length > 0) {
          const bufferedEnd = buffered.end(buffered.length - 1);
          const estimatedBitrate = (bufferedEnd - lastTime) * 1000000;
          bitrateSamples.push(estimatedBitrate);
          
          if (bitrateSamples.length > 5) { // Reduced from 10
            bitrateSamples = bitrateSamples.slice(-5);
          }
          
          const averageBitrate = bitrateSamples.reduce((a, b) => a + b, 0) / bitrateSamples.length;
          const peakBitrate = Math.max(...bitrateSamples);
          
          setMetrics(prev => ({
            ...prev,
            averageBitrate: Math.round(averageBitrate),
            peakBitrate: Math.round(peakBitrate),
          }));
        }
        lastTime = currentTime;
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [enableAnalytics, onPlay, onPause, onEnded]);

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
        // Cloudflare-specific attributes
        data-cf-optimized={enableCloudflareOptimizations}
        data-cache-strategy={cacheStrategy}
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
      
      {/* Performance metrics in development */}
      {process.env.NODE_ENV === 'development' && enableAnalytics && (
        <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded space-y-1">
          <div>Time: {currentTime.toFixed(1)}s / {duration.toFixed(1)}s</div>
          <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
          <div>Stalls: {metrics.bufferingEvents}</div>
          <div>Bitrate: {Math.round(metrics.averageBitrate / 1000)}kbps</div>
        </div>
      )}
    </div>
  );
}

// Hook for video performance metrics
export function useVideoPerformance(videoRef: React.RefObject<HTMLVideoElement>) {
  const [metrics, setMetrics] = useState<VideoMetrics>({
    loadTime: 0,
    bufferingEvents: 0,
    qualityChanges: 0,
    stallTime: 0,
    averageBitrate: 0,
    peakBitrate: 0,
    droppedFrames: 0,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startTime = performance.now();
    let stallStartTime = 0;
    let totalStallTime = 0;
    let bitrateSamples: number[] = [];

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

    const handleTimeUpdate = () => {
      const buffered = video.buffered;
      if (buffered.length > 0) {
        const bufferedEnd = buffered.end(buffered.length - 1);
        const estimatedBitrate = (bufferedEnd - video.currentTime) * 1000000;
        bitrateSamples.push(estimatedBitrate);
        
        if (bitrateSamples.length > 10) {
          bitrateSamples = bitrateSamples.slice(-10);
        }
        
        const averageBitrate = bitrateSamples.reduce((a, b) => a + b, 0) / bitrateSamples.length;
        const peakBitrate = Math.max(...bitrateSamples);
        
        setMetrics(prev => ({
          ...prev,
          averageBitrate: Math.round(averageBitrate),
          peakBitrate: Math.round(peakBitrate),
        }));
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef]);

  return metrics;
}

// Utility function to get optimal video settings based on device capabilities
export function getOptimalVideoSettings() {
  if (typeof window === 'undefined') {
    return {
      clientBandwidthHint: 5000000,
      quality: 'auto' as const,
      preload: 'metadata' as const,
      cacheStrategy: 'balanced' as const,
    };
  }

  const connection = typeof navigator !== 'undefined' 
    ? (navigator as unknown as { connection?: { effectiveType: string; downlink: number } }).connection
    : null;
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const isTablet = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  
  let clientBandwidthHint = 5000000; // 5 Mbps default
  let quality: 'auto' | '1080p' | '720p' | '480p' | '360p' = 'auto';
  let preload: 'none' | 'metadata' | 'auto' = 'metadata';
  let cacheStrategy: 'aggressive' | 'balanced' | 'conservative' = 'balanced';

  // Adjust based on connection
  if (connection) {
    if (connection.effectiveType === '4g') {
      clientBandwidthHint = 10000000; // 10 Mbps
      quality = '1080p';
    } else if (connection.effectiveType === '3g') {
      clientBandwidthHint = 2000000; // 2 Mbps
      quality = '480p';
    } else if (connection.effectiveType === '2g') {
      clientBandwidthHint = 500000; // 0.5 Mbps
      quality = '360p';
      preload = 'none';
      cacheStrategy = 'aggressive';
    }
  }

  // Adjust based on device type
  if (isMobile) {
    clientBandwidthHint = Math.min(clientBandwidthHint, 5000000);
    quality = quality === '1080p' ? '720p' : quality;
  } else if (isTablet) {
    clientBandwidthHint = Math.min(clientBandwidthHint, 8000000);
  }

  return {
    clientBandwidthHint,
    quality,
    preload,
    cacheStrategy,
  };
}

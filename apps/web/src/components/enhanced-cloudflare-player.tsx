'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import type { CloudflarePlayerProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EnhancedCloudflarePlayerProps extends CloudflarePlayerProps {
  enable4K?: boolean
  enableAdaptiveQuality?: boolean
  enablePreloading?: boolean
  enableAnalytics?: boolean
  bandwidthHint?: number
  qualityPreference?: 'auto' | '1080p' | '720p' | '480p' | '360p' | '2160p'
}

export const EnhancedCloudflarePlayer = memo(function EnhancedCloudflarePlayer({
  uid,
  autoplay = false,
  muted = true,
  className,
  poster,
  enable4K = true,
  enableAdaptiveQuality = true,
  enablePreloading = false,
  enableAnalytics = false,
  bandwidthHint,
  qualityPreference = 'auto'
}: EnhancedCloudflarePlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentQuality, _setCurrentQuality] = useState<string>('auto')

  // Customer code is handled directly in the stream URL construction

  // Generate optimized stream URL with 4K support
  const streamUrl = useMemo(() => {
    if (!uid) return ''
    
    const baseUrl = `https://iframe.videodelivery.net/${uid}`
    const params = new URLSearchParams()
    
    // Essential playback parameters
    if (autoplay) params.append('autoplay', 'true')
    if (muted) params.append('muted', 'true')
    
    // Core player settings
    params.append('controls', 'true')
    params.append('responsive', 'true')
    params.append('preload', enablePreloading ? 'metadata' : 'none')
    
    // Quality and resolution settings
    if (enableAdaptiveQuality) {
      params.append('quality', qualityPreference)
    } else {
      params.append('quality', 'auto')
    }
    
    // 4K/2160p support
    if (enable4K) {
      params.append('maxResolution', '2160p')
      params.append('enableHighBitrate', 'true')
    }
    
    // Bandwidth optimization
    if (bandwidthHint) {
      params.append('clientBandwidthHint', Math.round(bandwidthHint / 1000000).toString())
    }
    
    // UI customization
    params.append('primaryColor', '3b82f6') // Sky blue theme
    params.append('letterboxColor', 'transparent')
    params.append('defaultTextTrack', 'off')
    
    // Performance optimizations
    params.append('speed', '1')
    params.append('enablePictureInPicture', 'true')
    params.append('enableKeyboardShortcuts', 'true')
    params.append('enableFullscreen', 'true')
    
    // Analytics (if enabled)
    if (enableAnalytics) {
      params.append('enableAnalytics', 'true')
      params.append('analyticsId', `trailer-${uid}`)
    }
    
    // Advanced features
    params.append('enableHDR', 'false') // Disable HDR for better compatibility
    params.append('enableSubtitles', 'false')
    params.append('enableChapters', 'false')
    
    const queryString = params.toString()
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`
  }, [uid, autoplay, muted, enable4K, enableAdaptiveQuality, enablePreloading, enableAnalytics, bandwidthHint, qualityPreference])

  // Generate high-quality poster URL with 15ms timestamp
  const posterUrl = useMemo(() => {
    if (poster) return poster
    if (!uid) return ''
    
    return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=0.015s&width=1920&height=1080&quality=95&fit=crop&format=webp&sharpen=1`
  }, [uid, poster])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎥 Enhanced video loaded successfully:', {
        uid,
        quality: currentQuality,
        enable4K,
        timestamp: new Date().toISOString()
      })
    }
  }, [uid, currentQuality, enable4K])

  const handleError = useCallback((event?: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    setIsLoading(false)
    setHasError(true)
    
    console.error('🚨 Enhanced Cloudflare Stream Error:', {
      uid,
      streamUrl,
      error: event ? 'iframe_load_error' : 'unknown_error',
      enable4K,
      qualityPreference,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
    })
  }, [uid, streamUrl, enable4K, qualityPreference])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
  }, [])

  // Early returns after all hooks  
  if (!uid) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <p className="text-muted-foreground">No video ID provided</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <div className="text-center p-4">
          <p className="text-red-400 font-semibold mb-2">🚨 Video Not Found</p>
          <p className="text-muted-foreground text-xs mb-2">
            Video ID: <code className="bg-zinc-800 px-1 rounded">{uid}</code>
          </p>
          <p className="text-muted-foreground text-xs mb-3">
            This video does not exist in Cloudflare Stream
          </p>
          <div className="space-y-2">
            <button 
              onClick={handleRetry}
              className="block w-full text-sm text-primary hover:underline"
            >
              Retry Loading
            </button>
            <button 
              onClick={() => console.log('🔍 Debug Info:', { uid, streamUrl, enable4K, qualityPreference })}
              className="block w-full text-xs text-muted-foreground hover:underline"
            >
              Show Debug Info
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative aspect-video rounded-2xl overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted rounded-2xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-xs text-muted-foreground">
              {enable4K ? 'Loading 4K video...' : 'Loading video...'}
            </p>
          </div>
        </div>
      )}
      
      <iframe
        src={streamUrl}
        title="Enhanced Video Player"
        className="w-full h-full border-0 rounded-2xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        loading={enablePreloading ? "eager" : "lazy"}
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        data-poster={posterUrl}
      />
    </div>
  )
})

// Utility function to get optimal video settings based on device and connection
export function getOptimalVideoSettings() {
  if (typeof window === 'undefined') {
    return {
      enable4K: false,
      qualityPreference: 'auto' as const,
      bandwidthHint: 5000000,
      enablePreloading: false
    }
  }

  const connection = typeof navigator !== 'undefined' 
    ? (navigator as unknown as { connection?: { effectiveType: string; downlink: number } }).connection
    : null
  
  const isMobile = window.innerWidth < 768
  const isTablet = window.innerWidth < 1024
  const isHighDPI = window.devicePixelRatio > 1.5
  
  let enable4K = false
  let qualityPreference: 'auto' | '1080p' | '720p' | '480p' | '360p' | '2160p' = 'auto'
  let bandwidthHint = 5000000 // 5 Mbps default
  let enablePreloading = false

  // Adjust based on connection quality
  if (connection) {
    if (connection.effectiveType === '4g' && connection.downlink > 10) {
      enable4K = !isMobile && isHighDPI
      qualityPreference = enable4K ? '2160p' : '1080p'
      bandwidthHint = 15000000 // 15 Mbps
      enablePreloading = true
    } else if (connection.effectiveType === '4g') {
      qualityPreference = '1080p'
      bandwidthHint = 8000000 // 8 Mbps
      enablePreloading = true
    } else if (connection.effectiveType === '3g') {
      qualityPreference = '720p'
      bandwidthHint = 3000000 // 3 Mbps
    } else if (connection.effectiveType === '2g') {
      qualityPreference = '480p'
      bandwidthHint = 1000000 // 1 Mbps
    }
  }

  // Adjust based on device type
  if (isMobile) {
    enable4K = false
    qualityPreference = qualityPreference === '2160p' ? '1080p' : qualityPreference
    bandwidthHint = Math.min(bandwidthHint, 5000000)
  } else if (isTablet) {
    enable4K = false
    bandwidthHint = Math.min(bandwidthHint, 8000000)
  }

  return {
    enable4K,
    qualityPreference,
    bandwidthHint,
    enablePreloading
  }
}

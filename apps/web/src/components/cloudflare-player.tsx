'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import type { CloudflarePlayerProps } from '@/lib/types'
import { cn } from '@/lib/utils'
// Browser detection removed in v2.3 for unified cross-browser experience

export const CloudflarePlayer = memo(function CloudflarePlayer({
  uid,
  autoplay = false,
  muted = true,
  className,
  poster: _poster,
}: CloudflarePlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  // const [debugInfo] = useState<string>('')
  // Unified browser experience - no browser detection needed

  // Customer code is handled directly in the stream URL construction

  // Memoize stream URL construction optimized for fast loading
  const streamUrl = useMemo(() => {
    if (!uid) return ''
    
    // Use standard Cloudflare Stream iframe URL with minimal parameters for faster loading
    const baseUrl = `https://iframe.videodelivery.net/${uid}`
    const params = new URLSearchParams()
    
    // Essential parameters only - remove unnecessary ones that slow down loading
    if (autoplay) params.append('autoplay', 'true')
    if (muted) params.append('muted', 'true')
    
    // Optimized for fast loading with high quality support
    params.append('preload', 'none') // Don't preload to speed up initial load
    params.append('controls', 'true')
    params.append('responsive', 'true')
    
    // Enable high quality video playback (4K/2160p support)
    params.append('quality', 'auto') // Enable adaptive quality including 4K
    params.append('primaryColor', '3b82f6') // Sky blue theme
    params.append('letterboxColor', 'transparent')
    params.append('defaultTextTrack', 'off')
    
    // Performance optimizations
    params.append('speed', '1')
    params.append('enablePictureInPicture', 'true')
    params.append('enableKeyboardShortcuts', 'true')
    
    const queryString = params.toString()
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`
  }, [uid, autoplay, muted])

  // Alternative: Direct video source URLs for manual quality selection (unused for now)
  // const directVideoUrls = useMemo(() => {
  //   if (!uid) return null
  //   return {
  //     mp4: `https://videodelivery.net/${uid}/mp4`,
  //     hls: `https://videodelivery.net/${uid}/manifest/video.m3u8`,
  //     dash: `https://videodelivery.net/${uid}/manifest/video.mpd`
  //   }
  // }, [uid])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    
    // Unified video optimization logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🎥 Video loaded successfully:', uid)
    }
  }, [uid])

  const handleError = useCallback((event?: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    setIsLoading(false)
    setHasError(true)
    
    // Enhanced error logging for all environments
    console.error('🚨 Cloudflare Stream Error:', {
      uid,
      streamUrl,
      error: event ? 'iframe_load_error' : 'unknown_error',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
    })
    
    // Test accessibility of the video
    if (typeof window !== 'undefined') {
      const testUrls = [
        `https://iframe.videodelivery.net/${uid}`,
        `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`
      ]
      
      console.log('🔍 Testing video accessibility:', { uid, testUrls })
    }
  }, [uid, streamUrl])

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
              onClick={() => console.log('🔍 Debug Info:', { uid, streamUrl })}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <iframe
        src={streamUrl}
        title="Video Player"
        className="w-full h-full border-0 rounded-2xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
      />
    </div>
  )
})

// Alternative component for signed URLs (premium feature)
export const SignedCloudflarePlayer = memo(function SignedCloudflarePlayer({
  uid,
  signedUrl,
  autoplay = false,
  muted = true,
  className,
}: CloudflarePlayerProps & { signedUrl?: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
  }, [])

  // Early returns after all hooks
  if (!signedUrl && !uid) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <p className="text-muted-foreground">No video URL provided</p>
      </div>
    )
  }

  // Use signed URL if available, otherwise fall back to regular player
  if (!signedUrl) {
    return (
      <CloudflarePlayer
        uid={uid}
        autoplay={autoplay}
        muted={muted}
        className={className}
      />
    )
  }

  if (hasError) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Unable to load video</p>
          <button 
            onClick={handleRetry}
            className="text-sm text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative aspect-video rounded-2xl overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <iframe
        src={signedUrl}
        title="Video Player"
        className="w-full h-full border-0 rounded-2xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        loading="eager"
      />
    </div>
  )
})
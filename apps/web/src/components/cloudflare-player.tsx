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
  poster,
}: CloudflarePlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  // Unified browser experience - no browser detection needed

  const customerCode = useMemo(() => process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE, [])

  // Memoize stream URL construction optimized for 4K support
  const streamUrl = useMemo(() => {
    if (!uid) return ''
    
    // Use customer-specific URL for proper Cloudflare Stream integration
    const baseUrl = `https://iframe.videodelivery.net/${uid}`
    const params = new URLSearchParams()
    
    if (autoplay) params.append('autoplay', 'true')
    if (muted) params.append('muted', 'true')
    if (poster) params.append('poster', poster)
    
    // Essential parameters for optimal quality
    params.append('preload', 'metadata')
    params.append('controls', 'true')
    
    // Key parameters to ensure maximum quality availability
    params.append('primaryColor', '3b82f6')
    params.append('letterboxColor', 'transparent')
    
    // IMPORTANT: These parameters help ensure all quality levels are available
    // The iframe player will automatically show 2160p if the source supports it
    params.append('responsive', 'true')
    params.append('defaultTextTrack', 'off')
    
    // Add customer code for proper authentication
    if (customerCode) {
      params.append('customerCode', customerCode)
    }
    
    // Unified cross-browser optimizations - works consistently across all browsers
    params.set('preload', 'metadata') // Standard preloading for all browsers
    params.append('quality', 'auto')
    params.append('speed', '1')
    
    const queryString = params.toString()
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`
  }, [uid, autoplay, muted, poster, customerCode])

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

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    
    // Enhanced error logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('🎥 Video error:', {
        uid,
        streamUrl
      })
    }
  }, [uid, streamUrl])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
  }, [])

  // Early returns after all hooks
  if (!customerCode) {
    console.error('NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE is not configured')
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Player configuration error</p>
          <p className="text-xs text-muted-foreground">Missing Cloudflare customer code</p>
        </div>
      </div>
    )
  }

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
        src={streamUrl}
        title="Video Player"
        className="w-full h-full border-0 rounded-2xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        loading="eager"
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
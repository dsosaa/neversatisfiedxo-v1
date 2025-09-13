'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface InstantVideoPlayerProps {
  uid: string
  autoplay?: boolean
  muted?: boolean
  className?: string
  enable4K?: boolean
  qualityPreference?: 'auto' | 'high' | 'medium' | 'low'
  bandwidthHint?: 'high' | 'medium' | 'low'
  enablePreloading?: boolean
  enableAdaptiveQuality?: boolean
  enableAnalytics?: boolean
  onLoadStart?: () => void
  onLoadComplete?: () => void
  onError?: (error: any) => void
}

export function InstantVideoPlayer({
  uid,
  autoplay = false,
  muted = false,
  className,
  enable4K = true,
  qualityPreference = 'auto',
  bandwidthHint: _bandwidthHint = 'high',
  enablePreloading = true,
  enableAdaptiveQuality = true,
  enableAnalytics: _enableAnalytics = false,
  onLoadStart,
  onLoadComplete,
  onError
}: InstantVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadStartTime = useRef<number>(0)

  // Generate high-quality poster URL with 15ms timestamp
  const posterUrl = `https://customer-${process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE || 'd6a71f77965f2f32d7f3ebb03869b8d6'}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?time=0.015s&width=1920&height=1080&quality=95&format=webp&sharpen=1`

  // Build stream URL with optimal parameters
  const streamUrl = useMemo(() => {
    const baseUrl = `https://iframe.cloudflarestream.com/${uid}`
    const params = new URLSearchParams({
      autoplay: autoplay ? 'true' : 'false',
      muted: muted ? 'true' : 'false',
      controls: 'true',
      responsive: 'true',
      preload: enablePreloading ? 'metadata' : 'none',
      quality: enableAdaptiveQuality ? 'auto' : qualityPreference,
      primaryColor: '#3b82f6',
      letterboxColor: '#000000',
      defaultTextTrack: 'off',
      speed: '1',
      enablePictureInPicture: 'true',
      enableKeyboardShortcuts: 'true',
      poster: posterUrl
    })

    if (enable4K) {
      params.set('quality', 'auto')
    }

    return `${baseUrl}?${params.toString()}`
  }, [uid, autoplay, muted, enablePreloading, enableAdaptiveQuality, qualityPreference, enable4K, posterUrl])

  // Simulate loading progress for better UX
  useEffect(() => {
    if (!isLoading) return

    loadStartTime.current = Date.now()
    onLoadStart?.()

    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 100)

    return () => clearInterval(progressInterval)
  }, [isLoading, onLoadStart])

  const handleLoad = () => {
    const loadTime = Date.now() - loadStartTime.current
    console.log(`🎬 Video loaded in ${loadTime}ms`)
    
    setIsLoading(false)
    setLoadProgress(100)
    onLoadComplete?.()
  }

  const handleError = (error: any) => {
    console.error('Video player error:', error)
    setHasError(true)
    setIsLoading(false)
    onError?.(error)
  }

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-zinc-900 rounded-lg",
        "min-h-[400px] text-zinc-400",
        className
      )}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-lg font-medium mb-2">Video Unavailable</p>
          <p className="text-sm text-zinc-500">This video cannot be played at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative bg-zinc-900 rounded-lg overflow-hidden", className)}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
          <div className="text-center">
            {/* Animated Loading Spinner */}
            <div className="relative w-16 h-16 mb-4 mx-auto">
              <div className="absolute inset-0 border-4 border-zinc-700 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: '0.8s' }}
              ></div>
            </div>
            
            {/* Loading Text */}
            <div className="space-y-2">
              <p className="text-lg font-medium text-zinc-200">Loading Video...</p>
              <div className="w-48 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-zinc-400">
                {loadProgress < 30 ? 'Preparing stream...' : 
                 loadProgress < 60 ? 'Loading video data...' : 
                 loadProgress < 90 ? 'Almost ready...' : 'Finalizing...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <iframe
        ref={iframeRef}
        src={streamUrl}
        title={`Video player for ${uid}`}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className={cn(
          "w-full h-full border-0 rounded-lg aspect-video min-h-[400px]",
          isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...(enablePreloading && { loading: "eager" })}
      />
    </div>
  )
}


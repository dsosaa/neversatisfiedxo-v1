'use client'

import { useState, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'

interface SimpleCloudflarePlayerProps {
  uid: string
  autoplay?: boolean
  muted?: boolean
  className?: string
}

export const SimpleCloudflarePlayer = memo(function SimpleCloudflarePlayer({
  uid,
  autoplay = false,
  muted = true,
  className,
}: SimpleCloudflarePlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    console.log('✅ Simple iframe loaded successfully:', uid)
    setIsLoading(false)
    setHasError(false)
  }, [uid])

  const handleError = useCallback(() => {
    console.error('❌ Simple iframe failed to load:', uid)
    setIsLoading(false)
    setHasError(true)
  }, [uid])

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
          <p className="text-red-400 font-semibold mb-2">❌ Video Failed to Load</p>
          <p className="text-muted-foreground text-xs mb-2">
            Video ID: <code className="bg-zinc-800 px-1 rounded">{uid}</code>
          </p>
          <button 
            onClick={() => {
              setHasError(false)
              setIsLoading(true)
            }}
            className="text-sm text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Build the iframe URL with minimal parameters
  const iframeUrl = `https://iframe.videodelivery.net/${uid}?${new URLSearchParams({
    autoplay: autoplay ? 'true' : 'false',
    muted: muted ? 'true' : 'false',
    controls: 'true',
    preload: 'metadata',
    responsive: 'true'
  })}`

  return (
    <div className={cn('relative aspect-video rounded-2xl overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading video...</span>
        </div>
      )}
      
      <iframe
        src={iframeUrl}
        title="Video Player"
        className="w-full h-full border-0 rounded-2xl"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        style={{ 
          minHeight: '200px',
          backgroundColor: '#000'
        }}
      />
    </div>
  )
})

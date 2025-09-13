'use client'

import { useState, useCallback, memo } from 'react'
import { InstantVideoPlayer } from '@/components/instant-video-player'
import { cn } from '@/lib/utils'

interface LazyVideoPlayerProps {
  uid: string
  autoplay?: boolean
  muted?: boolean
  className?: string
  poster?: string
  triggerOnHover?: boolean
}

export const LazyVideoPlayer = memo(function LazyVideoPlayer({
  uid,
  autoplay = false,
  muted = true,
  className,
  poster,
  triggerOnHover = true,
}: LazyVideoPlayerProps) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = useCallback(() => {
    if (triggerOnHover) {
      setIsHovered(true)
      // Delay loading to avoid unnecessary requests on quick hovers
      setTimeout(() => {
        if (isHovered) {
          setShouldLoadVideo(true)
        }
      }, 300)
    }
  }, [triggerOnHover, isHovered])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleClick = useCallback(() => {
    setShouldLoadVideo(true)
  }, [])

  // Use poster image URL if provided, otherwise generate high-quality thumbnail URL with 15ms timestamp
  const posterUrl = poster || `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=0.015s&width=1920&height=1080&quality=95&fit=crop&format=webp&sharpen=1`

  return (
    <div 
      className={cn('relative aspect-video rounded-2xl overflow-hidden cursor-pointer', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {shouldLoadVideo ? (
        <InstantVideoPlayer
          uid={uid}
          autoplay={autoplay}
          muted={muted}
          className="w-full h-full rounded-2xl"
          enable4K={true}
          qualityPreference="auto"
          bandwidthHint="high"
          enablePreloading={true}
          enableAdaptiveQuality={true}
        />
      ) : (
        <div className="relative w-full h-full">
          {/* Show poster image until video is loaded */}
          <img
            src={posterUrl}
            alt="Video preview"
            className="w-full h-full object-cover rounded-2xl"
            loading="lazy"
            onError={(e) => {
              // Fallback to a generic placeholder if thumbnail fails
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFByZXZpZXc8L3RleHQ+PC9zdmc+'
            }}
          />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-all duration-200">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

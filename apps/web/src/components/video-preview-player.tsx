'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'

interface VideoPreviewPlayerProps {
  uid: string
  startTime?: number // Start time in seconds
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  className?: string
}

export const VideoPreviewPlayer = memo(function VideoPreviewPlayer({
  uid,
  startTime = 1,
  autoplay = false,
  muted = true,
  loop = true,
  className,
}: VideoPreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Generate the HLS video URL
  const videoUrl = `https://videodelivery.net/${uid}/manifest/video.m3u8`

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsLoading(false)
      setHasError(false)
      
      // Set the video to the start time
      video.currentTime = startTime
      
      // If autoplay is enabled, start playing
      if (autoplay) {
        video.play().catch(console.error)
      }
    }

    const handleLoadedMetadata = () => {
      // Set the video to the start time when metadata is loaded
      video.currentTime = startTime
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
      // Only log error in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Video preview failed to load:', uid)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [uid, startTime, autoplay])

  // Handle hover to play/pause
  const handleMouseEnter = () => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.play().catch(console.error)
    }
  }

  const handleMouseLeave = () => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause()
    }
  }

  if (hasError) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <div className="text-center p-4">
          <p className="text-red-400 font-semibold mb-2">🚨 Preview Not Available</p>
          <p className="text-muted-foreground text-xs">
            Video ID: <code className="bg-zinc-800 px-1 rounded">{uid}</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn('relative aspect-video rounded-2xl overflow-hidden', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-muted rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        muted={muted}
        loop={loop}
        playsInline
        preload="metadata"
        className="w-full h-full object-cover rounded-2xl"
        style={{ 
          objectFit: 'cover',
          objectPosition: 'center'
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = startTime
          }
        }}
      />
      
      {/* Play overlay when not playing */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
})

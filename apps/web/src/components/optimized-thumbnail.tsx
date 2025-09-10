'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedThumbnailProps {
  uid: string
  title: string
  className?: string
  priority?: boolean
  sizes?: string
  onClick?: () => void
}

/**
 * Optimized thumbnail component using Next.js Image
 * Provides progressive loading, WebP/AVIF support, and responsive sizing
 */
export function OptimizedThumbnail({ 
  uid, 
  title, 
  className, 
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onClick 
}: OptimizedThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (!uid) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No thumbnail available</p>
        </div>
      </div>
    )
  }

  // Generate ultra high-quality thumbnail URL from Cloudflare Stream
  const thumbnailUrl = `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?width=2560&height=1440&quality=95&fit=crop&format=webp`
  
  // Fallback to a different timestamp with same quality if default fails
  const fallbackUrl = `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?width=2560&height=1440&quality=95&fit=crop&format=webp&time=10s`

  if (hasError) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-2xl flex items-center justify-center',
        className
      )}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-xs">Video thumbnail</p>
          <button 
            onClick={() => {
              setHasError(false)
              setIsLoading(true)
            }}
            className="text-xs text-primary hover:underline mt-1"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'relative aspect-video rounded-2xl overflow-hidden group cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Optimized thumbnail image */}
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        fill
        className={cn(
          'object-cover transition-all duration-300 group-hover:scale-105',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        sizes={sizes}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkRMUIjH/xAAVAQEBAAAAAAAAAAAAAAAAAAABBP/EABcRAAMBAAAAAAAAAAAAAAAAAAECEQA/2gAMAwEAAhEDEQA/AKrjUyy3qIUvL5P04hKE3TIEqf6nYH6B"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          // Try fallback URL first
          const img = document.createElement('img')
          img.onload = () => setIsLoading(false)
          img.onerror = () => setHasError(true)
          img.src = fallbackUrl
        }}
      />

      {/* Play button overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <svg 
            className="w-8 h-8 text-white ml-1" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>

      {/* Gradient overlay for better text readability (if needed) */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}

/**
 * Lightweight thumbnail for lists and cards
 */
export function CompactThumbnail({ 
  uid, 
  title, 
  className,
  sizes = '(max-width: 768px) 50vw, 25vw'
}: OptimizedThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  if (!uid || hasError) {
    return (
      <div className={cn(
        'aspect-video bg-muted rounded-lg flex items-center justify-center',
        className
      )}>
        <svg 
          className="w-8 h-8 text-muted-foreground" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        </svg>
      </div>
    )
  }

  const thumbnailUrl = `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?width=1200&height=675&quality=90&fit=crop&format=webp`

  return (
    <div className={cn('relative aspect-video rounded-lg overflow-hidden', className)}>
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        fill
        className="object-cover"
        sizes={sizes}
        quality={75}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
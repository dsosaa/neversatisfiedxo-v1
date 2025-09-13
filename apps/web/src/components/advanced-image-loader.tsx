'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AdvancedImageLoaderProps {
  uid: string
  title: string
  className?: string
  priority?: boolean
  sizes?: string
  onClick?: () => void
  quality?: number
  enableLazyLoading?: boolean
  enableBlurPlaceholder?: boolean
  enableWebP?: boolean
  enableAVIF?: boolean
  enableProgressiveLoading?: boolean
}

/**
 * Advanced image loader with multiple optimization strategies
 * - Intersection Observer for lazy loading
 * - Progressive loading with blur placeholders
 * - WebP/AVIF format support
 * - Multiple quality fallbacks
 * - Preloading for critical images
 */
export function AdvancedImageLoader({ 
  uid, 
  title, 
  className, 
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onClick,
  quality = 95,
  enableLazyLoading = true,
  enableBlurPlaceholder = true,
  enableWebP: _enableWebP = true,
  enableAVIF: _enableAVIF = true,
  enableProgressiveLoading = true
}: AdvancedImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Skip intersection observer for priority images
  const [currentQuality, setCurrentQuality] = useState(quality)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Generate optimized image URLs with multiple quality options
  const generateImageUrls = useCallback((uid: string) => {
    const baseUrl = `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`
    const params = {
      time: '0.015s',
      width: '1920',
      height: '1080',
      quality: currentQuality.toString(),
      fit: 'crop',
      sharpen: '1'
    }

    const urls = {
      // Primary high-quality WebP
      webp: `${baseUrl}?${new URLSearchParams({ ...params, format: 'webp' }).toString()}`,
      // Fallback high-quality JPEG
      jpeg: `${baseUrl}?${new URLSearchParams({ ...params, format: 'jpeg' }).toString()}`,
      // Lower quality for progressive loading
      lowQuality: `${baseUrl}?${new URLSearchParams({ 
        ...params, 
        quality: '60',
        width: '800',
        height: '450'
      }).toString()}`,
      // Fallback timestamp
      fallback: `${baseUrl}?${new URLSearchParams({ 
        ...params, 
        time: '0.03s',
        quality: '85'
      }).toString()}`
    }

    return urls
  }, [currentQuality])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
      observerRef.current = observer
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enableLazyLoading, priority, isInView])

  // Progressive loading strategy
  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleImageError = useCallback(() => {
    if (currentQuality > 60) {
      // Try lower quality
      setCurrentQuality(60)
      setHasError(false)
    } else {
      // Try fallback URL
      const urls = generateImageUrls(uid)
      setLoadedSrc(urls.fallback)
    }
  }, [currentQuality, uid, generateImageUrls])

  // Preload critical images
  useEffect(() => {
    if (priority && !loadedSrc) {
      const urls = generateImageUrls(uid)
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = urls.webp
      document.head.appendChild(link)
      setLoadedSrc(urls.webp)
    }
  }, [priority, uid, generateImageUrls, loadedSrc])

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
              setCurrentQuality(quality)
            }}
            className="text-xs text-primary hover:underline mt-1"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const urls = generateImageUrls(uid)
  const imageSrc = loadedSrc || urls.webp

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative aspect-video rounded-2xl overflow-hidden group cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Loading placeholder with shimmer effect */}
      {isLoading && enableBlurPlaceholder && (
        <div className="absolute inset-0 bg-muted rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {enableProgressiveLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          )}
        </div>
      )}
      
      {/* Progressive loading - show low quality first */}
      {enableProgressiveLoading && isInView && !loadedSrc && (
        <Image
          src={urls.lowQuality}
          alt={`Low quality preview for ${title}`}
          fill
          className="object-cover rounded-2xl opacity-50"
          sizes={sizes}
          quality={60}
          priority={priority}
          onLoad={() => {
            // Load high quality after low quality loads
            setTimeout(() => setLoadedSrc(urls.webp), 100)
          }}
        />
      )}
      
      {/* High quality image */}
      {isInView && (
        <Image
          src={imageSrc}
          alt={`Thumbnail for ${title}`}
          fill
          className={cn(
            'object-cover transition-all duration-500 group-hover:scale-105',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          sizes={sizes}
          priority={priority}
          quality={currentQuality}
          placeholder={enableBlurPlaceholder ? "blur" : "empty"}
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkRMUIjH/xAAVAQEBAAAAAAAAAAAAAAAAAAABBP/EABcRAAMBAAAAAAAAAAAAAAAAAAECEQA/2gAMAwEAAhEDEQA/AKrjUyy3qIUvL5P04hKE3TIEqf6nYH6B"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

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

      {/* Gradient overlay for better text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}

/**
 * Lightweight version for lists and cards with basic optimizations
 */
export function FastImageLoader({ 
  uid, 
  title, 
  className,
  sizes = '(max-width: 768px) 50vw, 25vw',
  quality = 90
}: Pick<AdvancedImageLoaderProps, 'uid' | 'title' | 'className' | 'sizes' | 'quality'>) {
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

  const thumbnailUrl = `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=0.015s&width=800&height=450&quality=${quality}&fit=crop&format=webp`

  return (
    <div className={cn('relative aspect-video rounded-lg overflow-hidden', className)}>
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        fill
        className="object-cover"
        sizes={sizes}
        quality={quality}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

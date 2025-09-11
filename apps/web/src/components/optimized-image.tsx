'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 85,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc = '/placeholder-image.jpg',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Default blur placeholder
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-muted-foreground text-sm text-center">
            <div className="w-8 h-8 mx-auto mb-2 bg-muted-foreground/20 rounded" />
            <div>Image unavailable</div>
          </div>
        </div>
      )}

              {/* Actual image */}
              {isInView && !hasError && (
                <Image
                  src={src}
                  alt={alt}
                  width={fill ? undefined : width}
                  height={fill ? undefined : height}
                  fill={fill}
                  quality={quality}
                  sizes={sizes}
                  priority={priority}
                  placeholder={placeholder}
                  blurDataURL={blurDataURL || defaultBlurDataURL}
                  onLoad={handleLoad}
                  onError={handleError}
                  className={cn(
                    'transition-opacity duration-300',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  {...props}
                />
              )}

      {/* Fallback image for errors */}
      {hasError && fallbackSrc && (
        <Image
          src={fallbackSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          quality={quality}
          sizes={sizes}
          className="opacity-100"
          {...props}
        />
      )}
    </div>
  )
}

// Hook for preloading images
export function useImagePreload(src: string) {
  const [isPreloaded, setIsPreloaded] = useState(false)

  useEffect(() => {
    if (!src) return

    const img = new window.Image()
    img.onload = () => setIsPreloaded(true)
    img.onerror = () => setIsPreloaded(false)
    img.src = src

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return isPreloaded
}

// Hook for batch preloading
export function useBatchImagePreload(srcs: string[]) {
  const [preloadedCount, setPreloadedCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (srcs.length === 0) {
      setIsComplete(true)
      return
    }

    let loadedCount = 0
    const totalCount = srcs.length

    const handleLoad = () => {
      loadedCount++
      setPreloadedCount(loadedCount)
      
      if (loadedCount === totalCount) {
        setIsComplete(true)
      }
    }

    const images = srcs.map(src => {
      const img = new window.Image()
      img.onload = handleLoad
      img.onerror = handleLoad // Count errors as "loaded" to prevent hanging
      img.src = src
      return img
    })

    return () => {
      images.forEach(img => {
        img.onload = null
        img.onerror = null
      })
    }
  }, [srcs])

  return { preloadedCount, totalCount: srcs.length, isComplete }
}

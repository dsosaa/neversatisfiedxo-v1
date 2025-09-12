'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { OptimizedImage } from '@/components/optimized-image'
import { Play, Clock, Film, DollarSign, User, Eye } from '@/lib/icons'
import { Card, CardContent } from '@/components/ui/card'
import { m, conditionalMotion, motionPresets } from '@/lib/motion'
import { useSmartPreload } from '@/hooks/use-intersection-observer'
import { usePreloadService } from '@/lib/preload-service'
import { useImageFallback } from '@/hooks/use-image-fallback'
import { ThumbnailSkeleton } from '@/components/enhanced-skeleton'
import type { TrailerCardProps } from '@/lib/types'
import { formatPrice, parseLength, formatLength, parsePrice } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'


// Utility function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Enhanced Badge component with improved styling and icons
interface EnhancedBadgeProps {
  variant: 'video' | 'price' | 'duration' | 'status'
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
  isFree?: boolean
}

const EnhancedBadge = ({ variant, children, icon, className, isFree }: EnhancedBadgeProps) => {
  const baseClasses = "h-6 px-2.5 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm transition-all duration-300 flex items-center gap-1"
  
  const variantClasses = {
    video: isFree 
      ? "bg-sky-500/95 hover:bg-sky-400/95 text-white border border-sky-400/70 shadow-sky-500/30"
      : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-400/70 shadow-red-500/30",
    price: isFree 
      ? "bg-sky-500/95 hover:bg-sky-400/95 text-white border border-sky-400/70 shadow-sky-500/30"
      : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-400/70 shadow-red-500/30",
    duration: "bg-zinc-800/80 text-zinc-200 border border-zinc-600/60 hover:bg-zinc-700/80",
    status: "bg-emerald-500/90 hover:bg-emerald-400/90 text-white border border-emerald-400/60"
  }
  
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {icon}
      {children}
    </div>
  )
}

// Legacy UnifiedBadge for compatibility with existing code
const UnifiedBadge = ({ variant, children, icon, className }: { variant: 'primary' | 'secondary' | 'tertiary', children: React.ReactNode, icon?: React.ReactNode, className?: string }) => {
  const baseClasses = "h-7 px-3 rounded-xl text-sm font-medium backdrop-blur-sm shadow-sm transition-all duration-300 flex items-center gap-1.5"
  
  const variantClasses = {
    primary: "bg-sky-500 hover:bg-sky-400 text-white border border-sky-400/50",
    secondary: "bg-zinc-800/80 text-zinc-100 border border-zinc-700",
    tertiary: "bg-transparent text-zinc-200 border border-zinc-700 hover:bg-zinc-800/20"
  }
  
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {icon}
      {children}
    </div>
  )
}

export const TrailerCard = memo(function TrailerCard({ trailer, onPreview }: TrailerCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const preloadService = usePreloadService()

  // Memoize expensive calculations
  const price = useMemo(() => parsePrice(trailer.price), [trailer.price])
  const lengthInMinutes = useMemo(() => parseLength(trailer.length), [trailer.length])
  
  // Optimized responsive thumbnail URLs with fallback handling
  const thumbnailUrls = useMemo(() => {
    const customerCode = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE
    if (!customerCode || !trailer.cf_video_uid) {
      return null
    }
    
    // Use the correct Cloudflare Stream thumbnail URL format with video UID and timestamp
    const baseUrl = `https://videodelivery.net/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg`
    const fallbackBaseUrl = `https://customer-${customerCode}.cloudflarestream.com/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg`
    
    return {
      // Enhanced responsive sizes with fallback URLs
      small: `${baseUrl}?time=5s&width=480&height=270&quality=88&fit=crop&format=webp&sharpen=1`,
      medium: `${baseUrl}?time=5s&width=960&height=540&quality=90&fit=crop&format=webp&sharpen=1`,
      large: `${baseUrl}?time=5s&width=1440&height=810&quality=95&fit=crop&format=webp&sharpen=1`,
      // Ultra-high quality for hover/preview
      ultra: `${baseUrl}?time=5s&width=1920&height=1080&quality=95&fit=crop&format=webp&sharpen=1`,
      // Blur placeholder - tiny, fast-loading version
      placeholder: `${baseUrl}?time=5s&width=40&height=23&quality=75&fit=crop&format=webp`,
      // Fallback URLs for 400 errors
      fallbacks: {
        small: `${fallbackBaseUrl}?time=5s&width=480&height=270&quality=88&fit=crop&format=webp`,
        medium: `${fallbackBaseUrl}?time=5s&width=960&height=540&quality=90&fit=crop&format=webp`,
        large: `${fallbackBaseUrl}?time=5s&width=1440&height=810&quality=95&fit=crop&format=webp`
      }
    }
  }, [trailer.cf_video_uid])
  
        // Enhanced image loading with fallback and retry logic
        const {
          currentUrl: thumbnailUrl,
          hasError: imageError,
          retry: retryImage,
          handleLoad: handleImageLoad,
          handleError: handleImageError
        } = useImageFallback(
          thumbnailUrls?.medium || null,
          {
            maxRetries: 2,
            retryDelay: 1000,
            fallbackUrls: thumbnailUrls?.fallbacks ? [
              thumbnailUrls.fallbacks.medium,
              thumbnailUrls.fallbacks.small
            ] : []
          }
        )

  // Smart preloading with intersection observer
  const { elementRef } = useSmartPreload<HTMLDivElement>(
    async () => {
      if (thumbnailUrls && preloadService) {
        // Preload multiple sizes for responsive behavior
        await preloadService.preloadImages([
          thumbnailUrls.medium,
          thumbnailUrls.large
        ], { 
          priority: 'auto',
          timeout: 8000
        })
      }
    },
    {
      rootMargin: '100px', // Start preloading 100px before visibility
      priority: 'auto',
      connectionType: 'auto'
    }
  )

  // Memoize formatted values
  const formattedPrice = useMemo(() => formatPrice(price), [price])
  const formattedLength = useMemo(() => formatLength(lengthInMinutes), [lengthInMinutes])
  
  // Memoize title with ALL CAPS formatting - show full title
  const displayTitle = useMemo(() => {
    return trailer.title.toUpperCase() // Convert to ALL CAPS, no truncation
  }, [trailer.title])
  
  // Memoize description truncation
  const displayDescription = useMemo(() => {
    if (!trailer.description) return ''
    return truncateText(trailer.description, 150) // Limit to 150 characters
  }, [trailer.description])
  
  const toggleDescription = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowFullDescription(!showFullDescription)
  }, [showFullDescription])

  const handlePreview = useCallback(() => {
    onPreview?.(trailer)
  }, [onPreview, trailer])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handlePreview()
    }
  }, [handlePreview])

  return (
    <m.div
      ref={elementRef}
      {...conditionalMotion(motionPresets.slideUp, prefersReducedMotion)}
      {...conditionalMotion(motionPresets.cardHover, prefersReducedMotion)}
      className="group cursor-pointer focus:outline-none"
      onClick={handlePreview}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Play trailer: ${trailer.title} by ${trailer.creators}. ${formattedPrice}, ${formattedLength}`}
    >
      <Card className="h-full flex flex-col overflow-hidden border border-zinc-800/40 hover:border-zinc-600/60 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/30 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md hover:scale-[1.02] group-hover:shadow-sky-500/10">
        <div className="relative aspect-[16/9] bg-muted rounded-t-2xl overflow-hidden">
          {/* Enhanced thumbnail with fallback and retry */}
          {thumbnailUrl ? (
            <OptimizedImage
              src={thumbnailUrl}
              alt={`Thumbnail for ${trailer.title} video trailer`}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 480px, (max-width: 1024px) 480px, 480px"
              priority={false}
              quality={85}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <ThumbnailSkeleton 
              className="w-full h-full rounded-t-2xl" 
              showRetry={imageError}
              onRetry={imageError ? retryImage : undefined}
            />
          )}

          {/* Gradient scrim for badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/60 rounded-t-2xl pointer-events-none" />

          {/* Video Number Badge - (top-left) */}
          <div className="absolute top-0.5 left-0.5">
            <EnhancedBadge variant="video" icon={<Film className="w-5 h-5" />} isFree={price === 0} className="h-8 px-4 text-base font-bold tracking-wide">
              Video #{trailer.video_number}
            </EnhancedBadge>
          </div>

          {/* Price Badge - (top-right) */}
          <div className="absolute top-0.5 right-0.5">
            <EnhancedBadge variant="price" icon={<DollarSign className="w-5 h-5" />} isFree={price === 0} className="h-8 px-4 text-base font-bold tracking-wide">
              {price === 0 ? "FREE" : formattedPrice}
            </EnhancedBadge>
          </div>

          {/* Upload status indicator - HIDDEN */}
          {false && trailer.upload_status !== 'Complete' && (
            <div className="absolute top-12 left-3">
              <UnifiedBadge variant="primary" className="bg-amber-600 hover:bg-amber-500 border-amber-500/50">
                {trailer.upload_status}
              </UnifiedBadge>
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-within:bg-black/20 transition-all duration-200 rounded-t-2xl">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
              <m.div
                {...conditionalMotion(motionPresets.buttonHover, prefersReducedMotion)}
                className="bg-sky-500/90 text-white rounded-full p-3 backdrop-blur-sm border border-sky-400/50 shadow-lg"
                aria-hidden="true"
              >
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" aria-hidden="true" />
              </m.div>
            </div>
          </div>
        </div>

        <CardContent className="flex-1 flex flex-col p-4 space-y-3">
          {/* Title with ALL CAPS - Full display */}
          <h3 className="font-bold text-base leading-snug group-hover:text-sky-300 transition-colors duration-200 text-zinc-100 tracking-wide" title={trailer.title}>
            {displayTitle}
          </h3>

          {/* Compact Creator Section */}
          <div className="flex items-center gap-2 -mt-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-zinc-300" />
            </div>
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-1">
              {trailer.creators.split(',').map((creator, index) => (
                <span key={index} className="flex items-center">
                  {creator.trim()}
                  {index < trailer.creators.split(',').length - 1 && (
                    <span className="mx-1 text-zinc-600">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Optimized Description with Read More */}
          {trailer.description && (
            <div className="space-y-1">
              <p className="text-sm text-zinc-400 leading-relaxed">
                {showFullDescription ? trailer.description : displayDescription}
              </p>
              {trailer.description.length > 150 && (
                <button
                  onClick={toggleDescription}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}

          {/* Inline badges row - Duration and CTA */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-zinc-800/40">
            <div className="flex items-center gap-2">
              {lengthInMinutes > 0 && (
                <EnhancedBadge variant="duration" icon={<Clock className="w-3 h-3" />}>
                  {formattedLength}
                </EnhancedBadge>
              )}
            </div>
            
            {/* Enhanced CTA Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePreview()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/40 hover:bg-sky-400/60 text-white rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-sky-500/30 backdrop-blur-sm border border-sky-400/40"
            >
              <Eye className="w-3 h-3" />
              Watch Trailer
            </button>
          </div>
        </CardContent>
      </Card>
    </m.div>
  )
})

// Skeleton loader for trailer cards
export function TrailerCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-zinc-800/50 rounded-2xl shadow-lg bg-zinc-950/95 backdrop-blur-sm">
      <div className="relative aspect-[16/9] bg-muted rounded-t-2xl animate-pulse overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        
        {/* Skeleton badges */}
        <div className="absolute top-3 left-3">
          <div className="h-7 px-3 rounded-xl bg-zinc-700/50 animate-pulse w-16" />
        </div>
        <div className="absolute top-3 right-3">
          <div className="h-7 px-3 rounded-xl bg-zinc-700/50 animate-pulse w-14" />
        </div>
      </div>
      <CardContent className="p-5 space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-muted rounded-md animate-pulse" />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse" />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex justify-between items-center pt-4 mt-auto border-t border-zinc-800/50">
          <div className="h-7 px-3 rounded-xl bg-zinc-700/50 animate-pulse w-20" />
          <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

// List view for trailer cards
export function TrailerList({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  )
}

// List item component for trailers
export const TrailerListItem = memo(function TrailerListItem({ trailer, onPreview }: TrailerCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // Memoize expensive calculations
  const price = useMemo(() => parsePrice(trailer.price), [trailer.price])
  const lengthInMinutes = useMemo(() => parseLength(trailer.length), [trailer.length])
  
  // Optimized responsive thumbnail URLs for list view with fallback handling
  const thumbnailUrls = useMemo(() => {
    const customerCode = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE
    if (!customerCode || !trailer.cf_video_uid) {
      console.log('List view thumbnail URL generation failed:', { customerCode, cf_video_uid: trailer.cf_video_uid, trailer })
      return null
    }
    
    // Use the correct Cloudflare Stream thumbnail URL format with video UID and timestamp
    const baseUrl = `https://videodelivery.net/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg`
    const fallbackBaseUrl = `https://customer-${customerCode}.cloudflarestream.com/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg`
    
    console.log('Generated list view thumbnail URLs:', { baseUrl, fallbackBaseUrl, cf_video_uid: trailer.cf_video_uid })
    
    return {
      // Enhanced list view with fallback URLs
      small: `${baseUrl}?width=280&height=158&quality=88&fit=crop&format=webp&sharpen=1`,
      medium: `${baseUrl}?width=560&height=315&quality=90&fit=crop&format=webp&sharpen=1`,
      large: `${baseUrl}?width=840&height=473&quality=95&fit=crop&format=webp&sharpen=1`,
      // Blur placeholder - tiny, fast-loading version
      placeholder: `${baseUrl}?width=40&height=23&quality=75&fit=crop&format=webp`,
      // Fallback URLs for 400 errors
      fallbacks: {
        small: `${fallbackBaseUrl}?width=280&height=158&quality=88&fit=crop&format=webp`,
        medium: `${fallbackBaseUrl}?width=560&height=315&quality=90&fit=crop&format=webp`,
        large: `${fallbackBaseUrl}?width=840&height=473&quality=95&fit=crop&format=webp`
      }
    }
  }, [trailer])
  
  // Enhanced image loading with fallback and retry logic - restored for consistency with grid view
  const {
    currentUrl: thumbnailUrl,
    hasError: imageError,
    retry: retryImage,
    handleLoad: handleImageLoad,
    handleError: handleImageError
  } = useImageFallback(
    thumbnailUrls?.medium || null,
    {
      maxRetries: 2,
      retryDelay: 1000,
      fallbackUrls: thumbnailUrls?.fallbacks ? [
        thumbnailUrls.fallbacks.medium,
        thumbnailUrls.fallbacks.small
      ] : []
    }
  )

  // Memoize formatted values
  const formattedPrice = useMemo(() => formatPrice(price), [price])
  const formattedLength = useMemo(() => formatLength(lengthInMinutes), [lengthInMinutes])
  
  // Memoize title with ALL CAPS formatting
  const displayTitle = useMemo(() => {
    return trailer.title.toUpperCase()
  }, [trailer.title])
  
  // Memoize description truncation
  const displayDescription = useMemo(() => {
    if (!trailer.description) return ''
    return truncateText(trailer.description, 200) // More space in list view
  }, [trailer.description])
  
  const toggleDescription = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowFullDescription(!showFullDescription)
  }, [showFullDescription])

  const handlePreview = useCallback(() => {
    onPreview?.(trailer)
  }, [onPreview, trailer])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handlePreview()
    }
  }, [handlePreview])

  return (
    <m.div
      {...conditionalMotion(motionPresets.slideLeft, prefersReducedMotion)}
      {...conditionalMotion(
        { whileHover: { y: -2, scale: 1.005, transition: { duration: 0.2, ease: 'easeOut' } } }, 
        prefersReducedMotion
      )}
      className="group cursor-pointer focus:outline-none"
      onClick={handlePreview}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Play trailer: ${trailer.title} by ${trailer.creators}. ${formattedPrice}, ${formattedLength}`}
    >
      <Card className="overflow-hidden border border-zinc-800/40 hover:border-zinc-600/60 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/30 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md group-hover:shadow-sky-500/10">
        <div className="flex gap-6 p-6">
          {/* Enhanced thumbnail rendering with fallback support */}
          <div className="relative w-56 aspect-[16/9] bg-muted rounded-xl overflow-hidden flex-shrink-0">
            {thumbnailUrl ? (
              <OptimizedImage
                src={thumbnailUrl}
                alt={`Thumbnail for ${trailer.title} video trailer`}
                fill
                className="object-cover transition-all duration-300 group-hover:scale-105"
                sizes="280px"
                priority={false}
                quality={85}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <ThumbnailSkeleton 
                className="w-full h-full rounded-xl" 
                showRetry={imageError}
                onRetry={imageError ? retryImage : undefined}
              />
            )}

            {/* Upload status indicator - only show if not complete - HIDDEN */}
            {false && trailer.upload_status !== 'Complete' && (
              <div className="absolute top-2 left-2">
                <EnhancedBadge variant="status" className="bg-amber-600/95 hover:bg-amber-500/95 border-amber-500/60">
                  {trailer.upload_status}
                </EnhancedBadge>
              </div>
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-within:bg-black/20 transition-all duration-200 rounded-xl">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                <m.div
                  {...conditionalMotion(motionPresets.buttonHover, prefersReducedMotion)}
                  className="bg-sky-500/90 text-white rounded-full p-3 backdrop-blur-sm border border-sky-400/50 shadow-lg"
                  aria-hidden="true"
                >
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden="true" />
                </m.div>
              </div>
            </div>
          </div>

          {/* Content - Enhanced layout */}
          <div className="flex-1 space-y-4">
            {/* Video Number and Price Badges Row */}
            <div className="flex items-center gap-3">
              <EnhancedBadge variant="video" icon={<Film className="w-4 h-4" />} isFree={price === 0} className="h-7 px-3 text-sm font-bold tracking-wide">
                Video #{trailer.video_number}
              </EnhancedBadge>
              <EnhancedBadge variant="price" icon={<DollarSign className="w-4 h-4" />} isFree={price === 0} className="h-7 px-3 text-sm font-bold tracking-wide">
                {price === 0 ? "FREE" : formattedPrice}
              </EnhancedBadge>
            </div>

            {/* Title with ALL CAPS */}
            <h3 className="font-bold text-xl leading-snug group-hover:text-sky-300 transition-colors duration-200 text-zinc-100 tracking-wide" title={trailer.title}>
              {displayTitle}
            </h3>

            {/* Enhanced Creator Section */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-zinc-300" />
              </div>
              <div className="text-sm text-zinc-500 font-medium flex items-center gap-1">
                {trailer.creators.split(',').map((creator, index) => (
                  <span key={index} className="flex items-center">
                    {creator.trim()}
                    {index < trailer.creators.split(',').length - 1 && (
                      <span className="mx-1.5 text-zinc-600">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Enhanced Description with Read More */}
            {trailer.description && (
              <div className="space-y-2">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {showFullDescription ? trailer.description : displayDescription}
                </p>
                {trailer.description.length > 200 && (
                  <button
                    onClick={toggleDescription}
                    className="text-sm text-sky-400 hover:text-sky-300 font-medium transition-colors"
                  >
                    {showFullDescription ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}

            {/* Enhanced bottom section with duration and CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/40">
              <div className="flex items-center gap-3">
                {lengthInMinutes > 0 && (
                  <EnhancedBadge variant="duration" icon={<Clock className="w-3.5 h-3.5" />} className="h-7 px-3">
                    {formattedLength}
                  </EnhancedBadge>
                )}
              </div>
              
              {/* Enhanced CTA Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500/40 hover:bg-sky-400/60 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-sky-500/30 backdrop-blur-sm border border-sky-400/40"
              >
                <Eye className="w-4 h-4" />
                Watch Trailer
              </button>
            </div>
          </div>
        </div>
      </Card>
    </m.div>
  )
})

// Grid container for trailer cards
export function TrailerGrid({ children, className }: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 grid-auto-rows-fr',
      className
    )}>
      {children}
    </div>
  )
}
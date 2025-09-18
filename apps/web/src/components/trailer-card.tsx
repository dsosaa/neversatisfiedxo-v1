'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import Image from 'next/image'
// import { AdvancedImageLoader } from '@/components/advanced-image-loader'
import { Play, Film, DollarSign, User, Eye, Clock } from '@/lib/icons'
import { Card, CardContent } from '@/components/ui/card'
import { m, conditionalMotion, motionPresets } from '@/lib/motion'
// Removed unused hooks and components
import type { TrailerCardProps } from '@/lib/types'
import { formatPrice, parseLength, formatLength, parsePrice } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { generateOptimizedThumbnailUrl } from '@/lib/image-utils'


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

export const TrailerCard = memo(function TrailerCard({ trailer, onPreview, highPriority = false }: TrailerCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  // Removed complex lazy loading and preloading logic

  // Debug logging to identify rendering issues
  // Trailer card rendering

  // Memoize expensive calculations
  const price = useMemo(() => parsePrice(trailer.price), [trailer.price])
  const lengthInMinutes = useMemo(() => parseLength(trailer.length), [trailer.length])

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
      {...conditionalMotion(motionPresets.slideUp, prefersReducedMotion)}
      {...conditionalMotion(motionPresets.cardHover, prefersReducedMotion)}
      className="group cursor-pointer focus:outline-none"
      onClick={handlePreview}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Play trailer: ${trailer.title} by ${trailer.creators}. ${formattedPrice}, ${formattedLength}`}
    >
      <Card 
        className="h-full flex flex-col overflow-hidden border border-zinc-800/40 hover:border-zinc-600/60 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/30 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md hover:scale-[1.02] group-hover:shadow-sky-500/10"
      >
        <div className="relative aspect-[16/9] bg-black rounded-t-2xl overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '288px 162px' }}>
          {trailer.cf_video_uid ? (
            <CardThumbnail
              uid={trailer.cf_video_uid}
              alt={`Thumbnail for ${trailer.title}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              highPriority={highPriority}
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <Film className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">No thumbnail available</p>
                <p className="text-xs text-zinc-500">Video #{trailer.video_number}</p>
              </div>
            </div>
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

          {/* Duration Badge - (bottom-left) */}
          <div className="absolute bottom-0.5 left-0.5">
            <EnhancedBadge variant="duration" icon={<Clock className="w-4 h-4" />} className="h-7 px-3 text-sm font-bold">
              {formattedLength}
            </EnhancedBadge>
          </div>

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

          {/* Enhanced Description with Better Readability */}
          {trailer.description && (
            <div className="space-y-2">
              <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                  {showFullDescription ? trailer.description : displayDescription}
                </p>
              </div>
              {trailer.description.length > 150 && (
                <button
                  onClick={toggleDescription}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors ml-1"
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}

          {/* CTA Button */}
          <div className="flex items-center justify-end pt-3 mt-auto border-t border-zinc-800/40">
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

// Enhanced skeleton loader for trailer cards with better animations
export function TrailerCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-zinc-800/50 rounded-2xl shadow-lg bg-zinc-950/95 backdrop-blur-sm">
      <div className="relative aspect-[16/9] bg-muted rounded-t-2xl overflow-hidden">
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        
        {/* Skeleton badges with staggered animation */}
        <div className="absolute top-3 left-3">
          <div className="h-7 px-3 rounded-xl bg-zinc-700/50 animate-pulse w-16 skeleton-delay-1" />
        </div>
        <div className="absolute top-3 right-3">
          <div className="h-7 px-3 rounded-xl bg-zinc-700/50 animate-pulse w-14 skeleton-delay-2" />
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="h-6 px-2 rounded-lg bg-zinc-700/50 animate-pulse w-12 skeleton-delay-3" />
        </div>
      </div>
      <CardContent className="p-5 space-y-3">
        {/* Title skeleton with varying width */}
        <div className="h-6 bg-muted rounded-md animate-pulse w-4/5" style={{ animationDelay: '0.4s' }} />
        
        {/* Description skeleton with realistic text patterns */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md animate-pulse w-full" style={{ animationDelay: '0.5s' }} />
          <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse" style={{ animationDelay: '0.6s' }} />
          <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse" style={{ animationDelay: '0.7s' }} />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex justify-between items-center pt-4 mt-auto border-t border-zinc-800/50">
          <div className="h-7 px-3 rounded-xl bg-zinc-700/50 animate-pulse w-20" style={{ animationDelay: '0.8s' }} />
          <div className="w-3 h-3 bg-muted rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
        </div>
      </CardContent>
    </Card>
  )
}

// Compact skeleton for list view
export function TrailerListItemSkeleton() {
  return (
    <Card className="overflow-hidden border border-zinc-800/50 rounded-2xl shadow-lg bg-zinc-950/95 backdrop-blur-sm">
      <div className="flex gap-6 p-6">
        {/* Image skeleton */}
        <div className="relative w-56 h-0 pt-[56.25%] bg-muted rounded-xl overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <div className="absolute bottom-2 left-2">
            <div className="h-6 px-2 rounded-lg bg-zinc-700/50 animate-pulse w-12" />
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md animate-pulse w-full" />
            <div className="h-4 bg-muted rounded-md w-2/3 animate-pulse" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 px-3 rounded-xl bg-zinc-700/50 animate-pulse w-16" />
            <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </div>
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
export const TrailerListItem = memo(function TrailerListItem({ trailer, onPreview, highPriority = false }: TrailerCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  // Removed complex lazy loading logic

  // Memoize expensive calculations
  const price = useMemo(() => parsePrice(trailer.price), [trailer.price])
  const lengthInMinutes = useMemo(() => parseLength(trailer.length), [trailer.length])

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
      <Card 
        className="overflow-hidden border border-zinc-800/40 hover:border-zinc-600/60 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/30 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md group-hover:shadow-sky-500/10"
      >
        <div className="flex gap-6 p-6">
          {/* Progressive image loading with lazy loading */}
          <div className="relative w-56 aspect-[16/9] bg-black rounded-xl overflow-hidden flex-shrink-0" style={{ contentVisibility: 'auto', containIntrinsicSize: '224px 126px' }}>
            <CardThumbnail
              uid={trailer.cf_video_uid}
              alt={`Thumbnail for ${trailer.title}`}
              sizes="224px"
              highPriority={highPriority}
            />

            {/* Upload status indicator - only show if not complete - HIDDEN */}
            {false && trailer.upload_status !== 'Complete' && (
              <div className="absolute top-2 left-2">
                <EnhancedBadge variant="status" className="bg-amber-600/95 hover:bg-amber-500/95 border-amber-500/60">
                  {trailer.upload_status}
                </EnhancedBadge>
              </div>
            )}

            {/* Duration Badge - (bottom-left) */}
            <div className="absolute bottom-2 left-2">
              <EnhancedBadge variant="duration" icon={<Clock className="w-4 h-4" />} className="h-7 px-3 text-sm font-bold">
                {formattedLength}
              </EnhancedBadge>
            </div>

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

            {/* Enhanced Description with Better Readability */}
            {trailer.description && (
              <div className="space-y-3">
                <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                    {showFullDescription ? trailer.description : displayDescription}
                  </p>
                </div>
                {trailer.description.length > 200 && (
                  <button
                    onClick={toggleDescription}
                    className="text-sm text-sky-400 hover:text-sky-300 font-medium transition-colors ml-1"
                  >
                    {showFullDescription ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}

            {/* CTA Button */}
            <div className="flex items-center justify-end pt-4 border-t border-zinc-800/40">
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

function CardThumbnail({
  uid,
  alt,
  sizes,
  highPriority = false
}: {
  uid: string
  alt: string
  sizes: string
  highPriority?: boolean
}) {
  const [fallbackIndex, setFallbackIndex] = useState(0)
  const customerCode = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE

  const candidates = useMemo(() => {
    const times = ['0.005s', '0.015s', '0.03s']
    // Prefer JPEG first for faster decode on many devices, then WebP
    const fmts: Array<'jpeg' | 'webp'> = ['jpeg', 'webp']
    const urls: string[] = []
    for (const fmt of fmts) {
      for (const t of times) {
        urls.push(
          generateOptimizedThumbnailUrl(uid, {
            time: t,
            width: 800,
            height: 450,
            quality: 75,
            format: fmt as 'webp' | 'jpeg',
            fit: 'crop'
          })
        )
      }
    }
    if (customerCode) {
      for (const fmt of fmts) {
        for (const t of times) {
          const params = new URLSearchParams({
            time: t,
            width: String(800),
            height: String(450),
            quality: String(75),
            format: fmt,
            fit: 'crop'
          })
          urls.push(`https://customer-${customerCode}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?${params.toString()}`)
        }
      }
    }
    return urls
  }, [uid, customerCode])

  const src = candidates[Math.min(fallbackIndex, candidates.length - 1)]

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={highPriority}
      sizes={sizes}
      // Remove blur placeholder for a uniform look; use shimmer background
      className="object-cover"
      referrerPolicy="no-referrer"
      onError={() => setFallbackIndex((i) => i + 1)}
    />
  )
}

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

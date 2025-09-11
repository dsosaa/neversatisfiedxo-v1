'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from '@/lib/motion'
import { X, ExternalLink, Clock, DollarSign, User, Film } from '@/lib/icons'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { CloudflarePlayer } from '@/components/cloudflare-player'
import type { QuickPreviewProps } from '@/lib/types'
import { formatPrice, parseLength, formatLength, parsePrice } from '@/lib/api'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Enhanced Badge component matching the main design system
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

export function QuickPreview({ trailer, open, onOpenChange }: QuickPreviewProps) {
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (open && trailer) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => setIsPlayerReady(true), 300)
      return () => clearTimeout(timer)
    } else {
      setIsPlayerReady(false)
    }
  }, [open, trailer])

  // Enhanced keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!trailer) return null

  const price = parsePrice(trailer.price)
  const lengthInMinutes = parseLength(trailer.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={focusTrapRef}
        className="max-w-4xl w-full h-auto max-h-[90vh] overflow-hidden rounded-2xl p-0"
        aria-describedby={`trailer-preview-${trailer.id}`}
      >
        <VisuallyHidden>
          <DialogTitle>{trailer?.title || 'Video Preview'}</DialogTitle>
        </VisuallyHidden>
        <div 
          id={`trailer-preview-${trailer.id}`} 
          className="sr-only"
        >
          Video preview for {trailer.title} by {trailer.creators}. Duration: {formatLength(lengthInMinutes)}. Price: {formatPrice(price)}.
        </div>
        <AnimatePresence mode="wait">
          {trailer && (
            <m.div
              key={trailer.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
              className="relative"
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-t-2xl overflow-hidden">
                {isPlayerReady && (
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CloudflarePlayer
                      uid={trailer.cf_video_uid}
                      autoplay={true}
                      muted={true}
                      className="rounded-none"
                      poster={`https://videodelivery.net/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg?time=5s&width=1920&height=1080&quality=95&fit=crop&format=webp&sharpen=1`}
                    />
                  </m.div>
                )}
              </div>

              {/* Content Section - Matching Gallery Card Design */}
              <div className="p-6 bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md">
                <div className="space-y-4">
                  
                  {/* Header Section - Video Number & Price Badges */}
                  <div className="flex items-center justify-between gap-3">
                    <EnhancedBadge variant="video" icon={<Film className="w-4 h-4" />} isFree={price === 0} className="h-7 px-3 text-sm font-bold tracking-wide">
                      Video #{trailer.video_number}
                    </EnhancedBadge>
                    
                    <EnhancedBadge variant="price" icon={<DollarSign className="w-4 h-4" />} isFree={price === 0} className="h-7 px-3 text-sm font-bold tracking-wide">
                      {price === 0 ? 'FREE' : formatPrice(price)}
                    </EnhancedBadge>
                  </div>

                  {/* Title - Matching Card Typography */}
                  <h2 className="font-bold text-2xl leading-snug text-zinc-100 tracking-wide uppercase">
                    {trailer.title}
                  </h2>
                  
                  {/* Creator - Matching Card Style */}
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

                  {/* Duration Row */}
                  <div className="flex items-center gap-3">
                    {lengthInMinutes > 0 && (
                      <EnhancedBadge variant="duration" icon={<Clock className="w-3.5 h-3.5" />}>
                        {formatLength(lengthInMinutes)}
                      </EnhancedBadge>
                    )}

                    {/* Status Indicator - Only show if not complete */}
                    {trailer.upload_status !== 'Complete' && (
                      <EnhancedBadge variant="status">
                        {trailer.upload_status}
                      </EnhancedBadge>
                    )}
                  </div>

                  {/* Description Section - Matching Card Style */}
                  {trailer.description && (
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {trailer.description}
                      </p>
                    </div>
                  )}

                  {/* Action Button - Matching Card Style */}
                  <div className="pt-4 border-t border-zinc-800/40">
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full flex items-center gap-2 px-4 py-2 bg-sky-500/40 hover:bg-sky-400/60 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-sky-500/30 backdrop-blur-sm border border-sky-400/40"
                    >
                      <Link href={`/video/${trailer.id}`} onClick={() => onOpenChange(false)}>
                        <ExternalLink className="w-4 h-4" />
                        View Full Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

// Loading state for quick preview
export function QuickPreviewSkeleton({ open, onOpenChange }: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] overflow-hidden rounded-2xl p-0">
        <VisuallyHidden>
          <DialogTitle>Loading Video Preview</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Video Player skeleton */}
          <div className="aspect-video bg-muted animate-pulse rounded-t-2xl" />

          {/* Content skeleton */}
          <div className="p-6 bg-card space-y-4">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
              <div className="h-8 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
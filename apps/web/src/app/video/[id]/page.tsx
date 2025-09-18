'use client'

import { useState, useEffect, useRef, lazy } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { m, AnimatePresence } from '@/lib/motion'
import { ArrowLeft, Clock, DollarSign, User, Calendar, Share, Heart, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useTrailer, useRelatedTrailers, usePrefetchTrailer } from '@/lib/hooks'
import { formatPrice, parseLength, formatLength, parsePrice } from '@/lib/api'
import { cn } from '@/lib/utils'

// Unified backdrop utility for all browsers (replaces getBrowserSafeBackdrop)
import Link from 'next/link'

// Removed unused CloudflarePlayer import

const TrailerCard = lazy(() => import('@/components/trailer-card').then(module => ({
  default: module.TrailerCard
})))

const TrailerGrid = lazy(() => import('@/components/trailer-card').then(module => ({
  default: module.TrailerGrid
})))

const TrailerCardSkeleton = lazy(() => import('@/components/trailer-card').then(module => ({
  default: module.TrailerCardSkeleton
})))

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  // Unified browser experience - no browser detection needed
  const [showStickyPlayer, setShowStickyPlayer] = useState(false)
  const mainPlayerRef = useRef<HTMLDivElement>(null)
  const prefetchTrailer = usePrefetchTrailer()

  const videoId = params.id as string
  
  // Unified animation support for all browsers
  
  const { data: trailer, isLoading, error } = useTrailer(videoId)
  const { data: relatedTrailers, isLoading: relatedLoading } = useRelatedTrailers(trailer || null)

  // Handle sticky player visibility based on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (mainPlayerRef.current) {
        const rect = mainPlayerRef.current.getBoundingClientRect()
        const isMainPlayerVisible = rect.bottom > 0 && rect.top < window.innerHeight
        setShowStickyPlayer(!isMainPlayerVisible)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prefetch related trailers on hover
  const handleRelatedHover = (id: string) => {
    prefetchTrailer(id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border p-4">
          <div className="container mx-auto">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="aspect-video bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !trailer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The video you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const price = parsePrice(trailer.price)
  const lengthInMinutes = parseLength(trailer.length)

  return (
    <div className="min-h-screen bg-background">
      {/* Header matching main site design */}
      <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-sky-500/30 hover:border-sky-400/50 hover:bg-sky-500/10 text-sky-400 hover:text-sky-300">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="border-sky-500/30 hover:border-sky-400/50 hover:bg-sky-500/10 text-sky-400 hover:text-sky-300">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 w-full max-w-screen-2xl mx-auto">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <div className="lg:col-span-2">
            <m.div
              ref={mainPlayerRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
            >
              <iframe
                src={`https://iframe.videodelivery.net/${trailer.cf_video_uid}?autoplay=false&muted=false&poster=${encodeURIComponent(`https://videodelivery.net/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg?time=0.005s&width=1920&height=1080&quality=95&fit=crop&format=webp&sharpen=1`)}`}
                className="w-full h-full rounded-2xl border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                title={`Video player for ${trailer.title}`}
              />
            </m.div>
          </div>

          {/* Sidebar Info - Unified Design */}
          <div className="space-y-6">
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Video Info Card - Matching Gallery Design */}
              <Card className="overflow-hidden border border-zinc-800/40 rounded-2xl shadow-xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md">
                <CardContent className="p-6 space-y-6">
                  {/* Title */}
                  <h1 className="text-2xl font-bold leading-tight text-zinc-100 tracking-wide">
                    {trailer.title.toUpperCase()}
                  </h1>

                  {/* Badges Row */}
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={cn(
                        "h-8 px-4 text-base font-bold tracking-wide rounded-xl",
                        price === 0 
                          ? "bg-sky-500/95 hover:bg-sky-400/95 text-white border border-sky-400/70 shadow-sky-500/30"
                          : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-400/70 shadow-red-500/30"
                      )}
                    >
                      Video #{trailer.video_number}
                    </Badge>
                    <Badge 
                      className={cn(
                        "h-8 px-4 text-base font-bold tracking-wide rounded-xl",
                        price === 0 
                          ? "bg-sky-500/95 hover:bg-sky-400/95 text-white border border-sky-400/70 shadow-sky-500/30"
                          : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-400/70 shadow-red-500/30"
                      )}
                    >
                      {price === 0 ? "FREE" : formatPrice(price)}
                    </Badge>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-zinc-300" />
                    </div>
                    <div className="text-sm text-zinc-500 font-medium">
                      {trailer.creators}
                    </div>
                  </div>

                  {/* Duration */}
                  {lengthInMinutes > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-zinc-300" />
                      </div>
                      <div className="text-sm text-zinc-500 font-medium">
                        {formatLength(lengthInMinutes)}
                      </div>
                    </div>
                  )}

                  {/* Published Date */}
                  {trailer.created_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-zinc-300" />
                      </div>
                      <div className="text-sm text-zinc-500 font-medium">
                        {new Date(trailer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="pt-4 border-t border-zinc-800/40">
                    <Button 
                      className={cn(
                        "w-full py-3 text-base font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border",
                        price === 0
                          ? "bg-sky-500/40 hover:bg-sky-400/60 text-white border-sky-400/40 hover:shadow-sky-500/30"
                          : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-red-400/70 shadow-red-500/30"
                      )}
                    >
                      <DollarSign className="w-5 h-5 mr-2" />
                      {price === 0 ? 'Watch FREE Video' : `Purchase for ${formatPrice(price)}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          </div>
        </div>

        {/* Description Section - Simplified and Unified */}
        <div className="mt-12 space-y-6">
          {/* Description Card */}
          {trailer.description && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="overflow-hidden border border-zinc-800/40 rounded-2xl shadow-xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                      {trailer.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          )}

          {/* Additional Details */}
          {trailer.detailed_description && trailer.detailed_description !== trailer.description && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border border-zinc-800/40 rounded-2xl shadow-xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                      {trailer.detailed_description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          )}
        </div>

        {/* Related Videos */}
        {relatedTrailers && relatedTrailers.length > 0 && (
          <div className="mt-12">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-zinc-100">More from {trailer.creators}</h2>
                <Button asChild variant="outline" className="border-sky-500/30 hover:border-sky-400/50 hover:bg-sky-500/10 text-sky-400 hover:text-sky-300">
                  <Link href={`/?creator=${encodeURIComponent(trailer.creators)}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </Button>
              </div>

              {relatedLoading ? (
                <TrailerGrid>
                  {Array.from({ length: 3 }, (_, i) => (
                    <TrailerCardSkeleton key={i} />
                  ))}
                </TrailerGrid>
              ) : (
                <TrailerGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {relatedTrailers.map((relatedTrailer, index) => (
                    <m.div
                      key={relatedTrailer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      onMouseEnter={() => handleRelatedHover(relatedTrailer.id)}
                    >
                      <TrailerCard 
                        trailer={relatedTrailer} 
                        onPreview={(trailer) => router.push(`/video/${trailer.id}`)}
                      />
                    </m.div>
                  ))}
                </TrailerGrid>
              )}
            </m.div>
          </div>
        )}
      </main>

      {/* Sticky Mini Player */}
      <AnimatePresence>
        {showStickyPlayer && (
          <m.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 border-t border-zinc-800/40 z-50 bg-zinc-950/95 backdrop-blur-md"
          >
            <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3">
              <div className="flex items-center gap-4">
                {/* Mini Player */}
                <div className="w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                  <iframe
                    src={`https://iframe.videodelivery.net/${trailer.cf_video_uid}?autoplay=true&muted=true`}
                    className="w-full h-full rounded-lg border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    title={`Mini player for ${trailer.title}`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-zinc-100">{trailer.title}</h3>
                  <p className="text-sm text-zinc-500 truncate">
                    {trailer.creators}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge 
                    className={cn(
                      "border-zinc-700 text-zinc-300",
                      price === 0 
                        ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    )}
                  >
                    {price === 0 ? "FREE" : formatPrice(price)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                    onClick={() => {
                      mainPlayerRef.current?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      })
                    }}
                  >
                    Back to Video
                  </Button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
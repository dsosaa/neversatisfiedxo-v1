'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
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
const getUnifiedBackdrop = (classes: string) => {
  // Return unified CSS classes - works consistently across all browsers
  return classes
}
import Link from 'next/link'

// Lazy load heavy components to reduce initial bundle size
const CloudflarePlayer = lazy(() => import('@/components/cloudflare-player').then(module => ({
  default: module.CloudflarePlayer
})))

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
  const shouldUseAdvancedAnimations = true
  
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
      {/* Header with Safari-aware backdrop effects */}
      <header className={cn(
        "border-b border-border sticky top-0 z-40",
        getUnifiedBackdrop(
          "backdrop-blur-sm bg-background/80"
        )
      )}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-8">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Player with progressive enhancement */}
            {shouldUseAdvancedAnimations ? (
              <div className="lg:col-span-2">
                <m.div
                  ref={mainPlayerRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
                >
                  <Suspense fallback={
                    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                      <div className="text-muted-foreground">Loading player...</div>
                    </div>
                  }>
                    <CloudflarePlayer
                      uid={trailer.cf_video_uid}
                      autoplay={false}
                      muted={false}
                      className="rounded-2xl"
                      poster={`https://videodelivery.net/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg?time=0.03s&width=1920&height=1080&quality=95&fit=crop&format=webp&sharpen=1`}
                    />
                  </Suspense>
                </m.div>
              </div>
            ) : (
              <div className="lg:col-span-2">
                <div
                  ref={mainPlayerRef}
                  className="aspect-video rounded-2xl overflow-hidden bg-black shadow-xl opacity-100"
                >
                  <Suspense fallback={
                    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                      <div className="text-muted-foreground">Loading player...</div>
                    </div>
                  }>
                    <CloudflarePlayer
                      uid={trailer.cf_video_uid}
                      autoplay={false}
                      muted={false}
                      className="rounded-2xl"
                      poster={`https://videodelivery.net/${trailer.cf_video_uid}/thumbnails/thumbnail.jpg?time=0.03s&width=1920&height=1080&quality=95&fit=crop&format=webp&sharpen=1`}
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Enhanced Sidebar Info with progressive enhancement */}
            {shouldUseAdvancedAnimations ? (
              <div className="space-y-6">
                <m.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {/* Video Number Badge */}
                  <div className="mb-4">
                    <Badge 
                      variant="default"
                      className="bg-primary-20 text-primary px-4 py-2 rounded-xl text-base font-bold tracking-wide border-2 shadow-md"
                      style={{
                        borderColor: price === 0 ? 'hsl(217 91% 60%)' : 'hsl(0 84% 60%)',
                        backgroundColor: price === 0 ? 'hsl(217 91% 60% / 0.15)' : 'hsl(0 84% 60% / 0.15)',
                        color: price === 0 ? 'hsl(217 91% 90%)' : 'hsl(0 84% 90%)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      Video #{trailer.video_number}
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold mb-6 leading-tight text-foreground" 
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {trailer.title}
                  </h1>

                  {/* Enhanced Price Display */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105" 
                         style={{
                           borderColor: price === 0 ? 'hsl(217 91% 60%)' : 'hsl(0 84% 60%)',
                           backgroundColor: price === 0 ? 'hsl(217 91% 60% / 0.15)' : 'hsl(0 84% 60% / 0.15)',
                           boxShadow: price === 0 
                             ? '0 8px 24px -6px hsl(217 91% 60% / 0.3)' 
                             : '0 8px 24px -6px hsl(0 84% 60% / 0.3)'
                         }}>
                      <DollarSign className="w-6 h-6" style={{
                        color: price === 0 ? 'hsl(217 91% 75%)' : 'hsl(0 84% 75%)'
                      }} />
                      <span className="text-2xl font-bold" style={{
                        color: price === 0 ? 'hsl(217 91% 90%)' : 'hsl(0 84% 90%)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>
                        {price === 0 ? 'FREE' : formatPrice(price)}
                      </span>
                    </div>
                    
                    {trailer.upload_status !== 'Complete' && (
                      <Badge variant="destructive" className="mt-2">
                        {trailer.upload_status}
                      </Badge>
                    )}
                  </div>

                  {/* Enhanced Metadata */}
                  <div className="space-y-4">
                    <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-700/50">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400 font-medium">Creator</p>
                            <p className="text-slate-200 font-semibold">{trailer.creators}</p>
                          </div>
                        </div>
                        
                        {lengthInMinutes > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-400 font-medium">Duration</p>
                              <p className="text-slate-200 font-semibold">{formatLength(lengthInMinutes)}</p>
                            </div>
                          </div>
                        )}
                        
                        {trailer.created_at && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-400 font-medium">Published</p>
                              <p className="text-slate-200 font-semibold">
                                {new Date(trailer.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Purchase Button */}
                  {price > 0 && (
                    <Button 
                      className="w-full mt-6 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      size="lg"
                      style={{
                        background: 'linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(0 84% 50%) 100%)',
                        boxShadow: '0 8px 24px -6px hsl(0 84% 60% / 0.4)'
                      }}
                    >
                      <DollarSign className="w-5 h-5 mr-2" />
                      Purchase for {formatPrice(price)}
                    </Button>
                  )}

                  {/* Free Video CTA */}
                  {price === 0 && (
                    <div className="mt-6 p-4 rounded-xl border-2 text-center" 
                         style={{
                           borderColor: 'hsl(217 91% 60%)',
                           backgroundColor: 'hsl(217 91% 60% / 0.1)'
                         }}>
                      <p className="text-lg font-semibold mb-2" style={{
                        color: 'hsl(217 91% 90%)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        🎉 This video is FREE!
                      </p>
                      <p className="text-sm" style={{
                        color: 'hsl(217 91% 80%)'
                      }}>
                        Enjoy this complimentary content
                      </p>
                    </div>
                  )}
                </m.div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="opacity-100">
                  {/* Video Number Badge - Safari fallback */}
                  <div className="mb-4">
                    <Badge 
                      variant="default"
                      className="bg-primary-20 text-primary px-4 py-2 rounded-xl text-base font-bold tracking-wide border-2 shadow-md"
                      style={{
                        borderColor: price === 0 ? 'hsl(217 91% 60%)' : 'hsl(0 84% 60%)',
                        backgroundColor: price === 0 ? 'hsl(217 91% 60% / 0.15)' : 'hsl(0 84% 60% / 0.15)',
                        color: price === 0 ? 'hsl(217 91% 90%)' : 'hsl(0 84% 90%)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      Video #{trailer.video_number}
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold mb-6 leading-tight text-foreground" 
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {trailer.title}
                  </h1>

                  {/* Enhanced Price Display - Safari fallback */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 shadow-lg transition-all duration-300" 
                         style={{
                           borderColor: price === 0 ? 'hsl(217 91% 60%)' : 'hsl(0 84% 60%)',
                           backgroundColor: price === 0 ? 'hsl(217 91% 60% / 0.15)' : 'hsl(0 84% 60% / 0.15)',
                           boxShadow: price === 0 
                             ? '0 8px 24px -6px hsl(217 91% 60% / 0.3)' 
                             : '0 8px 24px -6px hsl(0 84% 60% / 0.3)'
                         }}>
                      <DollarSign className="w-6 h-6" style={{
                        color: price === 0 ? 'hsl(217 91% 75%)' : 'hsl(0 84% 75%)'
                      }} />
                      <span className="text-2xl font-bold" style={{
                        color: price === 0 ? 'hsl(217 91% 90%)' : 'hsl(0 84% 90%)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>
                        {price === 0 ? 'FREE' : formatPrice(price)}
                      </span>
                    </div>
                    
                    {trailer.upload_status !== 'Complete' && (
                      <Badge variant="destructive" className="mt-2">
                        {trailer.upload_status}
                      </Badge>
                    )}
                  </div>

                  {/* Enhanced Metadata - Safari fallback */}
                  <div className="space-y-4">
                    <Card className="bg-slate-900/60 border-slate-700/50">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400 font-medium">Creator</p>
                            <p className="text-slate-200 font-semibold">{trailer.creators}</p>
                          </div>
                        </div>
                        
                        {lengthInMinutes > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-400 font-medium">Duration</p>
                              <p className="text-slate-200 font-semibold">{formatLength(lengthInMinutes)}</p>
                            </div>
                          </div>
                        )}
                        
                        {trailer.created_at && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-400 font-medium">Published</p>
                              <p className="text-slate-200 font-semibold">
                                {new Date(trailer.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Purchase Button - Safari fallback */}
                  {price > 0 && (
                    <Button 
                      className="w-full mt-6 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300"
                      size="lg"
                      style={{
                        background: 'linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(0 84% 50%) 100%)',
                        boxShadow: '0 8px 24px -6px hsl(0 84% 60% / 0.4)'
                      }}
                    >
                      <DollarSign className="w-5 h-5 mr-2" />
                      Purchase for {formatPrice(price)}
                    </Button>
                  )}

                  {/* Free Video CTA - Safari fallback */}
                  {price === 0 && (
                    <div className="mt-6 p-4 rounded-xl border-2 text-center" 
                         style={{
                           borderColor: 'hsl(217 91% 60%)',
                           backgroundColor: 'hsl(217 91% 60% / 0.1)'
                         }}>
                      <p className="text-lg font-semibold mb-2" style={{
                        color: 'hsl(217 91% 90%)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        🎉 This video is FREE!
                      </p>
                      <p className="text-sm" style={{
                        color: 'hsl(217 91% 80%)'
                      }}>
                        Enjoy this complimentary content
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Description Section with progressive enhancement */}
        <div className="container mx-auto px-4">
          {shouldUseAdvancedAnimations ? (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                {/* Enhanced Description */}
                {trailer.description && (
                  <Card className={cn(
                    "border-slate-700/50 shadow-xl",
                    getUnifiedBackdrop(
                      "bg-slate-900/40 backdrop-blur-sm"
                    )
                  )}>
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Description</h2>
                      </div>
                      <div className="prose prose-slate prose-invert max-w-none">
                        <p className="text-slate-300 leading-relaxed text-lg">
                          {trailer.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Detailed Description */}
                {trailer.detailed_description && trailer.detailed_description !== trailer.description && (
                  <Card className={cn(
                    "border-slate-700/50 shadow-xl",
                    getUnifiedBackdrop(
                      "bg-slate-900/40 backdrop-blur-sm"
                    )
                  )}>
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Additional Details</h2>
                      </div>
                      <div className="prose prose-slate prose-invert max-w-none">
                        <p className="text-slate-300 leading-relaxed text-lg">
                          {trailer.detailed_description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Video Information */}
                <Card className={cn(
                  "border-slate-700/50 shadow-xl",
                  getUnifiedBackdrop(
                    "bg-slate-900/40 backdrop-blur-sm"
                  )
                )}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white">Video Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Video Number</dt>
                        <dd className="text-xl font-bold text-white">#{trailer.video_number}</dd>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Duration</dt>
                        <dd className="text-xl font-bold text-white">
                          {lengthInMinutes > 0 ? formatLength(lengthInMinutes) : trailer.length}
                        </dd>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Price</dt>
                        <dd className="text-xl font-bold" style={{
                          color: price === 0 ? 'hsl(217 91% 80%)' : 'hsl(0 84% 80%)'
                        }}>
                          {price === 0 ? 'FREE' : formatPrice(price)}
                        </dd>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Status</dt>
                        <dd className="flex items-center gap-2">
                          {trailer.upload_status === 'Complete' ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                              <span className="text-xl font-bold text-emerald-400">Complete</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                              <span className="text-xl font-bold text-amber-400">{trailer.upload_status}</span>
                            </>
                          )}
                        </dd>
                      </div>

                      {/* Additional Quality Information */}
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30 md:col-span-2">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Video Quality</dt>
                        <dd className="flex items-center gap-4 flex-wrap">
                          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-semibold">
                            Up to 4K UHD
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-semibold">
                            Adaptive Streaming
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-semibold">
                            Multi-codec Support
                          </span>
                        </dd>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </m.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 opacity-100">
              <div className="lg:col-span-2 space-y-6">
                {/* Enhanced Description - Safari fallback */}
                {trailer.description && (
                  <Card className={cn(
                    "border-slate-700/50 shadow-xl",
                    getUnifiedBackdrop(
                      "bg-slate-900/40 backdrop-blur-sm"
                    )
                  )}>
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Description</h2>
                      </div>
                      <div className="prose prose-slate prose-invert max-w-none">
                        <p className="text-slate-300 leading-relaxed text-lg">
                          {trailer.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Detailed Description - Safari fallback */}
                {trailer.detailed_description && trailer.detailed_description !== trailer.description && (
                  <Card className={cn(
                    "border-slate-700/50 shadow-xl",
                    getUnifiedBackdrop(
                      "bg-slate-900/40 backdrop-blur-sm"
                    )
                  )}>
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Additional Details</h2>
                      </div>
                      <div className="prose prose-slate prose-invert max-w-none">
                        <p className="text-slate-300 leading-relaxed text-lg">
                          {trailer.detailed_description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Video Information - Safari fallback */}
                <Card className={cn(
                  "border-slate-700/50 shadow-xl",
                  getUnifiedBackdrop(
                    "bg-slate-900/40 backdrop-blur-sm"
                  )
                )}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white">Video Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Video Number</dt>
                        <dd className="text-xl font-bold text-white">#{trailer.video_number}</dd>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Duration</dt>
                        <dd className="text-xl font-bold text-white">
                          {lengthInMinutes > 0 ? formatLength(lengthInMinutes) : trailer.length}
                        </dd>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Price</dt>
                        <dd className="text-xl font-bold" style={{
                          color: price === 0 ? 'hsl(217 91% 80%)' : 'hsl(0 84% 80%)'
                        }}>
                          {price === 0 ? 'FREE' : formatPrice(price)}
                        </dd>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Status</dt>
                        <dd className="flex items-center gap-2">
                          {trailer.upload_status === 'Complete' ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                              <span className="text-xl font-bold text-emerald-400">Complete</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                              <span className="text-xl font-bold text-amber-400">{trailer.upload_status}</span>
                            </>
                          )}
                        </dd>
                      </div>

                      {/* Additional Quality Information */}
                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/30 md:col-span-2">
                        <dt className="text-sm font-medium text-slate-400 mb-2">Video Quality</dt>
                        <dd className="flex items-center gap-4 flex-wrap">
                          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-semibold">
                            Up to 4K UHD
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-semibold">
                            Adaptive Streaming
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm font-semibold">
                            Multi-codec Support
                          </span>
                        </dd>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Related Videos with progressive enhancement */}
        {relatedTrailers && relatedTrailers.length > 0 && (
          <div className="container mx-auto px-4 mt-12">
            {shouldUseAdvancedAnimations ? (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">More from {trailer.creators}</h2>
                  <Button asChild variant="outline">
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
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
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
            ) : (
              <div className="opacity-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">More from {trailer.creators}</h2>
                  <Button asChild variant="outline">
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
                    {relatedTrailers.map((relatedTrailer, _index) => (
                      <div
                        key={relatedTrailer.id}
                        onMouseEnter={() => handleRelatedHover(relatedTrailer.id)}
                        className="opacity-100"
                      >
                        <TrailerCard 
                          trailer={relatedTrailer} 
                          onPreview={(trailer) => router.push(`/video/${trailer.id}`)}
                        />
                      </div>
                    ))}
                  </TrailerGrid>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky Mini Player with progressive enhancement */}
      <AnimatePresence>
        {showStickyPlayer && (
          shouldUseAdvancedAnimations ? (
            <m.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                "fixed bottom-0 left-0 right-0 border-t border-border z-50",
                getUnifiedBackdrop(
                  "bg-background/95 backdrop-blur-md"
                )
              )}
            >
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-4">
                  {/* Mini Player */}
                  <div className="w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <Suspense fallback={
                      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                        <div className="text-muted-foreground text-xs">Loading...</div>
                      </div>
                    }>
                      <CloudflarePlayer
                        uid={trailer.cf_video_uid}
                        autoplay={true}
                        muted={true}
                        className="rounded-lg"
                      />
                    </Suspense>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{trailer.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {trailer.creators}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline">{formatPrice(price)}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
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
          ) : (
            <div className={cn(
              "fixed bottom-0 left-0 right-0 border-t border-border z-50 opacity-100",
              getUnifiedBackdrop(
                "bg-background/95 backdrop-blur-md"
              )
            )}>
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-4">
                  {/* Mini Player */}
                  <div className="w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <Suspense fallback={
                      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                        <div className="text-muted-foreground text-xs">Loading...</div>
                      </div>
                    }>
                      <CloudflarePlayer
                        uid={trailer.cf_video_uid}
                        autoplay={true}
                        muted={true}
                        className="rounded-lg"
                      />
                    </Suspense>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{trailer.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {trailer.creators}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline">{formatPrice(price)}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
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
            </div>
          )
        )}
      </AnimatePresence>
    </div>
  )
}
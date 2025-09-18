"use client"

import { useState, useCallback, useEffect } from 'react'
import { TrailerCard, TrailerCardSkeleton, TrailerGrid, TrailerList, TrailerListItem } from '@/components/trailer-card'
import { m, motionPresets } from '@/lib/motion'
// Removed unused preloader hook
import type { Trailer } from '@/lib/types'
import { generateOptimizedThumbnailUrl } from '@/lib/image-utils'

// Import QuickPreview directly for better mobile compatibility
import dynamic from 'next/dynamic'
const QuickPreview = dynamic(() => import('@/components/quick-preview').then(m => m.QuickPreview), { ssr: false })

// Loading skeleton for QuickPreview - mimics the modal structure (not used anymore)
// function QuickPreviewSkeleton({ 
//   open, 
//   onOpenChange 
// }: { 
//   open: boolean
//   onOpenChange: (open: boolean) => void 
// }) {
//   if (!open) return null
//   
//   return (
//     <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
//       <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-pulse">
//         {/* Close button */}
//         <div className="absolute top-4 right-4 z-10">
//           <button
//             onClick={() => onOpenChange(false)}
//             className="w-10 h-10 rounded-full bg-muted"
//           />
//         </div>
//         
//         {/* Video skeleton */}
//         <div className="aspect-video bg-muted" />
//         
//         {/* Content skeleton */}
//         <div className="p-8 space-y-6">
//           <div className="flex items-center justify-between">
//             <div className="h-8 bg-muted rounded w-32" />
//             <div className="h-8 bg-muted rounded w-20" />
//           </div>
//           <div className="h-10 bg-muted rounded w-3/4" />
//           <div className="space-y-2">
//             <div className="h-4 bg-muted rounded" />
//             <div className="h-4 bg-muted rounded w-2/3" />
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

interface TrailerDisplayProps {
  trailers: Trailer[]
  isLoading: boolean
  error: Error | null
  viewMode: 'grid' | 'list'
  searchQuery?: string
}

export function TrailerDisplay({ 
  trailers, 
  isLoading, 
  error, 
  viewMode,
  searchQuery 
}: TrailerDisplayProps) {
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  
  // Removed complex preloading logic

  const handlePreview = useCallback((trailer: Trailer) => {
    setSelectedTrailer(trailer)
    setPreviewOpen(true)
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false)
    setTimeout(() => setSelectedTrailer(null), 300)
  }, [])

  // Background preload of upcoming thumbnails (beyond viewport)
  useEffect(() => {
    if (!trailers || trailers.length === 0) return

    const CONCURRENCY = 6

    // Preload ALL trailer thumbnails in the background
    const urls = trailers
      .filter(t => !!t.cf_video_uid)
      .map(t => generateOptimizedThumbnailUrl(t.cf_video_uid, {
        time: '0.005s',
        width: 800,
        height: 450,
        quality: 75,
        format: 'jpeg',
        fit: 'crop'
      }))

    let cancelled = false
    let index = 0
    let active = 0

    const startNext = () => {
      if (cancelled) return
      if (index >= urls.length) return
      while (active < CONCURRENCY && index < urls.length) {
        const src = urls[index++]
        active++
        const img = new Image()
        // Hint to browser: low priority background fetch
        try { (img as any).fetchPriority = 'low' } catch {}
        img.decoding = 'async'
        img.onload = img.onerror = () => {
          active--
          startNext()
        }
        img.src = src
      }
    }

    startNext()
    return () => { cancelled = true }
  }, [trailers])

  if (isLoading) {
    return viewMode === 'grid' ? (
      <TrailerGrid>
        {Array.from({ length: 8 }, (_, i) => (
          <TrailerCardSkeleton key={i} />
        ))}
      </TrailerGrid>
    ) : (
      <TrailerList>
        {Array.from({ length: 4 }, (_, i) => (
          <TrailerCardSkeleton key={i} />
        ))}
      </TrailerList>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Failed to load trailers. Please try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (trailers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {searchQuery ? 'No trailers found matching your search.' : 'No trailers available.'}
        </p>
        {searchQuery && (
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <TrailerGrid>
          {trailers.map((trailer, index) => (
            <m.div
              key={trailer.id}
              {...motionPresets.slideUp}
              transition={{ 
                duration: 0.3,
                delay: index * 0.02 
              }}
            >
              <TrailerCard
                trailer={trailer}
                highPriority={index < 24}
                onPreview={handlePreview}
              />
            </m.div>
          ))}
        </TrailerGrid>
      ) : (
        <TrailerList>
          {trailers.map((trailer, index) => (
            <m.div
              key={trailer.id}
              {...motionPresets.slideLeft}
              transition={{ 
                duration: 0.3,
                delay: index * 0.02 
              }}
            >
              <TrailerListItem
                trailer={trailer}
                highPriority={index < 24}
                onPreview={handlePreview}
              />
            </m.div>
          ))}
        </TrailerList>
      )}

      {/* Quick Preview Dialog */}
      <QuickPreview
        trailer={selectedTrailer}
        open={previewOpen}
        onOpenChange={handleClosePreview}
      />
    </>
  )
}

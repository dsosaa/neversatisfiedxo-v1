'use client'

import { useState, useMemo, useCallback } from 'react'
import { GalleryControls } from '@/components/gallery-controls'
import { TrailerDisplay } from '@/components/trailer-display'
import type { FilterOptions } from '@/components/modern-filter-chips'
import { useTrailers, useSearchTrailers } from '@/lib/hooks'
import type { Trailer, TrailerFilters } from '@/lib/types'
import { parsePrice } from '@/lib/api'
import { useDebounce } from '@/lib/use-debounce'

import { ModernFilterChips } from '@/components/modern-filter-chips'

// Lazy load command palette (heavy component with search functionality)
// const CommandPalette = lazy(() => import('@/components/command-palette').then(module => ({
//   default: module.CommandPalette
// })))

// Monitoring dashboard removed for production cleanup


interface GalleryProviderProps {
  initialData?: {
    results: Trailer[]
    count: number
    next?: string
    previous?: string
  }
}

export function GalleryProvider({ initialData }: GalleryProviderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TrailerFilters>({})
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high'>('oldest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [_activeFilters, setActiveFilters] = useState<FilterOptions>({
    selectedPriceRanges: [],
    creators: [],
    selectedYears: []
  })

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch data - only call hooks when needed
  const searchEnabled = searchQuery.trim().length > 2
  const { data: searchData, isLoading: searchLoading, error: searchError } = useSearchTrailers(debouncedSearchQuery, searchEnabled)
  
  // Only fetch trailers if we don't have initial data or if filters are applied
  const hasFilters = Object.keys(filters).length > 0
  const shouldFetchTrailers = !initialData || hasFilters
  const { data: trailersData, isLoading: trailersLoading, error: trailersError } = useTrailers(filters, { enabled: shouldFetchTrailers })

  // Use search data if searching, otherwise use filtered trailers, fallback to initial data
  const finalData = searchEnabled ? searchData : (trailersData || initialData)
  const isLoading = searchEnabled ? searchLoading : (shouldFetchTrailers ? trailersLoading : false)
  const error = searchEnabled ? searchError : trailersError

  // Note: Latest video number is now calculated server-side

  // Sort trailers
  const sortedTrailers = useMemo(() => {
    if (!finalData?.results) return []

    const trailers = [...finalData.results]

    // Apply sorting
    return trailers.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.video_number || 0) - (a.video_number || 0)
        case 'oldest':
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        case 'price_low':
          return parsePrice(a.price) - parsePrice(b.price)
        case 'price_high':
          return parsePrice(b.price) - parsePrice(a.price)
        default:
          return 0
      }
    })
  }, [finalData?.results, sortBy])

  const handleFilterApply = useCallback((newFilters: FilterOptions) => {
    setActiveFilters(newFilters)
    // Convert FilterOptions to TrailerFilters format
    const apiFilters: TrailerFilters = {}
    
    // Handle price range filtering with specific rules
    if (newFilters.selectedPriceRanges.length > 0) {
      const priceRanges = newFilters.selectedPriceRanges
      
      // FREE (contains all free videos)
      if (priceRanges.includes('free')) {
        apiFilters.price_max = 0
      }
      // $15< (contains all videos that are $15 or less but excludes free videos)
      else if (priceRanges.includes('15-below')) {
        apiFilters.price_min = 0.01
        apiFilters.price_max = 15
      }
      // $20 (all videos that are $20)
      else if (priceRanges.includes('20')) {
        apiFilters.price_min = 20
        apiFilters.price_max = 20
      }
      // $25 (all videos $25 through $29.99)
      else if (priceRanges.includes('25')) {
        apiFilters.price_min = 25
        apiFilters.price_max = 29.99
      }
      // $30+ (all videos $30 - $39.99)
      else if (priceRanges.includes('30')) {
        apiFilters.price_min = 30
        apiFilters.price_max = 39.99
      }
      // $40+ (all videos $40 and above)
      else if (priceRanges.includes('40-plus')) {
        apiFilters.price_min = 40
      }
      
      // Handle multiple price ranges (if multiple are selected)
      if (priceRanges.length > 1) {
        // For multiple ranges, we'll need to handle this differently
        // For now, we'll use the first selected range
        // TODO: Implement proper multi-range filtering
      }
    }
    
    // Handle year filtering
    if (newFilters.selectedYears.length > 0) {
      // For now, use the first selected year. In the future, we could support multiple years
      apiFilters.year = newFilters.selectedYears[0]
    }
    
    setFilters(apiFilters)
  }, [])


  return (
    <div className="space-y-6">
      <GalleryControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ModernFilterChips
        filters={_activeFilters}
        onFiltersChange={handleFilterApply}
        availableCreators={finalData?.results ? [...new Set(finalData.results.map(t => t.creators))] : []}
      />

      <TrailerDisplay
        trailers={sortedTrailers}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
        searchQuery={searchQuery}
      />
    </div>
  )
}
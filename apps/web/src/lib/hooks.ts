'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './api'
import type { Trailer, TrailerFilters, AuthResponse } from './types'

// Query keys
export const queryKeys = {
  trailers: ['trailers'] as const,
  trailer: (id: string) => ['trailers', id] as const,
  trailersWithFilters: (filters: TrailerFilters) => ['trailers', filters] as const,
  relatedTrailers: (trailerId: string) => ['trailers', 'related', trailerId] as const,
}

// Auth hooks
export const useVerifyPassword = () => {
  return useMutation({
    mutationFn: (password: string) => apiClient.verifyPassword(password),
    onSuccess: (data: AuthResponse) => {
      if (data.success) {
        // Password verification successful - cookie should be set by the API
        console.log('Authentication successful')
      }
    },
    onError: (error) => {
      console.error('Authentication failed:', error)
    },
  })
}

// Trailer hooks
export const useTrailers = (filters: TrailerFilters = {}, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: queryKeys.trailersWithFilters(filters),
    queryFn: () => apiClient.getTrailers(filters),
    enabled: options.enabled !== false,
    staleTime: 15 * 60 * 1000, // 15 minutes (increased for better performance)
    gcTime: 30 * 60 * 1000, // 30 minutes (increased for better caching)
    retry: 2, // Reduced retries for faster failure
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: false, // Disable refetch on mount if data exists
    refetchOnReconnect: 'always', // Only refetch on reconnect
  })
}

export const useTrailer = (id: string) => {
  return useQuery({
    queryKey: queryKeys.trailer(id),
    queryFn: () => apiClient.getTrailer(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes (increased for video data)
    gcTime: 60 * 60 * 1000, // 60 minutes (increased for video data)
    retry: 2, // Reduced retries for faster failure
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: false, // Disable refetch on mount if data exists
    refetchOnReconnect: 'always', // Only refetch on reconnect
  })
}

export const useSearchTrailers = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['trailers', 'search', query],
    queryFn: () => apiClient.searchTrailers(query),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes (increased for search results)
    gcTime: 15 * 60 * 1000, // 15 minutes (increased for search results)
    retry: 1, // Reduced retries for search
    retryDelay: 1000, // Fixed retry delay for search
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: false, // Disable refetch on mount if data exists
  })
}

export const useRelatedTrailers = (trailer: Trailer | null) => {
  return useQuery({
    queryKey: queryKeys.relatedTrailers(trailer?.id || ''),
    queryFn: () => trailer ? apiClient.getRelatedTrailers(trailer) : Promise.resolve([]),
    enabled: !!trailer,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Prefetch utilities
export const usePrefetchTrailer = () => {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.trailer(id),
      queryFn: () => apiClient.getTrailer(id),
      staleTime: 10 * 60 * 1000,
    })
  }
}

export const usePrefetchRelatedTrailers = () => {
  const queryClient = useQueryClient()
  
  return (trailer: Trailer) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.relatedTrailers(trailer.id),
      queryFn: () => apiClient.getRelatedTrailers(trailer),
      staleTime: 15 * 60 * 1000,
    })
  }
}

// Cache utilities
export const useInvalidateTrailers = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.trailers,
    })
  }
}

// Optimistic updates
export const useUpdateTrailerCache = () => {
  const queryClient = useQueryClient()
  
  return (updatedTrailer: Trailer) => {
    // Update individual trailer cache
    queryClient.setQueryData(
      queryKeys.trailer(updatedTrailer.id),
      updatedTrailer
    )
    
    // Update trailers list cache
    queryClient.setQueriesData(
      { queryKey: queryKeys.trailers },
      (oldData: { results?: Trailer[] } | undefined) => {
        if (!oldData?.results) return oldData
        
        return {
          ...oldData,
          results: oldData.results.map((trailer: Trailer) =>
            trailer.id === updatedTrailer.id ? updatedTrailer : trailer
          ),
        }
      }
    )
  }
}
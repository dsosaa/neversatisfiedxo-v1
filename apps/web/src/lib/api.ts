import type { Trailer, ApiResponse, TrailerFilters, AuthResponse } from './types'

const BASE_URL = process.env.MEDIACMS_BASE_URL || 'http://localhost:8000'

class ApiClient {
  constructor(_baseURL: string = BASE_URL, _token?: string) {
    // Constructor parameters kept for backward compatibility but not stored
    // All API calls now go directly to frontend API endpoints
  }


  // Auth endpoints - Use frontend API (localhost:3000), not MediaCMS backend
  async verifyPassword(accessCode: string): Promise<AuthResponse> {
    const frontendBaseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    
    const response = await fetch(`${frontendBaseURL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessCode }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Trailer endpoints - Use frontend API (localhost:3000), not MediaCMS backend
  async getTrailers(filters: TrailerFilters = {}): Promise<ApiResponse<Trailer>> {
    const searchParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const query = searchParams.toString()
    const endpoint = `/api/trailers${query ? `?${query}` : ''}`
    
    // Handle different runtime contexts
    let baseURL: string
    if (typeof window !== 'undefined') {
      // Browser context - use current origin
      baseURL = window.location.origin
    } else {
      // Server-side context - use environment variable or fallback
      baseURL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000'
    }
    
    const fullURL = `${baseURL}${endpoint}`
    
    try {
      const response = await fetch(fullURL)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${fullURL}`)
      }
      
      return response.json()
    } catch (error) {
      const errorInfo = {
        url: fullURL,
        filters,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorString: String(error)
      }
      console.error('Error fetching trailers:', errorInfo)
      throw error
    }
  }

  async getTrailer(id: string): Promise<Trailer> {
    // Handle different runtime contexts
    let baseURL: string
    if (typeof window !== 'undefined') {
      // Browser context - use current origin
      baseURL = window.location.origin
    } else {
      // Server-side context - use environment variable or fallback
      baseURL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000'
    }
    
    const fullURL = `${baseURL}/api/trailers/${id}`
    
    try {
      const response = await fetch(fullURL)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${fullURL}`)
      }
      
      const data = await response.json()
      
      // The individual trailer endpoint returns the trailer object directly
      return data
    } catch (error) {
      const errorInfo = {
        url: fullURL,
        id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorString: String(error)
      }
      console.error('Error fetching trailer:', errorInfo)
      throw error
    }
  }

  // Search trailers
  async searchTrailers(query: string): Promise<ApiResponse<Trailer>> {
    return this.getTrailers({ search: query })
  }

  // Get related trailers (same creator or similar content)
  async getRelatedTrailers(trailer: Trailer, limit: number = 6): Promise<Trailer[]> {
    const response = await this.getTrailers({ 
      creator: trailer.creators,
    })
    
    // Filter out the current trailer and randomize the order
    const filtered = response.results.filter(t => t.id !== trailer.id)
    
    // Fisher-Yates shuffle algorithm for randomization
    const shuffled = [...filtered]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    // Return limited results
    return shuffled.slice(0, limit)
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Utility functions for parsing data
export const parsePrice = (priceString: string): number => {
  if (priceString.toLowerCase() === 'free') return 0
  const match = priceString.match(/\$?(\d+(?:\.\d{2})?)/)
  return match ? parseFloat(match[1]) : 0
}

export const parseLength = (lengthString: string): number => {
  // Parse formats like "25 Minutes", "1 Hour 15 Minutes", "32 Minutes"
  const match = lengthString.match(/(\d+)\s*(?:Hour|Hr)?s?\s*(\d+)?\s*(?:Minute|Min)?s?/i)
  if (match) {
    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    return lengthString.toLowerCase().includes('hour') ? hours * 60 + minutes : hours
  }
  return 0
}

export const formatPrice = (price: number): string => {
  return price === 0 ? 'FREE' : `$${price}`
}

export const formatLength = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
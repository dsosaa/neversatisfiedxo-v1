import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { getVideoUID, hasVideoMapping, MAPPING_STATS } from '../../../lib/video-mapping'

// Type for trailer data
interface TrailerData {
  id: string
  cf_video_uid: string
  cf_thumb_uid: string
  video_number: number
  title: string
  description: string
  price: string
  price_numeric: number
  length: string
  length_minutes: number
  creators: string
  upload_status: string
  is_featured: boolean
  is_premium: boolean
  created_at: string
}

// Parse price string to numeric value
function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.toUpperCase() === 'FREE') {
    return 0
  }
  return parseInt(priceStr.replace('$', ''), 10) || 0
}

// Parse length string to minutes
function parseLength(lengthStr: string): number {
  if (!lengthStr) return 0
  
  const lower = lengthStr.toLowerCase()
  let totalMinutes = 0
  
  if (lower.includes('hour')) {
    const hours = parseInt(lower.split('hour')[0].trim(), 10) || 0
    totalMinutes += hours * 60
    const remaining = lower.split('hour')[1]
    if (remaining && remaining.includes('minute')) {
      const minutes = parseInt(remaining.split('minute')[0].trim(), 10) || 0
      totalMinutes += minutes
    }
  } else if (lower.includes('minute')) {
    totalMinutes = parseInt(lower.split('minute')[0].trim(), 10) || 0
  }
  
  return totalMinutes
}

// Load trailer data from CSV
function loadTrailerData(): TrailerData[] {
  try {
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      path.join(process.cwd(), '../../data/VideoDB.csv'),
      path.join(process.cwd(), '../../../data/VideoDB.csv'),
      path.join(process.cwd(), 'data/VideoDB.csv'),
      path.join(__dirname, '../../../../data/VideoDB.csv'),
    ]
    
    let csvPath: string | null = null
    let csvContent: string | null = null
    
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          csvPath = testPath
          csvContent = fs.readFileSync(testPath, 'utf-8')
          break
        }
      } catch {
        // Continue trying other paths
        continue
      }
    }
    
    if (!csvContent || !csvPath) {
      console.error('CSV file not found at any of these locations:', possiblePaths)
      return []
    }
    
    console.log('Successfully loaded CSV from:', csvPath)
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    })
    
    const trailers: TrailerData[] = []
    const data = parseResult.data as Record<string, unknown>[]
    
    data.forEach((row: Record<string, unknown>, index: number) => {
      const videoNumber = String(row['Video Number'] || '').replace('Video ', '').trim()
      const csvVideoId = String(row['Video ID'] || '').trim()
      
      // Skip if essential data is missing
      if (!videoNumber || !csvVideoId) {
        return
      }
      
      const videoNum = parseInt(videoNumber, 10) || index
      
      // Get real Cloudflare video UID from our mapping, fallback to CSV ID
      const realVideoUID = getVideoUID(videoNum) || csvVideoId
      const hasRealMapping = hasVideoMapping(videoNum)
      
      const priceStr = String(row['Price'] || 'FREE')
      const lengthStr = String(row['Length'] || '')
      
      const trailer: TrailerData = {
        id: realVideoUID, // Use real Cloudflare video UID as primary key
        cf_video_uid: realVideoUID,
        cf_thumb_uid: String(row['Thumbnail ID'] || ''),
        video_number: videoNum,
        title: String(row['Description'] || 'Untitled'),
        description: String(row['Detailed Description'] || ''),
        price: priceStr,
        price_numeric: parsePrice(priceStr),
        length: lengthStr,
        length_minutes: parseLength(lengthStr),
        creators: String(row['Creators'] || ''),
        upload_status: hasRealMapping ? 'Complete' : 'Unavailable', // Mark unmapped videos
        is_featured: false,
        is_premium: parsePrice(priceStr) > 0,
        created_at: new Date().toISOString(), // Default timestamp
      }
      
      trailers.push(trailer)
    })
    
    return trailers
  } catch (error) {
    console.error('Error loading trailer data:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const cfVideoUid = searchParams.get('cf_video_uid')
    const minPrice = searchParams.get('price_min')
    const maxPrice = searchParams.get('price_max')
    const minLength = searchParams.get('length_min')
    const maxLength = searchParams.get('length_max')
    const creator = searchParams.get('creator')
    const status = searchParams.get('status')
    const featured = searchParams.get('is_featured')
    const premium = searchParams.get('is_premium')
    const ordering = searchParams.get('ordering') || '-created_at'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('page_size') || '200', 10) // Increased default to show all videos
    
    let trailers = loadTrailerData()
    
    // Apply filters
    if (cfVideoUid) {
      trailers = trailers.filter(trailer => trailer.cf_video_uid === cfVideoUid)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      trailers = trailers.filter(trailer => 
        trailer.title.toLowerCase().includes(searchLower) ||
        trailer.description.toLowerCase().includes(searchLower) ||
        trailer.creators.toLowerCase().includes(searchLower)
      )
    }
    
    if (minPrice) {
      trailers = trailers.filter(trailer => trailer.price_numeric >= parseFloat(minPrice))
    }
    
    if (maxPrice) {
      trailers = trailers.filter(trailer => trailer.price_numeric <= parseFloat(maxPrice))
    }
    
    if (minLength) {
      trailers = trailers.filter(trailer => trailer.length_minutes >= parseFloat(minLength))
    }
    
    if (maxLength) {
      trailers = trailers.filter(trailer => trailer.length_minutes <= parseFloat(maxLength))
    }
    
    if (creator) {
      const creatorLower = creator.toLowerCase()
      trailers = trailers.filter(trailer => 
        trailer.creators.toLowerCase().includes(creatorLower)
      )
    }
    
    if (status) {
      trailers = trailers.filter(trailer => trailer.upload_status === status)
    }
    
    if (featured !== null) {
      trailers = trailers.filter(trailer => trailer.is_featured === (featured === 'true'))
    }
    
    if (premium !== null) {
      trailers = trailers.filter(trailer => trailer.is_premium === (premium === 'true'))
    }
    
    // Apply ordering
    trailers.sort((a, b) => {
      const field = ordering.startsWith('-') ? ordering.slice(1) : ordering
      const order = ordering.startsWith('-') ? -1 : 1
      
      switch (field) {
        case 'created_at':
          return order * (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        case 'price':
          return order * (a.price_numeric - b.price_numeric)
        case 'length':
          return order * (a.length_minutes - b.length_minutes)
        case 'title':
          return order * a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    
    // Apply pagination
    const totalCount = trailers.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTrailers = trailers.slice(startIndex, endIndex)
    
    // Calculate mapping statistics for debug info
    const mappedVideos = trailers.filter(t => hasVideoMapping(t.video_number))
    const unmappedVideos = trailers.filter(t => !hasVideoMapping(t.video_number))
    
    const response = {
      count: totalCount,
      next: endIndex < totalCount ? `${request.url.split('?')[0]}?page=${page + 1}` : null,
      previous: page > 1 ? `${request.url.split('?')[0]}?page=${page - 1}` : null,
      results: paginatedTrailers,
      mapping_info: {
        total_videos_in_csv: trailers.length,
        videos_with_real_mapping: mappedVideos.length,
        videos_without_mapping: unmappedVideos.length,
        total_available_mappings: MAPPING_STATS.totalMappings,
        mapping_coverage: `${Math.round((mappedVideos.length / trailers.length) * 100)}%`
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
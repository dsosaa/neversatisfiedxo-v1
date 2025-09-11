import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

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
  
  // Extract numeric value from price string (e.g., "$20" -> 20)
  const match = priceStr.match(/\$(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

// Parse length string to minutes
function parseLength(lengthStr: string): number {
  if (!lengthStr) return 0
  
  // Handle various length formats
  const timeMatch = lengthStr.match(/(\d+)\s*(?:min|minutes?|mins?)/i)
  if (timeMatch) {
    return parseInt(timeMatch[1], 10)
  }
  
  // Handle hour format
  const hourMatch = lengthStr.match(/(\d+)\s*(?:hour|hours?|hrs?)/i)
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 60
  }
  
  // Handle "1 Hour+" format
  if (lengthStr.toLowerCase().includes('hour+')) {
    return 60
  }
  
  // Handle "1.5 Hours" format
  const decimalHourMatch = lengthStr.match(/(\d+\.?\d*)\s*(?:hour|hours?|hrs?)/i)
  if (decimalHourMatch) {
    return Math.round(parseFloat(decimalHourMatch[1]) * 60)
  }
  
  return 0
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
      const videoNumber = String(row['Video Number'] || '').trim()
      const videoId = String(row['Video ID'] || '').trim()
      
      // Skip if essential data is missing
      if (!videoNumber || !videoId) {
        return
      }
      
      const priceStr = String(row['Price'] || 'FREE')
      const lengthStr = String(row['Length'] || '')
      
      const trailer: TrailerData = {
        id: videoId, // Use Cloudflare video ID as primary key
        cf_video_uid: videoId,
        cf_thumb_uid: String(row['Thumbnail ID'] || ''),
        video_number: parseInt(videoNumber, 10) || index,
        title: String(row['Description'] || 'Untitled'),
        description: String(row['Detailed Description'] || ''),
        price: priceStr,
        price_numeric: parsePrice(priceStr),
        length: lengthStr,
        length_minutes: parseLength(lengthStr),
        creators: String(row['Creators'] || ''),
        upload_status: String(row['Upload Status'] || 'Complete'),
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' }, 
        { status: 400 }
      )
    }
    
    const trailers = loadTrailerData()
    const trailer = trailers.find(t => t.cf_video_uid === videoId || t.id === videoId)
    
    if (!trailer) {
      return NextResponse.json(
        { error: 'Trailer not found' }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json(trailer)
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

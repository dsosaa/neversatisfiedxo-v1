import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Real Cloudflare Stream video ID mapping
const VIDEO_ID_MAPPING: Record<number, string> = {
  189: '62fee0bff98a4dc4b8dffbaffbb143a4',
  188: 'b9499650940443b7b47168794ad2a314',
  177: 'f535d3ebfc3140bcbf194f0cf50ad824',
  86: 'ba25eca76fa24bbe82a36b1eaf39f166',
  46: 'cf5b52ffc3ad4b32908aa64d96e38603',
  36: 'f93d4f243366aeaca0be7394e0a7a61e',
  28: '6938118acc7f8afbee07890ec3efd74a',
  45: '1d512b5028958b771bb5298c055f0fe7',
  44: 'cf5a273407b9388487b29c0444e7e665',
  35: 'd68ccb8b43de484ba663d41c9c2213e9',
  182: '5e4ec3fd39aa438092619a4decce6b18',
  181: 'eda292db8daa4b60ad80f83fce2ef252',
  180: '2b858787cf6e4c1b93e42b5f795fed5a',
}

interface TrailerData {
  id: string
  cf_video_uid: string
  cf_thumb_uid: string
  video_number: number
  title: string
  description: string
  creators: string
  length: string
  price: string
  upload_status: string
  upload_date: string
  created_date: string
  is_featured: boolean
  is_premium: boolean
}

let trailerCache: TrailerData[] | null = null
let lastCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getTrailers(): Promise<TrailerData[]> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (trailerCache && (now - lastCacheTime) < CACHE_DURATION) {
    return trailerCache
  }

  try {
    const csvPath = path.join(process.cwd(), 'data/VideoDB.csv')
    const csvData = await fs.readFile(csvPath, 'utf8')
    
    // Simple CSV parsing
    const lines = csvData.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const records = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const record: Record<string, string> = {}
        headers.forEach((header, index) => {
          record[header] = values[index] || ''
        })
        return record
      })


    trailerCache = records.map((row: Record<string, string>) => {
      const videoNumber = parseInt(String(row['Video Number'] || row['video_number'] || '0'))
      const realVideoId = VIDEO_ID_MAPPING[videoNumber]
      
      // Use real video ID if available, otherwise keep original (which will show errors)
      const videoId = realVideoId || String(row['Video ID'] || row['cf_video_uid'] || '')
      
      const trailer: TrailerData = {
        id: videoId, // Use real video ID as primary key
        cf_video_uid: videoId,
        cf_thumb_uid: String(row['Thumbnail ID'] || ''),
        video_number: videoNumber,
        title: String(row['Title'] || 'Untitled'),
        description: String(row['Description'] || ''),
        creators: String(row['Creators'] || 'Unknown'),
        length: String(row['Length (min)'] || row['length'] || '0'),
        price: String(row['Price ($)'] || row['price'] || '0'),
        upload_status: 'Complete',
        upload_date: String(row['Upload Date'] || ''),
        created_date: new Date().toISOString(),
        is_featured: String(row['Featured'] || '').toLowerCase() === 'yes',
        is_premium: parseFloat(String(row['Price ($)'] || '0')) > 0
      }

      return trailer
    })

    lastCacheTime = now
    // Processed trailers with video mappings
    return trailerCache || []

  } catch (error) {
    console.error('❌ Error loading trailers:', error)
    return []
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const creator = searchParams.get('creator')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let trailers = await getTrailers()

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase()
      trailers = trailers.filter(trailer => 
        trailer.title.toLowerCase().includes(searchLower) ||
        trailer.description.toLowerCase().includes(searchLower) ||
        trailer.creators.toLowerCase().includes(searchLower)
      )
    }

    // Filter by creator
    if (creator) {
      const creatorLower = creator.toLowerCase()
      trailers = trailers.filter(trailer => 
        trailer.creators.toLowerCase().includes(creatorLower)
      )
    }

    // Apply pagination
    const paginatedTrailers = trailers.slice(offset, offset + limit)
    
    // Separate videos with real IDs vs fake IDs
    const workingVideos = paginatedTrailers.filter(t => VIDEO_ID_MAPPING[t.video_number])
    const brokenVideos = paginatedTrailers.filter(t => !VIDEO_ID_MAPPING[t.video_number])


    return NextResponse.json({
      trailers: paginatedTrailers,
      pagination: {
        total: trailers.length,
        limit,
        offset,
        hasMore: offset + limit < trailers.length
      },
      debug: {
        working_videos: workingVideos.length,
        broken_videos: brokenVideos.length,
        total_real_mappings: Object.keys(VIDEO_ID_MAPPING).length,
        sample_working_video: workingVideos[0]?.video_number || null
      }
    })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch trailers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
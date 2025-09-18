import { NextRequest, NextResponse } from 'next/server'

// Cloudflare Stream API configuration
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_STREAM_API_TOKEN = process.env.CF_STREAM_API_TOKEN

interface CloudflareStreamVideo {
  uid: string
  status: string
  thumbnail: string
  thumbnailTimestampPct: number
  readyToStream: boolean
  duration: number
  input: {
    width: number
    height: number
  }
  preview: string
  allowedOrigins: string[]
  requireSignedURLs: boolean
  uploaded: string
  uploadExpiry: string | null
  maxSizeBytes: number | null
  maxDurationSeconds: number | null
  meta: {
    [key: string]: string | number | boolean | null
  }
  created: string
  modified: string
  scheduledDeletion: string | null
  size: number
  playback: {
    hls: string
    dash: string
  }
}

interface CloudflareStreamResponse {
  result: CloudflareStreamVideo[]
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: Array<{ code: number; message: string }>
  result_info: {
    page: number
    per_page: number
    count: number
    total_count: number
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!CF_ACCOUNT_ID || !CF_STREAM_API_TOKEN) {
      console.error('Missing Cloudflare credentials:', {
        hasAccountId: !!CF_ACCOUNT_ID,
        hasApiToken: !!CF_STREAM_API_TOKEN
      })
      
      return NextResponse.json({
        error: 'Cloudflare Stream API credentials not configured',
        details: {
          CF_ACCOUNT_ID: CF_ACCOUNT_ID ? 'Present' : 'Missing',
          CF_STREAM_API_TOKEN: CF_STREAM_API_TOKEN ? 'Present' : 'Missing'
        }
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '100'

    // Fetch videos from Cloudflare Stream API
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream?page=${page}&per_page=${perPage}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CF_STREAM_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudflare Stream API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      return NextResponse.json({
        error: 'Failed to fetch videos from Cloudflare Stream',
        status: response.status,
        details: errorText
      }, { status: response.status })
    }

    const data: CloudflareStreamResponse = await response.json()
    
    if (!data.success) {
      console.error('Cloudflare Stream API returned errors:', data.errors)
      return NextResponse.json({
        error: 'Cloudflare Stream API request failed',
        errors: data.errors,
        messages: data.messages
      }, { status: 400 })
    }

    // Transform the data to match our needs
    const videos = data.result.map(video => ({
      uid: video.uid,
      status: video.status,
      readyToStream: video.readyToStream,
      duration: video.duration,
      thumbnail: video.thumbnail,
      preview: video.preview,
      name: video.meta?.name || 'Untitled',
      created: video.created,
      modified: video.modified,
      size: video.size,
      playback: video.playback,
      meta: video.meta
    }))

    // Successfully fetched Cloudflare Stream videos

    return NextResponse.json({
      success: true,
      videos,
      pagination: data.result_info,
      summary: {
        totalVideos: videos.length,
        readyToStream: videos.filter(v => v.readyToStream).length,
        processing: videos.filter(v => v.status === 'inprogress').length,
        errors: videos.filter(v => v.status === 'error').length
      }
    })

  } catch (error) {
    console.error('Cloudflare Stream API error:', error)
    return NextResponse.json({
      error: 'Internal server error while fetching Cloudflare Stream videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Optional: POST endpoint to upload videos or update metadata
export async function POST(_request: NextRequest) {
  // Implementation for uploading videos or updating metadata
  return NextResponse.json({
    error: 'Upload functionality not implemented yet'
  }, { status: 501 })
}
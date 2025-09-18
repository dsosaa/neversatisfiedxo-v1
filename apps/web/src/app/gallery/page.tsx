import { GalleryProvider } from '@/components/gallery-provider'
// Removed unused PreloadResources component
import { type Trailer } from '@/lib/types'
import { getVideoUID, hasVideoMapping } from '@/lib/video-mapping'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

// Server-side direct data loading (avoiding network calls during SSR)
function loadTrailerDataDirect() {
  try {
    // Try multiple possible paths for the CSV file (env first, then common fallbacks)
    const envPath = process.env.VIDEO_DB_PATH
    const possiblePaths = [
      envPath || '',
      path.resolve(process.cwd(), '../../data/VideoDB.csv'),
      path.resolve(process.cwd(), '../../../data/VideoDB.csv'),
      path.resolve(process.cwd(), '../../../../data/VideoDB.csv'),
      path.resolve(process.cwd(), 'data/VideoDB.csv'),
      path.resolve(__dirname, '../../../../data/VideoDB.csv'),
      '/opt/neversatisfiedxo/data/VideoDB.csv',
      '/app/data/VideoDB.csv',
    ].filter(Boolean)
    
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
        continue
      }
    }
    
    if (!csvContent || !csvPath) {
      console.error('CSV file not found during SSR - checked paths:', possiblePaths)
      return {
        count: 0,
        next: undefined,
        previous: undefined,
        results: []
      }
    }
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    })
    
    const trailers: Trailer[] = []
    const data = parseResult.data as Record<string, unknown>[]
    
    data.forEach((row: Record<string, unknown>, index: number) => {
      const videoNumber = String(row['Video Number'] || '').replace('Video ', '').trim()
      const videoId = String(row['Video ID'] || '').trim()
      
      if (!videoNumber || !videoId) return
      
      const priceStr = String(row['Price'] || 'FREE')
      const lengthStr = String(row['Length'] || '')
      
      // Parse price
      let priceNumeric = 0
      if (priceStr && priceStr.toUpperCase() !== 'FREE') {
        priceNumeric = parseInt(priceStr.replace('$', ''), 10) || 0
      }
      
      // Parse length
      let lengthMinutes = 0
      if (lengthStr) {
        const lower = lengthStr.toLowerCase()
        if (lower.includes('hour')) {
          const hours = parseInt(lower.split('hour')[0].trim(), 10) || 0
          lengthMinutes += hours * 60
          const remaining = lower.split('hour')[1]
          if (remaining && remaining.includes('minute')) {
            const minutes = parseInt(remaining.split('minute')[0].trim(), 10) || 0
            lengthMinutes += minutes
          }
        } else if (lower.includes('minute')) {
          lengthMinutes = parseInt(lower.split('minute')[0].trim(), 10) || 0
        }
      }
      
      const videoNum = parseInt(videoNumber, 10) || index
      
      // Get real Cloudflare video UID from our mapping, fallback to CSV ID
      const realVideoUID = getVideoUID(videoNum) || videoId
      const hasRealMapping = hasVideoMapping(videoNum)
      
      const trailer = {
        id: realVideoUID, // Use real Cloudflare video UID as primary key
        cf_video_uid: realVideoUID,
        cf_thumb_uid: String(row['Thumbnail ID'] || ''),
        video_number: videoNum,
        title: String(row['Description'] || 'Untitled'),
        description: String(row['Detailed Description'] || ''),
        price: priceStr,
        price_numeric: priceNumeric,
        length: lengthStr,
        length_minutes: lengthMinutes,
        creators: String(row['Creators'] || ''),
        upload_status: hasRealMapping ? 'Complete' : 'Unavailable', // Mark unmapped videos
        is_featured: false,
        is_premium: priceNumeric > 0,
        created_at: new Date().toISOString(),
      }
      
      trailers.push(trailer as Trailer)
    })
    
    return {
      count: trailers.length,
      next: undefined,
      previous: undefined,
      results: trailers
    }
  } catch (error) {
    console.error('Error loading trailer data during SSR:', error)
    return {
      count: 0,
      next: undefined,
      previous: undefined,
      results: []
    }
  }
}

async function getInitialTrailers() {
  try {
    const data = loadTrailerDataDirect()
    // Successfully loaded initial trailers
    return data
  } catch (error) {
    const errorInfo = {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorString: String(error)
    }
    console.error('Failed to fetch initial trailers:', errorInfo)
    
    // Return a safe empty state instead of null
    return {
      count: 0,
      next: undefined,
      previous: undefined,
      results: []
    }
  }
}

function calculateLatestVideoNumber(trailers: Array<{ video_number?: number }>) {
  if (!trailers || trailers.length === 0) return 0
  return Math.max(...trailers.map(trailer => trailer.video_number || 0))
}

export default async function GalleryPage() {
  // Server-side data fetching
  const initialData = await getInitialTrailers()
  const latestVideoNumber = calculateLatestVideoNumber(initialData.results)

  return (
        <div className="min-h-screen bg-background overflow-x-hidden">
          {/* Static Server-Rendered Header */}
      <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/neversatisfiedxo-logo.png"
                alt="neversatisfiedxo"
                width={200}
                height={50}
                className="h-7 sm:h-8 md:h-9 w-auto font-semibold"
                priority
              />
            </div>

            <div className="flex items-center gap-4">
              <Badge 
                className="hidden md:flex text-sm font-medium bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50 transition-all duration-200"
              >
                {latestVideoNumber || 0} VIDEOS
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Client-Side Gallery Functionality */}
      <main className="px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 w-full max-w-screen-2xl mx-auto">
        <GalleryProvider initialData={initialData} />
      </main>
    </div>
  )
}

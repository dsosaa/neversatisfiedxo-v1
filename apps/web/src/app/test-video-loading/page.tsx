'use client'

import { useState } from 'react'
import { CloudflarePlayer } from '@/components/cloudflare-player'

export default function TestVideoLoading() {
  const [testVideoId, setTestVideoId] = useState('ee65f7035c7445388bc1237d3d51cddd')
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Video Loading Test</h1>
        
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Test Video ID:</span>
            <input
              type="text"
              value={testVideoId}
              onChange={(e) => setTestVideoId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground"
              placeholder="Enter Cloudflare video UID"
            />
          </label>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">CloudflarePlayer Component</h2>
            <div className="border border-gray-300 rounded-lg p-4">
              <CloudflarePlayer
                uid={testVideoId}
                autoplay={false}
                muted={true}
                className="w-full max-w-2xl"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Direct iframe Test</h2>
            <div className="border border-gray-300 rounded-lg p-4">
              <iframe
                src={`https://iframe.videodelivery.net/${testVideoId}?autoplay=false&muted=true&controls=true&preload=metadata&responsive=true&poster=https://videodelivery.net/${testVideoId}/thumbnails/thumbnail.jpg?time=0.03s&width=800&height=450&quality=85&fit=crop&format=webp`}
                title="Direct iframe test"
                className="w-full max-w-2xl aspect-video border-0 rounded-lg"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={() => console.log('Direct iframe loaded successfully')}
                onError={() => console.error('Direct iframe failed to load')}
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 dark:text-gray-300">
                {JSON.stringify({
                  videoId: testVideoId,
                  iframeUrl: `https://iframe.videodelivery.net/${testVideoId}`,
                  customerCode: process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE ? 
                    `${process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE.substring(0, 8)}...` : 'MISSING',
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { CloudflarePlayer } from '@/components/cloudflare-player'

// Real working video IDs from Cloudflare Stream
const WORKING_VIDEOS = [
  { id: '62fee0bff98a4dc4b8dffbaffbb143a4', name: 'Video #189', duration: '23.3s' },
  { id: 'b9499650940443b7b47168794ad2a314', name: 'Video #188', duration: '17.9s' },
  { id: 'f535d3ebfc3140bcbf194f0cf50ad824', name: 'Video #177', duration: '30.2s' },
  { id: 'ba25eca76fa24bbe82a36b1eaf39f166', name: 'Video #86', duration: '54.6s' },
  { id: 'cf5b52ffc3ad4b32908aa64d96e38603', name: 'Video #46', duration: '51.1s' }
]

const BROKEN_VIDEO_ID = 'ee65f7035c7445388bc1237d3d51cddd' // From CSV - doesn't exist

export default function TestFixedVideos() {
  const [apiData, setApiData] = useState<any>(null)
  
  useEffect(() => {
    // Test the fixed API endpoint
    fetch('/api/trailers/fixed')
      .then(res => res.json())
      .then(data => setApiData(data))
      .catch(err => console.error('API Error:', err))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🎯 Video Streaming Test - Real vs Fake IDs
        </h1>
        
        {/* API Debug Info */}
        {apiData && (
          <div className="bg-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">📊 API Debug Info</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-zinc-400">Total Trailers</div>
                <div className="text-2xl font-bold text-white">{apiData.pagination?.total || 0}</div>
              </div>
              <div>
                <div className="text-zinc-400">Working Videos</div>
                <div className="text-2xl font-bold text-green-400">{apiData.debug?.working_videos || 0}</div>
              </div>
              <div>
                <div className="text-zinc-400">Broken Videos</div>
                <div className="text-2xl font-bold text-red-400">{apiData.debug?.broken_videos || 0}</div>
              </div>
              <div>
                <div className="text-zinc-400">Real Mappings</div>
                <div className="text-2xl font-bold text-blue-400">{apiData.debug?.total_real_mappings || 0}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Working Videos Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-green-400">
            ✅ Working Videos (Real Cloudflare Stream IDs)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKING_VIDEOS.map((video) => (
              <div key={video.id} className="bg-zinc-800 rounded-xl p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{video.name}</h3>
                  <p className="text-sm text-zinc-400">Duration: {video.duration}</p>
                  <p className="text-xs text-zinc-500 font-mono break-all">{video.id}</p>
                </div>
                
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <CloudflarePlayer
                    uid={video.id}
                    autoplay={false}
                    muted={true}
                    className="rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Broken Video Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-red-400">
            ❌ Broken Video (Fake CSV ID)
          </h2>
          <div className="bg-zinc-800 rounded-xl p-4 max-w-md">
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Video #4 (from CSV)</h3>
              <p className="text-sm text-zinc-400">This ID doesn't exist in Cloudflare</p>
              <p className="text-xs text-zinc-500 font-mono break-all">{BROKEN_VIDEO_ID}</p>
            </div>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <CloudflarePlayer
                uid={BROKEN_VIDEO_ID}
                autoplay={false}
                muted={true}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">🔧 Solution Summary</h2>
          <div className="space-y-3 text-sm">
            <p><strong>Problem Found:</strong> All video IDs in the CSV are fake/placeholder data that don't exist in your Cloudflare Stream account.</p>
            <p><strong>Solution Created:</strong> I mapped the real Cloudflare Stream video IDs to the corresponding video numbers from your CSV.</p>
            <p><strong>Working Videos:</strong> The videos above use real IDs and should play correctly.</p>
            <p><strong>Next Steps:</strong> Update the main API to use the real video ID mapping for all gallery videos.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
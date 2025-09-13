'use client'

import { CloudflarePlayer } from '@/components/cloudflare-player'

export default function DebugVideosPage() {
  const testVideoUID = 'ee65f7035c7445388bc1237d3d51cddd'

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Debug Page</h1>
        
        <div className="space-y-8">
          {/* Test 1: Basic CloudflarePlayer */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test 1: Basic CloudflarePlayer</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <CloudflarePlayer
                uid={testVideoUID}
                autoplay={false}
                muted={true}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Test 2: With Poster */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test 2: With Poster Image</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <CloudflarePlayer
                uid={testVideoUID}
                autoplay={false}
                muted={true}
                className="w-full h-full"
                poster={`https://videodelivery.net/${testVideoUID}/thumbnails/thumbnail.jpg?time=0.03s&width=800&height=450&quality=85&fit=crop&format=webp`}
              />
            </div>
          </div>

          {/* Test 3: Direct iframe */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test 3: Direct iframe</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={`https://iframe.videodelivery.net/${testVideoUID}`}
                className="w-full h-full border-0 rounded-lg"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>

          {/* Test 4: Poster URL Test */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test 4: Poster URL Test</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={`https://videodelivery.net/${testVideoUID}/thumbnails/thumbnail.jpg?time=0.03s&width=800&height=450&quality=85&fit=crop&format=webp`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Poster image failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log('Poster image loaded successfully')}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p>Video UID: <code className="bg-gray-200 px-2 py-1 rounded">{testVideoUID}</code></p>
          <p>Iframe URL: <code className="bg-gray-200 px-2 py-1 rounded break-all">{`https://iframe.videodelivery.net/${testVideoUID}`}</code></p>
          <p>Poster URL: <code className="bg-gray-200 px-2 py-1 rounded break-all">{`https://videodelivery.net/${testVideoUID}/thumbnails/thumbnail.jpg?time=0.03s&width=800&height=450&quality=85&fit=crop&format=webp`}</code></p>
          <p className="mt-2 text-sm text-gray-600">Check browser console for any errors</p>
        </div>
      </div>
    </div>
  )
}

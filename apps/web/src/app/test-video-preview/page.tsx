'use client'

import { VideoPreviewPlayer } from '@/components/video-preview-player'

export default function TestVideoPreviewPage() {
  const testVideoUID = 'ee65f7035c7445388bc1237d3d51cddd'

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Preview Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Test 1: Basic preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Preview (1s start)</h2>
            <VideoPreviewPlayer
              uid={testVideoUID}
              startTime={1}
              className="w-full"
            />
          </div>

          {/* Test 2: Different start time */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">5s Start Time</h2>
            <VideoPreviewPlayer
              uid={testVideoUID}
              startTime={5}
              className="w-full"
            />
          </div>

          {/* Test 3: 10s start time */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">10s Start Time</h2>
            <VideoPreviewPlayer
              uid={testVideoUID}
              startTime={10}
              className="w-full"
            />
          </div>

          {/* Test 4: Autoplay preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Autoplay Preview</h2>
            <VideoPreviewPlayer
              uid={testVideoUID}
              startTime={1}
              autoplay={true}
              className="w-full"
            />
          </div>

          {/* Test 5: Different video */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Video #1 (1s start)</h2>
            <VideoPreviewPlayer
              uid="4593b719e6f64b15907a065e1f749b46"
              startTime={1}
              className="w-full"
            />
          </div>

          {/* Test 6: Error case */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Invalid Video (Error Test)</h2>
            <VideoPreviewPlayer
              uid="invalid-video-id"
              startTime={1}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="space-y-2 text-sm">
            <li>• Hover over videos to see them play from the start time</li>
            <li>• Move mouse away to pause the video</li>
            <li>• Videos should start at the specified timestamp (1s, 5s, 10s)</li>
            <li>• Videos should loop continuously</li>
            <li>• The invalid video should show an error message</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CloudflarePlayer } from '@/components/cloudflare-player'
import { VideoDebug } from '@/components/video-debug'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestVideoPage() {
  const [videoId, setVideoId] = useState('')
  const [testVideoId, setTestVideoId] = useState('')

  const handleTest = () => {
    if (videoId.trim()) {
      setTestVideoId(videoId.trim())
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Video Loading Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-id">Video ID</Label>
              <div className="flex gap-2">
                <Input
                  id="video-id"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  placeholder="Enter Cloudflare video ID"
                  className="flex-1"
                />
                <Button onClick={handleTest}>Test Video</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Environment Variables</Label>
              <div className="text-sm space-y-1">
                <div>
                  <strong>NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE:</strong>{' '}
                  {process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE || 'Not set'}
                </div>
                <div>
                  <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {testVideoId && (
          <Card>
            <CardHeader>
              <CardTitle>Video Player Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-video">
                  <CloudflarePlayer
                    uid={testVideoId}
                    autoplay={false}
                    muted={true}
                    className="w-full h-full"
                  />
                </div>
                
                <div className="text-sm space-y-1">
                  <div><strong>Video ID:</strong> {testVideoId}</div>
                  <div><strong>Thumbnail URL:</strong> https://videodelivery.net/{testVideoId}/thumbnails/thumbnail.jpg</div>
                  <div><strong>Video URL:</strong> https://iframe.videodelivery.net/{testVideoId}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <VideoDebug 
          videoId={testVideoId || 'test-video-id'} 
          customerCode={process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE}
        />
      </div>
    </div>
  )
}
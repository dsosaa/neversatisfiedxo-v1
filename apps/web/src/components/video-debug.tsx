'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface VideoDebugProps {
  videoId: string
  customerCode?: string
}

interface DebugInfo {
  videoId: string
  customerCode: string | null
  thumbnailUrl: string
  videoUrl: string
  thumbnailStatus: 'loading' | 'success' | 'error'
  videoStatus: 'loading' | 'success' | 'error'
  errors: string[]
}

export function VideoDebug({ videoId, customerCode }: VideoDebugProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    videoId,
    customerCode: customerCode || process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE || null,
    thumbnailUrl: '',
    videoUrl: '',
    thumbnailStatus: 'loading',
    videoStatus: 'loading',
    errors: []
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    const runDebugChecks = async () => {
      const errors: string[] = []
      
      // Check customer code
      if (!debugInfo.customerCode) {
        errors.push('NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE is not configured')
      }

      // Generate URLs
      const thumbnailUrl = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?width=400&height=225&quality=85&fit=crop&format=webp`
      const videoUrl = `https://iframe.videodelivery.net/${videoId}?customerCode=${debugInfo.customerCode}&controls=true&preload=metadata`

      setDebugInfo(prev => ({
        ...prev,
        thumbnailUrl,
        videoUrl
      }))

      // Test thumbnail URL
      try {
        const thumbnailResponse = await fetch(thumbnailUrl, { method: 'HEAD' })
        if (thumbnailResponse.ok) {
          setDebugInfo(prev => ({ ...prev, thumbnailStatus: 'success' }))
        } else {
          setDebugInfo(prev => ({ ...prev, thumbnailStatus: 'error' }))
          errors.push(`Thumbnail URL returned ${thumbnailResponse.status}: ${thumbnailResponse.statusText}`)
        }
      } catch (error) {
        setDebugInfo(prev => ({ ...prev, thumbnailStatus: 'error' }))
        errors.push(`Thumbnail URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test video URL
      try {
        const videoResponse = await fetch(videoUrl, { method: 'HEAD' })
        if (videoResponse.ok) {
          setDebugInfo(prev => ({ ...prev, videoStatus: 'success' }))
        } else {
          setDebugInfo(prev => ({ ...prev, videoStatus: 'error' }))
          errors.push(`Video URL returned ${videoResponse.status}: ${videoResponse.statusText}`)
        }
      } catch (error) {
        setDebugInfo(prev => ({ ...prev, videoStatus: 'error' }))
        errors.push(`Video URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      setDebugInfo(prev => ({ ...prev, errors }))
    }

    runDebugChecks()
  }, [isVisible, videoId, debugInfo.customerCode])

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return 'bg-yellow-100 text-yellow-800'
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
    }
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Debug Video
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Video Debug Info</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Video ID:</span>
            <Badge variant="outline" className="text-xs">
              {debugInfo.videoId}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Customer Code:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(debugInfo.customerCode ? 'success' : 'error')}
              <Badge 
                variant="outline" 
                className={`text-xs ${debugInfo.customerCode ? 'text-green-600' : 'text-red-600'}`}
              >
                {debugInfo.customerCode ? 'Configured' : 'Missing'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Thumbnail:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(debugInfo.thumbnailStatus)}
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(debugInfo.thumbnailStatus)}`}
              >
                {debugInfo.thumbnailStatus}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Video Player:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(debugInfo.videoStatus)}
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(debugInfo.videoStatus)}`}
              >
                {debugInfo.videoStatus}
              </Badge>
            </div>
          </div>
        </div>

        {debugInfo.errors.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-red-600">Errors:</span>
            <div className="space-y-1">
              {debugInfo.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-sm font-medium">URLs:</span>
          <div className="space-y-1">
            <div className="text-xs">
              <strong>Thumbnail:</strong>
              <div className="break-all text-gray-600 mt-1">
                {debugInfo.thumbnailUrl}
              </div>
            </div>
            <div className="text-xs">
              <strong>Video:</strong>
              <div className="break-all text-gray-600 mt-1">
                {debugInfo.videoUrl}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDebugInfo(prev => ({
              ...prev,
              thumbnailStatus: 'loading',
              videoStatus: 'loading',
              errors: []
            }))
            setIsVisible(false)
            setTimeout(() => setIsVisible(true), 100)
          }}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Tests
        </Button>
      </CardContent>
    </Card>
  )
}

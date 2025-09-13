'use client'

import { useState } from 'react'

export default function TestPosterPage() {
  const [testResults, setTestResults] = useState<Array<{url: string, status: string, error?: string}>>([])
  const [loading, setLoading] = useState(false)

  const testUrls = [
    'https://videodelivery.net/ee65f7035c7445388bc1237d3d51cddd/thumbnails/thumbnail.jpg',
    'https://videodelivery.net/ee65f7035c7445388bc1237d3d51cddd/thumbnails/thumbnail.jpg?time=3ms',
    'https://videodelivery.net/ee65f7035c7445388bc1237d3d51cddd/thumbnails/thumbnail.jpg?time=3ms&width=800&height=450&quality=85&fit=crop&format=webp',
    'https://iframe.videodelivery.net/ee65f7035c7445388bc1237d3d51cddd'
  ]

  const testUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return {
        url,
        status: response.ok ? '✅ Success' : `❌ Error ${response.status}`,
        error: response.ok ? undefined : `HTTP ${response.status}`
      }
    } catch (error) {
      return {
        url,
        status: '❌ Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const runTests = async () => {
    setLoading(true)
    const results = []
    
    for (const url of testUrls) {
      const result = await testUrl(url)
      results.push(result)
      setTestResults([...results])
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between tests
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Poster URL Test</h1>
        
        <div className="mb-8">
          <button
            onClick={runTests}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test URLs'}
          </button>
        </div>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm">{result.status}</span>
                <span className="text-sm text-gray-600 break-all">{result.url}</span>
              </div>
              {result.error && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Images</h2>
          <div className="grid grid-cols-2 gap-4">
            {testUrls.slice(0, 3).map((url, index) => (
              <div key={index} className="text-center">
                <h3 className="text-sm font-medium mb-2">Test {index + 1}</h3>
                <img
                  src={url}
                  alt={`Test ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const errorDiv = document.createElement('div')
                    errorDiv.className = 'w-full h-32 bg-red-100 border border-red-300 rounded flex items-center justify-center text-red-600 text-sm'
                    errorDiv.textContent = 'Failed to load'
                    target.parentNode?.insertBefore(errorDiv, target)
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

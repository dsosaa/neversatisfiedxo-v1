'use client'

import { OptimizedImage } from '@/components/optimized-image'

export default function TestImagePage() {
  const testImageUrl = 'https://videodelivery.net/365ca453af0f7e71f332a910878f99fc/thumbnails/thumbnail.jpg?time=5s'
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Image Test Page</h1>
      <div className="w-96 h-64 border-2 border-red-500">
        <OptimizedImage
          src={testImageUrl}
          alt="Test image"
          fill
          className="object-cover"
        />
      </div>
      <p className="mt-4">Image URL: {testImageUrl}</p>
    </div>
  )
}

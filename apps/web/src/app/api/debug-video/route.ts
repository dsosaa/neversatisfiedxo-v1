import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'Missing video ID' }, { status: 400 })
  }

  try {
    // Test the API call that the video page should be making
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'https://videos.neversatisfiedxo.com'
    const apiUrl = `${baseURL}/api/trailers/${id}`
    
    console.log('Debug: Testing API call to:', apiUrl)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'API call failed', 
        status: response.status,
        url: apiUrl 
      }, { status: response.status })
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      url: apiUrl,
      data: data,
      environment: {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      error: 'Debug API call failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

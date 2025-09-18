import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    // Simple password check
    if (password === 'yesmistress') {
      // Set a simple session cookie
      const response = NextResponse.json({ 
        success: true, 
        message: 'Authentication successful'
      })
      
      // Set a simple session cookie that expires in 7 days
      response.cookies.set('authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
      
      return response
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid access code' 
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Authentication failed' 
      },
      { status: 500 }
    )
  }
}

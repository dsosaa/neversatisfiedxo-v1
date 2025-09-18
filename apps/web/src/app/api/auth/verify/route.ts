import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessCode } = body

    // Get the expected password from environment variables
    const expectedPassword = process.env.GATE_PASSWORD || 'yesmistress'

    // Verify the access code
    if (accessCode === expectedPassword) {
      // Set authentication cookie
      const cookieStore = await cookies()
      cookieStore.set('authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })

      // Check if request is from mobile
      const userAgent = request.headers.get('user-agent') || ''
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Authentication successful',
        mobile: isMobile
      })
      
      // Add mobile-specific headers
      if (isMobile) {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
      }
      
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

export async function GET() {
  // Check if user is authenticated
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.get('authenticated')?.value === 'true'

  return NextResponse.json({ 
    authenticated: isAuthenticated 
  })
}

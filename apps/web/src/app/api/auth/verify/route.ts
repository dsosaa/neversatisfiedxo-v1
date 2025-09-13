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

      return NextResponse.json({ 
        success: true, 
        message: 'Authentication successful' 
      })
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

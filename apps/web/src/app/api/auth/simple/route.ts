import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body
    const rawPassword: string = String(password ?? '')
    const normalizedPassword = rawPassword.toLowerCase().replace(/\s+/g, '')
    const expectedEnv = (process.env.GATE_PASSWORD || 'yesmistress').toLowerCase().replace(/\s+/g, '')

    // Simple password check - no complex validation
    if (normalizedPassword === expectedEnv) {
      // Create response with success
      const response = NextResponse.json({ 
        success: true, 
        message: 'Authentication successful'
      })
      
      // Determine if the incoming request is over HTTPS to decide the Secure flag
      const forwardedProto = request.headers.get('x-forwarded-proto')
      const isHttps = (forwardedProto ?? request.nextUrl.protocol.replace(':', '')) === 'https'

      // Set a simple session cookie that expires in 7 days
      response.cookies.set('authenticated', 'true', {
        httpOnly: true,
        // Only set Secure flag when the request is HTTPS
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
      // Prevent any caching of this auth response
      response.headers.set('Cache-Control', 'no-store, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      console.log('✅ Authentication successful for password input')
      return response
    } else {
      console.log('❌ Authentication failed for provided password')
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
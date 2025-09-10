import { NextResponse } from 'next/server'

// Simple health check endpoint for deployment scripts
// This endpoint provides a basic "OK" response for load balancers and deployment checks
export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'neversatisfiedxo-frontend'
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  )
}
import { NextResponse } from 'next/server';
import { getCloudflareCustomerCode } from '@/lib/cloudflare';

export async function GET() {
  try {
    const customerCode = await getCloudflareCustomerCode();
    
    return NextResponse.json({ 
      customerCode,
      accountId: process.env.CF_ACCOUNT_ID,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching customer code:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch customer code',
        fallback: process.env.CF_ACCOUNT_ID,
        success: false 
      },
      { status: 500 }
    );
  }
}
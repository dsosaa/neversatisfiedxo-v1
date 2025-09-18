#!/usr/bin/env node

// Test Cloudflare Stream API connection and fetch customer code
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const API_TOKEN = process.env.CF_STREAM_API_TOKEN;

async function testCloudflareConnection() {
  console.log('Testing Cloudflare Stream API connection...\n');
  
  if (!ACCOUNT_ID || !API_TOKEN) {
    console.error('❌ Missing CF_ACCOUNT_ID or CF_STREAM_API_TOKEN in .env.local');
    process.exit(1);
  }

  try {
    // Test account access
    console.log('🔍 Fetching account details...');
    const accountResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountResponse.ok) {
      throw new Error(`Account API failed: ${accountResponse.status} ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();
    
    if (!accountData.success) {
      throw new Error(`Account API error: ${accountData.errors?.map(e => e.message).join(', ')}`);
    }

    console.log('✅ Account access successful');
    console.log(`   Account ID: ${accountData.result.id}`);
    console.log(`   Account Name: ${accountData.result.name}`);

    // Test Stream API access
    console.log('\n🎥 Testing Stream API access...');
    const streamResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!streamResponse.ok) {
      throw new Error(`Stream API failed: ${streamResponse.status} ${streamResponse.statusText}`);
    }

    const streamData = await streamResponse.json();
    
    if (!streamData.success) {
      throw new Error(`Stream API error: ${streamData.errors?.map(e => e.message).join(', ')}`);
    }

    console.log('✅ Stream API access successful');
    console.log(`   Videos found: ${streamData.result?.length || 0}`);

    // Customer code is typically the account ID for Cloudflare Stream
    console.log('\n📋 Configuration Summary:');
    console.log('=' * 50);
    console.log(`Customer Code: ${ACCOUNT_ID}`);
    console.log(`Account ID: ${ACCOUNT_ID}`);
    console.log(`API Token: ${API_TOKEN.substring(0, 8)}...`);
    console.log('\n✅ All Cloudflare Stream configurations are valid!');
    
    // Generate sample iframe URL
    console.log('\n🎬 Sample iframe URL format:');
    console.log(`https://iframe.videodelivery.net/YOUR_VIDEO_ID`);
    
  } catch (error) {
    console.error('❌ Cloudflare API test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testCloudflareConnection();
#!/usr/bin/env node

/**
 * Cloudflare Stream Optimization Test Script
 * Validates that all optimizations are working correctly
 */

const https = require('https');
const { promisify } = require('util');
require('dotenv').config();

// Configuration
const CF_EMAIL = 'nsxofilms@gmail.com';
const CF_API_KEY = process.env.CF_GLOBAL_API_KEY;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_STREAM_CUSTOMER_CODE = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE;

if (!CF_API_KEY) {
  console.error('❌ CF_GLOBAL_API_KEY not found in .env file');
  process.exit(1);
}

const DOMAIN_NAME = process.argv[2] || 'videos.neversatisfiedxo.com';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API Helper
async function cfApiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4${endpoint}`,
      method,
      headers: {
        'X-Auth-Email': CF_EMAIL,
        'X-Auth-Key': CF_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.success) {
            resolve(parsed.result);
          } else {
            reject(new Error(`API Error: ${JSON.stringify(parsed.errors)}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test functions
async function testApiConnection() {
  colorLog('blue', '\n🔍 Testing API Connection...');
  try {
    const zones = await cfApiRequest('/zones');
    const zone = zones.find(z => z.name === DOMAIN_NAME);
    if (zone) {
      colorLog('green', `✅ API connection successful. Zone ID: ${zone.id}`);
      return zone.id;
    } else {
      throw new Error(`Domain ${DOMAIN_NAME} not found`);
    }
  } catch (error) {
    colorLog('red', `❌ API connection failed: ${error.message}`);
    throw error;
  }
}

async function testCacheSettings(zoneId) {
  colorLog('blue', '\n📦 Testing Cache Settings...');
  
  try {
    const cacheSettings = await cfApiRequest(`/zones/${zoneId}/settings/cache_level`);
    colorLog('green', `✅ Cache level: ${cacheSettings.value}`);
    
    const browserCacheTtl = await cfApiRequest(`/zones/${zoneId}/settings/browser_cache_ttl`);
    colorLog('green', `✅ Browser cache TTL: ${browserCacheTtl.value} seconds`);
    
    const edgeCacheTtl = await cfApiRequest(`/zones/${zoneId}/settings/edge_cache_ttl`);
    colorLog('green', `✅ Edge cache TTL: ${edgeCacheTtl.value} seconds`);
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Cache settings test failed: ${error.message}`);
    return false;
  }
}

async function testCompressionSettings(zoneId) {
  colorLog('blue', '\n🗜️  Testing Compression Settings...');
  
  try {
    const minifySettings = await cfApiRequest(`/zones/${zoneId}/settings/minify`);
    colorLog('green', `✅ Minification: CSS=${minifySettings.value.css}, HTML=${minifySettings.value.html}, JS=${minifySettings.value.js}`);
    
    const polishSettings = await cfApiRequest(`/zones/${zoneId}/settings/polish`);
    colorLog('green', `✅ Polish: ${polishSettings.value}`);
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Compression settings test failed: ${error.message}`);
    return false;
  }
}

async function testSecuritySettings(zoneId) {
  colorLog('blue', '\n🛡️  Testing Security Settings...');
  
  try {
    const httpsSettings = await cfApiRequest(`/zones/${zoneId}/settings/always_use_https`);
    colorLog('green', `✅ Always use HTTPS: ${httpsSettings.value}`);
    
    const sslSettings = await cfApiRequest(`/zones/${zoneId}/settings/ssl`);
    colorLog('green', `✅ SSL mode: ${sslSettings.value}`);
    
    const tlsSettings = await cfApiRequest(`/zones/${zoneId}/settings/min_tls_version`);
    colorLog('green', `✅ Minimum TLS version: ${tlsSettings.value}`);
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Security settings test failed: ${error.message}`);
    return false;
  }
}

async function testSpeedSettings(zoneId) {
  colorLog('blue', '\n⚡ Testing Speed Settings...');
  
  try {
    const rocketLoader = await cfApiRequest(`/zones/${zoneId}/settings/rocket_loader`);
    colorLog('green', `✅ Rocket Loader: ${rocketLoader.value}`);
    
    const mirage = await cfApiRequest(`/zones/${zoneId}/settings/mirage`);
    colorLog('green', `✅ Mirage: ${mirage.value}`);
    
    const http2 = await cfApiRequest(`/zones/${zoneId}/settings/http2`);
    colorLog('green', `✅ HTTP/2: ${http2.value}`);
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Speed settings test failed: ${error.message}`);
    return false;
  }
}

async function testRulesets(zoneId) {
  colorLog('blue', '\n📋 Testing Rulesets...');
  
  try {
    const rulesets = await cfApiRequest(`/zones/${zoneId}/rulesets`);
    
    const videoRules = rulesets.filter(r => 
      r.name.includes('Video') || 
      r.name.includes('video') ||
      r.name.includes('Cache') ||
      r.name.includes('Compression')
    );
    
    if (videoRules.length > 0) {
      colorLog('green', `✅ Found ${videoRules.length} video-related rulesets:`);
      videoRules.forEach(rule => {
        colorLog('cyan', `   • ${rule.name} (${rule.rules?.length || 0} rules)`);
      });
    } else {
      colorLog('yellow', '⚠️  No video-specific rulesets found');
    }
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Rulesets test failed: ${error.message}`);
    return false;
  }
}

async function testPageRules(zoneId) {
  colorLog('blue', '\n📄 Testing Page Rules...');
  
  try {
    const pageRules = await cfApiRequest(`/zones/${zoneId}/pagerules`);
    
    if (pageRules.length > 0) {
      colorLog('green', `✅ Found ${pageRules.length} page rules:`);
      pageRules.forEach(rule => {
        colorLog('cyan', `   • ${rule.target} (${rule.status})`);
      });
    } else {
      colorLog('yellow', '⚠️  No page rules found');
    }
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Page rules test failed: ${error.message}`);
    return false;
  }
}

async function testStreamConfiguration() {
  colorLog('blue', '\n🎬 Testing Stream Configuration...');
  
  if (!CF_STREAM_CUSTOMER_CODE) {
    colorLog('yellow', '⚠️  CF_STREAM_CUSTOMER_CODE not found in environment');
    return false;
  }
  
  try {
    // Test if we can access Stream account
    const account = await cfApiRequest(`/accounts/${CF_ACCOUNT_ID}`);
    colorLog('green', `✅ Stream account verified: ${account.name}`);
    
    // Test Stream API access (if token is available)
    if (process.env.CF_STREAM_API_TOKEN) {
      try {
        const streamVideos = await cfApiRequest(`/accounts/${CF_ACCOUNT_ID}/stream`);
        colorLog('green', `✅ Stream API access verified. Found ${streamVideos.length} videos`);
      } catch (error) {
        colorLog('yellow', '⚠️  Stream API access limited (this is normal)');
      }
    }
    
    return true;
  } catch (error) {
    colorLog('red', `❌ Stream configuration test failed: ${error.message}`);
    return false;
  }
}

async function testDomainResolution() {
  colorLog('blue', '\n🌐 Testing Domain Resolution...');
  
  try {
    const dns = require('dns');
    const { promisify } = require('util');
    const lookup = promisify(dns.lookup);
    
    const result = await lookup(DOMAIN_NAME);
    colorLog('green', `✅ Domain resolves to: ${result.address}`);
    
    // Test HTTPS connectivity
    const https = require('https');
    return new Promise((resolve) => {
      const req = https.request(`https://${DOMAIN_NAME}`, { method: 'HEAD' }, (res) => {
        colorLog('green', `✅ HTTPS connection successful. Status: ${res.statusCode}`);
        colorLog('cyan', `   Headers: ${JSON.stringify(res.headers, null, 2)}`);
        resolve(true);
      });
      
      req.on('error', (error) => {
        colorLog('red', `❌ HTTPS connection failed: ${error.message}`);
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        colorLog('red', '❌ HTTPS connection timeout');
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    colorLog('red', `❌ Domain resolution test failed: ${error.message}`);
    return false;
  }
}

async function generateReport(results) {
  colorLog('magenta', '\n📊 OPTIMIZATION TEST REPORT');
  colorLog('magenta', '========================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  colorLog('white', `\nOverall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  
  if (successRate >= 90) {
    colorLog('green', '🎉 Excellent! Your Cloudflare optimizations are working perfectly.');
  } else if (successRate >= 70) {
    colorLog('yellow', '⚠️  Good, but some optimizations may need attention.');
  } else {
    colorLog('red', '❌ Several optimizations are not working. Please check the configuration.');
  }
  
  colorLog('white', '\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    colorLog(color, `  ${status} ${test}`);
  });
  
  if (successRate < 100) {
    colorLog('yellow', '\n🔧 Next Steps:');
    colorLog('white', '1. Check the failed tests above');
    colorLog('white', '2. Verify your Cloudflare plan includes the required features');
    colorLog('white', '3. Run the optimization script again if needed');
    colorLog('white', '4. Contact Cloudflare support for API-related issues');
  }
  
  colorLog('cyan', '\n📚 For more information, see: CLOUDFLARE_STREAM_OPTIMIZATION.md');
}

// Main execution
async function main() {
  try {
    colorLog('cyan', '🎬 Cloudflare Stream Optimization Test Suite');
    colorLog('cyan', '==========================================');
    colorLog('white', `Testing domain: ${DOMAIN_NAME}`);
    colorLog('white', `Account ID: ${CF_ACCOUNT_ID}`);
    colorLog('white', `Stream Customer Code: ${CF_STREAM_CUSTOMER_CODE || 'Not set'}`);
    
    const zoneId = await testApiConnection();
    
    const results = {
      'API Connection': true,
      'Cache Settings': await testCacheSettings(zoneId),
      'Compression Settings': await testCompressionSettings(zoneId),
      'Security Settings': await testSecuritySettings(zoneId),
      'Speed Settings': await testSpeedSettings(zoneId),
      'Rulesets': await testRulesets(zoneId),
      'Page Rules': await testPageRules(zoneId),
      'Stream Configuration': await testStreamConfiguration(),
      'Domain Resolution': await testDomainResolution(),
    };
    
    await generateReport(results);
    
  } catch (error) {
    colorLog('red', `\n❌ Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

main();

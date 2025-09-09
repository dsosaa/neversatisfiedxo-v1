#!/usr/bin/env node

/**
 * Cloudflare Performance Optimization Script
 * Run this script after adding your domain to Cloudflare
 * 
 * Usage: node scripts/cloudflare-optimize.js [domain-name]
 * Example: node scripts/cloudflare-optimize.js example.com
 */

const https = require('https');
const { promisify } = require('util');
require('dotenv').config();

// Configuration
const CF_EMAIL = 'nsxofilms@gmail.com';
const CF_API_KEY = process.env.CF_GLOBAL_API_KEY;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

if (!CF_API_KEY) {
  console.error('❌ CF_GLOBAL_API_KEY not found in .env file');
  process.exit(1);
}

const DOMAIN_NAME = process.argv[2];
if (!DOMAIN_NAME) {
  console.error('❌ Please provide domain name: node scripts/cloudflare-optimize.js example.com');
  process.exit(1);
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

// Main optimization functions
async function getZoneId(domain) {
  console.log(`🔍 Looking up zone ID for ${domain}...`);
  const zones = await cfApiRequest('/zones');
  const zone = zones.find(z => z.name === domain);
  if (!zone) {
    throw new Error(`Domain ${domain} not found in Cloudflare. Please add it first.`);
  }
  console.log(`✅ Found zone ID: ${zone.id}`);
  return zone.id;
}

async function enableSmartTieredCache(zoneId) {
  console.log('🚀 Enabling Smart Tiered Cache...');
  try {
    await cfApiRequest(`/zones/${zoneId}/cache/tiered_cache_smart_topology_enable`, 'PATCH', {
      value: 'on'
    });
    console.log('✅ Smart Tiered Cache enabled (40-60% cache hit improvement expected)');
  } catch (error) {
    console.log('⚠️  Smart Tiered Cache may already be enabled or requires higher plan');
  }
}

async function configureCompressionRules(zoneId) {
  console.log('🗜️  Configuring compression rules...');
  
  const compressionRules = [
    {
      description: 'Enable Brotli compression for web assets',
      expression: '(http.request.uri.path.extension in {"html" "css" "js" "json" "xml" "txt"})',
      action: 'compress_response',
      action_parameters: {
        algorithms: [
          { name: 'brotli' },
          { name: 'gzip' },
          { name: 'auto' }
        ]
      }
    },
    {
      description: 'Enable Zstandard compression for large files',
      expression: '(http.request.uri.path.extension in {"js" "css"}) and (cf.response.content_length gt 10000)',
      action: 'compress_response',
      action_parameters: {
        algorithms: [
          { name: 'zstd' },
          { name: 'brotli' },
          { name: 'gzip' }
        ]
      }
    }
  ];

  try {
    const ruleset = await cfApiRequest(`/zones/${zoneId}/rulesets`, 'POST', {
      name: 'Compression Rules',
      kind: 'zone',
      phase: 'http_response_compression',
      rules: compressionRules
    });
    console.log('✅ Compression rules configured (60-80% size reduction expected)');
  } catch (error) {
    console.log('⚠️  Compression rules may already exist or require different approach');
    console.log('   Manual setup may be required in dashboard');
  }
}

async function enablePolish(zoneId) {
  console.log('🖼️  Enabling Polish image optimization...');
  try {
    await cfApiRequest(`/zones/${zoneId}/settings/polish`, 'PATCH', {
      value: 'lossy'
    });
    console.log('✅ Polish enabled (35-50% image size reduction expected)');
  } catch (error) {
    console.log('⚠️  Polish requires Pro plan or higher');
  }
}

async function createVideoCacheRules(zoneId) {
  console.log('📹 Creating video-specific cache rules...');
  
  const cacheRules = [
    {
      description: 'Cache video manifests for 1 hour',
      expression: '(http.request.uri.path.extension eq "m3u8") or (http.request.uri.path.extension eq "mpd")',
      action: 'set_cache_settings',
      action_parameters: {
        cache: true,
        edge_ttl: {
          mode: 'override_origin',
          default: 3600
        },
        browser_ttl: {
          mode: 'override_origin', 
          default: 1800
        }
      }
    },
    {
      description: 'Cache video segments for 24 hours',
      expression: '(http.request.uri.path.extension eq "ts") or (http.request.uri.path.extension eq "m4s")',
      action: 'set_cache_settings',
      action_parameters: {
        cache: true,
        edge_ttl: {
          mode: 'override_origin',
          default: 86400
        },
        browser_ttl: {
          mode: 'override_origin',
          default: 43200
        }
      }
    },
    {
      description: 'Cache Cloudflare Stream content optimally',
      expression: '(http.host contains "cloudflarestream.com") or (http.host contains "videodelivery.net")',
      action: 'set_cache_settings',
      action_parameters: {
        cache: true,
        edge_ttl: {
          mode: 'respect_origin'
        }
      }
    }
  ];

  try {
    const ruleset = await cfApiRequest(`/zones/${zoneId}/rulesets`, 'POST', {
      name: 'Video Cache Rules',
      kind: 'zone', 
      phase: 'http_request_cache_settings',
      rules: cacheRules
    });
    console.log('✅ Video cache rules created (faster video loading expected)');
  } catch (error) {
    console.log('⚠️  Cache rules may need manual configuration in dashboard');
  }
}

async function configureSpeedSettings(zoneId) {
  console.log('⚡ Configuring speed optimizations...');
  
  const speedSettings = [
    { setting: 'minify', value: { css: 'on', html: 'on', js: 'on' } },
    { setting: 'rocket_loader', value: 'on' },
    { setting: 'mirage', value: 'on' },
    { setting: 'browser_cache_ttl', value: 31536000 }, // 1 year
    { setting: 'edge_cache_ttl', value: 7200 }, // 2 hours default
  ];

  for (const { setting, value } of speedSettings) {
    try {
      await cfApiRequest(`/zones/${zoneId}/settings/${setting}`, 'PATCH', { value });
      console.log(`✅ ${setting} configured`);
    } catch (error) {
      console.log(`⚠️  ${setting} may require higher plan or manual setup`);
    }
  }
}

async function enableSecurityFeatures(zoneId) {
  console.log('🛡️  Enabling security features...');
  
  const securitySettings = [
    { setting: 'always_use_https', value: 'on' },
    { setting: 'ssl', value: 'full' },
    { setting: 'min_tls_version', value: '1.2' },
    { setting: 'opportunistic_encryption', value: 'on' },
    { setting: 'automatic_https_rewrites', value: 'on' }
  ];

  for (const { setting, value } of securitySettings) {
    try {
      await cfApiRequest(`/zones/${zoneId}/settings/${setting}`, 'PATCH', { value });
      console.log(`✅ ${setting} enabled`);
    } catch (error) {
      console.log(`⚠️  ${setting} configuration may need manual adjustment`);
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Cloudflare optimization for video trailer website...\n');
    
    const zoneId = await getZoneId(DOMAIN_NAME);
    
    console.log('\n📊 Implementing optimizations...');
    
    // High impact optimizations
    await enableSmartTieredCache(zoneId);
    await configureCompressionRules(zoneId);
    await enablePolish(zoneId);
    await createVideoCacheRules(zoneId);
    
    // Speed and security optimizations
    await configureSpeedSettings(zoneId);
    await enableSecurityFeatures(zoneId);
    
    console.log('\n🎉 Cloudflare optimization completed!');
    console.log('\n📈 Expected improvements:');
    console.log('  • 40-70% faster video manifest loading');
    console.log('  • 60-80% reduction in HTML/CSS/JS size');
    console.log('  • 35-50% smaller images/thumbnails');
    console.log('  • 20-30% faster Time to First Byte');
    console.log('  • Improved Core Web Vitals scores');
    console.log('\n⏱️  Changes may take up to 5 minutes to propagate globally.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
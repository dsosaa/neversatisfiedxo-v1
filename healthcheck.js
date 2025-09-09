#!/usr/bin/env node

/**
 * Docker health check script for the Next.js application
 * This script is called by Docker to verify the container is healthy
 */

const http = require('http');

const options = {
  hostname: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
  headers: {
    'User-Agent': 'Docker-Healthcheck/1.0',
    'Accept': 'application/json',
  },
};

const request = http.request(options, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    try {
      const healthData = JSON.parse(data);
      
      if (response.statusCode === 200 && healthData.status === 'healthy') {
        console.log('✓ Health check passed');
        process.exit(0);
      } else if (response.statusCode === 200 && healthData.status === 'degraded') {
        console.log('⚠ Health check passed with warnings (degraded)');
        process.exit(0); // Still considered healthy for Docker
      } else {
        console.error('✗ Health check failed:', healthData);
        process.exit(1);
      }
    } catch (error) {
      console.error('✗ Health check failed - invalid JSON response:', error.message);
      process.exit(1);
    }
  });
});

request.on('error', (error) => {
  console.error('✗ Health check failed - request error:', error.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('✗ Health check failed - request timeout');
  request.destroy();
  process.exit(1);
});

request.end();
import { NextResponse } from 'next/server';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database?: 'connected' | 'disconnected';
    mediacms?: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
  };
  performance: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      load: number;
    };
  };
  checks: {
    api: 'pass' | 'fail';
    database: 'pass' | 'fail';
    mediacms: 'pass' | 'fail';
  };
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    // Get CPU load (simplified)
    const cpuLoad = process.cpuUsage();
    const cpuLoadPercentage = Math.round((cpuLoad.user + cpuLoad.system) / 1000000);

    // Check external services
    const checks = await Promise.allSettled([
      // Check MediaCMS is responding (any 2xx or 3xx response is considered healthy)
      fetch(`${process.env.MEDIACMS_BASE_URL || 'http://mediacms:80'}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }).then(res => {
        console.log('MediaCMS check:', res.status);
        return res.status >= 200 && res.status < 400;
      }).catch(err => {
        console.log('MediaCMS check error:', err.message);
        return false;
      }),
      
      // Check if we can reach the database (simplified check)
      Promise.resolve(true), // This would be a real DB check in production
    ]);

    const [mediacmsCheck, databaseCheck] = checks;
    
    const healthCheck: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        mediacms: mediacmsCheck.status === 'fulfilled' && mediacmsCheck.value ? 'connected' : 'disconnected',
        database: databaseCheck.status === 'fulfilled' && databaseCheck.value ? 'connected' : 'disconnected',
      },
      performance: {
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: memoryPercentage,
        },
        cpu: {
          load: cpuLoadPercentage,
        },
      },
      checks: {
        api: 'pass',
        database: databaseCheck.status === 'fulfilled' && databaseCheck.value ? 'pass' : 'fail',
        mediacms: mediacmsCheck.status === 'fulfilled' && mediacmsCheck.value ? 'pass' : 'fail',
      },
    };

    // Determine overall health - only API and database are critical
    const criticalChecks: (keyof typeof healthCheck.checks)[] = ['api', 'database'];
    const criticalChecksPass = criticalChecks.every(check => healthCheck.checks[check] === 'pass');
    
    // Set status based on critical checks only
    if (criticalChecksPass) {
      healthCheck.status = 'healthy';
    } else {
      healthCheck.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...healthCheck,
      responseTime: `${responseTime}ms`,
    }, {
      status: healthCheck.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        api: 'fail',
        database: 'fail',
        mediacms: 'fail',
      },
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
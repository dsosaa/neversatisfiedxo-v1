import { NextRequest, NextResponse } from 'next/server';

interface MonitoringData {
  timestamp: string;
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    cpu: {
      user: number;
      system: number;
      load: number;
    };
    platform: string;
    nodeVersion: string;
  };
  application: {
    version: string;
    environment: string;
    buildTime: string;
    requests: {
      total: number;
      errors: number;
      successRate: number;
    };
  };
  services: {
    mediacms: {
      status: 'connected' | 'disconnected' | 'unknown';
      responseTime: number;
      lastCheck: string;
    };
    database: {
      status: 'connected' | 'disconnected' | 'unknown';
      lastCheck: string;
    };
  };
  performance: {
    pageLoad: {
      average: number;
      p95: number;
      p99: number;
    };
    api: {
      average: number;
      p95: number;
      p99: number;
    };
  };
}

// In-memory metrics store (in production, use Redis or database)
  const metrics = {
  requests: { total: 0, errors: 0 },
  pageLoadTimes: [] as number[],
  apiResponseTimes: [] as number[],
};

export async function GET() {
  try {
    // Get system information
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Calculate memory percentage
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    // Calculate success rate
    const successRate = metrics.requests.total > 0 
      ? Math.round(((metrics.requests.total - metrics.requests.errors) / metrics.requests.total) * 100)
      : 100;

    // Calculate performance metrics
    const avgPageLoad = metrics.pageLoadTimes.length > 0
      ? Math.round(metrics.pageLoadTimes.reduce((a, b) => a + b, 0) / metrics.pageLoadTimes.length)
      : 0;

    const p95PageLoad = metrics.pageLoadTimes.length > 0
      ? Math.round(metrics.pageLoadTimes.sort((a, b) => a - b)[Math.floor(metrics.pageLoadTimes.length * 0.95)])
      : 0;

    const p99PageLoad = metrics.pageLoadTimes.length > 0
      ? Math.round(metrics.pageLoadTimes.sort((a, b) => a - b)[Math.floor(metrics.pageLoadTimes.length * 0.99)])
      : 0;

    const avgApiResponse = metrics.apiResponseTimes.length > 0
      ? Math.round(metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.apiResponseTimes.length)
      : 0;

    const p95ApiResponse = metrics.apiResponseTimes.length > 0
      ? Math.round(metrics.apiResponseTimes.sort((a, b) => a - b)[Math.floor(metrics.apiResponseTimes.length * 0.95)])
      : 0;

    const p99ApiResponse = metrics.apiResponseTimes.length > 0
      ? Math.round(metrics.apiResponseTimes.sort((a, b) => a - b)[Math.floor(metrics.apiResponseTimes.length * 0.99)])
      : 0;

    // Check external services
    const mediacmsCheck = await checkMediaCMS();
    const databaseCheck = await checkDatabase();

    const monitoringData: MonitoringData = {
      timestamp: new Date().toISOString(),
      system: {
        uptime,
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: memoryPercentage,
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000000), // seconds
          system: Math.round(cpuUsage.system / 1000000), // seconds
          load: Math.round((cpuUsage.user + cpuUsage.system) / 1000000),
        },
        platform: process.platform,
        nodeVersion: process.version,
      },
      application: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
        requests: {
          total: metrics.requests.total,
          errors: metrics.requests.errors,
          successRate,
        },
      },
      services: {
        mediacms: mediacmsCheck,
        database: databaseCheck,
      },
      performance: {
        pageLoad: {
          average: avgPageLoad,
          p95: p95PageLoad,
          p99: p99PageLoad,
        },
        api: {
          average: avgApiResponse,
          p95: p95ApiResponse,
          p99: p99ApiResponse,
        },
      },
    };

    return NextResponse.json(monitoringData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Monitoring data collection failed:', error);
    
    return NextResponse.json({
      error: 'Failed to collect monitoring data',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 500,
    });
  }
}

// Helper function to check MediaCMS
async function checkMediaCMS() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${process.env.MEDIACMS_BASE_URL || 'http://mediacms:80'}/api/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.ok ? 'connected' as const : 'disconnected' as const,
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'disconnected' as const,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
    };
  }
}

// Helper function to check database
async function checkDatabase() {
  try {
    // This would be a real database check in production
    return {
      status: 'connected' as const,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'disconnected' as const,
      lastCheck: new Date().toISOString(),
    };
  }
}

// POST endpoint to record metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'pageLoad':
        metrics.pageLoadTimes.push(data.duration);
        // Keep only last 1000 measurements
        if (metrics.pageLoadTimes.length > 1000) {
          metrics.pageLoadTimes = metrics.pageLoadTimes.slice(-1000);
        }
        break;
      case 'apiResponse':
        metrics.apiResponseTimes.push(data.duration);
        // Keep only last 1000 measurements
        if (metrics.apiResponseTimes.length > 1000) {
          metrics.apiResponseTimes = metrics.apiResponseTimes.slice(-1000);
        }
        break;
      case 'request':
        metrics.requests.total++;
        break;
      case 'error':
        metrics.requests.errors++;
        break;
      case 'metric':
        // Handle detailed metrics
        if (data.type === 'apiCall') {
          metrics.apiResponseTimes.push(data.duration);
        } else if (data.type === 'pageLoad') {
          metrics.pageLoadTimes.push(data.duration);
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record metric' }, { status: 400 });
  }
}

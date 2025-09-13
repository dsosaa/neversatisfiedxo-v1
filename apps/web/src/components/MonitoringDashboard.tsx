'use client';

import React, { useState, useEffect } from 'react';
import { useMonitoring } from '@/lib/monitoring';

interface MonitoringData {
  timestamp: string;
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      load: number;
    };
  };
  application: {
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
    };
  };
  performance: {
    pageLoad: {
      average: number;
      p95: number;
    };
    api: {
      average: number;
      p95: number;
    };
  };
}

export default function MonitoringDashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getMetrics } = useMonitoring();

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const response = await fetch('/api/monitoring');
        if (!response.ok) {
          throw new Error('Failed to fetch monitoring data');
        }
        const data = await response.json();
        setMonitoringData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Monitoring Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-yellow-800 font-semibold">No Data</h3>
        <p className="text-yellow-600">No monitoring data available</p>
      </div>
    );
  }

  const localMetrics = getMetrics();

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">System Monitoring Dashboard</h1>
        
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">System Health</h3>
            <div className="text-2xl font-bold text-green-600">
              {monitoringData.system.memory.percentage < 80 ? '🟢 Healthy' : '🟡 Warning'}
            </div>
            <p className="text-sm text-green-600 mt-1">
              Memory: {monitoringData.system.memory.percentage}%
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-semibold mb-2">Uptime</h3>
            <div className="text-2xl font-bold text-blue-600">
              {Math.floor(monitoringData.system.uptime / 3600)}h
            </div>
            <p className="text-sm text-blue-600 mt-1">
              {Math.floor((monitoringData.system.uptime % 3600) / 60)}m
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-purple-800 font-semibold mb-2">Success Rate</h3>
            <div className="text-2xl font-bold text-purple-600">
              {monitoringData.application.requests.successRate}%
            </div>
            <p className="text-sm text-purple-600 mt-1">
              {monitoringData.application.requests.total} requests
            </p>
          </div>
        </div>

        {/* Services Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-800 font-semibold mb-4">Services Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">MediaCMS API</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  monitoringData.services.mediacms.status === 'connected'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {monitoringData.services.mediacms.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Response Time</span>
                <span className="text-gray-800 font-mono">
                  {monitoringData.services.mediacms.responseTime}ms
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-800 font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Page Load (avg)</span>
                <span className="text-gray-800 font-mono">
                  {monitoringData.performance.pageLoad.average}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Response (avg)</span>
                <span className="text-gray-800 font-mono">
                  {monitoringData.performance.api.average}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <h3 className="text-gray-800 font-semibold mb-4">Memory Usage</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${
                monitoringData.system.memory.percentage < 70 
                  ? 'bg-green-500' 
                  : monitoringData.system.memory.percentage < 90 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${monitoringData.system.memory.percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{monitoringData.system.memory.used}MB used</span>
            <span>{monitoringData.system.memory.total}MB total</span>
          </div>
        </div>

        {/* Local Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-800 font-semibold mb-4">Client-Side Errors</h3>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {localMetrics.errors.length}
            </div>
            <p className="text-sm text-gray-600">
              Errors tracked in this session
            </p>
            {localMetrics.errors.length > 0 && (
              <div className="mt-4 max-h-32 overflow-y-auto">
                {localMetrics.errors.slice(-5).map((error) => (
                  <div key={error.id} className="text-xs text-gray-600 mb-1">
                    {error.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-800 font-semibold mb-4">Performance Metrics</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {localMetrics.metrics.length}
            </div>
            <p className="text-sm text-gray-600">
              Metrics tracked in this session
            </p>
            {localMetrics.metrics.length > 0 && (
              <div className="mt-4 max-h-32 overflow-y-auto">
                {localMetrics.metrics.slice(-5).map((metric) => (
                  <div key={metric.id} className="text-xs text-gray-600 mb-1">
                    {metric.name}: {metric.duration}ms
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last updated: {new Date(monitoringData.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

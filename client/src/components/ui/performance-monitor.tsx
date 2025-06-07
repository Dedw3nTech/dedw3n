import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  connectionCount: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    connectionCount: 0
  });

  useEffect(() => {
    // Monitor performance metrics
    const startTime = performance.now();
    
    // Measure initial load time
    const loadHandler = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, loadTime }));
    };

    // Measure memory usage if available
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return memory.usedJSHeapSize / 1024 / 1024; // MB
      }
      return undefined;
    };

    // Monitor WebSocket connections
    const monitorConnections = () => {
      const wsConnections = document.querySelectorAll('[data-connection-status]').length;
      return wsConnections;
    };

    const updateMetrics = () => {
      setMetrics(prev => ({
        ...prev,
        memoryUsage: measureMemory(),
        connectionCount: monitorConnections(),
        renderTime: performance.now() - startTime
      }));
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);

    // Initial load measurement
    if (document.readyState === 'complete') {
      loadHandler();
    } else {
      window.addEventListener('load', loadHandler);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('load', loadHandler);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
      <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
      <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
      {metrics.memoryUsage && <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>}
      <div>Connections: {metrics.connectionCount}</div>
    </div>
  );
}
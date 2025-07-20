import { MemoryLeakMonitor } from '@/services/memoryLeakMonitor';
import performanceAPI from './performanceAPIWrapper';

/**
 * Integration utilities for automatically applying memory leak detection
 * to existing components without major refactoring
 */

// Global flag to enable/disable automatic memory leak detection
export const MEMORY_LEAK_DETECTION_ENABLED = (
import.meta.env.VITE_ENABLE_MEMORY_LEAK_DETECTION === 'true' ||
process.env.NODE_ENV === 'development' ||
typeof window !== 'undefined' && window.location.search.includes('memory-debug=true')) &&
typeof window !== 'undefined' && performanceAPI.getSupportInfo().performance;

/**
 * Monkey patch common browser APIs to include memory leak warnings
 */
export function initializeMemoryLeakDetection() {
  if (!MEMORY_LEAK_DETECTION_ENABLED || typeof window === 'undefined') {
    console.log('🔍 Memory leak detection disabled (not supported or disabled in environment)');
    return;
  }

  try {
    console.log('🔍 Memory leak detection initialized');

    // Track global timer usage
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalClearTimeout = window.clearTimeout;
    const originalClearInterval = window.clearInterval;

    const activeTimers = new Set<number>();
    const activeIntervals = new Set<number>();

    window.setTimeout = function (callback: Function, delay?: number, ...args: any[]) {
      const id = originalSetTimeout.call(window, (...callbackArgs) => {
        activeTimers.delete(id);
        return callback(...callbackArgs);
      }, delay, ...args);

      activeTimers.add(id);

      if (activeTimers.size > 50) {
        console.warn(`🚨 High number of active timers detected: ${activeTimers.size}`);
      }

      return id;
    };

    window.setInterval = function (callback: Function, delay?: number, ...args: any[]) {
      const id = originalSetInterval.call(window, callback, delay, ...args);
      activeIntervals.add(id);

      if (activeIntervals.size > 20) {
        console.warn(`🚨 High number of active intervals detected: ${activeIntervals.size}`);
      }

      return id;
    };

    window.clearTimeout = function (id?: number) {
      if (id) {
        activeTimers.delete(id);
      }
      return originalClearTimeout.call(window, id);
    };

    window.clearInterval = function (id?: number) {
      if (id) {
        activeIntervals.delete(id);
      }
      return originalClearInterval.call(window, id);
    };

    // Track fetch requests
    const originalFetch = window.fetch;
    const activeRequests = new Set<string>();

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();
      const requestId = `${Date.now()}-${Math.random()}`;

      activeRequests.add(requestId);

      if (activeRequests.size > 100) {
        console.warn(`🚨 High number of active fetch requests: ${activeRequests.size}`);
      }

      return originalFetch.call(window, input, init).finally(() => {
        activeRequests.delete(requestId);
      });
    };

    // Monitor page unload to detect potential leaks
    window.addEventListener('beforeunload', () => {
      const leaks = [];

      if (activeTimers.size > 0) {
        leaks.push(`${activeTimers.size} active timers`);
      }

      if (activeIntervals.size > 0) {
        leaks.push(`${activeIntervals.size} active intervals`);
      }

      if (activeRequests.size > 0) {
        leaks.push(`${activeRequests.size} active requests`);
      }

      if (leaks.length > 0) {
        console.warn('🚨 Potential memory leaks detected on page unload:', leaks.join(', '));
      }
    });

    // Set up periodic memory monitoring with safe performance API
    setInterval(() => {
      try {
        // Use the safe performance API wrapper
        const memory = performanceAPI.getMemoryUsage();

        if (memory) {
          const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
          const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
          const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

          console.log(`📊 Memory: ${usedMB}MB used, ${totalMB}MB total, ${limitMB}MB limit`);

          // Check for rapid memory growth
          const pressure = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          if (pressure > 0.8) {
            console.warn(`🚨 High memory pressure: ${(pressure * 100).toFixed(1)}%`);
          }
        }
      } catch (error) {
        // Silently handle performance API errors to prevent crashes
        console.warn('Performance monitoring error (non-critical):', error.message);
      }
    }, 30000); // Check every 30 seconds

    console.log('✅ Memory leak detection patches applied');
  } catch (error) {
    console.warn('⚠️ Memory leak detection initialization failed:', error);
    // Continue without memory leak detection
  }
}

/**
 * Report a potential memory leak to the monitoring system
 */
export function reportMemoryLeak(componentName: string, leakType: string, details: any) {
  if (!MEMORY_LEAK_DETECTION_ENABLED) return;

  const monitor = MemoryLeakMonitor.getInstance();
  monitor.reportPotentialLeak(componentName, leakType, details);

  console.warn(`🔴 Memory leak reported: ${componentName} - ${leakType}`, details);
}

/**
 * Higher-order function to wrap components with automatic memory tracking
 */
export function withMemoryTracking(componentName: string) {
  return function <T extends React.ComponentType<any>>(Component: T): T {
    const WrappedComponent = (props: any) => {
      const monitor = MemoryLeakMonitor.getInstance();

      React.useEffect(() => {
        monitor.trackComponent(componentName);

        return () => {
          monitor.untrackComponent(componentName);
        };
      }, []);

      return React.createElement(Component, props);
    };

    WrappedComponent.displayName = `withMemoryTracking(${componentName})`;
    return WrappedComponent as T;
  };
}

/**
 * Hook to automatically report component lifecycle to memory monitor
 */
export function useComponentMemoryTracking(componentName: string) {
  const monitor = MemoryLeakMonitor.getInstance();

  React.useEffect(() => {
    if (MEMORY_LEAK_DETECTION_ENABLED) {
      monitor.trackComponent(componentName);

      return () => {
        monitor.untrackComponent(componentName);
      };
    }
  }, [componentName]);
}

/**
 * Utility to force garbage collection (if available)
 */
export function forceGarbageCollection(): boolean {
  if (typeof window !== 'undefined' && (window as any).gc) {
    (window as any).gc();
    console.log('🗑️ Garbage collection forced');
    return true;
  }
  console.warn('⚠️ Garbage collection not available. Enable with --js-flags="--expose-gc"');
  return false;
}

/**
 * Get current memory usage information
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  limit: number;
  pressure: number;
} | null {
  try {
    // Use the safe performance API wrapper
    const memory = performanceAPI.getMemoryUsage();
    if (!memory) {
      return null;
    }

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      pressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit
    };
  } catch (error) {
    console.warn('Error accessing performance.memory:', error);
    return null;
  }
}

// Import React for the HOC
import React from 'react';

// Type definitions
export interface MemoryLeakDetectionConfig {
  enabled: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  maxActiveTimers: number;
  maxActiveIntervals: number;
  maxActiveRequests: number;
}

export const DEFAULT_CONFIG: MemoryLeakDetectionConfig = {
  enabled: MEMORY_LEAK_DETECTION_ENABLED,
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
  maxActiveTimers: 50,
  maxActiveIntervals: 20,
  maxActiveRequests: 100
};

export default {
  initializeMemoryLeakDetection,
  reportMemoryLeak,
  withMemoryTracking,
  useComponentMemoryTracking,
  forceGarbageCollection,
  getMemoryUsage,
  MEMORY_LEAK_DETECTION_ENABLED,
  DEFAULT_CONFIG
};
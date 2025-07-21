import React, { useEffect, useRef, useCallback } from 'react';
import { MemoryLeakMonitor } from '@/services/memoryLeakMonitor';

export interface MemoryLeakConfig {
  trackTimers?: boolean;
  trackEventListeners?: boolean;
  trackSubscriptions?: boolean;
  trackAsyncOperations?: boolean;
  warnOnLargeClosure?: boolean;
  maxClosureSize?: number;
}

const DEFAULT_CONFIG: MemoryLeakConfig = {
  trackTimers: true,
  trackEventListeners: true,
  trackSubscriptions: true,
  trackAsyncOperations: true,
  warnOnLargeClosure: true,
  maxClosureSize: 1024 * 1024 // 1MB
};

export function useMemoryLeakDetector(
  componentName: string,
  config: MemoryLeakConfig = DEFAULT_CONFIG
) {
  const monitor = useRef<MemoryLeakMonitor | null>(null);
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const eventListeners = useRef<Map<EventTarget, {event: string; listener: EventListener;}[]>>(new Map());
  const subscriptions = useRef<Set<() => void>>(new Set());
  const asyncOperations = useRef<Set<AbortController>>(new Set());
  const isMounted = useRef(true);

  useEffect(() => {
    monitor.current = MemoryLeakMonitor.getInstance();
    monitor.current.trackComponent(componentName);

    return () => {
      isMounted.current = false;

      // Clean up all tracked resources
      cleanupTimers();
      cleanupEventListeners();
      cleanupSubscriptions();
      cleanupAsyncOperations();

      monitor.current?.untrackComponent(componentName);
    };
  }, [componentName]);

  const cleanupTimers = useCallback(() => {
    timers.current.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timers.current.clear();
    intervals.current.clear();
  }, []);

  const cleanupEventListeners = useCallback(() => {
    eventListeners.current.forEach((listeners, target) => {
      listeners.forEach(({ event, listener }) => {
        target.removeEventListener(event, listener);
      });
    });
    eventListeners.current.clear();
  }, []);

  const cleanupSubscriptions = useCallback(() => {
    subscriptions.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during subscription cleanup:', error);
      }
    });
    subscriptions.current.clear();
  }, []);

  const cleanupAsyncOperations = useCallback(() => {
    asyncOperations.current.forEach((controller) => {
      controller.abort();
    });
    asyncOperations.current.clear();
  }, []);

  // Wrapped setTimeout with automatic cleanup
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    if (!config.trackTimers) {
      return setTimeout(callback, delay);
    }

    const timer = setTimeout(() => {
      if (isMounted.current) {
        callback();
      }
      timers.current.delete(timer);
    }, delay);

    timers.current.add(timer);
    return timer;
  }, [config.trackTimers]);

  // Wrapped setInterval with automatic cleanup
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    if (!config.trackTimers) {
      return setInterval(callback, delay);
    }

    const interval = setInterval(() => {
      if (isMounted.current) {
        callback();
      } else {
        clearInterval(interval);
        intervals.current.delete(interval);
      }
    }, delay);

    intervals.current.add(interval);
    return interval;
  }, [config.trackTimers]);

  // Wrapped addEventListener with automatic cleanup
  const safeAddEventListener = useCallback((
    target: EventTarget,
    event: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    if (!config.trackEventListeners) {
      target.addEventListener(event, listener, options);
      return;
    }

    target.addEventListener(event, listener, options);

    if (!eventListeners.current.has(target)) {
      eventListeners.current.set(target, []);
    }
    eventListeners.current.get(target)!.push({ event, listener });
  }, [config.trackEventListeners]);

  // Track subscriptions with automatic cleanup
  const trackSubscription = useCallback((cleanup: () => void) => {
    if (!config.trackSubscriptions) {
      return cleanup;
    }

    subscriptions.current.add(cleanup);
    return cleanup;
  }, [config.trackSubscriptions]);

  // Track async operations with AbortController
  const trackAsyncOperation = useCallback(<T,>(
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    if (!config.trackAsyncOperations) {
      return operation(new AbortController().signal);
    }

    const controller = new AbortController();
    asyncOperations.current.add(controller);

    return operation(controller.signal).finally(() => {
      asyncOperations.current.delete(controller);
    });
  }, [config.trackAsyncOperations]);

  // Safe state update that checks if component is mounted
  const safeSetState = useCallback((setter: () => void) => {
    if (isMounted.current) {
      setter();
    } else {
      console.warn(`Attempted to update state in unmounted component: ${componentName}`);
      monitor.current?.reportPotentialLeak(componentName, 'setState_after_unmount', {
        timestamp: Date.now(),
        stackTrace: new Error().stack
      });
    }
  }, [componentName]);

  // Monitor closure size
  const monitorClosureSize = useCallback((closureName: string, closure: any) => {
    if (!config.warnOnLargeClosure) return;

    try {
      const size = JSON.stringify(closure).length;
      if (size > (config.maxClosureSize || DEFAULT_CONFIG.maxClosureSize!)) {
        console.warn(`Large closure detected in ${componentName}.${closureName}: ${size} bytes`);
        monitor.current?.reportPotentialLeak(componentName, 'large_closure', {
          closureName,
          size,
          threshold: config.maxClosureSize
        });
      }
    } catch (error) {
      // Ignore circular reference errors for closure size checking
    }
  }, [componentName, config.warnOnLargeClosure, config.maxClosureSize]);

  return {
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,
    trackSubscription,
    trackAsyncOperation,
    safeSetState,
    monitorClosureSize,
    cleanup: {
      timers: cleanupTimers,
      eventListeners: cleanupEventListeners,
      subscriptions: cleanupSubscriptions,
      asyncOperations: cleanupAsyncOperations,
      all: () => {
        cleanupTimers();
        cleanupEventListeners();
        cleanupSubscriptions();
        cleanupAsyncOperations();
      }
    },
    isComponentMounted: () => isMounted.current
  };
}

// HOC for automatic memory leak detection
export function withMemoryLeakDetection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function MemoryLeakDetectedComponent(props: P) {
    const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const memoryTools = useMemoryLeakDetector(displayName);
    return <WrappedComponent {...props} memoryTools={memoryTools} />;
  };
}

export default useMemoryLeakDetector;

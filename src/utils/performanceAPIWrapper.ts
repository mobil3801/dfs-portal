/**
 * Safe wrapper for Performance API to prevent errors in environments
 * where certain performance methods are not available
 */

export interface SafePerformanceAPI {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  navigation: PerformanceNavigationTiming | null;
  isSupported: boolean;
}

class PerformanceAPIWrapper {
  private isPerformanceSupported: boolean;
  private isMemorySupported: boolean;
  private isNavigationTimingSupported: boolean;

  constructor() {
    this.isPerformanceSupported = this.checkPerformanceSupport();
    this.isMemorySupported = this.checkMemorySupport();
    this.isNavigationTimingSupported = this.checkNavigationTimingSupport();
  }

  private checkPerformanceSupport(): boolean {
    return typeof window !== 'undefined' &&
    typeof window.performance !== 'undefined' &&
    window.performance !== null;
  }

  private checkMemorySupport(): boolean {
    if (!this.isPerformanceSupported) return false;

    try {
      const performance = window.performance as any;
      return performance.memory &&
      typeof performance.memory.usedJSHeapSize === 'number';
    } catch (error) {
      return false;
    }
  }

  private checkNavigationTimingSupport(): boolean {
    if (!this.isPerformanceSupported) return false;

    try {
      // More comprehensive check for getEntriesByType support
      const performance = window.performance;
      if (!performance || typeof performance !== 'object') return false;

      // Check if the method exists and is callable
      if (typeof performance.getEntriesByType !== 'function') return false;

      // Test call to ensure it actually works
      try {
        const testResult = performance.getEntriesByType('navigation');
        return Array.isArray(testResult);
      } catch (testError) {
        console.warn('Performance.getEntriesByType test call failed:', testError);
        return false;
      }
    } catch (error) {
      console.warn('Performance.getEntriesByType not available:', error);
      return false;
    }
  }

  /**
   * Safely get memory information
   */
  getMemoryUsage(): SafePerformanceAPI['memory'] {
    if (!this.isMemorySupported) {
      return null;
    }

    try {
      const memory = (window.performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize || 0,
        totalJSHeapSize: memory.totalJSHeapSize || 0,
        jsHeapSizeLimit: memory.jsHeapSizeLimit || 0
      };
    } catch (error) {
      console.warn('Error accessing performance.memory:', error);
      return null;
    }
  }

  /**
   * Safely get navigation timing information
   */
  getNavigationTiming(): PerformanceNavigationTiming | null {
    if (!this.isNavigationTimingSupported) {
      return null;
    }

    try {
      // Double-check that the method is still available
      if (typeof window.performance.getEntriesByType !== 'function') {
        console.warn('getEntriesByType method not available');
        return null;
      }

      const navigationEntries = window.performance.getEntriesByType('navigation');
      return navigationEntries.length > 0 ? navigationEntries[0] as PerformanceNavigationTiming : null;
    } catch (error) {
      console.warn('Error accessing navigation timing:', error);
      return null;
    }
  }

  /**
   * Safely get resource timing information
   */
  getResourceTiming(): PerformanceResourceTiming[] {
    if (!this.isNavigationTimingSupported) {
      return [];
    }

    try {
      // Double-check that the method is still available
      if (typeof window.performance.getEntriesByType !== 'function') {
        console.warn('getEntriesByType method not available for resource timing');
        return [];
      }

      return window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    } catch (error) {
      console.warn('Error accessing resource timing:', error);
      return [];
    }
  }

  /**
   * Safely get mark entries
   */
  getMarks(): PerformanceMark[] {
    if (!this.isNavigationTimingSupported) {
      return [];
    }

    try {
      // Double-check that the method is still available
      if (typeof window.performance.getEntriesByType !== 'function') {
        console.warn('getEntriesByType method not available for marks');
        return [];
      }

      return window.performance.getEntriesByType('mark') as PerformanceMark[];
    } catch (error) {
      console.warn('Error accessing performance marks:', error);
      return [];
    }
  }

  /**
   * Safely get measure entries
   */
  getMeasures(): PerformanceMeasure[] {
    if (!this.isNavigationTimingSupported) {
      return [];
    }

    try {
      // Double-check that the method is still available
      if (typeof window.performance.getEntriesByType !== 'function') {
        console.warn('getEntriesByType method not available for measures');
        return [];
      }

      return window.performance.getEntriesByType('measure') as PerformanceMeasure[];
    } catch (error) {
      console.warn('Error accessing performance measures:', error);
      return [];
    }
  }

  /**
   * Safely create a performance mark
   */
  mark(name: string): void {
    if (!this.isPerformanceSupported) {
      return;
    }

    try {
      if (typeof window.performance.mark === 'function') {
        window.performance.mark(name);
      }
    } catch (error) {
      console.warn('Error creating performance mark:', error);
    }
  }

  /**
   * Safely create a performance measure
   */
  measure(name: string, startMark?: string, endMark?: string): void {
    if (!this.isPerformanceSupported) {
      return;
    }

    try {
      if (typeof window.performance.measure === 'function') {
        window.performance.measure(name, startMark, endMark);
      }
    } catch (error) {
      console.warn('Error creating performance measure:', error);
    }
  }

  /**
   * Safely get current timestamp
   */
  now(): number {
    if (!this.isPerformanceSupported) {
      return Date.now();
    }

    try {
      return window.performance.now();
    } catch (error) {
      console.warn('Error getting performance.now():', error);
      return Date.now();
    }
  }

  /**
   * Get comprehensive support information
   */
  getSupportInfo(): {
    performance: boolean;
    memory: boolean;
    navigationTiming: boolean;
    marks: boolean;
    measures: boolean;
    now: boolean;
  } {
    return {
      performance: this.isPerformanceSupported,
      memory: this.isMemorySupported,
      navigationTiming: this.isNavigationTimingSupported,
      marks: this.isPerformanceSupported && typeof window.performance.mark === 'function',
      measures: this.isPerformanceSupported && typeof window.performance.measure === 'function',
      now: this.isPerformanceSupported && typeof window.performance.now === 'function'
    };
  }

  /**
   * Check if all required APIs are supported
   */
  isFullySupported(): boolean {
    return this.isPerformanceSupported &&
    this.isMemorySupported &&
    this.isNavigationTimingSupported;
  }
}

// Create a singleton instance
const performanceAPI = new PerformanceAPIWrapper();

export default performanceAPI;

// Export common functions for convenience
export const getMemoryUsage = () => performanceAPI.getMemoryUsage();
export const getNavigationTiming = () => performanceAPI.getNavigationTiming();
export const getSupportInfo = () => performanceAPI.getSupportInfo();
export const safePerformanceNow = () => performanceAPI.now();
export const safePerformanceMark = (name: string) => performanceAPI.mark(name);
export const safePerformanceMeasure = (name: string, startMark?: string, endMark?: string) =>
performanceAPI.measure(name, startMark, endMark);
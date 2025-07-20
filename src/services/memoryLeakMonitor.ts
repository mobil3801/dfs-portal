import performanceAPI from '../utils/performanceAPIWrapper';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface LeakReport {
  componentName: string;
  leakType: string;
  metadata: any;
  timestamp: number;
  memoryStats?: MemoryStats;
}

interface ComponentTracker {
  name: string;
  mountTime: number;
  unmountTime?: number;
  leakReports: LeakReport[];
  memoryUsageOnMount: MemoryStats | null;
  memoryUsageOnUnmount: MemoryStats | null;
}

export class MemoryLeakMonitor {
  private static instance: MemoryLeakMonitor;
  private components: Map<string, ComponentTracker> = new Map();
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private maxMemoryGrowth = 50 * 1024 * 1024; // 50MB
  private memoryCheckFrequency = 30000; // 30 seconds
  private isMonitoring = false;
  private baselineMemory: MemoryStats | null = null;
  private memoryHistory: {timestamp: number;memory: MemoryStats;}[] = [];
  private maxHistorySize = 100;

  // Enhanced leak detection properties
  private leakOccurrences = 0;
  private lastAlertTime = 0;
  private readonly ALERT_COOLDOWN = 300000; // 5 minutes between alerts
  private readonly MIN_OCCURRENCES_FOR_CRITICAL_ALERT = 3;
  private readonly CONSECUTIVE_GROWTH_THRESHOLD = 5; // Must see growth 5 times consecutively
  private consecutiveGrowthCount = 0;

  private constructor() {
    this.initializeMonitoring();
  }

  static getInstance(): MemoryLeakMonitor {
    if (!MemoryLeakMonitor.instance) {
      MemoryLeakMonitor.instance = new MemoryLeakMonitor();
    }
    return MemoryLeakMonitor.instance;
  }

  private initializeMonitoring(): void {
    // Check if performance API is supported through our wrapper
    if (!performanceAPI.getSupportInfo().memory) {
      console.warn('Memory monitoring not available in this environment');
      return;
    }

    try {
      this.baselineMemory = this.getCurrentMemoryStats();
      if (this.baselineMemory) {
        this.startMonitoring();
      } else {
        console.warn('Performance memory API not available in this browser');
      }
    } catch (error) {
      console.warn('Error initializing memory monitoring:', error);
    }
  }

  private getCurrentMemoryStats(): MemoryStats | null {
    try {
      // Use the safe performance API wrapper
      const memory = performanceAPI.getMemoryUsage();
      if (!memory) {
        return null;
      }

      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    } catch (error) {
      console.warn('Error accessing performance.memory:', error);
      return null;
    }
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.memoryCheckFrequency);

    // Monitor for page unload to cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stopMonitoring();
      });
    }
  }

  private stopMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    this.isMonitoring = false;
  }

  private checkMemoryUsage(): void {
    const currentMemory = this.getCurrentMemoryStats();
    if (!currentMemory || !this.baselineMemory) return;

    // Add to history
    this.memoryHistory.push({
      timestamp: Date.now(),
      memory: currentMemory
    });

    // Keep history size manageable
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Enhanced memory leak detection
    this.analyzeMemoryTrend(currentMemory);

    // Check for memory pressure
    const memoryPressure = currentMemory.usedJSHeapSize / currentMemory.jsHeapSizeLimit;
    if (memoryPressure > 0.8) {
      console.warn(`High memory pressure detected: ${(memoryPressure * 100).toFixed(1)}%`);
      this.sugggestGarbageCollection();
    }
  }

  private analyzeMemoryTrend(currentMemory: MemoryStats): void {
    if (this.memoryHistory.length < 10) return;

    const recentHistory = this.memoryHistory.slice(-10);
    const previousMemory = recentHistory[recentHistory.length - 2];

    if (!previousMemory) return;

    const memoryDelta = currentMemory.usedJSHeapSize - previousMemory.memory.usedJSHeapSize;
    const significantGrowth = memoryDelta > this.maxMemoryGrowth / 10; // 5MB threshold for individual checks

    if (significantGrowth) {
      this.consecutiveGrowthCount++;
    } else {
      // Reset consecutive count if no significant growth
      this.consecutiveGrowthCount = Math.max(0, this.consecutiveGrowthCount - 1);
    }

    // Only consider it a potential leak if we see consistent growth
    if (this.consecutiveGrowthCount >= this.CONSECUTIVE_GROWTH_THRESHOLD) {
      this.leakOccurrences++;

      // Check if we should trigger a critical alert
      const now = Date.now();
      const shouldTriggerCriticalAlert =
      this.leakOccurrences >= this.MIN_OCCURRENCES_FOR_CRITICAL_ALERT &&
      now - this.lastAlertTime > this.ALERT_COOLDOWN;

      if (shouldTriggerCriticalAlert) {
        this.lastAlertTime = now;
        this.reportCriticalMemoryLeak(currentMemory);
      }
    }

    // Auto-recovery mechanism - reset if memory usage decreases significantly
    if (memoryDelta < -(this.maxMemoryGrowth / 5)) {// Memory decreased by 10MB or more
      this.leakOccurrences = 0;
      this.consecutiveGrowthCount = 0;
      console.log('Memory usage decreased significantly - resetting leak detection counters');
    }
  }

  private reportCriticalMemoryLeak(currentMemory: MemoryStats): void {
    const memoryGrowth = currentMemory.usedJSHeapSize - this.baselineMemory!.usedJSHeapSize;

    console.error(`🚨 CRITICAL MEMORY LEAK DETECTED!`);
    console.error(`Memory grew by ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    console.error(`Leak occurrences: ${this.leakOccurrences}`);
    console.error(`Consecutive growth periods: ${this.consecutiveGrowthCount}`);

    // Report components that might be leaking
    this.reportSuspiciousComponents();
  }

  private reportGlobalMemoryLeak(currentMemory: MemoryStats, growth: number): void {
    console.warn(`Potential memory leak detected! Memory grew by ${(growth / 1024 / 1024).toFixed(2)}MB`);
    this.reportSuspiciousComponents();
  }

  private reportSuspiciousComponents(): void {
    const suspiciousComponents = Array.from(this.components.entries()).
    filter(([_, tracker]) => tracker.leakReports.length > 0).
    map(([name, tracker]) => ({
      name,
      leakCount: tracker.leakReports.length,
      lastLeakTime: Math.max(...tracker.leakReports.map((r) => r.timestamp))
    })).
    sort((a, b) => b.leakCount - a.leakCount);

    if (suspiciousComponents.length > 0) {
      console.group('🔍 Suspicious Components:');
      suspiciousComponents.forEach((comp) => {
        console.log(`${comp.name}: ${comp.leakCount} potential leaks`);
      });
      console.groupEnd();
    }
  }

  private sugggestGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      console.log('Triggering garbage collection...');
      (window as any).gc();
    } else {
      console.log('Consider triggering garbage collection manually in DevTools');
    }
  }

  trackComponent(componentName: string): void {
    const memoryStats = this.getCurrentMemoryStats();

    if (this.components.has(componentName)) {
      // Component remounting
      const existing = this.components.get(componentName)!;
      existing.mountTime = Date.now();
      existing.unmountTime = undefined;
      existing.memoryUsageOnMount = memoryStats;
    } else {
      this.components.set(componentName, {
        name: componentName,
        mountTime: Date.now(),
        leakReports: [],
        memoryUsageOnMount: memoryStats,
        memoryUsageOnUnmount: null
      });
    }

    console.log(`📊 Tracking component: ${componentName}`, {
      totalTracked: this.components.size,
      memoryOnMount: memoryStats ? `${(memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A'
    });
  }

  untrackComponent(componentName: string): void {
    const tracker = this.components.get(componentName);
    if (!tracker) return;

    const memoryStats = this.getCurrentMemoryStats();
    tracker.unmountTime = Date.now();
    tracker.memoryUsageOnUnmount = memoryStats;

    const lifecycleTime = tracker.unmountTime - tracker.mountTime;

    // Check for memory growth during component lifecycle
    if (tracker.memoryUsageOnMount && memoryStats) {
      const memoryDelta = memoryStats.usedJSHeapSize - tracker.memoryUsageOnMount.usedJSHeapSize;

      if (memoryDelta > 5 * 1024 * 1024) {// 5MB threshold
        console.warn(`Component ${componentName} may have caused memory growth: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    console.log(`📉 Component unmounted: ${componentName}`, {
      lifecycleTime: `${lifecycleTime}ms`,
      leakReports: tracker.leakReports.length,
      memoryOnUnmount: memoryStats ? `${(memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A'
    });
  }

  reportPotentialLeak(componentName: string, leakType: string, metadata: any): void {
    const tracker = this.components.get(componentName);
    if (!tracker) {
      console.warn(`Cannot report leak for untracked component: ${componentName}`);
      return;
    }

    const leakReport: LeakReport = {
      componentName,
      leakType,
      metadata,
      timestamp: Date.now(),
      memoryStats: this.getCurrentMemoryStats()
    };

    tracker.leakReports.push(leakReport);

    console.warn(`🚨 Potential memory leak detected in ${componentName}:`, {
      type: leakType,
      details: metadata,
      totalLeaksForComponent: tracker.leakReports.length
    });

    // Suggest fixes based on leak type
    this.suggestFix(leakType, componentName);
  }

  private suggestFix(leakType: string, componentName: string): void {
    const suggestions: Record<string, string> = {
      setState_after_unmount: 'Use a ref to track mount status or cleanup async operations in useEffect cleanup',
      large_closure: 'Consider breaking down large objects or using useMemo/useCallback to optimize closures',
      uncleared_timer: 'Make sure to clear timers in useEffect cleanup function',
      unremoved_listener: 'Remove event listeners in useEffect cleanup function',
      uncancelled_subscription: 'Cancel subscriptions and async operations in useEffect cleanup',
      memory_leak_detected: 'Check for circular references and ensure proper cleanup of resources'
    };

    const suggestion = suggestions[leakType];
    if (suggestion) {
      console.log(`💡 Suggestion for ${componentName}: ${suggestion}`);
    }
  }

  getComponentStats(componentName?: string): ComponentTracker[] | ComponentTracker | null {
    if (componentName) {
      return this.components.get(componentName) || null;
    }
    return Array.from(this.components.values());
  }

  getMemoryHistory(): {timestamp: number;memory: MemoryStats;}[] {
    return [...this.memoryHistory];
  }

  getCurrentMemoryInfo(): {
    current: MemoryStats | null;
    baseline: MemoryStats | null;
    growth: number;
    pressure: number;
    componentsTracked: number;
    totalLeakReports: number;
    leakOccurrences: number;
    isCriticalLeakDetected: boolean;
    nextAlertTime: number;
  } {
    const current = this.getCurrentMemoryStats();
    const growth = current && this.baselineMemory ?
    current.usedJSHeapSize - this.baselineMemory.usedJSHeapSize :
    0;
    const pressure = current ? current.usedJSHeapSize / current.jsHeapSizeLimit : 0;
    const totalLeakReports = Array.from(this.components.values()).
    reduce((total, tracker) => total + tracker.leakReports.length, 0);

    return {
      current,
      baseline: this.baselineMemory,
      growth,
      pressure,
      componentsTracked: this.components.size,
      totalLeakReports,
      leakOccurrences: this.leakOccurrences,
      isCriticalLeakDetected: this.leakOccurrences >= this.MIN_OCCURRENCES_FOR_CRITICAL_ALERT,
      nextAlertTime: this.lastAlertTime + this.ALERT_COOLDOWN
    };
  }

  // Force garbage collection if available (Chrome DevTools)
  forceGarbageCollection(): boolean {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
      console.log('Garbage collection triggered');
      return true;
    }
    console.warn('Garbage collection not available. Enable in Chrome: --js-flags="--expose-gc"');
    return false;
  }

  // Reset monitoring baseline and counters
  resetBaseline(): void {
    this.baselineMemory = this.getCurrentMemoryStats();
    this.memoryHistory = [];
    this.leakOccurrences = 0;
    this.consecutiveGrowthCount = 0;
    this.lastAlertTime = 0;
    console.log('Memory baseline and leak detection counters reset');
  }

  // Generate memory report
  generateReport(): string {
    const info = this.getCurrentMemoryInfo();
    const suspiciousComponents = Array.from(this.components.values()).
    filter((tracker) => tracker.leakReports.length > 0).
    sort((a, b) => b.leakReports.length - a.leakReports.length);

    const report = `
Memory Leak Detection Report
Generated: ${new Date().toISOString()}

=== Memory Stats ===
Current Usage: ${info.current ? (info.current.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A'}MB
Baseline Usage: ${info.baseline ? (info.baseline.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A'}MB
Memory Growth: ${(info.growth / 1024 / 1024).toFixed(2)}MB
Memory Pressure: ${(info.pressure * 100).toFixed(1)}%
Heap Size Limit: ${info.current ? (info.current.jsHeapSizeLimit / 1024 / 1024).toFixed(2) : 'N/A'}MB

=== Leak Detection Status ===
Leak Occurrences: ${info.leakOccurrences}
Critical Leak Detected: ${info.isCriticalLeakDetected ? 'YES' : 'NO'}
Next Alert Available: ${info.nextAlertTime > Date.now() ? new Date(info.nextAlertTime).toISOString() : 'Now'}

=== Component Tracking ===
Components Tracked: ${info.componentsTracked}
Total Leak Reports: ${info.totalLeakReports}

=== Suspicious Components ===
${suspiciousComponents.length === 0 ? 'No suspicious components detected' :
    suspiciousComponents.map((comp) =>
    `${comp.name}: ${comp.leakReports.length} leak reports`
    ).join('\n')}

=== Memory History (Last 10 entries) ===
${this.memoryHistory.slice(-10).map((entry) =>
    `${new Date(entry.timestamp).toISOString()}: ${(entry.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
    ).join('\n')}
    `;

    return report.trim();
  }
}

export default MemoryLeakMonitor;
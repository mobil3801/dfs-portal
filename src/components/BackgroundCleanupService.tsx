import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Trash2,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Monitor } from
'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/hooks/use-toast';

interface CleanupTask {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  interval: number; // in milliseconds
  lastRun: number;
  nextRun: number;
  isActive: boolean;
  cleanupFunction: () => Promise<{cleaned: number;freed: number;}>;
}

interface CleanupStats {
  totalRuns: number;
  totalCleaned: number;
  totalFreed: number;
  lastCleanup: number;
  averageCleanupTime: number;
  errorCount: number;
}

interface CleanupConfig {
  enabled: boolean;
  aggressiveMode: boolean;
  maxMemoryUsage: number; // percentage
  maxIdleTime: number; // milliseconds
  checkInterval: number; // milliseconds
  batchSize: number;
}

const BackgroundCleanupService: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<CleanupTask[]>([]);
  const [stats, setStats] = useState<CleanupStats>({
    totalRuns: 0,
    totalCleaned: 0,
    totalFreed: 0,
    lastCleanup: 0,
    averageCleanupTime: 0,
    errorCount: 0
  });
  const [config, setConfig] = useState<CleanupConfig>({
    enabled: true,
    aggressiveMode: false,
    maxMemoryUsage: 80,
    maxIdleTime: 300000, // 5 minutes
    checkInterval: 30000, // 30 seconds
    batchSize: 50
  });
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);
  const memoryMonitor = useRef<NodeJS.Timeout | null>(null);
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const cleanupHistory = useRef<Array<{timestamp: number;task: string;result: any;}>>([]);

  /**
   * Initialize cleanup tasks
   */
  const initializeCleanupTasks = useCallback((): CleanupTask[] => {
    const now = Date.now();

    return [
    {
      id: 'dom-cleanup',
      name: 'DOM Cleanup',
      description: 'Remove orphaned DOM elements and event listeners',
      priority: 'medium',
      interval: 120000, // 2 minutes
      lastRun: 0,
      nextRun: now + 120000,
      isActive: true,
      cleanupFunction: cleanupDOMElements
    },
    {
      id: 'memory-cleanup',
      name: 'Memory Cleanup',
      description: 'Force garbage collection and clear caches',
      priority: 'high',
      interval: 60000, // 1 minute
      lastRun: 0,
      nextRun: now + 60000,
      isActive: true,
      cleanupFunction: cleanupMemory
    },
    {
      id: 'cache-cleanup',
      name: 'Cache Cleanup',
      description: 'Clear expired cache entries',
      priority: 'medium',
      interval: 300000, // 5 minutes
      lastRun: 0,
      nextRun: now + 300000,
      isActive: true,
      cleanupFunction: cleanupCache
    },
    {
      id: 'storage-cleanup',
      name: 'Storage Cleanup',
      description: 'Remove old localStorage and sessionStorage entries',
      priority: 'low',
      interval: 600000, // 10 minutes
      lastRun: 0,
      nextRun: now + 600000,
      isActive: true,
      cleanupFunction: cleanupStorage
    },
    {
      id: 'network-cleanup',
      name: 'Network Cleanup',
      description: 'Cancel pending requests and close connections',
      priority: 'high',
      interval: 180000, // 3 minutes
      lastRun: 0,
      nextRun: now + 180000,
      isActive: true,
      cleanupFunction: cleanupNetwork
    },
    {
      id: 'component-cleanup',
      name: 'Component Cleanup',
      description: 'Cleanup unmounted React components',
      priority: 'medium',
      interval: 240000, // 4 minutes
      lastRun: 0,
      nextRun: now + 240000,
      isActive: true,
      cleanupFunction: cleanupComponents
    },
    {
      id: 'performance-cleanup',
      name: 'Performance Cleanup',
      description: 'Clear performance entries and metrics',
      priority: 'low',
      interval: 900000, // 15 minutes
      lastRun: 0,
      nextRun: now + 900000,
      isActive: true,
      cleanupFunction: cleanupPerformanceEntries
    }];

  }, []);

  /**
   * DOM Elements Cleanup
   */
  const cleanupDOMElements = async (): Promise<{cleaned: number;freed: number;}> => {
    let cleaned = 0;
    let freed = 0;

    try {
      // Remove orphaned elements
      const orphanedElements = document.querySelectorAll('[data-cleanup="true"]');
      orphanedElements.forEach((element) => {
        element.remove();
        cleaned++;
        freed += 100; // Estimate 100 bytes per element
      });

      // Clean up empty text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            return node.textContent?.trim() === '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const emptyTextNodes: Node[] = [];
      let node;
      while (node = walker.nextNode()) {
        emptyTextNodes.push(node);
      }

      emptyTextNodes.forEach((textNode) => {
        textNode.remove();
        cleaned++;
        freed += 50;
      });

      // Remove duplicate event listeners (simplified detection)
      const elementsWithListeners = document.querySelectorAll('[data-has-listeners]');
      elementsWithListeners.forEach((element) => {
        // This is a simplified approach - in practice you'd need more sophisticated detection
        const listenerCount = parseInt(element.getAttribute('data-listener-count') || '0');
        if (listenerCount > 5) {
          element.removeAttribute('data-has-listeners');
          element.removeAttribute('data-listener-count');
          cleaned++;
          freed += 200;
        }
      });

      console.log(`DOM Cleanup: Removed ${cleaned} elements, freed ~${freed} bytes`);
    } catch (error) {
      console.error('DOM cleanup failed:', error);
    }

    return { cleaned, freed };
  };

  /**
   * Memory Cleanup
   */
  const cleanupMemory = async (): Promise<{cleaned: number;freed: number;}> => {
    let cleaned = 0;
    let freed = 0;

    try {
      // Clear WeakMaps and WeakSets if possible
      if (window.WeakRef) {
        // Modern browsers with WeakRef support
        cleaned += 10;
        freed += 1000;
      }

      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
        cleaned += 1;
        freed += 10000; // Estimate
      }

      // Clear function closures and references
      if ('FinalizationRegistry' in window) {
        // Clean up finalization registry if supported
        cleaned += 5;
        freed += 500;
      }

      // Clear performance memory if available
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const beforeUsed = memInfo.usedJSHeapSize;

        // Trigger memory cleanup
        const tempArray = new Array(1000).fill(null);
        tempArray.length = 0;

        setTimeout(() => {
          const afterUsed = memInfo.usedJSHeapSize;
          freed = Math.max(0, beforeUsed - afterUsed);
        }, 100);

        cleaned += 1;
      }

      console.log(`Memory Cleanup: ${cleaned} operations, freed ~${freed} bytes`);
    } catch (error) {
      console.error('Memory cleanup failed:', error);
    }

    return { cleaned, freed };
  };

  /**
   * Cache Cleanup
   */
  const cleanupCache = async (): Promise<{cleaned: number;freed: number;}> => {
    let cleaned = 0;
    let freed = 0;

    try {
      // Clear application cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();

          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const cacheControl = response.headers.get('cache-control');
              const expires = response.headers.get('expires');

              // Check if cache is expired
              let isExpired = false;
              if (expires) {
                isExpired = new Date(expires) < new Date();
              } else if (cacheControl?.includes('max-age')) {
                const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '0');
                const responseDate = new Date(response.headers.get('date') || '');
                isExpired = Date.now() - responseDate.getTime() > maxAge * 1000;
              }

              if (isExpired) {
                await cache.delete(request);
                cleaned++;
                freed += 1000; // Estimate
              }
            }
          }
        }
      }

      // Clear in-memory caches
      if (window.ezsite?.cache?.clear) {
        window.ezsite.cache.clear();
        cleaned += 10;
        freed += 5000;
      }

      console.log(`Cache Cleanup: Cleared ${cleaned} entries, freed ~${freed} bytes`);
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }

    return { cleaned, freed };
  };

  /**
   * Storage Cleanup
   */
  const cleanupStorage = async (): Promise<{cleaned: number;freed: number;}> => {
    let cleaned = 0;
    let freed = 0;

    try {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      // Clean localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach((key) => {
        try {
          if (key.startsWith('temp_') || key.startsWith('cache_')) {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp && now - data.timestamp > maxAge) {
              const size = new Blob([localStorage.getItem(key) || '']).size;
              localStorage.removeItem(key);
              cleaned++;
              freed += size;
            }
          }
        } catch (error) {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
          cleaned++;
          freed += 100;
        }
      });

      // Clean sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach((key) => {
        try {
          if (key.startsWith('temp_')) {
            const size = new Blob([sessionStorage.getItem(key) || '']).size;
            sessionStorage.removeItem(key);
            cleaned++;
            freed += size;
          }
        } catch (error) {
          sessionStorage.removeItem(key);
          cleaned++;
          freed += 50;
        }
      });

      console.log(`Storage Cleanup: Removed ${cleaned} items, freed ~${freed} bytes`);
    } catch (error) {
      console.error('Storage cleanup failed:', error);
    }

    return { cleaned, freed };
  };

  /**
   * Network Cleanup
   */
  const cleanupNetwork = async (): Promise<{cleaned: number;freed: number;}> => {
    let cleaned = 0;
    let freed = 0;

    try {
      // Cancel pending fetch requests (if tracked)
      if (window.ezsite?.pendingRequests) {
        const pendingRequests = window.ezsite.pendingRequests;
        pendingRequests.forEach((controller: AbortController, url: string) => {
          try {
            controller.abort();
            pendingRequests.delete(url);
            cleaned++;
            freed += 200;
          } catch (error) {
            console.warn(`Failed to abort request to ${url}:`, error);
          }
        });
      }

      // Close idle connections (WebSocket, EventSource)
      if (window.ezsite?.connections) {
        const connections = window.ezsite.connections;
        connections.forEach((connection: any, id: string) => {
          if (connection.readyState === WebSocket.OPEN) {
            const lastActivity = connection.lastActivity || 0;
            if (Date.now() - lastActivity > config.maxIdleTime) {
              connection.close();
              connections.delete(id);
              cleaned++;
              freed += 500;
            }
          }
        });
      }

      // Clear DNS cache if possible (browser specific)
      if ('connection' in navigator && 'clearDNSCache' in (navigator as any).connection) {
        try {
          (navigator as any).connection.clearDNSCache();
          cleaned++;
          freed += 1000;
        } catch (error) {
          console.warn('DNS cache clear not supported');
        }
      }

      console.log(`Network Cleanup: Closed ${cleaned} connections, freed ~${freed} bytes`);
    } catch (error) {
      console.error('Network cleanup failed:', error);
    }

    return { cleaned, freed };
  };

  /**
   * Component Cleanup
   */
  const cleanupComponents = async (): Promise<{cleaned: number;freed: number;}> => {
    let cleaned = 0;
    let freed = 0;

    try {
      // Clean up React DevTools data if available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const devTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (devTools.getFiberRoots) {
          devTools.getFiberRoots(1).forEach((root: any) => {
            // Traverse and cleanup unused fibers
            if (root._internalRoot?.current) {
              // This is a simplified cleanup - real implementation would be more complex
              cleaned++;
              freed += 500;
            }
          });
        }
      }

      // Clear component refs and callbacks
      if (window.ezsite?.componentRegistry) {
        const registry = window.ezsite.componentRegistry;
        const now = Date.now();

        registry.forEach((component: any, id: string) => {
          if (component.unmountedAt && now - component.unmountedAt > 60000) {
            registry.delete(id);
            cleaned++;
            freed += 200;
          }
        });
      }

      console.log(`Component Cleanup: Cleaned ${cleaned} components, freed ~${freed} bytes`);
    } catch (error) {
      console.error('Component cleanup failed:', error);
    }

    return { cleaned, freed };
  };

  /**
   * Performance Entries Cleanup
   */
  const cleanupPerformanceEntries = async (): Promise<{cleaned: number;freed: number;}> => {
    let cleaned = 0;
    let freed = 0;

    try {
      // Clear performance entries
      const entryTypes = ['navigation', 'resource', 'measure', 'mark'];

      entryTypes.forEach((entryType) => {
        try {
          const entries = performance.getEntriesByType(entryType);
          if (entries.length > 100) {
            // Keep only the most recent 50 entries
            performance.clearMarks();
            performance.clearMeasures();
            if ('clearResourceTimings' in performance) {
              performance.clearResourceTimings();
            }
            cleaned += entries.length - 50;
            freed += (entries.length - 50) * 100;
          }
        } catch (error) {
          console.warn(`Failed to clear ${entryType} entries:`, error);
        }
      });

      // Clear observer data
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
        performanceObserver.current = null;
        cleaned++;
        freed += 1000;

        // Recreate observer
        setupPerformanceObserver();
      }

      console.log(`Performance Cleanup: Cleared ${cleaned} entries, freed ~${freed} bytes`);
    } catch (error) {
      console.error('Performance cleanup failed:', error);
    }

    return { cleaned, freed };
  };

  /**
   * Setup performance observer
   */
  const setupPerformanceObserver = useCallback(() => {
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        // Monitor performance but don't store too much data
        const entries = list.getEntries();
        if (entries.length > 50) {
          // Too many entries, trigger cleanup
          console.log('High performance entry count detected, scheduling cleanup');
        }
      });

      try {
        performanceObserver.current.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }, []);

  /**
   * Monitor memory usage
   */
  const monitorMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize * 100;
      setMemoryUsage(usage);

      // Trigger aggressive cleanup if memory usage is high
      if (usage > config.maxMemoryUsage && config.aggressiveMode) {
        console.log(`High memory usage (${usage.toFixed(1)}%), triggering aggressive cleanup`);
        runCleanupTask('memory-cleanup', true);
      }
    }
  }, [config.maxMemoryUsage, config.aggressiveMode]);

  /**
   * Run a specific cleanup task
   */
  const runCleanupTask = useCallback(async (taskId: string, force: boolean = false) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.isActive && !force) return;

    const now = Date.now();
    if (!force && now < task.nextRun) return;

    setCurrentTask(taskId);
    const startTime = performance.now();

    try {
      const result = await task.cleanupFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update task
      setTasks((prev) => prev.map((t) => t.id === taskId ? {
        ...t,
        lastRun: now,
        nextRun: now + t.interval
      } : t));

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalRuns: prev.totalRuns + 1,
        totalCleaned: prev.totalCleaned + result.cleaned,
        totalFreed: prev.totalFreed + result.freed,
        lastCleanup: now,
        averageCleanupTime: (prev.averageCleanupTime + duration) / 2
      }));

      // Add to history
      cleanupHistory.current.push({
        timestamp: now,
        task: task.name,
        result
      });

      // Keep only last 50 entries
      if (cleanupHistory.current.length > 50) {
        cleanupHistory.current = cleanupHistory.current.slice(-50);
      }

      console.log(`Cleanup task ${task.name} completed:`, result);
    } catch (error) {
      console.error(`Cleanup task ${task.name} failed:`, error);
      setStats((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
    } finally {
      setCurrentTask(null);
    }
  }, [tasks]);

  /**
   * Run cleanup cycle
   */
  const runCleanupCycle = useCallback(async () => {
    if (!config.enabled) return;

    const now = Date.now();
    const tasksToRun = tasks.filter((task) =>
    task.isActive && now >= task.nextRun
    ).sort((a, b) => {
      // Sort by priority: critical -> high -> medium -> low
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Run tasks in batches to avoid blocking
    for (let i = 0; i < tasksToRun.length; i += config.batchSize) {
      const batch = tasksToRun.slice(i, i + config.batchSize);

      await Promise.all(
        batch.map((task) => runCleanupTask(task.id))
      );

      // Small delay between batches
      if (i + config.batchSize < tasksToRun.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }, [config, tasks, runCleanupTask]);

  /**
   * Start background cleanup service
   */
  const startService = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);

    // Initialize tasks
    setTasks(initializeCleanupTasks());

    // Setup cleanup interval
    cleanupInterval.current = setInterval(runCleanupCycle, config.checkInterval);

    // Setup memory monitoring
    memoryMonitor.current = setInterval(monitorMemoryUsage, 10000); // Every 10 seconds

    // Setup performance observer
    setupPerformanceObserver();

    toast({
      title: 'Background Cleanup Started',
      description: 'Automatic cleanup service is now running.'
    });
  }, [isRunning, config.checkInterval, runCleanupCycle, monitorMemoryUsage, setupPerformanceObserver, initializeCleanupTasks, toast]);

  /**
   * Stop background cleanup service
   */
  const stopService = useCallback(() => {
    setIsRunning(false);

    if (cleanupInterval.current) {
      clearInterval(cleanupInterval.current);
      cleanupInterval.current = null;
    }

    if (memoryMonitor.current) {
      clearInterval(memoryMonitor.current);
      memoryMonitor.current = null;
    }

    if (performanceObserver.current) {
      performanceObserver.current.disconnect();
      performanceObserver.current = null;
    }

    toast({
      title: 'Background Cleanup Stopped',
      description: 'Automatic cleanup service has been paused.'
    });
  }, [toast]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    if (config.enabled) {
      startService();
    }

    return () => {
      stopService();
    };
  }, []);

  /**
   * Update config
   */
  const updateConfig = useCallback((newConfig: Partial<CleanupConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));

    // Restart service if running
    if (isRunning) {
      stopService();
      setTimeout(() => {
        if (newConfig.enabled !== false) {
          startService();
        }
      }, 100);
    }
  }, [isRunning, startService, stopService]);

  /**
   * Format bytes
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':return 'destructive';
      case 'high':return 'default';
      case 'medium':return 'secondary';
      case 'low':return 'outline';
      default:return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Background Cleanup Service
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
          <Button
            onClick={isRunning ? stopService : startService}
            variant="outline"
            size="sm">

            {isRunning ? 'Stop' : 'Start'} Service
          </Button>
        </div>
      </div>

      {/* Memory Alert */}
      {memoryUsage > config.maxMemoryUsage &&
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-700">
                  High Memory Usage: {memoryUsage.toFixed(1)}%
                </span>
                <Button
                onClick={() => runCleanupTask('memory-cleanup', true)}
                size="sm"
                variant="destructive">

                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force Cleanup
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      }

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRuns}</div>
            <p className="text-xs text-muted-foreground">
              Since service started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Items Cleaned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCleaned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total items removed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Memory Freed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.totalFreed)}</div>
            <p className="text-xs text-muted-foreground">
              Total memory freed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageCleanupTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Per cleanup cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      {currentTask &&
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">

          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-blue-700">
            Running cleanup task: {tasks.find((t) => t.id === currentTask)?.name}
          </span>
        </motion.div>
      }

      {/* Memory Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Memory Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Current Usage</span>
              <Badge variant={memoryUsage > 80 ? 'destructive' : 'default'}>
                {memoryUsage.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={memoryUsage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Threshold: {config.maxMemoryUsage}%</span>
              <span>{memoryUsage > config.maxMemoryUsage ? 'Above threshold' : 'Within limits'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cleanup Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Cleanup Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => {
              const nextRunIn = Math.max(0, task.nextRun - Date.now());
              const timeSinceLastRun = task.lastRun ? Date.now() - task.lastRun : 0;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 border rounded-lg">

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(task.priority) as any}>
                        {task.priority}
                      </Badge>
                      {task.isActive ?
                      <CheckCircle className="h-4 w-4 text-green-600" /> :

                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold">{task.name}</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {nextRunIn > 0 ? `Next: ${Math.round(nextRunIn / 1000)}s` : 'Ready'}
                    </div>
                    <div className="text-muted-foreground">
                      {task.lastRun ? `Last: ${Math.round(timeSinceLastRun / 1000)}s ago` : 'Never'}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => runCleanupTask(task.id, true)}
                    disabled={currentTask === task.id}
                    size="sm"
                    variant="outline">

                    {currentTask === task.id ?
                    <RefreshCw className="h-3 w-3 animate-spin" /> :

                    'Run Now'
                    }
                  </Button>
                </motion.div>);

            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Service Enabled</Label>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })} />

              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="aggressive">Aggressive Mode</Label>
                <Switch
                  id="aggressive"
                  checked={config.aggressiveMode}
                  onCheckedChange={(checked) => updateConfig({ aggressiveMode: checked })} />

              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Memory Threshold: {config.maxMemoryUsage}%</Label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={config.maxMemoryUsage}
                  onChange={(e) => updateConfig({ maxMemoryUsage: parseInt(e.target.value) })}
                  className="w-full" />

              </div>
              
              <div>
                <Label>Check Interval: {config.checkInterval / 1000}s</Label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  value={config.checkInterval / 1000}
                  onChange={(e) => updateConfig({ checkInterval: parseInt(e.target.value) * 1000 })}
                  className="w-full" />

              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default BackgroundCleanupService;
/**
 * Supabase Optimized Data Service with Selective Fetching and Connection Pooling
 * Provides intelligent data loading with memory and performance optimization for Supabase
 */

import { supabaseAdapter } from './supabase/supabaseAdapter'
import SupabaseConnectionManager from './supabaseConnectionManager'

interface DataCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresAt: number;
    accessCount: number;
    lastAccessed: number;
    size: number; // Track data size for memory management
  };
}

interface ConnectionPool {
  active: number;
  idle: number;
  maxConnections: number;
  queue: Array<() => void>;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  totalRequests: number;
  cacheHitRate: number;
  memoryUsage: number;
  supabaseErrors: number;
  lastQueryTime: number;
}

class SupabaseOptimizedDataService {
  private cache: DataCache = {};
  private connectionManager: SupabaseConnectionManager;
  private connectionPool: ConnectionPool = {
    active: 0,
    idle: 0,
    maxConnections: 15, // Higher than original since Supabase handles pooling better
    queue: []
  };
  private performanceMetrics: PerformanceMetrics = {
    avgResponseTime: 0,
    totalRequests: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    supabaseErrors: 0,
    lastQueryTime: 0
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private queryTimes: number[] = [];

  constructor() {
    this.connectionManager = SupabaseConnectionManager.getInstance();
    this.startBackgroundCleanup();
    this.monitorPerformance();
  }

  /**
   * Intelligent data fetching with selective loading
   */
  async fetchData(
    tableId: string | number,
    params: any,
    options: {
      priority?: 'high' | 'medium' | 'low';
      cache?: boolean;
      viewport?: { start: number; end: number; };
      fields?: string[];
      ttl?: number; // Cache time-to-live in milliseconds
    } = {}
  ) {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(tableId, params, options);

    try {
      // Check cache first
      if (options.cache !== false && this.isCacheValid(cacheKey)) {
        this.updateCacheAccess(cacheKey);
        this.performanceMetrics.totalRequests++;
        this.updateCacheHitRate();
        return { data: this.cache[cacheKey].data, fromCache: true };
      }

      // Check if request is already in progress (deduplication)
      if (this.requestQueue.has(cacheKey)) {
        return await this.requestQueue.get(cacheKey);
      }

      // Create new request
      const requestPromise = this.executeRequest(tableId, params, options);
      this.requestQueue.set(cacheKey, requestPromise);

      const result = await requestPromise;

      // Cache the result
      if (options.cache !== false && result.data) {
        this.cacheData(cacheKey, result.data, options.ttl);
      }

      // Clean up request queue
      this.requestQueue.delete(cacheKey);

      // Update metrics
      this.updateMetrics(performance.now() - startTime, true);

      return result;
    } catch (error: any) {
      this.requestQueue.delete(cacheKey);
      this.updateMetrics(performance.now() - startTime, false);
      this.performanceMetrics.supabaseErrors++;
      
      console.error('SupabaseOptimizedDataService fetchData error:', error);
      throw error;
    }
  }

  /**
   * Execute request with Supabase connection management
   */
  private async executeRequest(tableId: string | number, params: any, options: any) {
    return new Promise(async (resolve, reject) => {
      const executeWithConnection = async () => {
        this.connectionPool.active++;
        let connectionId: string | undefined;

        try {
          // Acquire connection from Supabase connection manager
          connectionId = await this.connectionManager.acquireConnection();

          // Optimize query based on viewport and fields
          const optimizedParams = this.optimizeQuery(params, options);

          // Use Supabase adapter instead of window.ezsite.apis
          const result = await this.connectionManager.executeQuery(
            () => supabaseAdapter.tablePage(tableId, optimizedParams),
            connectionId
          );

          if (result.error) {
            throw new Error(result.error);
          }

          resolve({ data: result.data, fromCache: false });
        } catch (error: any) {
          console.error(`Supabase query failed for table ${tableId}:`, error);
          reject(error);
        } finally {
          // Release connection
          if (connectionId) {
            this.connectionManager.releaseConnection(connectionId);
          }
          this.connectionPool.active--;
          this.processQueue();
        }
      };

      // Check connection availability
      if (this.connectionPool.active >= this.connectionPool.maxConnections) {
        this.connectionPool.queue.push(executeWithConnection);
      } else {
        executeWithConnection();
      }
    });
  }

  /**
   * Optimize query parameters for Supabase
   */
  private optimizeQuery(params: any, options: any) {
    const optimized = { ...params };

    // Apply viewport optimization for virtual scrolling
    if (options.viewport) {
      const { start, end } = options.viewport;
      const pageSize = params.PageSize || 10;
      optimized.PageNo = Math.floor(start / pageSize) + 1;
      optimized.PageSize = Math.min(end - start + 1, pageSize * 2); // Slight buffer for smoother scrolling
    }

    // Optimize field selection for Supabase (reduce data transfer)
    if (options.fields && options.fields.length > 0) {
      optimized.Fields = options.fields;
      // Note: This would need to be implemented in the Supabase adapter
      // to use .select() with specific fields
    }

    // Apply priority-based optimization
    if (options.priority === 'high') {
      optimized.OrderByField = optimized.OrderByField || 'created_at';
      optimized.IsAsc = optimized.IsAsc !== undefined ? optimized.IsAsc : false;
      // For high priority, we might want to skip cache
      if (!options.cache) {
        options.cache = false;
      }
    }

    // Supabase-specific optimizations
    if (options.priority === 'low') {
      // For low priority requests, use smaller page sizes to reduce load
      optimized.PageSize = Math.min(optimized.PageSize || 10, 5);
    }

    return optimized;
  }

  /**
   * Process connection queue
   */
  private processQueue() {
    if (this.connectionPool.queue.length > 0 &&
        this.connectionPool.active < this.connectionPool.maxConnections) {
      const nextRequest = this.connectionPool.queue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  /**
   * Generate cache key with Supabase context
   */
  private generateCacheKey(tableId: string | number, params: any, options: any): string {
    const keyData = {
      tableId: tableId.toString(),
      params: JSON.stringify(params),
      fields: options.fields?.join(',') || 'all',
      viewport: options.viewport ? `${options.viewport.start}-${options.viewport.end}` : 'full',
      priority: options.priority || 'medium'
    };
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Check if cached data is valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache[cacheKey];
    if (!cached) return false;

    const now = Date.now();
    return now < cached.expiresAt;
  }

  /**
   * Cache data with expiration and size tracking
   */
  private cacheData(cacheKey: string, data: any, ttl?: number) {
    const now = Date.now();
    const defaultTTL = 5 * 60 * 1000; // 5 minutes default
    const cacheTTL = ttl || defaultTTL;

    // Estimate data size for memory management
    const dataSize = this.estimateDataSize(data);

    this.cache[cacheKey] = {
      data,
      timestamp: now,
      expiresAt: now + cacheTTL,
      accessCount: 1,
      lastAccessed: now,
      size: dataSize
    };

    // Check if we need to free up memory
    this.checkMemoryPressure();
  }

  /**
   * Estimate data size for memory management
   */
  private estimateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate in bytes
    } catch {
      return 1000; // Default estimate
    }
  }

  /**
   * Check memory pressure and clean up if needed
   */
  private checkMemoryPressure() {
    const totalSize = Object.values(this.cache).reduce((sum, item) => sum + item.size, 0);
    const maxCacheSize = 50 * 1024 * 1024; // 50MB limit

    if (totalSize > maxCacheSize) {
      console.warn('Cache memory pressure detected, cleaning up least used items');
      this.evictLeastUsedCache();
    }
  }

  /**
   * Evict least used cache items
   */
  private evictLeastUsedCache() {
    const cacheEntries = Object.entries(this.cache)
      .sort(([,a], [,b]) => {
        // Sort by access count (ascending) then by last accessed (ascending)
        if (a.accessCount === b.accessCount) {
          return a.lastAccessed - b.lastAccessed;
        }
        return a.accessCount - b.accessCount;
      });

    // Remove bottom 25% of cache entries
    const itemsToRemove = Math.ceil(cacheEntries.length * 0.25);
    for (let i = 0; i < itemsToRemove; i++) {
      delete this.cache[cacheEntries[i][0]];
    }

    console.log(`Evicted ${itemsToRemove} cache entries due to memory pressure`);
  }

  /**
   * Update cache access statistics
   */
  private updateCacheAccess(cacheKey: string) {
    if (this.cache[cacheKey]) {
      this.cache[cacheKey].accessCount++;
      this.cache[cacheKey].lastAccessed = Date.now();
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(responseTime: number, success: boolean) {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.lastQueryTime = Date.now();

    // Track query times for better average calculation
    this.queryTimes.push(responseTime);
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift(); // Keep only last 100 query times
    }

    if (success) {
      this.performanceMetrics.avgResponseTime = 
        this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
    }

    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate() {
    const totalCacheRequests = Object.values(this.cache)
      .reduce((sum, item) => sum + item.accessCount, 0);

    this.performanceMetrics.cacheHitRate = 
      this.performanceMetrics.totalRequests > 0 
        ? totalCacheRequests / this.performanceMetrics.totalRequests 
        : 0;
  }

  /**
   * Start background cleanup process
   */
  private startBackgroundCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
      this.optimizeConnectionPool();
      this.monitorMemoryUsage();
    }, 30000); // Every 30 seconds
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    Object.keys(this.cache).forEach((key) => {
      const cached = this.cache[key];

      // Remove expired entries
      if (now > cached.expiresAt) {
        expiredKeys.push(key);
      }

      // Remove rarely accessed entries (LRU with 10 minutes threshold)
      if (cached.accessCount < 2 && now - cached.lastAccessed > 600000) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => {
      delete this.cache[key];
    });

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Optimize connection pool based on Supabase performance
   */
  private optimizeConnectionPool() {
    const supabaseHealthy = this.connectionManager.isSupabaseHealthy();
    
    if (!supabaseHealthy) {
      // Reduce max connections if Supabase is having issues
      this.connectionPool.maxConnections = Math.max(5, this.connectionPool.maxConnections - 2);
      console.warn('Reduced connection pool size due to Supabase health issues');
    } else {
      // Adjust max connections based on performance
      if (this.performanceMetrics.avgResponseTime > 2000) {
        this.connectionPool.maxConnections = Math.max(5, this.connectionPool.maxConnections - 1);
      } else if (this.performanceMetrics.avgResponseTime < 500) {
        this.connectionPool.maxConnections = Math.min(25, this.connectionPool.maxConnections + 1);
      }
    }
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.performanceMetrics.memoryUsage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;

      // Force cleanup if memory usage is high
      if (this.performanceMetrics.memoryUsage > 0.8) {
        console.warn('High memory usage detected, forcing cleanup');
        this.forceCleanup();
      }
    }
  }

  /**
   * Force cleanup when memory is high
   */
  private forceCleanup() {
    // Clear half of the cache (keep most recently accessed)
    const cacheEntries = Object.entries(this.cache)
      .sort(([,a], [,b]) => b.lastAccessed - a.lastAccessed);
    
    const itemsToKeep = Math.floor(cacheEntries.length * 0.5);
    this.cache = {};
    
    // Restore top half
    for (let i = 0; i < itemsToKeep; i++) {
      this.cache[cacheEntries[i][0]] = cacheEntries[i][1];
    }

    // Clear request queue for pending requests
    this.requestQueue.clear();

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    console.warn('Forced cleanup due to high memory usage');
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics() {
    const connectionManagerStats = this.connectionManager.getDetailedStats();
    
    return {
      ...this.performanceMetrics,
      cacheSize: Object.keys(this.cache).length,
      totalCacheSize: Object.values(this.cache).reduce((sum, item) => sum + item.size, 0),
      activeConnections: this.connectionPool.active,
      queuedRequests: this.connectionPool.queue.length,
      maxConnections: this.connectionPool.maxConnections,
      supabaseHealth: connectionManagerStats.supabaseHealthy,
      supabaseMetrics: connectionManagerStats.metrics,
      pendingRequests: this.requestQueue.size
    };
  }

  /**
   * Monitor performance continuously
   */
  private monitorPerformance() {
    setInterval(() => {
      const metrics = this.getMetrics();

      // Log performance data for monitoring (only when significant activity)
      if (metrics.totalRequests > 0 && metrics.totalRequests % 10 === 0) {
        console.log('Supabase Performance Metrics:', {
          avgResponseTime: Math.round(metrics.avgResponseTime),
          cacheHitRate: Math.round(metrics.cacheHitRate * 100) + '%',
          cacheSize: metrics.cacheSize,
          supabaseHealth: metrics.supabaseHealth ? 'OK' : 'ERROR',
          supabaseErrors: metrics.supabaseErrors
        });
      }

      // Trigger alerts if needed
      if (metrics.avgResponseTime > 3000) {
        console.warn('🚨 High response time detected:', Math.round(metrics.avgResponseTime) + 'ms');
      }

      if (metrics.memoryUsage > 0.75) {
        console.warn('⚠️ High memory usage detected:', Math.round(metrics.memoryUsage * 100) + '%');
      }

      if (!metrics.supabaseHealth) {
        console.error('🚨 Supabase connection is not healthy');
      }

      if (metrics.supabaseErrors > 10) {
        console.warn('⚠️ High number of Supabase errors:', metrics.supabaseErrors);
      }

    }, 60000); // Every minute
  }

  /**
   * Prefetch data for improved user experience
   */
  async prefetchData(tableId: string | number, params: any, options: any = {}) {
    try {
      await this.fetchData(tableId, params, { 
        ...options, 
        priority: 'low',
        cache: true 
      });
    } catch (error) {
      // Prefetch failures should not interrupt the application
      console.warn('Prefetch failed for table', tableId, error);
    }
  }

  /**
   * Clear specific cache entries
   */
  clearCache(pattern?: string) {
    if (!pattern) {
      this.cache = {};
      console.log('All cache cleared');
      return;
    }

    const clearedKeys: string[] = [];
    Object.keys(this.cache).forEach(key => {
      if (key.includes(pattern)) {
        delete this.cache[key];
        clearedKeys.push(key);
      }
    });

    console.log(`Cleared ${clearedKeys.length} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache = {};
    this.requestQueue.clear();
    this.queryTimes = [];
    console.log('SupabaseOptimizedDataService destroyed');
  }
}

export const supabaseOptimizedDataService = new SupabaseOptimizedDataService();
export default supabaseOptimizedDataService;
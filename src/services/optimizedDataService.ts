/**
 * Optimized Data Service with Selective Fetching and Connection Pooling
 * Provides intelligent data loading with memory and performance optimization
 */

interface DataCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresAt: number;
    accessCount: number;
    lastAccessed: number;
  };
}

interface ConnectionPool {
  active: number;
  idle: number;
  maxConnections: number;
  queue: Array<() => void>;
}

class OptimizedDataService {
  private cache: DataCache = {};
  private connectionPool: ConnectionPool = {
    active: 0,
    idle: 0,
    maxConnections: 10,
    queue: []
  };
  private performanceMetrics = {
    avgResponseTime: 0,
    totalRequests: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.startBackgroundCleanup();
    this.monitorPerformance();
  }

  /**
   * Intelligent data fetching with selective loading
   */
  async fetchData(
  tableId: string,
  params: any,
  options: {
    priority?: 'high' | 'medium' | 'low';
    cache?: boolean;
    viewport?: {start: number;end: number;};
    fields?: string[];
  } = {})
  {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(tableId, params, options);

    try {
      // Check cache first
      if (options.cache !== false && this.isCacheValid(cacheKey)) {
        this.updateCacheAccess(cacheKey);
        return { data: this.cache[cacheKey].data, fromCache: true };
      }

      // Check if request is already in progress
      if (this.requestQueue.has(cacheKey)) {
        return await this.requestQueue.get(cacheKey);
      }

      // Create new request
      const requestPromise = this.executeRequest(tableId, params, options);
      this.requestQueue.set(cacheKey, requestPromise);

      const result = await requestPromise;

      // Cache the result
      if (options.cache !== false) {
        this.cacheData(cacheKey, result.data);
      }

      // Clean up request queue
      this.requestQueue.delete(cacheKey);

      // Update metrics
      this.updateMetrics(performance.now() - startTime, true);

      return result;
    } catch (error) {
      this.requestQueue.delete(cacheKey);
      this.updateMetrics(performance.now() - startTime, false);
      throw error;
    }
  }

  /**
   * Execute request with connection pooling
   */
  private async executeRequest(tableId: string, params: any, options: any) {
    return new Promise(async (resolve, reject) => {
      const executeWithConnection = async () => {
        this.connectionPool.active++;

        try {
          // Optimize query based on viewport and fields
          const optimizedParams = this.optimizeQuery(params, options);

          const { data, error } = await window.ezsite.apis.tablePage(
            tableId,
            optimizedParams
          );

          if (error) throw new Error(error);

          resolve({ data, fromCache: false });
        } catch (error) {
          reject(error);
        } finally {
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
   * Optimize query parameters based on viewport and requirements
   */
  private optimizeQuery(params: any, options: any) {
    const optimized = { ...params };

    // Apply viewport optimization for virtual scrolling
    if (options.viewport) {
      const { start, end } = options.viewport;
      optimized.PageNo = Math.floor(start / (params.PageSize || 10)) + 1;
      optimized.PageSize = Math.min(end - start, params.PageSize || 10);
    }

    // Optimize field selection
    if (options.fields && options.fields.length > 0) {
      optimized.Fields = options.fields;
    }

    // Apply priority-based ordering
    if (options.priority === 'high') {
      optimized.OrderByField = optimized.OrderByField || 'id';
      optimized.IsAsc = optimized.IsAsc !== undefined ? optimized.IsAsc : false;
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
   * Generate cache key
   */
  private generateCacheKey(tableId: string, params: any, options: any): string {
    const keyData = {
      tableId,
      params: JSON.stringify(params),
      fields: options.fields?.join(',') || 'all',
      viewport: options.viewport ? `${options.viewport.start}-${options.viewport.end}` : 'full'
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
   * Cache data with expiration
   */
  private cacheData(cacheKey: string, data: any) {
    const now = Date.now();
    this.cache[cacheKey] = {
      data,
      timestamp: now,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes default
      accessCount: 1,
      lastAccessed: now
    };
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

    if (success) {
      this.performanceMetrics.avgResponseTime =
      (this.performanceMetrics.avgResponseTime + responseTime) / 2;
    }

    // Calculate cache hit rate
    const totalCacheRequests = Object.values(this.cache).
    reduce((sum, item) => sum + item.accessCount, 0);

    this.performanceMetrics.cacheHitRate =
    totalCacheRequests / this.performanceMetrics.totalRequests;
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

      // Remove rarely accessed entries (LRU)
      if (cached.accessCount < 2 && now - cached.lastAccessed > 600000) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => {
      delete this.cache[key];
    });

    console.log(`Cleaned up ${expiredKeys.length} cache entries`);
  }

  /**
   * Optimize connection pool
   */
  private optimizeConnectionPool() {
    // Adjust max connections based on performance
    if (this.performanceMetrics.avgResponseTime > 1000) {
      this.connectionPool.maxConnections = Math.max(5, this.connectionPool.maxConnections - 1);
    } else if (this.performanceMetrics.avgResponseTime < 300) {
      this.connectionPool.maxConnections = Math.min(15, this.connectionPool.maxConnections + 1);
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
        this.forceCleanup();
      }
    }
  }

  /**
   * Force cleanup when memory is high
   */
  private forceCleanup() {
    // Clear all cache
    this.cache = {};

    // Clear request queue
    this.requestQueue.clear();

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    console.warn('Forced cleanup due to high memory usage');
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      cacheSize: Object.keys(this.cache).length,
      activeConnections: this.connectionPool.active,
      queuedRequests: this.connectionPool.queue.length
    };
  }

  /**
   * Monitor performance continuously
   */
  private monitorPerformance() {
    setInterval(() => {
      const metrics = this.getMetrics();

      // Log performance data for monitoring
      console.log('Performance Metrics:', metrics);

      // Trigger alerts if needed
      if (metrics.avgResponseTime > 2000) {
        console.warn('High response time detected:', metrics.avgResponseTime);
      }

      if (metrics.memoryUsage > 0.7) {
        console.warn('High memory usage detected:', metrics.memoryUsage);
      }
    }, 60000); // Every minute
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache = {};
    this.requestQueue.clear();
  }
}

export const optimizedDataService = new OptimizedDataService();
export default optimizedDataService;
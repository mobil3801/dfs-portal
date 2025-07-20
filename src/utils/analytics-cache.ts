// Analytics caching utilities for performance optimization

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  persistToStorage: boolean;
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig = {
    maxSize: 100,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    persistToStorage: true
  };

  private readonly STORAGE_KEY = 'dashboard_analytics_cache';
  private readonly BACKUP_KEY = 'dashboard_analytics_backup';

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Load persisted cache on initialization
    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }

    // Setup periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Clean every minute
  }

  // Generate cache key
  private generateKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.map((p) => JSON.stringify(p)).join(':')}`;
  }

  // Set cache entry
  private set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    };

    // Enforce cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);

    // Persist to storage if enabled
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  // Get cache entry
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Evict oldest cache entry
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Clean expired entries
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));

    // Update storage after cleanup
    if (this.config.persistToStorage && expiredKeys.length > 0) {
      this.saveToStorage();
    }
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  // Load cache from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const cacheData = JSON.parse(stored) as Array<[string, CacheEntry<any>]>;
        this.cache = new Map(cacheData);

        // Clean expired entries after loading
        this.cleanup();
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.cache.clear();
    }
  }

  // Public methods for metrics caching
  async getMetrics(timeframe: string, stations: string[]): Promise<any | null> {
    const key = this.generateKey('metrics', timeframe, stations);
    return this.get(key);
  }

  async setMetrics(timeframe: string, stations: string[], data: any, ttl?: number): Promise<void> {
    const key = this.generateKey('metrics', timeframe, stations);
    this.set(key, data, ttl);

    // Also save as backup data
    await this.setBackupMetrics(data);
  }

  // Comparison data caching
  async getComparison(timeframe: string, stations: string[]): Promise<any | null> {
    const key = this.generateKey('comparison', timeframe, stations);
    return this.get(key);
  }

  async setComparison(timeframe: string, stations: string[], data: any, ttl?: number): Promise<void> {
    const key = this.generateKey('comparison', timeframe, stations);
    this.set(key, data, ttl);
  }

  // Forecast data caching
  async getForecast(timeframe: string, stations: string[]): Promise<any | null> {
    const key = this.generateKey('forecast', timeframe, stations);
    return this.get(key);
  }

  async setForecast(timeframe: string, stations: string[], data: any, ttl?: number): Promise<void> {
    const key = this.generateKey('forecast', timeframe, stations);
    this.set(key, data, ttl || 30 * 60 * 1000); // Forecast cache for 30 minutes
  }

  // Chart data caching
  async getChartData(chartType: string, timeframe: string, stations: string[]): Promise<any | null> {
    const key = this.generateKey('chart', chartType, timeframe, stations);
    return this.get(key);
  }

  async setChartData(chartType: string, timeframe: string, stations: string[], data: any, ttl?: number): Promise<void> {
    const key = this.generateKey('chart', chartType, timeframe, stations);
    this.set(key, data, ttl);
  }

  // Export data caching
  async getExportData(exportId: string): Promise<any | null> {
    const key = this.generateKey('export', exportId);
    return this.get(key);
  }

  async setExportData(exportId: string, data: any, ttl?: number): Promise<void> {
    const key = this.generateKey('export', exportId);
    this.set(key, data, ttl || 10 * 60 * 1000); // Export cache for 10 minutes
  }

  // Backup data management
  async setBackupMetrics(data: any): Promise<void> {
    try {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save backup metrics:', error);
    }
  }

  async getBackupMetrics(): Promise<any | null> {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      if (stored) {
        const backup = JSON.parse(stored);

        // Check if backup is not too old (max 24 hours)
        if (Date.now() - backup.timestamp < 24 * 60 * 60 * 1000) {
          return backup.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load backup metrics:', error);
    }
    return null;
  }

  // Cache invalidation methods
  async invalidateMetrics(timeframe?: string, stations?: string[]): Promise<void> {
    if (timeframe && stations) {
      const key = this.generateKey('metrics', timeframe, stations);
      this.cache.delete(key);
    } else {
      // Invalidate all metrics cache
      const metricsKeys = Array.from(this.cache.keys()).filter((key) => key.startsWith('metrics:'));
      metricsKeys.forEach((key) => this.cache.delete(key));
    }

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  async invalidateComparison(timeframe?: string, stations?: string[]): Promise<void> {
    if (timeframe && stations) {
      const key = this.generateKey('comparison', timeframe, stations);
      this.cache.delete(key);
    } else {
      const comparisonKeys = Array.from(this.cache.keys()).filter((key) => key.startsWith('comparison:'));
      comparisonKeys.forEach((key) => this.cache.delete(key));
    }

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  async invalidateForecast(): Promise<void> {
    const forecastKeys = Array.from(this.cache.keys()).filter((key) => key.startsWith('forecast:'));
    forecastKeys.forEach((key) => this.cache.delete(key));

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    this.cache.clear();

    if (this.config.persistToStorage) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to clear cache from storage:', error);
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const [, entry] of this.cache.entries()) {
      totalSize++;
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: totalSize,
      validEntries,
      expiredEntries,
      hitRate: this.hitRate,
      maxSize: this.config.maxSize,
      usagePercent: totalSize / this.config.maxSize * 100
    };
  }

  // Track hit rate (simplified)
  private hitCount = 0;
  private missCount = 0;

  private get hitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total * 100 : 0;
  }

  // Method to track cache hits/misses
  trackHit(): void {
    this.hitCount++;
  }

  trackMiss(): void {
    this.missCount++;
  }

  // Configure cache settings
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Preload common data
  async preloadCommonData(): Promise<void> {
    // This would be called to preload frequently accessed data
    // Implementation would depend on usage patterns
    console.log('Preloading common analytics data...');
  }

  // Export cache for debugging
  exportCache() {
    return {
      entries: Array.from(this.cache.entries()),
      config: this.config,
      stats: this.getCacheStats()
    };
  }
}

export const analyticsCache = new AnalyticsCache();
export default analyticsCache;
import { supabase } from '@/lib/supabase'

interface ConnectionStats {
  activeConnections: number;
  maxConnections: number;
  idleConnections: number;
  queuedRequests: number;
  connectionPressure: number;
}

interface ConnectionConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
}

interface ConnectionMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  lastQueryTime: number;
}

/**
 * Supabase-compatible Database Connection Manager
 * Maintains the same interface as the original DatabaseConnectionManager
 * but uses Supabase client for actual database operations
 */
class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private activeConnections = new Set<string>();
  private requestQueue: Array<{
    id: string;
    timestamp: number;
    resolve: (connectionId: string) => void;
    reject: (error: Error) => void;
  }> = [];

  private config: ConnectionConfig = {
    maxConnections: 80, // Maintained for compatibility, but Supabase handles this internally
    idleTimeout: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    healthCheckInterval: 60000 // 1 minute
  };

  private metrics: ConnectionMetrics = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageQueryTime: 0,
    lastQueryTime: 0
  };

  private queryTimes: number[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionCleanupInterval: NodeJS.Timeout | null = null;
  private supabaseHealthy = true;
  private lastHealthCheck = Date.now();

  private alertThresholds = {
    warning: 0.7, // 70% of max connections
    critical: 0.85 // 85% of max connections
  };

  private constructor() {
    this.startHealthCheck();
    this.startConnectionCleanup();
    this.testSupabaseConnection();
  }

  static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager();
    }
    return SupabaseConnectionManager.instance;
  }

  /**
   * Acquire a connection (simplified for Supabase)
   * Since Supabase handles connection pooling internally, 
   * we just track virtual connections for compatibility
   */
  async acquireConnection(): Promise<string> {
    const connectionId = this.generateConnectionId();

    // Check if we're at virtual capacity
    if (this.activeConnections.size >= this.config.maxConnections) {
      console.warn('Virtual connection pool at capacity, queuing request');
      return this.queueConnection(connectionId);
    }

    // Test Supabase connectivity before returning connection
    if (!this.supabaseHealthy) {
      await this.testSupabaseConnection();
      if (!this.supabaseHealthy) {
        throw new Error('Supabase connection is not healthy');
      }
    }

    // Add to active connections tracking
    this.activeConnections.add(connectionId);
    this.logConnectionStats();

    return connectionId;
  }

  /**
   * Release a connection
   */
  releaseConnection(connectionId: string): void {
    if (!this.activeConnections.has(connectionId)) {
      console.warn(`Attempted to release non-existent connection: ${connectionId}`);
      return;
    }

    this.activeConnections.delete(connectionId);

    // Process queued requests
    this.processQueue();
    this.logConnectionStats();
  }

  /**
   * Force close connection
   */
  forceCloseConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
    console.log(`Forcefully closed connection: ${connectionId}`);
    this.processQueue();
    this.logConnectionStats();
  }

  /**
   * Execute a query with connection tracking and metrics
   */
  async executeQuery<T = any>(
    query: () => Promise<{ data: T | null; error: any }>,
    connectionId?: string
  ): Promise<{ data: T | null; error: any }> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    try {
      // Ensure we have a connection
      const connId = connectionId || await this.acquireConnection();
      
      // Execute the query
      const result = await query();
      
      // Track metrics
      const queryTime = Date.now() - startTime;
      this.trackQueryTime(queryTime);
      this.metrics.lastQueryTime = Date.now();

      if (result.error) {
        this.metrics.failedQueries++;
        console.error('Supabase query error:', result.error);
      } else {
        this.metrics.successfulQueries++;
      }

      // Release connection if we acquired it
      if (!connectionId) {
        this.releaseConnection(connId);
      }

      return result;

    } catch (error: any) {
      this.metrics.failedQueries++;
      const queryTime = Date.now() - startTime;
      this.trackQueryTime(queryTime);

      console.error('SupabaseConnectionManager query error:', error);
      
      return {
        data: null,
        error: error
      };
    }
  }

  private async queueConnection(connectionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const queueItem = {
        id: connectionId,
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.requestQueue.push(queueItem);

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.requestQueue.findIndex((item) => item.id === connectionId);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error(`Connection request timeout after ${this.config.connectionTimeout}ms`));
        }
      }, this.config.connectionTimeout);
    });
  }

  private processQueue(): void {
    while (this.requestQueue.length > 0 && this.activeConnections.size < this.config.maxConnections) {
      const queueItem = this.requestQueue.shift()!;

      // Check if request hasn't timed out
      if (Date.now() - queueItem.timestamp < this.config.connectionTimeout) {
        this.activeConnections.add(queueItem.id);
        queueItem.resolve(queueItem.id);
      } else {
        queueItem.reject(new Error('Connection request timeout'));
      }
    }
  }

  private generateConnectionId(): string {
    return `supabase_conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async testSupabaseConnection(): Promise<void> {
    try {
      // Simple health check query
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found", which is okay during setup
        console.error('Supabase health check failed:', error);
        this.supabaseHealthy = false;
      } else {
        this.supabaseHealthy = true;
      }
    } catch (error) {
      console.error('Supabase connectivity test failed:', error);
      this.supabaseHealthy = false;
    }

    this.lastHealthCheck = Date.now();
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private startConnectionCleanup(): void {
    this.connectionCleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, this.config.idleTimeout / 2); // Run cleanup every 15 seconds
  }

  private async performHealthCheck(): void {
    // Test Supabase connection
    await this.testSupabaseConnection();

    const stats = this.getConnectionStats();

    // Check for connection pressure
    if (stats.connectionPressure >= this.alertThresholds.critical) {
      console.error('CRITICAL: Virtual connection usage is critically high!', stats);
      this.triggerEmergencyCleanup();
    } else if (stats.connectionPressure >= this.alertThresholds.warning) {
      console.warn('WARNING: Virtual connection usage is high', stats);
      this.optimizeConnections();
    }

    // Log health status
    if (!this.supabaseHealthy) {
      console.error('Supabase connection is not healthy');
    }
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleConnections: string[] = [];

    // Find connections that have been active too long (simplified cleanup)
    this.activeConnections.forEach((connectionId) => {
      // Extract timestamp from connection ID
      const timestampMatch = connectionId.match(/supabase_conn_(\d+)_/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        if (now - timestamp > 300000) { // 5 minutes
          staleConnections.push(connectionId);
        }
      }
    });

    // Clean up stale connections
    staleConnections.forEach((connectionId) => {
      this.forceCloseConnection(connectionId);
      console.log(`Removed stale connection: ${connectionId}`);
    });
  }

  private triggerEmergencyCleanup(): void {
    console.log('Triggering emergency connection cleanup...');

    // Force close some active connections if needed
    const connectionsToClose = Math.min(10, this.activeConnections.size);
    const connectionArray = Array.from(this.activeConnections);

    for (let i = 0; i < connectionsToClose; i++) {
      this.forceCloseConnection(connectionArray[i]);
    }

    // Process any queued requests
    this.processQueue();

    console.log(`Emergency cleanup completed. Closed ${connectionsToClose} connections.`);
  }

  private optimizeConnections(): void {
    console.log('Optimizing database connections...');

    // Close some active connections to free up capacity
    const connectionsToClose = Math.min(5, this.activeConnections.size);
    const connectionArray = Array.from(this.activeConnections);

    for (let i = 0; i < connectionsToClose; i++) {
      this.forceCloseConnection(connectionArray[i]);
    }

    console.log(`Optimization completed. Closed ${connectionsToClose} connections.`);
  }

  private trackQueryTime(queryTime: number): void {
    this.queryTimes.push(queryTime);
    
    // Keep only last 100 query times for average calculation
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }

    // Calculate average
    this.metrics.averageQueryTime = this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
  }

  private logConnectionStats(): void {
    const stats = this.getConnectionStats();

    if (stats.connectionPressure > 0.5) { // Only log when usage is significant
      console.log(`Supabase Connections - Active: ${stats.activeConnections}/${stats.maxConnections} (${(stats.connectionPressure * 100).toFixed(1)}%), Queued: ${stats.queuedRequests}, Health: ${this.supabaseHealthy ? 'OK' : 'ERROR'}`);
    }
  }

  getConnectionStats(): ConnectionStats {
    const activeConnections = this.activeConnections.size;
    const maxConnections = this.config.maxConnections;
    const idleConnections = 0; // Supabase handles this internally
    const queuedRequests = this.requestQueue.length;
    const connectionPressure = activeConnections / maxConnections;

    return {
      activeConnections,
      maxConnections,
      idleConnections,
      queuedRequests,
      connectionPressure
    };
  }

  getDetailedStats(): {
    stats: ConnectionStats;
    config: ConnectionConfig;
    metrics: ConnectionMetrics;
    activeConnectionIds: string[];
    queuedRequestIds: string[];
    supabaseHealthy: boolean;
    lastHealthCheck: number;
  } {
    return {
      stats: this.getConnectionStats(),
      config: this.config,
      metrics: this.metrics,
      activeConnectionIds: Array.from(this.activeConnections),
      queuedRequestIds: this.requestQueue.map((item) => item.id),
      supabaseHealthy: this.supabaseHealthy,
      lastHealthCheck: this.lastHealthCheck
    };
  }

  updateConfig(newConfig: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Supabase connection manager configuration updated:', this.config);
  }

  reset(): void {
    // Clear all connections
    this.activeConnections.clear();

    // Reject all queued requests
    this.requestQueue.forEach((item) => {
      item.reject(new Error('Connection manager reset'));
    });
    this.requestQueue = [];

    // Reset metrics
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      lastQueryTime: 0
    };
    this.queryTimes = [];

    console.log('Supabase connection manager reset completed');
  }

  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.connectionCleanupInterval) {
      clearInterval(this.connectionCleanupInterval);
      this.connectionCleanupInterval = null;
    }

    this.reset();
    console.log('Supabase connection manager shut down');
  }

  // Supabase-specific methods
  getSupabaseClient() {
    return supabase;
  }

  isSupabaseHealthy(): boolean {
    return this.supabaseHealthy;
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }
}

export default SupabaseConnectionManager;
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

class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private activeConnections = new Set<string>();
  private idleConnections = new Set<string>();
  private requestQueue: Array<{
    id: string;
    timestamp: number;
    resolve: (connectionId: string) => void;
    reject: (error: Error) => void;
  }> = [];

  private config: ConnectionConfig = {
    maxConnections: 80, // Lower than the 100 limit to provide buffer
    idleTimeout: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    healthCheckInterval: 60000 // 1 minute
  };

  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionCleanupInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    warning: 0.7, // 70% of max connections
    critical: 0.85 // 85% of max connections
  };

  private constructor() {
    this.startHealthCheck();
    this.startConnectionCleanup();
  }

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  async acquireConnection(): Promise<string> {
    const connectionId = this.generateConnectionId();

    // Check if we're at capacity
    if (this.activeConnections.size >= this.config.maxConnections) {
      console.warn('Database connection pool at capacity, queuing request');
      return this.queueConnection(connectionId);
    }

    // Try to reuse an idle connection first
    const idleConnectionId = this.getIdleConnection();
    if (idleConnectionId) {
      this.activateConnection(idleConnectionId);
      return idleConnectionId;
    }

    // Create new connection
    this.activeConnections.add(connectionId);
    this.logConnectionStats();

    return connectionId;
  }

  releaseConnection(connectionId: string): void {
    if (!this.activeConnections.has(connectionId)) {
      console.warn(`Attempted to release non-existent connection: ${connectionId}`);
      return;
    }

    this.activeConnections.delete(connectionId);

    // Convert to idle connection for reuse
    this.idleConnections.add(connectionId);

    // Set timeout to clean up idle connection
    setTimeout(() => {
      this.cleanupIdleConnection(connectionId);
    }, this.config.idleTimeout);

    // Process queued requests
    this.processQueue();

    this.logConnectionStats();
  }

  forceCloseConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
    this.idleConnections.delete(connectionId);
    console.log(`Forcefully closed connection: ${connectionId}`);
    this.processQueue();
    this.logConnectionStats();
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

  private getIdleConnection(): string | null {
    const idleConnectionArray = Array.from(this.idleConnections);
    if (idleConnectionArray.length > 0) {
      const connectionId = idleConnectionArray[0];
      this.idleConnections.delete(connectionId);
      return connectionId;
    }
    return null;
  }

  private activateConnection(connectionId: string): void {
    this.idleConnections.delete(connectionId);
    this.activeConnections.add(connectionId);
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

  private cleanupIdleConnection(connectionId: string): void {
    if (this.idleConnections.has(connectionId)) {
      this.idleConnections.delete(connectionId);
      console.log(`Cleaned up idle connection: ${connectionId}`);
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  private performHealthCheck(): void {
    const stats = this.getConnectionStats();

    // Check for connection pressure
    if (stats.connectionPressure >= this.alertThresholds.critical) {
      console.error('🚨 CRITICAL: Database connection usage is critically high!', stats);
      this.triggerEmergencyCleanup();
    } else if (stats.connectionPressure >= this.alertThresholds.warning) {
      console.warn('⚠️ WARNING: Database connection usage is high', stats);
      this.optimizeConnections();
    }

    // Clean up long-running connections
    this.cleanupLongRunningConnections();
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleConnections: string[] = [];

    // Find connections that have been idle too long
    this.idleConnections.forEach((connectionId) => {
      // Extract timestamp from connection ID
      const timestamp = parseInt(connectionId.split('_')[1]);
      if (now - timestamp > this.config.idleTimeout) {
        staleConnections.push(connectionId);
      }
    });

    // Clean up stale connections
    staleConnections.forEach((connectionId) => {
      this.idleConnections.delete(connectionId);
      console.log(`Removed stale idle connection: ${connectionId}`);
    });
  }

  private cleanupLongRunningConnections(): void {
    const now = Date.now();
    const longRunningThreshold = 300000; // 5 minutes
    const longRunningConnections: string[] = [];

    this.activeConnections.forEach((connectionId) => {
      const timestamp = parseInt(connectionId.split('_')[1]);
      if (now - timestamp > longRunningThreshold) {
        longRunningConnections.push(connectionId);
      }
    });

    if (longRunningConnections.length > 0) {
      console.warn(`Found ${longRunningConnections.length} long-running connections`, longRunningConnections);

      // Force close some long-running connections if we're at high capacity
      const stats = this.getConnectionStats();
      if (stats.connectionPressure > this.alertThresholds.warning) {
        const connectionsToClose = Math.min(longRunningConnections.length, 5);
        for (let i = 0; i < connectionsToClose; i++) {
          this.forceCloseConnection(longRunningConnections[i]);
        }
        console.log(`Force closed ${connectionsToClose} long-running connections due to high capacity`);
      }
    }
  }

  private triggerEmergencyCleanup(): void {
    console.log('Triggering emergency connection cleanup...');

    // Force close some active connections if needed
    const connectionsToClose = Math.min(10, this.activeConnections.size);
    const connectionArray = Array.from(this.activeConnections);

    for (let i = 0; i < connectionsToClose; i++) {
      this.forceCloseConnection(connectionArray[i]);
    }

    // Clear all idle connections
    this.idleConnections.clear();

    // Process any queued requests
    this.processQueue();

    console.log(`Emergency cleanup completed. Closed ${connectionsToClose} connections.`);
  }

  private optimizeConnections(): void {
    console.log('Optimizing database connections...');

    // Clean up idle connections more aggressively
    const idleToRemove = Math.min(5, this.idleConnections.size);
    const idleArray = Array.from(this.idleConnections);

    for (let i = 0; i < idleToRemove; i++) {
      this.cleanupIdleConnection(idleArray[i]);
    }

    console.log(`Optimization completed. Removed ${idleToRemove} idle connections.`);
  }

  private logConnectionStats(): void {
    const stats = this.getConnectionStats();

    if (stats.connectionPressure > 0.5) {// Only log when usage is significant
      console.log(`Database Connections - Active: ${stats.activeConnections}/${stats.maxConnections} (${(stats.connectionPressure * 100).toFixed(1)}%), Idle: ${stats.idleConnections}, Queued: ${stats.queuedRequests}`);
    }
  }

  getConnectionStats(): ConnectionStats {
    const activeConnections = this.activeConnections.size;
    const maxConnections = this.config.maxConnections;
    const idleConnections = this.idleConnections.size;
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
    activeConnectionIds: string[];
    idleConnectionIds: string[];
    queuedRequestIds: string[];
    lastHealthCheck: number;
  } {
    return {
      stats: this.getConnectionStats(),
      config: this.config,
      activeConnectionIds: Array.from(this.activeConnections),
      idleConnectionIds: Array.from(this.idleConnections),
      queuedRequestIds: this.requestQueue.map((item) => item.id),
      lastHealthCheck: Date.now()
    };
  }

  updateConfig(newConfig: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Database connection manager configuration updated:', this.config);
  }

  reset(): void {
    // Clear all connections
    this.activeConnections.clear();
    this.idleConnections.clear();

    // Reject all queued requests
    this.requestQueue.forEach((item) => {
      item.reject(new Error('Connection manager reset'));
    });
    this.requestQueue = [];

    console.log('Database connection manager reset completed');
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
    console.log('Database connection manager shut down');
  }
}

export default DatabaseConnectionManager;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Clock,
  Trash2,
  Shield,
  Activity,
  Database,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle } from
'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/hooks/use-toast';

interface SessionData {
  id: string;
  userId: string;
  created: number;
  lastAccessed: number;
  expiresAt: number;
  size: number;
  isActive: boolean;
  data: any;
}

interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  totalMemoryUsage: number;
  averageSessionSize: number;
  oldestSession: number;
  memoryUsagePercentage: number;
}

interface SessionSettings {
  maxSessions: number;
  sessionTimeout: number; // in minutes
  autoCleanup: boolean;
  cleanupInterval: number; // in minutes
  maxSessionSize: number; // in bytes
  memoryThreshold: number; // percentage
  enableCompression: boolean;
  enableEncryption: boolean;
}

const SessionOptimizationManager: React.FC = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [settings, setSettings] = useState<SessionSettings>({
    maxSessions: 100,
    sessionTimeout: 30,
    autoCleanup: true,
    cleanupInterval: 5,
    maxSessionSize: 1024 * 1024, // 1MB
    memoryThreshold: 80,
    enableCompression: true,
    enableEncryption: true
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);
  const compressionWorker = useRef<Worker | null>(null);

  /**
   * Initialize session management
   */
  useEffect(() => {
    loadSessionData();
    setupCleanupInterval();
    setupCompressionWorker();
    setupPerformanceMonitoring();

    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
      if (compressionWorker.current) {
        compressionWorker.current.terminate();
      }
    };
  }, []);

  /**
   * Load session data from storage
   */
  const loadSessionData = useCallback(() => {
    try {
      const sessionData: SessionData[] = [];
      const storageKeys = Object.keys(localStorage);

      storageKeys.forEach((key) => {
        if (key.startsWith('session_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const sessionId = key.replace('session_', '');

            sessionData.push({
              id: sessionId,
              userId: data.userId || 'unknown',
              created: data.created || Date.now(),
              lastAccessed: data.lastAccessed || Date.now(),
              expiresAt: data.expiresAt || Date.now() + 30 * 60 * 1000,
              size: new Blob([JSON.stringify(data)]).size,
              isActive: Date.now() < (data.expiresAt || 0),
              data
            });
          } catch (error) {
            console.warn(`Failed to parse session data for key: ${key}`);
          }
        }
      });

      setSessions(sessionData);
      calculateMetrics(sessionData);
    } catch (error) {
      console.error('Failed to load session data:', error);
      toast({
        title: 'Session Load Error',
        description: 'Failed to load session data. Some features may not work correctly.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Calculate session metrics
   */
  const calculateMetrics = useCallback((sessionData: SessionData[]) => {
    const now = Date.now();
    const activeSessions = sessionData.filter((s) => s.isActive && s.expiresAt > now);
    const expiredSessions = sessionData.filter((s) => !s.isActive || s.expiresAt <= now);
    const totalSize = sessionData.reduce((sum, s) => sum + s.size, 0);
    const oldestSession = sessionData.length > 0 ?
    Math.min(...sessionData.map((s) => s.created)) :
    Date.now();

    // Estimate memory usage (rough approximation)
    const estimatedMemoryUsage = totalSize + sessionData.length * 100; // Base overhead per session
    const memoryLimit = 50 * 1024 * 1024; // Assume 50MB limit for localStorage
    const memoryUsagePercentage = estimatedMemoryUsage / memoryLimit * 100;

    setMetrics({
      totalSessions: sessionData.length,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      totalMemoryUsage: totalSize,
      averageSessionSize: sessionData.length > 0 ? totalSize / sessionData.length : 0,
      oldestSession,
      memoryUsagePercentage
    });
  }, []);

  /**
   * Setup automatic cleanup interval
   */
  const setupCleanupInterval = useCallback(() => {
    if (settings.autoCleanup) {
      cleanupInterval.current = setInterval(() => {
        performAutoCleanup();
      }, settings.cleanupInterval * 60 * 1000);
    }
  }, [settings.autoCleanup, settings.cleanupInterval]);

  /**
   * Setup compression worker for large sessions
   */
  const setupCompressionWorker = useCallback(() => {
    if (settings.enableCompression && 'Worker' in window) {
      try {
        // Create a simple compression worker
        const workerCode = `
          self.onmessage = function(e) {
            const { type, data, sessionId } = e.data;
            
            if (type === 'compress') {
              try {
                // Simple compression using JSON string manipulation
                const compressed = LZString ? LZString.compress(JSON.stringify(data)) : JSON.stringify(data);
                self.postMessage({ type: 'compressed', sessionId, data: compressed });
              } catch (error) {
                self.postMessage({ type: 'error', sessionId, error: error.message });
              }
            } else if (type === 'decompress') {
              try {
                const decompressed = LZString ? JSON.parse(LZString.decompress(data)) : JSON.parse(data);
                self.postMessage({ type: 'decompressed', sessionId, data: decompressed });
              } catch (error) {
                self.postMessage({ type: 'error', sessionId, error: error.message });
              }
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        compressionWorker.current = new Worker(URL.createObjectURL(blob));

        compressionWorker.current.onmessage = (e) => {
          const { type, sessionId, data, error } = e.data;

          if (type === 'compressed') {
            // Handle compressed session data
            console.log(`Session ${sessionId} compressed successfully`);
          } else if (type === 'decompressed') {
            // Handle decompressed session data
            console.log(`Session ${sessionId} decompressed successfully`);
          } else if (type === 'error') {
            console.error(`Compression error for session ${sessionId}:`, error);
          }
        };
      } catch (error) {
        console.warn('Failed to setup compression worker:', error);
      }
    }
  }, [settings.enableCompression]);

  /**
   * Setup performance monitoring
   */
  const setupPerformanceMonitoring = useCallback(() => {
    // Monitor localStorage usage
    const monitorStorage = () => {
      try {
        const used = JSON.stringify(localStorage).length;
        const quota = 10 * 1024 * 1024; // Approximate 10MB quota
        const percentage = used / quota * 100;

        if (percentage > settings.memoryThreshold) {
          toast({
            title: 'High Storage Usage',
            description: `Storage usage is at ${percentage.toFixed(1)}%. Consider cleaning up old sessions.`,
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.warn('Failed to monitor storage usage:', error);
      }
    };

    // Check every minute
    const monitoringInterval = setInterval(monitorStorage, 60000);

    return () => clearInterval(monitoringInterval);
  }, [settings.memoryThreshold, toast]);

  /**
   * Perform automatic cleanup
   */
  const performAutoCleanup = useCallback(async () => {
    console.log('Performing automatic session cleanup...');

    const now = Date.now();
    const expiredKeys: string[] = [];
    const oversizedKeys: string[] = [];

    // Find expired sessions
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('session_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');

          // Check if expired
          if (data.expiresAt && data.expiresAt < now) {
            expiredKeys.push(key);
          }

          // Check if oversized
          const size = new Blob([JSON.stringify(data)]).size;
          if (size > settings.maxSessionSize) {
            oversizedKeys.push(key);
          }
        } catch (error) {
          // Invalid session data, mark for removal
          expiredKeys.push(key);
        }
      }
    });

    // Remove expired sessions
    expiredKeys.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`Removed expired session: ${key}`);
    });

    // Handle oversized sessions
    oversizedKeys.forEach((key) => {
      if (settings.enableCompression) {
        // Try to compress instead of removing
        compressSession(key);
      } else {
        localStorage.removeItem(key);
        console.log(`Removed oversized session: ${key}`);
      }
    });

    // Reload session data
    loadSessionData();

    if (expiredKeys.length > 0 || oversizedKeys.length > 0) {
      toast({
        title: 'Session Cleanup Complete',
        description: `Removed ${expiredKeys.length} expired and ${oversizedKeys.length} oversized sessions.`
      });
    }
  }, [settings.maxSessionSize, settings.enableCompression, loadSessionData, toast]);

  /**
   * Compress a session
   */
  const compressSession = useCallback((sessionKey: string) => {
    if (!compressionWorker.current) return;

    try {
      const data = JSON.parse(localStorage.getItem(sessionKey) || '{}');
      compressionWorker.current.postMessage({
        type: 'compress',
        sessionId: sessionKey,
        data
      });
    } catch (error) {
      console.error(`Failed to compress session ${sessionKey}:`, error);
    }
  }, []);

  /**
   * Manual cleanup
   */
  const performManualCleanup = useCallback(async () => {
    setIsOptimizing(true);

    try {
      await performAutoCleanup();

      // Additional manual cleanup steps
      const now = Date.now();
      const oldThreshold = now - 7 * 24 * 60 * 60 * 1000; // 7 days
      const oldSessions: string[] = [];

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('session_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.created && data.created < oldThreshold) {
              oldSessions.push(key);
            }
          } catch (error) {
            oldSessions.push(key);
          }
        }
      });

      // Remove old sessions
      oldSessions.forEach((key) => {
        localStorage.removeItem(key);
      });

      toast({
        title: 'Manual Cleanup Complete',
        description: `Removed ${oldSessions.length} old sessions. Storage optimized.`
      });
    } catch (error) {
      console.error('Manual cleanup failed:', error);
      toast({
        title: 'Cleanup Failed',
        description: 'Failed to perform manual cleanup. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [performAutoCleanup, toast]);

  /**
   * Clear all sessions
   */
  const clearAllSessions = useCallback(() => {
    const sessionKeys = Object.keys(localStorage).filter((key) => key.startsWith('session_'));

    sessionKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    loadSessionData();

    toast({
      title: 'All Sessions Cleared',
      description: `Removed ${sessionKeys.length} sessions from storage.`
    });
  }, [loadSessionData, toast]);

  /**
   * Update session settings
   */
  const updateSettings = useCallback((newSettings: Partial<SessionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    // Restart cleanup interval if auto cleanup settings changed
    if (newSettings.autoCleanup !== undefined || newSettings.cleanupInterval !== undefined) {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
      setupCleanupInterval();
    }

    toast({
      title: 'Settings Updated',
      description: 'Session optimization settings have been updated.'
    });
  }, [setupCleanupInterval, toast]);

  /**
   * Format bytes for display
   */
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format time duration
   */
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p>Loading session data...</p>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" />
          Session Management
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={metrics.memoryUsagePercentage > 80 ? 'destructive' : 'default'}>
            {metrics.memoryUsagePercentage.toFixed(1)}% Storage Used
          </Badge>
          <Button
            onClick={performManualCleanup}
            disabled={isOptimizing}
            size="sm">

            {isOptimizing ?
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> :

            <Trash2 className="mr-2 h-4 w-4" />
            }
            Cleanup Now
          </Button>
        </div>
      </div>

      {/* Memory Usage Alert */}
      {metrics.memoryUsagePercentage > settings.memoryThreshold &&
      <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High storage usage detected ({metrics.memoryUsagePercentage.toFixed(1)}%). 
            Consider cleaning up old sessions or enabling auto-cleanup.
          </AlertDescription>
        </Alert>
      }

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeSessions} active, {metrics.expiredSessions} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatBytes(metrics.totalMemoryUsage)}
              </div>
              <Progress
                value={metrics.memoryUsagePercentage}
                className="h-2" />

              <p className="text-xs text-muted-foreground">
                {metrics.memoryUsagePercentage.toFixed(1)}% of storage used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(metrics.averageSessionSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Oldest Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(Date.now() - metrics.oldestSession)}
            </div>
            <p className="text-xs text-muted-foreground">
              age
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Sessions</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{metrics.activeSessions}</Badge>
                      <div className="w-32">
                        <Progress
                          value={metrics.activeSessions / metrics.totalSessions * 100}
                          className="h-2" />

                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Expired Sessions</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{metrics.expiredSessions}</Badge>
                      <div className="w-32">
                        <Progress
                          value={metrics.expiredSessions / metrics.totalSessions * 100}
                          className="h-2" />

                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Storage Usage</span>
                    <Badge variant={metrics.memoryUsagePercentage > 80 ? 'destructive' : 'default'}>
                      {metrics.memoryUsagePercentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={metrics.memoryUsagePercentage} className="h-4" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatBytes(metrics.totalMemoryUsage)}</span>
                    <span>~{formatBytes(50 * 1024 * 1024)} limit</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Session Details
                <Button onClick={clearAllSessions} variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sessions.map((session) =>
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-2 border rounded">

                    <div className="flex items-center gap-2">
                      <Badge variant={session.isActive ? 'default' : 'secondary'}>
                        {session.isActive ? 'Active' : 'Expired'}
                      </Badge>
                      <span className="text-sm font-mono">{session.id.substring(0, 8)}...</span>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(session.size)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDuration(Date.now() - session.lastAccessed)} ago</span>
                      <Button
                      onClick={() => {
                        localStorage.removeItem(`session_${session.id}`);
                        loadSessionData();
                      }}
                      variant="ghost"
                      size="sm">

                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {sessions.length === 0 &&
                <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No sessions found</p>
                  </div>
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Optimization Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-cleanup">Auto Cleanup</Label>
                    <Switch
                      id="auto-cleanup"
                      checked={settings.autoCleanup}
                      onCheckedChange={(checked) => updateSettings({ autoCleanup: checked })} />

                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compression">Enable Compression</Label>
                    <Switch
                      id="compression"
                      checked={settings.enableCompression}
                      onCheckedChange={(checked) => updateSettings({ enableCompression: checked })} />

                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="encryption">Enable Encryption</Label>
                    <Switch
                      id="encryption"
                      checked={settings.enableEncryption}
                      onCheckedChange={(checked) => updateSettings({ enableEncryption: checked })} />

                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Session Timeout: {settings.sessionTimeout} minutes</Label>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSettings({ sessionTimeout: parseInt(e.target.value) })}
                      className="w-full" />

                  </div>
                  
                  <div>
                    <Label>Cleanup Interval: {settings.cleanupInterval} minutes</Label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={settings.cleanupInterval}
                      onChange={(e) => updateSettings({ cleanupInterval: parseInt(e.target.value) })}
                      className="w-full" />

                  </div>
                  
                  <div>
                    <Label>Memory Threshold: {settings.memoryThreshold}%</Label>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={settings.memoryThreshold}
                      onChange={(e) => updateSettings({ memoryThreshold: parseInt(e.target.value) })}
                      className="w-full" />

                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={performManualCleanup}
                  disabled={isOptimizing}
                  className="w-full">

                  {isOptimizing ?
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> :

                  <Trash2 className="mr-2 h-4 w-4" />
                  }
                  Deep Cleanup
                </Button>
                
                <Button
                  onClick={clearAllSessions}
                  variant="destructive"
                  className="w-full">

                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Sessions
                </Button>
                
                <Button
                  onClick={() => {
                    if ('gc' in window) {
                      (window as any).gc();
                      toast({ title: 'Garbage collection triggered' });
                    } else {
                      toast({ title: 'Garbage collection not available' });
                    }
                  }}
                  variant="outline"
                  className="w-full">

                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force Garbage Collection
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.memoryUsagePercentage > 80 &&
                  <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        High storage usage. Consider enabling auto-cleanup or reducing session timeout.
                      </AlertDescription>
                    </Alert>
                  }
                  
                  {metrics.expiredSessions > 10 &&
                  <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {metrics.expiredSessions} expired sessions found. Run cleanup to free storage.
                      </AlertDescription>
                    </Alert>
                  }
                  
                  {metrics.averageSessionSize > 100000 &&
                  <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Large average session size. Consider enabling compression.
                      </AlertDescription>
                    </Alert>
                  }
                  
                  {!settings.autoCleanup &&
                  <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Auto cleanup is disabled. Enable it for better performance.
                      </AlertDescription>
                    </Alert>
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export default SessionOptimizationManager;
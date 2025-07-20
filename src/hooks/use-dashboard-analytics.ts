import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyticsCalculations } from '@/utils/analytics-calculations';
import { analyticsCache } from '@/utils/analytics-cache';
import { analyticsForecasting } from '@/utils/analytics-forecasting';
import { analyticsExport } from '@/utils/analytics-export';
import { analyticsAlerts } from '@/utils/analytics-alerts';
import { analyticsPerformance } from '@/utils/analytics-performance';

export interface DashboardMetrics {
  totalSales: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  fuelSales: {
    current: number;
    gallonsSold: number;
    avgPricePerGallon: number;
    change: number;
  };
  convenienceStoreSales: {
    current: number;
    topCategories: Array<{category: string;sales: number;}>;
    change: number;
  };
  expenses: {
    total: number;
    byCategory: Array<{category: string;amount: number;}>;
    change: number;
  };
  profitMargin: {
    current: number;
    target: number;
    variance: number;
  };
  employeeMetrics: {
    totalEmployees: number;
    activeShifts: number;
    payrollCosts: number;
  };
  inventoryMetrics: {
    lowStockItems: number;
    totalValue: number;
    turnoverRate: number;
  };
  stationComparison: {
    mobil: any;
    amocoRosedale: any;
    amocoBrooklyn: any;
  };
}

export interface TimeframeComparison {
  current: DashboardMetrics;
  previous: DashboardMetrics;
  yearOverYear: DashboardMetrics;
  weekOverWeek: DashboardMetrics;
  monthOverMonth: DashboardMetrics;
}

export interface ForecastData {
  sales: Array<{date: string;predicted: number;confidence: number;}>;
  fuel: Array<{date: string;gallons: number;revenue: number;}>;
  expenses: Array<{date: string;amount: number;category: string;}>;
  profitability: Array<{date: string;profit: number;margin: number;}>;
}

export interface AlertConfig {
  id: string;
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  isActive: boolean;
  notificationMethods: Array<'email' | 'sms' | 'dashboard'>;
  recipients: string[];
}

export interface AnalyticsOptions {
  timeframe: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  stations: Array<'MOBIL' | 'AMOCO ROSEDALE' | 'AMOCO BROOKLYN' | 'ALL'>;
  refreshInterval: number; // in milliseconds
  enableCaching: boolean;
  enableForecasting: boolean;
  enableAlerts: boolean;
  customDateRange?: {start: Date;end: Date;};
}

const DEFAULT_OPTIONS: AnalyticsOptions = {
  timeframe: 'today',
  stations: ['ALL'],
  refreshInterval: 60000, // 1 minute
  enableCaching: true,
  enableForecasting: true,
  enableAlerts: true
};

export const useDashboardAnalytics = (options: Partial<AnalyticsOptions> = {}) => {
  const { toast } = useToast();
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [comparison, setComparison] = useState<TimeframeComparison | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [performance, setPerformance] = useState<any>(null);

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const performanceMonitor = useRef(analyticsPerformance.createMonitor('dashboard-analytics'));

  // Fetch core metrics
  const fetchMetrics = useCallback(async (forceFresh = false) => {
    const startTime = performance.now();

    try {
      setLoading(true);
      setError(null);

      // Check cache first if enabled
      if (config.enableCaching && !forceFresh) {
        const cached = await analyticsCache.getMetrics(config.timeframe, config.stations);
        if (cached) {
          setMetrics(cached);
          setLastUpdate(new Date());
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshMetrics = await analyticsCalculations.calculateDashboardMetrics({
        timeframe: config.timeframe,
        stations: config.stations,
        customDateRange: config.customDateRange
      });

      setMetrics(freshMetrics);
      setLastUpdate(new Date());

      // Cache the results
      if (config.enableCaching) {
        await analyticsCache.setMetrics(config.timeframe, config.stations, freshMetrics);
      }

      // Check alerts
      if (config.enableAlerts) {
        await checkAlerts(freshMetrics);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
      toast({
        title: 'Analytics Error',
        description: errorMessage,
        variant: 'destructive'
      });

      // Try backup data source
      try {
        const backupData = await analyticsCache.getBackupMetrics();
        if (backupData) {
          setMetrics(backupData);
          toast({
            title: 'Using Backup Data',
            description: 'Showing cached data due to connection issue',
            variant: 'default'
          });
        }
      } catch (backupError) {
        console.error('Backup data fetch failed:', backupError);
      }
    } finally {
      setLoading(false);

      // Record performance
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      performanceMonitor.current?.recordLoadTime(loadTime);

      if (loadTime > 3000) {// Alert if load time > 3 seconds
        toast({
          title: 'Performance Warning',
          description: `Dashboard loaded slowly (${Math.round(loadTime)}ms)`,
          variant: 'default'
        });
      }
    }
  }, [config, toast]);

  // Fetch comparison data
  const fetchComparison = useCallback(async () => {
    try {
      const comparisonData = await analyticsCalculations.calculateTimeframeComparison({
        timeframe: config.timeframe,
        stations: config.stations,
        customDateRange: config.customDateRange
      });

      setComparison(comparisonData);

      if (config.enableCaching) {
        await analyticsCache.setComparison(config.timeframe, config.stations, comparisonData);
      }
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
    }
  }, [config]);

  // Fetch forecast data
  const fetchForecast = useCallback(async () => {
    if (!config.enableForecasting) return;

    try {
      const forecastData = await analyticsForecasting.generateForecast({
        timeframe: config.timeframe,
        stations: config.stations,
        forecastDays: 30
      });

      setForecast(forecastData);

      if (config.enableCaching) {
        await analyticsCache.setForecast(config.timeframe, config.stations, forecastData);
      }
    } catch (err) {
      console.error('Failed to fetch forecast data:', err);
    }
  }, [config]);

  // Load alert configurations
  const loadAlerts = useCallback(async () => {
    if (!config.enableAlerts) return;

    try {
      const alertConfigs = await analyticsAlerts.getAlertConfigurations();
      setAlerts(alertConfigs);
    } catch (err) {
      console.error('Failed to load alert configurations:', err);
    }
  }, [config.enableAlerts]);

  // Check alert thresholds
  const checkAlerts = useCallback(async (currentMetrics: DashboardMetrics) => {
    if (!config.enableAlerts || alerts.length === 0) return;

    try {
      const triggeredAlerts = await analyticsAlerts.checkThresholds(currentMetrics, alerts);

      for (const alert of triggeredAlerts) {
        if (alert.notificationMethods.includes('dashboard')) {
          toast({
            title: `Alert: ${alert.metric}`,
            description: `Threshold exceeded: ${alert.threshold}`,
            variant: 'destructive'
          });
        }

        if (alert.notificationMethods.includes('email')) {
          await analyticsAlerts.sendEmailAlert(alert, currentMetrics);
        }

        if (alert.notificationMethods.includes('sms')) {
          await analyticsAlerts.sendSMSAlert(alert, currentMetrics);
        }
      }
    } catch (err) {
      console.error('Failed to check alerts:', err);
    }
  }, [alerts, config.enableAlerts, toast]);

  // Export data functionality
  const exportData = useCallback(async (format: 'csv' | 'excel' | 'pdf', options?: any) => {
    try {
      if (!metrics) {
        throw new Error('No data available for export');
      }

      const exportResult = await analyticsExport.exportDashboardData({
        metrics,
        comparison,
        forecast,
        format,
        timeframe: config.timeframe,
        stations: config.stations,
        ...options
      });

      // Trigger download
      const link = document.createElement('a');
      link.href = exportResult.downloadUrl;
      link.download = exportResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: `Data exported as ${format.toUpperCase()}`,
        variant: 'default'
      });

      return exportResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      toast({
        title: 'Export Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [metrics, comparison, forecast, config, toast]);

  // Send automated email report
  const sendEmailReport = useCallback(async (recipients: string[], reportType: 'daily' | 'weekly' | 'monthly') => {
    try {
      if (!metrics) {
        throw new Error('No data available for email report');
      }

      await analyticsExport.sendEmailReport({
        metrics,
        comparison,
        forecast,
        recipients,
        reportType,
        timeframe: config.timeframe,
        stations: config.stations
      });

      toast({
        title: 'Email Report Sent',
        description: `${reportType} report sent to ${recipients.length} recipient(s)`,
        variant: 'default'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email report';
      toast({
        title: 'Email Report Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [metrics, comparison, forecast, config, toast]);

  // Update alert configuration
  const updateAlertConfig = useCallback(async (alertConfig: AlertConfig) => {
    try {
      await analyticsAlerts.updateAlertConfiguration(alertConfig);
      await loadAlerts(); // Reload alerts

      toast({
        title: 'Alert Updated',
        description: `Alert configuration for ${alertConfig.metric} updated successfully`,
        variant: 'default'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update alert';
      toast({
        title: 'Alert Update Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [loadAlerts, toast]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return performanceMonitor.current?.getMetrics();
  }, []);

  // Refresh data manually
  const refresh = useCallback(async () => {
    await Promise.all([
    fetchMetrics(true),
    fetchComparison(),
    fetchForecast()]
    );
  }, [fetchMetrics, fetchComparison, fetchForecast]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await analyticsCache.clearAll();
      await refresh();

      toast({
        title: 'Cache Cleared',
        description: 'Analytics cache cleared and data refreshed',
        variant: 'default'
      });
    } catch (err) {
      toast({
        title: 'Cache Clear Failed',
        description: 'Failed to clear cache',
        variant: 'destructive'
      });
    }
  }, [refresh, toast]);

  // Setup auto-refresh
  useEffect(() => {
    // Clear existing interval
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    // Setup new interval
    if (config.refreshInterval > 0) {
      refreshInterval.current = setInterval(() => {
        fetchMetrics();
      }, config.refreshInterval);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [config.refreshInterval, fetchMetrics]);

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
      fetchMetrics(),
      fetchComparison(),
      fetchForecast(),
      loadAlerts()]
      );
    };

    initializeData();
  }, [fetchMetrics, fetchComparison, fetchForecast, loadAlerts]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const perfMetrics = performanceMonitor.current?.getMetrics();
      setPerformance(perfMetrics);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    // Data
    metrics,
    comparison,
    forecast,
    alerts,
    performance,

    // State
    loading,
    error,
    lastUpdate,

    // Actions
    refresh,
    exportData,
    sendEmailReport,
    updateAlertConfig,
    clearCache,
    getPerformanceMetrics,

    // Utilities
    isStale: lastUpdate ? Date.now() - lastUpdate.getTime() > config.refreshInterval : true,
    cacheEnabled: config.enableCaching,
    forecastingEnabled: config.enableForecasting,
    alertsEnabled: config.enableAlerts
  };
};

export default useDashboardAnalytics;
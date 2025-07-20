import React, { createContext, useContext, ReactNode } from 'react';
import useDashboardAnalytics, { AnalyticsOptions } from '@/hooks/use-dashboard-analytics';

interface DashboardAnalyticsContextType {
  metrics: any;
  comparison: any;
  forecast: any;
  alerts: any[];
  performance: any;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  exportData: (format: 'csv' | 'excel' | 'pdf', options?: any) => Promise<any>;
  sendEmailReport: (recipients: string[], reportType: 'daily' | 'weekly' | 'monthly') => Promise<void>;
  updateAlertConfig: (alertConfig: any) => Promise<void>;
  clearCache: () => Promise<void>;
  getPerformanceMetrics: () => any;
  isStale: boolean;
  cacheEnabled: boolean;
  forecastingEnabled: boolean;
  alertsEnabled: boolean;
}

const DashboardAnalyticsContext = createContext<DashboardAnalyticsContextType | null>(null);

interface DashboardAnalyticsProviderProps {
  children: ReactNode;
  options?: Partial<AnalyticsOptions>;
}

export const DashboardAnalyticsProvider: React.FC<DashboardAnalyticsProviderProps> = ({
  children,
  options = {}
}) => {
  const analyticsHook = useDashboardAnalytics(options);

  return (
    <DashboardAnalyticsContext.Provider value={analyticsHook}>
      {children}
    </DashboardAnalyticsContext.Provider>);

};

export const useDashboardAnalyticsContext = (): DashboardAnalyticsContextType => {
  const context = useContext(DashboardAnalyticsContext);

  if (!context) {
    throw new Error('useDashboardAnalyticsContext must be used within a DashboardAnalyticsProvider');
  }

  return context;
};

export default DashboardAnalyticsProvider;

import { useEffect, useState, useCallback } from 'react';
import { OverflowDetector, OverflowIssue, OverflowDetectionConfig } from '@/utils/overflowDetection';

export const useOverflowDetection = (config?: Partial<OverflowDetectionConfig>) => {
  const [detector, setDetector] = useState<OverflowDetector | null>(null);
  const [issues, setIssues] = useState<OverflowIssue[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    if (detector) {
      detector.stopMonitoring();
    }

    const newDetector = new OverflowDetector(config);
    newDetector.startMonitoring();
    setDetector(newDetector);
    setIsMonitoring(true);
  }, [config]);

  const stopMonitoring = useCallback(() => {
    if (detector) {
      detector.stopMonitoring();
      setDetector(null);
      setIsMonitoring(false);
    }
  }, [detector]);

  const getReport = useCallback(() => {
    return detector?.getReport() || null;
  }, [detector]);

  const refreshIssues = useCallback(() => {
    if (detector) {
      setIssues(detector.getIssues());
    }
  }, [detector]);

  useEffect(() => {
    // Refresh issues periodically
    const interval = setInterval(() => {
      refreshIssues();
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshIssues]);

  useEffect(() => {
    return () => {
      if (detector) {
        detector.stopMonitoring();
      }
    };
  }, [detector]);

  return {
    startMonitoring,
    stopMonitoring,
    getReport,
    refreshIssues,
    issues,
    isMonitoring
  };
};
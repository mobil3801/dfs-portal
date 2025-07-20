// Analytics alerts utilities for threshold monitoring and notifications

import { AlertConfig } from '@/hooks/use-dashboard-analytics';

interface AlertThreshold {
  id: string;
  name: string;
  metric: string;
  value: number;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

interface AlertNotification {
  id: string;
  alertId: string;
  message: string;
  severity: string;
  triggeredAt: Date;
  channels: string[];
  acknowledged: boolean;
}

interface MetricValue {
  current: number;
  previous?: number;
  metadata?: any;
}

class AnalyticsAlerts {
  private readonly smsTableId = 12613; // sms_alert_history
  private readonly alertHistoryKey = 'analytics_alerts_history';
  private readonly cooldownMap = new Map<string, Date>();

  // Get alert configurations
  async getAlertConfigurations(): Promise<AlertConfig[]> {
    try {
      // For now, return default configurations
      // In a full implementation, these would be stored in a database table
      return this.getDefaultAlertConfigurations();
    } catch (error) {
      console.error('Error fetching alert configurations:', error);
      return [];
    }
  }

  // Update alert configuration
  async updateAlertConfiguration(config: AlertConfig): Promise<void> {
    try {
      // Store in localStorage for now
      // In production, this would be saved to a database table
      const alerts = await this.getAlertConfigurations();
      const updatedAlerts = alerts.filter((a) => a.id !== config.id);
      updatedAlerts.push(config);

      localStorage.setItem('analytics_alert_configs', JSON.stringify(updatedAlerts));

      console.log(`Alert configuration updated: ${config.id}`);
    } catch (error) {
      console.error('Error updating alert configuration:', error);
      throw new Error('Failed to update alert configuration');
    }
  }

  // Check thresholds against current metrics
  async checkThresholds(metrics: any, alerts: AlertConfig[]): Promise<AlertConfig[]> {
    const triggeredAlerts: AlertConfig[] = [];

    try {
      for (const alert of alerts) {
        if (!alert.isActive) continue;

        // Check cooldown
        if (this.isInCooldown(alert.id)) continue;

        const metricValue = this.extractMetricValue(metrics, alert.metric);
        if (metricValue === null) continue;

        const isTriggered = this.evaluateThreshold(metricValue, alert.threshold, alert.operator);

        if (isTriggered) {
          triggeredAlerts.push(alert);
          this.setCooldown(alert.id);

          // Log the alert
          await this.logAlert(alert, metricValue, metrics);
        }
      }
    } catch (error) {
      console.error('Error checking thresholds:', error);
    }

    return triggeredAlerts;
  }

  // Send email alert
  async sendEmailAlert(alert: AlertConfig, metrics: any): Promise<void> {
    try {
      const metricValue = this.extractMetricValue(metrics, alert.metric);
      const emailContent = this.generateEmailAlertContent(alert, metricValue, metrics);

      const { error } = await window.ezsite.apis.sendEmail({
        from: 'support@ezsite.ai',
        to: alert.recipients,
        subject: `Analytics Alert: ${alert.metric}`,
        html: emailContent.html,
        text: emailContent.text
      });

      if (error) {
        throw new Error(error);
      }

      console.log(`Email alert sent for ${alert.metric} to ${alert.recipients.length} recipients`);
    } catch (error) {
      console.error('Error sending email alert:', error);
      throw new Error('Failed to send email alert');
    }
  }

  // Send SMS alert
  async sendSMSAlert(alert: AlertConfig, metrics: any): Promise<void> {
    try {
      const metricValue = this.extractMetricValue(metrics, alert.metric);
      const message = this.generateSMSAlertMessage(alert, metricValue);

      // Log SMS alert in history table
      const smsData = {
        license_id: 0, // Not applicable for analytics alerts
        contact_id: 0, // System alert
        mobile_number: alert.recipients.join(', '),
        message_content: message,
        sent_date: new Date().toISOString(),
        delivery_status: 'Sent',
        days_before_expiry: 0,
        created_by: 1 // System user
      };

      const { error } = await window.ezsite.apis.tableCreate(this.smsTableId, smsData);

      if (error) {
        console.warn('Failed to log SMS alert:', error);
      }

      // In a real implementation, this would send SMS via SMS service
      console.log(`SMS alert logged for ${alert.metric}: ${message}`);
    } catch (error) {
      console.error('Error sending SMS alert:', error);
      throw new Error('Failed to send SMS alert');
    }
  }

  // Create new alert threshold
  async createAlertThreshold(threshold: Omit<AlertThreshold, 'id'>): Promise<string> {
    try {
      const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const alertThreshold: AlertThreshold = {
        ...threshold,
        id
      };

      // Store in localStorage for now
      const thresholds = await this.getAlertThresholds();
      thresholds.push(alertThreshold);

      localStorage.setItem('analytics_alert_thresholds', JSON.stringify(thresholds));

      return id;
    } catch (error) {
      console.error('Error creating alert threshold:', error);
      throw new Error('Failed to create alert threshold');
    }
  }

  // Get all alert thresholds
  async getAlertThresholds(): Promise<AlertThreshold[]> {
    try {
      const stored = localStorage.getItem('analytics_alert_thresholds');
      if (stored) {
        return JSON.parse(stored);
      }
      return this.getDefaultAlertThresholds();
    } catch (error) {
      console.error('Error fetching alert thresholds:', error);
      return [];
    }
  }

  // Update alert threshold
  async updateAlertThreshold(threshold: AlertThreshold): Promise<void> {
    try {
      const thresholds = await this.getAlertThresholds();
      const updatedThresholds = thresholds.filter((t) => t.id !== threshold.id);
      updatedThresholds.push(threshold);

      localStorage.setItem('analytics_alert_thresholds', JSON.stringify(updatedThresholds));
    } catch (error) {
      console.error('Error updating alert threshold:', error);
      throw new Error('Failed to update alert threshold');
    }
  }

  // Delete alert threshold
  async deleteAlertThreshold(thresholdId: string): Promise<void> {
    try {
      const thresholds = await this.getAlertThresholds();
      const filteredThresholds = thresholds.filter((t) => t.id !== thresholdId);

      localStorage.setItem('analytics_alert_thresholds', JSON.stringify(filteredThresholds));
    } catch (error) {
      console.error('Error deleting alert threshold:', error);
      throw new Error('Failed to delete alert threshold');
    }
  }

  // Get alert history
  async getAlertHistory(limit = 50): Promise<AlertNotification[]> {
    try {
      const stored = localStorage.getItem(this.alertHistoryKey);
      if (stored) {
        const history = JSON.parse(stored);
        return history.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error fetching alert history:', error);
      return [];
    }
  }

  // Clear alert history
  async clearAlertHistory(): Promise<void> {
    try {
      localStorage.removeItem(this.alertHistoryKey);
    } catch (error) {
      console.error('Error clearing alert history:', error);
      throw new Error('Failed to clear alert history');
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const history = await this.getAlertHistory();
      const updatedHistory = history.map((alert) =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );

      localStorage.setItem(this.alertHistoryKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }

  // Default alert configurations
  private getDefaultAlertConfigurations(): AlertConfig[] {
    return [
    {
      id: 'low_sales_alert',
      metric: 'totalSales.current',
      threshold: 5000,
      operator: 'less_than',
      isActive: true,
      notificationMethods: ['email', 'dashboard'],
      recipients: ['manager@example.com']
    },
    {
      id: 'high_expenses_alert',
      metric: 'expenses.total',
      threshold: 2000,
      operator: 'greater_than',
      isActive: true,
      notificationMethods: ['email', 'sms'],
      recipients: ['admin@example.com']
    },
    {
      id: 'low_profit_margin_alert',
      metric: 'profitMargin.current',
      threshold: 15,
      operator: 'less_than',
      isActive: true,
      notificationMethods: ['email', 'dashboard'],
      recipients: ['finance@example.com']
    },
    {
      id: 'low_inventory_alert',
      metric: 'inventoryMetrics.lowStockItems',
      threshold: 10,
      operator: 'greater_than',
      isActive: true,
      notificationMethods: ['email'],
      recipients: ['inventory@example.com']
    }];

  }

  // Default alert thresholds
  private getDefaultAlertThresholds(): AlertThreshold[] {
    return [
    {
      id: 'sales_drop_threshold',
      name: 'Sales Drop Alert',
      metric: 'totalSales.current',
      value: 5000,
      operator: 'less_than',
      severity: 'high',
      isActive: true,
      cooldownMinutes: 60
    },
    {
      id: 'expense_spike_threshold',
      name: 'Expense Spike Alert',
      metric: 'expenses.total',
      value: 2000,
      operator: 'greater_than',
      severity: 'medium',
      isActive: true,
      cooldownMinutes: 120
    },
    {
      id: 'margin_low_threshold',
      name: 'Low Profit Margin Alert',
      metric: 'profitMargin.current',
      value: 15,
      operator: 'less_than',
      severity: 'high',
      isActive: true,
      cooldownMinutes: 240
    }];

  }

  // Extract metric value from metrics object
  private extractMetricValue(metrics: any, metricPath: string): number | null {
    try {
      const keys = metricPath.split('.');
      let value = metrics;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return null;
        }
      }

      return typeof value === 'number' ? value : null;
    } catch (error) {
      console.error(`Error extracting metric value for ${metricPath}:`, error);
      return null;
    }
  }

  // Evaluate threshold condition
  private evaluateThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      case 'percentage_change':
        // This would need previous value context
        return false;
      default:
        return false;
    }
  }

  // Check if alert is in cooldown period
  private isInCooldown(alertId: string): boolean {
    const lastTriggered = this.cooldownMap.get(alertId);
    if (!lastTriggered) return false;

    const cooldownPeriod = 30 * 60 * 1000; // 30 minutes default
    return Date.now() - lastTriggered.getTime() < cooldownPeriod;
  }

  // Set cooldown for alert
  private setCooldown(alertId: string): void {
    this.cooldownMap.set(alertId, new Date());
  }

  // Log alert to history
  private async logAlert(alert: AlertConfig, metricValue: number, metrics: any): Promise<void> {
    try {
      const notification: AlertNotification = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertId: alert.id,
        message: `Alert triggered: ${alert.metric} value ${metricValue} ${alert.operator.replace('_', ' ')} ${alert.threshold}`,
        severity: 'medium', // Could be derived from alert config
        triggeredAt: new Date(),
        channels: alert.notificationMethods,
        acknowledged: false
      };

      const history = await this.getAlertHistory();
      history.unshift(notification); // Add to beginning

      // Keep only last 100 alerts
      const trimmedHistory = history.slice(0, 100);

      localStorage.setItem(this.alertHistoryKey, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error logging alert:', error);
    }
  }

  // Generate email alert content
  private generateEmailAlertContent(alert: AlertConfig, metricValue: number, metrics: any): {html: string;text: string;} {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #721c24;">🚨 Analytics Alert Triggered</h2>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Alert Details</h3>
          
          <div style="margin: 10px 0;">
            <strong>Metric:</strong> ${alert.metric}
          </div>
          
          <div style="margin: 10px 0;">
            <strong>Current Value:</strong> ${this.formatMetricValue(metricValue, alert.metric)}
          </div>
          
          <div style="margin: 10px 0;">
            <strong>Threshold:</strong> ${alert.operator.replace('_', ' ')} ${this.formatMetricValue(alert.threshold, alert.metric)}
          </div>
          
          <div style="margin: 10px 0;">
            <strong>Triggered At:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #d1ecf1; border-radius: 8px;">
          <p style="margin: 0; color: #0c5460;">
            <strong>Action Required:</strong> Please review your dashboard for more details and take appropriate action.
          </p>
        </div>
      </div>
    `;

    const text = `
Analytics Alert Triggered

Alert Details:
- Metric: ${alert.metric}
- Current Value: ${this.formatMetricValue(metricValue, alert.metric)}
- Threshold: ${alert.operator.replace('_', ' ')} ${this.formatMetricValue(alert.threshold, alert.metric)}
- Triggered At: ${new Date().toLocaleString()}

Action Required: Please review your dashboard for more details and take appropriate action.
    `;

    return { html, text };
  }

  // Generate SMS alert message
  private generateSMSAlertMessage(alert: AlertConfig, metricValue: number): string {
    return `Alert: ${alert.metric} is ${this.formatMetricValue(metricValue, alert.metric)} (threshold: ${alert.operator.replace('_', ' ')} ${this.formatMetricValue(alert.threshold, alert.metric)}). Check dashboard for details.`;
  }

  // Format metric value for display
  private formatMetricValue(value: number, metric: string): string {
    if (metric.includes('Sales') || metric.includes('Revenue') || metric.includes('Expenses')) {
      return `$${value.toLocaleString()}`;
    }
    if (metric.includes('Margin') || metric.includes('Percent')) {
      return `${value.toFixed(1)}%`;
    }
    if (metric.includes('gallons') || metric.includes('Gallons')) {
      return `${value.toLocaleString()} gal`;
    }
    return value.toLocaleString();
  }

  // Test alert system
  async testAlertSystem(): Promise<void> {
    try {
      const testAlert: AlertConfig = {
        id: 'test_alert',
        metric: 'test.metric',
        threshold: 100,
        operator: 'greater_than',
        isActive: true,
        notificationMethods: ['email'],
        recipients: ['test@example.com']
      };

      const testMetrics = {
        test: { metric: 150 }
      };

      await this.sendEmailAlert(testAlert, testMetrics);
      console.log('Alert system test completed successfully');
    } catch (error) {
      console.error('Alert system test failed:', error);
      throw error;
    }
  }
}

export const analyticsAlerts = new AnalyticsAlerts();
export default analyticsAlerts;
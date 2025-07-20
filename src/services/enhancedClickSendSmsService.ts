// Enhanced ClickSend SMS Service with advanced features
// Updated to use the main ClickSend service with provided credentials

import { clickSendSmsService, SMSResponse, SMSMessage, ClickSendConfig } from './clickSendSmsService';

export interface AdvancedSMSOptions {
  priority?: 'low' | 'normal' | 'high';
  scheduledTime?: Date;
  retryAttempts?: number;
  template?: string;
  variables?: Record<string, string>;
  deliveryReport?: boolean;
  customSender?: string;
}

export interface SMSAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  averageCost: number;
  topRecipients: {phone: string;count: number;}[];
  dailyStats: {date: string;sent: number;delivered: number;}[];
}

export interface BulkSMSJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

class EnhancedClickSendSMSService {
  private jobQueue: Map<string, BulkSMSJob> = new Map();
  private retryQueue: Array<{message: SMSMessage;attempts: number;maxAttempts: number;}> = [];

  constructor(private baseService = clickSendSmsService) {
    // Initialize the base service with provided credentials
    this.initializeBaseService();
  }

  private async initializeBaseService() {
    try {
      // The base service auto-initializes with provided credentials
      console.log('🔧 Enhanced ClickSend SMS service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize enhanced SMS service:', error);
    }
  }

  async sendAdvancedSMS(
  phoneNumber: string,
  message: string,
  options: AdvancedSMSOptions = {})
  : Promise<SMSResponse> {
    try {
      // Process template variables if provided
      let processedMessage = message;
      if (options.template && options.variables) {
        processedMessage = this.processMessageTemplate(options.template, options.variables);
      }

      // Handle scheduled messaging
      if (options.scheduledTime && options.scheduledTime > new Date()) {
        return this.scheduleMessage(phoneNumber, processedMessage, options);
      }

      // Prepare SMS message
      const smsMessage: SMSMessage = {
        to: phoneNumber,
        message: processedMessage,
        type: options.priority || 'normal'
      };

      // Send SMS using ClickSend
      const response = await this.baseService.sendSMS(smsMessage);

      // Handle retry logic for failed messages
      if (!response.success && options.retryAttempts && options.retryAttempts > 0) {
        this.addToRetryQueue(smsMessage, options.retryAttempts);
      }

      // Log advanced analytics
      await this.logAdvancedAnalytics(phoneNumber, processedMessage, response, options);

      return response;
    } catch (error) {
      console.error('Advanced SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private processMessageTemplate(template: string, variables: Record<string, string>): string {
    let processedMessage = template;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedMessage = processedMessage.replace(regex, value);
    });

    return processedMessage;
  }

  private async scheduleMessage(
  phoneNumber: string,
  message: string,
  options: AdvancedSMSOptions)
  : Promise<SMSResponse> {
    // In a real implementation, this would integrate with a job scheduler
    // For now, we'll use setTimeout for simple scheduling
    const delay = options.scheduledTime!.getTime() - Date.now();

    if (delay > 0) {
      setTimeout(async () => {
        await this.baseService.sendSMS({
          to: phoneNumber,
          message: message,
          type: 'scheduled'
        });
      }, delay);

      return {
        success: true,
        messageId: `scheduled_${Date.now()}`,
        status: 'scheduled'
      };
    }

    // If scheduled time is in the past, send immediately
    return this.baseService.sendSMS({
      to: phoneNumber,
      message: message,
      type: 'immediate'
    });
  }

  private addToRetryQueue(message: SMSMessage, maxAttempts: number): void {
    this.retryQueue.push({
      message,
      attempts: 0,
      maxAttempts
    });
  }

  async processRetryQueue(): Promise<void> {
    const retryItems = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of retryItems) {
      item.attempts++;

      try {
        const response = await this.baseService.sendSMS(item.message);

        if (!response.success && item.attempts < item.maxAttempts) {
          // Add back to retry queue with exponential backoff
          setTimeout(() => {
            this.retryQueue.push(item);
          }, Math.pow(2, item.attempts) * 1000);
        }
      } catch (error) {
        console.error('Retry queue processing error:', error);
      }
    }
  }

  async sendBulkSMSWithProgress(
  messages: Array<{phoneNumber: string;message: string;options?: AdvancedSMSOptions;}>)
  : Promise<BulkSMSJob> {
    const jobId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: BulkSMSJob = {
      id: jobId,
      status: 'pending',
      totalMessages: messages.length,
      sentMessages: 0,
      failedMessages: 0,
      createdAt: new Date()
    };

    this.jobQueue.set(jobId, job);

    // Process messages asynchronously
    this.processBulkJob(jobId, messages);

    return job;
  }

  private async processBulkJob(
  jobId: string,
  messages: Array<{phoneNumber: string;message: string;options?: AdvancedSMSOptions;}>)
  : Promise<void> {
    const job = this.jobQueue.get(jobId);
    if (!job) return;

    job.status = 'processing';

    for (const { phoneNumber, message, options } of messages) {
      try {
        const response = await this.sendAdvancedSMS(phoneNumber, message, options || {});

        if (response.success) {
          job.sentMessages++;
        } else {
          job.failedMessages++;
        }

        // Add delay between messages to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        job.failedMessages++;
        console.error(`Bulk SMS error for ${phoneNumber}:`, error);
      }
    }

    job.status = 'completed';
    job.completedAt = new Date();
  }

  getBulkJobStatus(jobId: string): BulkSMSJob | null {
    return this.jobQueue.get(jobId) || null;
  }

  async getSMSAnalytics(dateRange?: {start: Date;end: Date;}): Promise<SMSAnalytics> {
    try {
      // Build date filter
      const filters: any[] = [];
      if (dateRange) {
        filters.push(
          { name: 'sent_at', op: 'GreaterThanOrEqual', value: dateRange.start.toISOString() },
          { name: 'sent_at', op: 'LessThanOrEqual', value: dateRange.end.toISOString() }
        );
      }

      // Get SMS history data
      const { data, error } = await window.ezsite.apis.tablePage(24062, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'sent_at',
        IsAsc: false,
        Filters: filters
      });

      if (error) throw new Error(error);

      const messages = data?.List || [];

      // Calculate analytics
      const totalSent = messages.length;
      const totalDelivered = messages.filter((m: any) => m.status === 'Delivered').length;
      const totalFailed = messages.filter((m: any) => m.status === 'Failed').length;
      const deliveryRate = totalSent > 0 ? totalDelivered / totalSent * 100 : 0;

      const totalCost = messages.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
      const averageCost = totalSent > 0 ? totalCost / totalSent : 0;

      // Top recipients
      const recipientCounts = messages.reduce((acc: Record<string, number>, m: any) => {
        acc[m.recipient_phone] = (acc[m.recipient_phone] || 0) + 1;
        return acc;
      }, {});

      const topRecipients = Object.entries(recipientCounts).
      map(([phone, count]) => ({ phone, count: count as number })).
      sort((a, b) => b.count - a.count).
      slice(0, 10);

      // Daily stats (last 30 days)
      const dailyStats = this.calculateDailyStats(messages);

      return {
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate,
        averageCost,
        topRecipients,
        dailyStats
      };
    } catch (error) {
      console.error('Error getting SMS analytics:', error);
      throw error;
    }
  }

  private calculateDailyStats(messages: any[]): {date: string;sent: number;delivered: number;}[] {
    const dailyMap = new Map<string, {sent: number;delivered: number;}>();

    messages.forEach((message) => {
      const date = message.sent_at?.split('T')[0];
      if (!date) return;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { sent: 0, delivered: 0 });
      }

      const stats = dailyMap.get(date)!;
      stats.sent++;
      if (message.status === 'Delivered') {
        stats.delivered++;
      }
    });

    return Array.from(dailyMap.entries()).
    map(([date, stats]) => ({ date, ...stats })).
    sort((a, b) => a.date.localeCompare(b.date)).
    slice(-30); // Last 30 days
  }

  private async logAdvancedAnalytics(
  phoneNumber: string,
  message: string,
  response: SMSResponse,
  options: AdvancedSMSOptions)
  : Promise<void> {
    // This would integrate with your analytics service
    // For now, we'll just log to console
    console.log('SMS Analytics:', {
      phoneNumber,
      messageLength: message.length,
      success: response.success,
      cost: response.cost,
      priority: options.priority,
      timestamp: new Date().toISOString()
    });
  }

  async sendEmergencyAlert(
  message: string,
  options: AdvancedSMSOptions = {})
  : Promise<SMSResponse[]> {
    try {
      // Get emergency contacts from settings
      const { data, error } = await window.ezsite.apis.tablePage(24061, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
        { name: 'is_emergency', op: 'Equal', value: true },
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (error) throw new Error(error);

      const emergencyContacts = data?.List || [];
      const results: SMSResponse[] = [];

      for (const contact of emergencyContacts) {
        const response = await this.sendAdvancedSMS(
          contact.phone_number,
          `🚨 EMERGENCY ALERT: ${message}`,
          { ...options, priority: 'high' }
        );
        results.push(response);

        // Small delay between emergency messages
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return results;
    } catch (error) {
      console.error('Emergency alert sending error:', error);
      throw error;
    }
  }

  async validatePhoneNumbers(phoneNumbers: string[]): Promise<{valid: string[];invalid: string[];}> {
    const valid: string[] = [];
    const invalid: string[] = [];

    phoneNumbers.forEach((phoneNumber) => {
      // E.164 format validation
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (e164Regex.test(phoneNumber)) {
        valid.push(phoneNumber);
      } else {
        invalid.push(phoneNumber);
      }
    });

    return { valid, invalid };
  }

  async getServiceHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: Date;
    responseTime: number;
    errorRate: number;
    balance: number;
  }> {
    const startTime = Date.now();

    try {
      const isConfigured = this.baseService.isServiceConfigured();
      if (!isConfigured) {
        return {
          status: 'down',
          lastCheck: new Date(),
          responseTime: 0,
          errorRate: 100,
          balance: 0
        };
      }

      const statusResponse = await this.baseService.getServiceStatus();
      const responseTime = Date.now() - startTime;

      // Get recent error rate (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentMessages } = await window.ezsite.apis.tablePage(24062, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'sent_at',
        IsAsc: false,
        Filters: [
        { name: 'sent_at', op: 'GreaterThanOrEqual', value: yesterday.toISOString() }]

      });

      const messages = recentMessages?.List || [];
      const failedCount = messages.filter((m: any) => m.status === 'Failed').length;
      const errorRate = messages.length > 0 ? failedCount / messages.length * 100 : 0;

      const balance = await this.baseService.getAccountBalance();

      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (!statusResponse.available) {
        status = 'down';
      } else if (errorRate > 10 || responseTime > 5000 || balance < 10) {
        status = 'degraded';
      }

      return {
        status,
        lastCheck: new Date(),
        responseTime,
        errorRate,
        balance
      };
    } catch (error) {
      console.error('Service health check error:', error);
      return {
        status: 'down',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorRate: 100,
        balance: 0
      };
    }
  }

  // Template management
  async createMessageTemplate(
  name: string,
  content: string,
  type: string = 'custom')
  : Promise<void> {
    try {
      await window.ezsite.apis.tableCreate('sms_templates', {
        template_name: name,
        message_content: content,
        template_type: type,
        is_active: true,
        priority_level: 'normal',
        created_by: 1
      });
    } catch (error) {
      console.error('Error creating message template:', error);
      throw error;
    }
  }

  async getMessageTemplates(): Promise<any[]> {
    try {
      const { data, error } = await window.ezsite.apis.tablePage('sms_templates', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'template_name',
        IsAsc: true,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw new Error(error);
      return data?.List || [];
    } catch (error) {
      console.error('Error getting message templates:', error);
      return [];
    }
  }

  // Wrapper methods to use the base ClickSend service
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    return this.baseService.sendSMS(message);
  }

  async testSMS(phoneNumber: string): Promise<SMSResponse> {
    return this.baseService.testSMS(phoneNumber);
  }

  async getAccountBalance(): Promise<number> {
    return this.baseService.getAccountBalance();
  }

  async getServiceStatus() {
    return this.baseService.getServiceStatus();
  }

  isServiceConfigured(): boolean {
    return this.baseService.isServiceConfigured();
  }
}

export const enhancedClickSendSmsService = new EnhancedClickSendSMSService();
export default enhancedClickSendSmsService;

// Export for backward compatibility
export const enhancedSmsService = enhancedClickSendSmsService;
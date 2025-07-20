// Legacy SMS Service - REDIRECTS TO CLICKSEND
// This file redirects all SMS functionality to use ClickSend exclusively
// Maintained for backward compatibility

import { clickSendSmsService } from './clickSendSmsService';

// Type definitions for backward compatibility
export interface ClickSendConfig {
  username: string;
  apiKey: string;
  fromNumber: string;
  testMode: boolean;
  webhookUrl?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
  status?: string;
  clickSendMessageId?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
  type?: string;
  templateId?: number;
  placeholders?: Record<string, string>;
}

export interface SMSTemplate {
  id: number;
  template_name: string;
  message_content: string;
  template_type: string;
  is_active: boolean;
  priority_level: string;
}

export interface SinchClickSendConfig extends ClickSendConfig {} // Deprecated alias

// Legacy SMS Service class that redirects to ClickSend
class LegacySMSService {
  constructor() {
    console.log('🔄 Legacy SMS Service initialized - All requests will be handled by ClickSend');
  }

  // All methods redirect to ClickSend service
  async configure(config: SinchClickSendConfig | ClickSendConfig) {
    console.log('🔄 Redirecting configuration to ClickSend service');
    return clickSendSmsService.configure(config);
  }

  async loadConfiguration(): Promise<void> {
    return clickSendSmsService.loadConfiguration();
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    return clickSendSmsService.sendSMS(message);
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    return clickSendSmsService.sendBulkSMS(messages);
  }

  async getDeliveryStatus(messageId: string): Promise<{status: string;delivered: boolean;}> {
    return clickSendSmsService.getDeliveryStatus(messageId);
  }

  async testSMS(phoneNumber: string): Promise<SMSResponse> {
    return clickSendSmsService.testSMS(phoneNumber);
  }

  async addTestNumber(phoneNumber: string): Promise<void> {
    return clickSendSmsService.addTestNumber(phoneNumber);
  }

  async removeTestNumber(phoneNumber: string): Promise<void> {
    return clickSendSmsService.removeTestNumber(phoneNumber);
  }

  getTestNumbers(): string[] {
    return clickSendSmsService.getTestNumbers();
  }

  async getDailyUsage(): Promise<{used: number;limit: number;percentage: number;}> {
    return clickSendSmsService.getDailyUsage();
  }

  isServiceConfigured(): boolean {
    return clickSendSmsService.isServiceConfigured();
  }

  getConfiguration(): ClickSendConfig | null {
    return clickSendSmsService.getConfiguration();
  }

  async getServiceStatus(): Promise<{available: boolean;message: string;providers?: any;quota?: any;}> {
    return clickSendSmsService.getServiceStatus();
  }

  async sendSimpleSMS(phoneNumber: string, message: string, fromNumber?: string): Promise<SMSResponse> {
    return clickSendSmsService.sendSimpleSMS(phoneNumber, message, fromNumber);
  }

  async getAvailableFromNumbers(): Promise<{number: string;provider: string;isActive: boolean;testMode: boolean;}[]> {
    return clickSendSmsService.getAvailableFromNumbers();
  }

  async sendCustomSMS(phoneNumber: string, message: string, fromNumber: string): Promise<SMSResponse> {
    return clickSendSmsService.sendCustomSMS(phoneNumber, message, fromNumber);
  }

  async getAccountBalance(): Promise<number> {
    return clickSendSmsService.getAccountBalance();
  }
}

// Legacy SMS Service with production features
class LegacyProductionSMSService extends LegacySMSService {
  async loadEnvironmentConfig(): Promise<void> {
    console.log('🔄 Legacy production service redirecting to ClickSend production service');
    // Always use ClickSend with provided credentials
    await clickSendSmsService.loadConfiguration();
  }

  async initializeForProduction(): Promise<void> {
    console.log('🚀 Legacy production SMS service redirected to ClickSend production service');
    await this.loadEnvironmentConfig();
  }
}

// Export instances that redirect to ClickSend
export const smsService = new LegacySMSService();
export const productionSmsService = new LegacyProductionSMSService();

// Export the actual ClickSend service as well for direct access
export { clickSendSmsService } from './clickSendSmsService';
export { enhancedClickSendSmsService } from './enhancedClickSendSmsService';

// Default export is the ClickSend service
export default clickSendSmsService;

// Deprecation warning
console.warn(`
⚠️  DEPRECATION NOTICE: smsService.ts is deprecated
📱 All SMS functionality now uses ClickSend exclusively
🔄 Please migrate to: import { clickSendSmsService } from './clickSendSmsService'
✅ Your provided ClickSend credentials are active: mobil3801beach@gmail.com
`);
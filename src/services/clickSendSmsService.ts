// ClickSend SMS Service Integration
// Using the ClickSend API for sending SMS messages with provided credentials

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

class ClickSendSMSService {
  private config: ClickSendConfig | null = null;
  private isConfigured: boolean = false;
  private testNumbers: string[] = []; // Verified test numbers
  private apiBaseUrl = 'https://rest.clicksend.com/v3';

  constructor() {
    // Auto-configure with provided credentials
    this.initializeWithCredentials();
  }

  private async initializeWithCredentials() {
    try {
      await this.configure({
        username: 'mobil3801beach@gmail.com',
        apiKey: '54DC23E4-34D7-C6B1-0601-112E36A46B49',
        fromNumber: 'DFS',
        testMode: false,
        webhookUrl: undefined
      });
      console.log('ClickSend SMS service initialized with provided credentials');
    } catch (error) {
      console.error('Failed to initialize ClickSend with provided credentials:', error);
    }
  }

  async configure(config: ClickSendConfig) {
    this.config = config;
    this.isConfigured = true;

    // Validate ClickSend credentials
    try {
      await this.validateCredentials();
      console.log('ClickSend SMS service configured successfully');
    } catch (error) {
      console.error('Failed to configure ClickSend:', error);
      this.isConfigured = false;
      throw error;
    }
  }

  async loadConfiguration(): Promise<void> {
    // Always use the provided credentials first
    if (!this.isConfigured) {
      await this.initializeWithCredentials();
    }

    // Load configuration from the correct table (24201)
    try {
      const { data, error } = await window.ezsite.apis.tablePage(24201, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'is_enabled', op: 'Equal', value: true }]
      });

      if (!error && data?.List && data.List.length > 0) {
        const config = data.List[0];
        // Override with database config if available, but keep the provided credentials
        await this.configure({
          username: config.username || 'mobil3801beach@gmail.com',
          apiKey: config.api_key || '54DC23E4-34D7-C6B1-0601-112E36A46B49',
          fromNumber: config.from_number || 'DFS',
          testMode: config.test_mode || false,
          webhookUrl: config.webhook_url
        });
      }
    } catch (error) {
      console.error('Error loading SMS configuration:', error);
      // Continue with the provided credentials if database config fails
    }
  }

  private async validateCredentials(): Promise<boolean> {
    if (!this.config) return false;

    try {
      // Test ClickSend API connection
      const response = await this.makeClickSendRequest('GET', '/account');
      return response.success;
    } catch (error) {
      console.error('ClickSend credential validation failed:', error);
      return false;
    }
  }

  private async makeClickSendRequest(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.config) {
      throw new Error('SMS service not configured');
    }

    const url = `${this.apiBaseUrl}${endpoint}`;
    const credentials = btoa(`${this.config.username}:${this.config.apiKey}`);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.response_msg || result.error_message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('ClickSend API request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!this.isConfigured || !this.config) {
      return {
        success: false,
        error: 'SMS service not configured. Please configure ClickSend settings.'
      };
    }

    // Validate phone number format
    if (!this.isValidPhoneNumber(message.to)) {
      return {
        success: false,
        error: 'Invalid phone number format. Use E.164 format (+1234567890)'
      };
    }

    // Check test mode restrictions
    if (this.config.testMode && !this.testNumbers.includes(message.to)) {
      return {
        success: false,
        error: 'Test mode is enabled. Phone number must be verified for testing.'
      };
    }

    try {
      // Check daily limits
      await this.checkDailyLimit();

      // Process template if templateId is provided
      let finalMessage = message.message;
      if (message.templateId) {
        finalMessage = await this.processTemplate(message.templateId, message.placeholders || {});
      }

      // Send SMS via ClickSend using the provided API format
      const response = await this.sendToClickSend({
        to: message.to,
        message: finalMessage,
        type: message.type
      });

      // Log to SMS history (correct table 24202)
      await this.logSMSHistory({
        recipient_phone: message.to,
        message_content: finalMessage,
        status: response.success ? 'Sent' : 'Failed',
        sent_at: new Date().toISOString(),
        sms_provider_id: response.clickSendMessageId,
        error_message: response.error,
        cost: response.cost || 0
      });

      // Update daily count
      if (response.success) {
        await this.updateDailyCount();
      }

      return response;
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async sendToClickSend(message: SMSMessage): Promise<SMSResponse> {
    try {
      // Create ClickSend API object as per ClickSend API documentation
      const smsMessage = {
        source: this.config?.fromNumber || 'DFS',
        to: message.to,
        body: message.message
      };

      const smsCollection = {
        messages: [smsMessage]
      };

      console.log('Sending to ClickSend:', smsCollection);

      const response = await this.makeClickSendRequest('POST', '/sms/send', smsCollection);

      if (response.success && response.data?.data?.messages?.[0]) {
        const messageResult = response.data.data.messages[0];

        return {
          success: messageResult.status === 'SUCCESS',
          messageId: messageResult.message_id,
          clickSendMessageId: messageResult.message_id,
          cost: parseFloat(messageResult.message_price) || 0,
          status: messageResult.status,
          error: messageResult.status !== 'SUCCESS' ? messageResult.custom_string : undefined
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to send SMS'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async processTemplate(templateId: number, placeholders: Record<string, string>): Promise<string> {
    try {
      const { data, error } = await window.ezsite.apis.tablePage('sms_templates', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'id', op: 'Equal', value: templateId }]
      });

      if (error) throw new Error(error);

      if (data?.List && data.List.length > 0) {
        let message = data.List[0].message_content;

        // Replace placeholders
        Object.entries(placeholders).forEach(([key, value]) => {
          message = message.replace(new RegExp(`{${key}}`, 'g'), value);
        });

        return message;
      }

      throw new Error('Template not found');
    } catch (error) {
      console.error('Error processing template:', error);
      throw error;
    }
  }

  private async checkDailyLimit(): Promise<void> {
    try {
      // Check configuration from correct table (24201)
      const { data, error } = await window.ezsite.apis.tablePage(24201, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'is_enabled', op: 'Equal', value: true }]
      });

      if (error) throw new Error(error);

      if (data?.List && data.List.length > 0) {
        const config = data.List[0];
        const today = new Date().toISOString().split('T')[0];

        // Count today's SMS messages from correct table (24202)
        const { data: historyData } = await window.ezsite.apis.tablePage(24202, {
          PageNo: 1,
          PageSize: 1,
          OrderByField: 'id',
          IsAsc: false,
          Filters: [
          { name: 'sent_at', op: 'StringStartsWith', value: today },
          { name: 'status', op: 'Equal', value: 'Sent' }]

        });

        const todayCount = historyData?.VirtualCount || 0;

        if (todayCount >= config.daily_limit) {
          throw new Error('Daily SMS limit exceeded. Please contact administrator or wait for tomorrow.');
        }
      }
    } catch (error) {
      console.error('Error checking daily limit:', error);
      throw error;
    }
  }

  private async updateDailyCount(): Promise<void> {


















































































































































































































































































































































































































































































































































































    // This is handled by counting records in the history table
    // No need for a separate counter field
  }private async logSMSHistory(historyData: any): Promise<void> {try {await window.ezsite.apis.tableCreate(24202, { ...historyData, sent_by_user_id: 1 // This should be the current user ID
        });} catch (error) {console.error('Error logging SMS history:', error);}}private isValidPhoneNumber(phoneNumber: string): boolean {// E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;return e164Regex.test(phoneNumber);}async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {const results = [];for (const message of messages) {try {const result = await this.sendSMS(message);results.push(result); // Add small delay between messages to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));} catch (error) {results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });}}return results;}async getDeliveryStatus(messageId: string): Promise<{status: string;delivered: boolean;}> {if (!this.isConfigured) {throw new Error('SMS service not configured');}try {const response = await this.makeClickSendRequest('GET', `/sms/history/${messageId}`);if (response.success && response.data) {const status = response.data.data.status;return { status: status, delivered: status === 'Delivered' };}return { status: 'unknown', delivered: false };} catch (error) {console.error('Error getting delivery status:', error);return { status: 'error', delivered: false };}}async testSMS(phoneNumber: string): Promise<SMSResponse> {const testMessage = { to: phoneNumber, message: `DFS Manager SMS Test - ${new Date().toLocaleString()}. If you receive this message, ClickSend SMS is working correctly with your provided credentials.`, type: 'test' };return this.sendSMS(testMessage);}async addTestNumber(phoneNumber: string): Promise<void> {if (this.isValidPhoneNumber(phoneNumber)) {this.testNumbers.push(phoneNumber);} else {throw new Error('Invalid phone number format');}}async removeTestNumber(phoneNumber: string): Promise<void> {this.testNumbers = this.testNumbers.filter((num) => num !== phoneNumber);}getTestNumbers(): string[] {return [...this.testNumbers];}async getDailyUsage(): Promise<{used: number;limit: number;percentage: number;}> {try {// Get configuration from correct table (24201)
      const { data, error } = await window.ezsite.apis.tablePage(24201, { PageNo: 1, PageSize: 1, OrderByField: 'id', IsAsc: false, Filters: [{ name: 'is_enabled', op: 'Equal', value: true }] });if (error) throw new Error(error);if (data?.List && data.List.length > 0) {const config = data.List[0];const today = new Date().toISOString().split('T')[0]; // Count today's SMS messages from correct table (24202)
        const { data: historyData } = await window.ezsite.apis.tablePage(24202, { PageNo: 1, PageSize: 1, OrderByField: 'id', IsAsc: false, Filters: [{ name: 'sent_at', op: 'StringStartsWith', value: today }, { name: 'status', op: 'Equal', value: 'Sent' }] });const used = historyData?.VirtualCount || 0;const limit = config.daily_limit;const percentage = used / limit * 100;return { used, limit, percentage };}return { used: 0, limit: 100, percentage: 0 };} catch (error) {console.error('Error getting daily usage:', error);return { used: 0, limit: 100, percentage: 0 };}}isServiceConfigured(): boolean {return this.isConfigured;}getConfiguration(): ClickSendConfig | null {return this.config;}async getServiceStatus(): Promise<{available: boolean;message: string;providers?: any;quota?: any;}> {try {if (!this.isConfigured) {return { available: false, message: 'SMS service not configured. Please configure ClickSend settings.' };}const accountResponse = await this.makeClickSendRequest('GET', '/account');const providers = [{ name: 'ClickSend', available: this.isConfigured && accountResponse.success }];const quota = { quotaRemaining: accountResponse.success ? accountResponse.data?.data?.balance || 0 : 0 };return { available: accountResponse.success, message: accountResponse.success ? 'ClickSend SMS service is configured and ready' : 'ClickSend connection failed', providers, quota };} catch (error) {console.error('Error checking service status:', error);return { available: false, message: 'Error checking service status' };}}async sendSimpleSMS(phoneNumber: string, message: string, fromNumber?: string): Promise<SMSResponse> {const originalConfig = this.config;if (fromNumber && this.config) {this.config = { ...this.config, fromNumber };}try {const result = await this.sendSMS({ to: phoneNumber, message: message, type: 'custom' });return result;} finally {if (originalConfig) {this.config = originalConfig;}}}async getAvailableFromNumbers(): Promise<{number: string;provider: string;isActive: boolean;testMode: boolean;}[]> {try {// Get from correct table (24201)
      const { data, error } = await window.ezsite.apis.tablePage(24201, { PageNo: 1, PageSize: 10, OrderByField: 'id', IsAsc: false, Filters: [] });if (error) throw new Error(error);return (data?.List || []).map((provider: any) => ({ number: provider.from_number || 'DFS', provider: 'ClickSend', isActive: provider.is_enabled, testMode: provider.test_mode || false }));} catch (error) {console.error('Error getting available from numbers:', error);return [{ number: 'DFS', provider: 'ClickSend', isActive: true, testMode: false }];}}async sendCustomSMS(phoneNumber: string, message: string, fromNumber: string): Promise<SMSResponse> {return this.sendSimpleSMS(phoneNumber, message, fromNumber);}async getAccountBalance(): Promise<number> {try {const response = await this.makeClickSendRequest('GET', '/account');if (response.success && response.data) {return response.data.data.balance || 0;}return 0;} catch (error) {console.error('Error getting account balance:', error);return 0;}}}export const clickSendSmsService = new ClickSendSMSService(); // Enhanced SMS Service with production features
class ProductionClickSendSMSService extends ClickSendSMSService {async loadEnvironmentConfig(): Promise<void> {try {// Always use the provided credentials as primary
      const envConfig = { username: 'mobil3801beach@gmail.com', apiKey: '54DC23E4-34D7-C6B1-0601-112E36A46B49', fromNumber: 'DFS', testMode: import.meta.env.VITE_SMS_TEST_MODE === 'true' || false, webhookUrl: import.meta.env.VITE_SMS_WEBHOOK_URL };await this.configure(envConfig);console.log('ClickSend SMS service configured with provided credentials');} catch (error) {console.error('Error loading SMS configuration:', error);throw error;}}async initializeForProduction(): Promise<void> {try {await this.loadEnvironmentConfig();console.log('Production ClickSend SMS service initialized with your credentials');} catch (error) {console.error('Failed to initialize production SMS service:', error);throw error;}}}export const productionClickSendSmsService = new ProductionClickSendSMSService(); // Export for backward compatibility and as the main SMS service
export const smsService = clickSendSmsService;export const productionSmsService = productionClickSendSmsService;export default clickSendSmsService;
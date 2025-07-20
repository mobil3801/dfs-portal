// License Alert Service for automated SMS notifications
import { smsService } from './smsService';

interface License {
  id: number;
  license_name: string;
  license_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  station: string;
  category: string;
  status: string;
  document_file_id: number;
  created_by: number;
}

interface SMSAlertSetting {
  id: number;
  setting_name: string;
  days_before_expiry: number;
  alert_frequency_days: number;
  is_active: boolean;
  message_template: string;
  created_by: number;
}

interface SMSContact {
  id: number;
  contact_name: string;
  mobile_number: string;
  station: string;
  is_active: boolean;
  contact_role: string;
  created_by: number;
}

class LicenseAlertService {
  /**
   * Check for licenses that need alerts and send SMS notifications
   */
  async checkAndSendAlerts(): Promise<void> {
    try {
      console.log('🔍 Checking for licenses requiring alerts...');

      // Get all active alert settings
      const { data: settingsData, error: settingsError } = await window.ezsite.apis.tablePage('12611', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (settingsError) {
        console.error('Error loading SMS settings:', settingsError);
        return;
      }

      const settings: SMSAlertSetting[] = settingsData.List || [];
      if (settings.length === 0) {
        console.log('No active SMS alert settings found');
        return;
      }

      // Get all active licenses
      const { data: licensesData, error: licensesError } = await window.ezsite.apis.tablePage('11731', {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'expiry_date',
        IsAsc: true,
        Filters: [
        { name: 'status', op: 'Equal', value: 'Active' }]

      });

      if (licensesError) {
        console.error('Error loading licenses:', licensesError);
        return;
      }

      const licenses: License[] = licensesData.List || [];
      console.log(`Found ${licenses.length} active licenses to check`);

      // Get all active SMS contacts
      const { data: contactsData, error: contactsError } = await window.ezsite.apis.tablePage('12612', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (contactsError) {
        console.error('Error loading SMS contacts:', contactsError);
        return;
      }

      const contacts: SMSContact[] = contactsData.List || [];
      if (contacts.length === 0) {
        console.log('No active SMS contacts found');
        return;
      }

      const today = new Date();
      let alertsSent = 0;

      // Check each license against each setting
      for (const license of licenses) {
        const expiryDate = new Date(license.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`📋 Checking license: ${license.license_name} (expires in ${daysUntilExpiry} days)`);

        for (const setting of settings) {
          // Check if license needs alert based on this setting
          if (daysUntilExpiry <= setting.days_before_expiry && daysUntilExpiry > 0) {
            // Check if we should send alert based on frequency
            const shouldSendAlert = await this.shouldSendAlert(
              license.id,
              setting.id,
              setting.alert_frequency_days
            );

            if (shouldSendAlert) {
              console.log(`⚠️ License ${license.license_name} needs alert (${daysUntilExpiry} days remaining)`);

              // Get relevant contacts for this license
              const relevantContacts = this.getRelevantContacts(contacts, license.station);

              // Send alerts
              for (const contact of relevantContacts) {
                await this.sendLicenseAlert(license, contact, setting, daysUntilExpiry);
                alertsSent++;
              }
            }
          }
        }
      }

      console.log(`✅ License alert check completed. ${alertsSent} alerts sent.`);
    } catch (error) {
      console.error('Error in license alert service:', error);
    }
  }

  /**
   * Check if we should send an alert based on frequency settings
   */
  private async shouldSendAlert(
  licenseId: number,
  settingId: number,
  frequencyDays: number)
  : Promise<boolean> {
    try {
      // Get the last alert sent for this license/setting combination
      const { data, error } = await window.ezsite.apis.tablePage('12613', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'sent_date',
        IsAsc: false,
        Filters: [
        { name: 'license_id', op: 'Equal', value: licenseId }]

      });

      if (error) {
        console.error('Error checking alert history:', error);
        return true; // Send alert if we can't check history
      }

      const history = data.List || [];
      if (history.length === 0) {
        return true; // No previous alerts, send one
      }

      // Check if enough time has passed since last alert
      const lastAlert = new Date(history[0].sent_date);
      const today = new Date();
      const daysSinceLastAlert = Math.ceil((today.getTime() - lastAlert.getTime()) / (1000 * 60 * 60 * 24));

      return daysSinceLastAlert >= frequencyDays;
    } catch (error) {
      console.error('Error checking alert frequency:', error);
      return true; // Send alert if error occurs
    }
  }

  /**
   * Get contacts relevant to a specific station
   */
  private getRelevantContacts(contacts: SMSContact[], station: string): SMSContact[] {
    return contacts.filter((contact) =>
    contact.station === 'ALL' || contact.station === station
    );
  }

  /**
   * Send SMS alert for a specific license
   */
  private async sendLicenseAlert(
  license: License,
  contact: SMSContact,
  setting: SMSAlertSetting,
  daysUntilExpiry: number)
  : Promise<void> {
    try {
      // Create message from template
      const message = this.createMessageFromTemplate(
        setting.message_template,
        license,
        daysUntilExpiry
      );

      console.log(`📱 Sending license alert to ${contact.contact_name} (${contact.mobile_number})`);

      // Send SMS
      const smsResult = await smsService.sendSMS({
        to: contact.mobile_number,
        message: message,
        type: 'license_alert'
      });

      // Record in history
      await window.ezsite.apis.tableCreate('12613', {
        license_id: license.id,
        contact_id: contact.id,
        mobile_number: contact.mobile_number,
        message_content: message,
        sent_date: new Date().toISOString(),
        delivery_status: smsResult.success ? 'Sent' : `Failed - ${smsResult.error}`,
        days_before_expiry: daysUntilExpiry,
        created_by: 1 // System generated
      });

      if (smsResult.success) {
        console.log(`✅ License alert sent successfully to ${contact.contact_name}`);
      } else {
        console.error(`❌ License alert failed to ${contact.contact_name}:`, smsResult.error);
      }
    } catch (error) {
      console.error(`Error sending license alert to ${contact.contact_name}:`, error);
    }
  }

  /**
   * Create SMS message from template
   */
  private createMessageFromTemplate(
  template: string,
  license: License,
  daysUntilExpiry: number)
  : string {
    const expiryDate = new Date(license.expiry_date).toLocaleDateString();

    return template.
    replace(/{license_name}/g, license.license_name).
    replace(/{station}/g, license.station).
    replace(/{expiry_date}/g, expiryDate).
    replace(/{days_remaining}/g, daysUntilExpiry.toString()).
    replace(/{license_number}/g, license.license_number).
    replace(/{category}/g, license.category);
  }

  /**
   * Send immediate alert for a specific license (manual trigger)
   */
  async sendImmediateAlert(licenseId: number): Promise<{success: boolean;message: string;}> {
    try {
      // Get license details using ID field
      const { data: licenseData, error: licenseError } = await window.ezsite.apis.tablePage('11731', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
        { name: 'ID', op: 'Equal', value: licenseId }]

      });

      if (licenseError || !licenseData.List || licenseData.List.length === 0) {
        return { success: false, message: 'License not found' };
      }

      const license: any = licenseData.List[0]; // Use any to handle ID field mismatch
      const expiryDate = new Date(license.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Get active contacts
      const { data: contactsData, error: contactsError } = await window.ezsite.apis.tablePage('12612', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (contactsError) {
        return { success: false, message: 'Failed to load contacts' };
      }

      const contacts: SMSContact[] = contactsData.List || [];
      const relevantContacts = this.getRelevantContacts(contacts, license.station);

      if (relevantContacts.length === 0) {
        return { success: false, message: 'No active contacts found for this station' };
      }

      // Use default alert setting
      const defaultTemplate = `🚨 URGENT: License '${license.license_name}' for ${license.station} expires in ${daysUntilExpiry} days (${expiryDate.toLocaleDateString()}). Please renew immediately!`;

      let successCount = 0;
      for (const contact of relevantContacts) {
        const smsResult = await smsService.sendSMS({
          to: contact.mobile_number,
          message: defaultTemplate,
          type: 'immediate_alert'
        });

        await window.ezsite.apis.tableCreate('12613', {
          license_id: license.ID, // Use the actual ID field
          contact_id: contact.id,
          mobile_number: contact.mobile_number,
          message_content: defaultTemplate,
          sent_date: new Date().toISOString(),
          delivery_status: smsResult.success ? 'Sent' : `Failed - ${smsResult.error}`,
          days_before_expiry: daysUntilExpiry,
          created_by: 1
        });

        if (smsResult.success) {
          successCount++;
        }
      }

      return {
        success: successCount > 0,
        message: `Alert sent to ${successCount}/${relevantContacts.length} contacts`
      };
    } catch (error) {
      console.error('Error sending immediate alert:', error);
      return { success: false, message: 'Failed to send alert' };
    }
  }
}

// Create singleton instance
const licenseAlertService = new LicenseAlertService();

export default licenseAlertService;
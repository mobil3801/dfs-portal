
/**
 * Draft saving utility functions for form data
 * Handles temporary storage with 12-hour expiration
 */

interface DraftData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const DRAFT_EXPIRY_HOURS = 12;
const DRAFT_KEY_PREFIX = 'sales_report_draft_';

export class DraftSavingService {
  private static getDraftKey(stationName: string, reportDate: string): string {
    const sanitizedStation = stationName.replace(/\s+/g, '_').toLowerCase();
    const sanitizedDate = reportDate.replace(/[^0-9-]/g, '');
    return `${DRAFT_KEY_PREFIX}${sanitizedStation}_${sanitizedDate}`;
  }

  /**
   * Save form data as draft with 12-hour expiration
   */
  static saveDraft(stationName: string, reportDate: string, formData: any): boolean {
    try {
      const key = this.getDraftKey(stationName, reportDate);
      const timestamp = Date.now();
      const expiresAt = timestamp + DRAFT_EXPIRY_HOURS * 60 * 60 * 1000; // 12 hours from now

      const draftData: DraftData = {
        data: formData,
        timestamp,
        expiresAt
      };

      localStorage.setItem(key, JSON.stringify(draftData));

      console.log(`✅ Draft saved successfully for ${stationName} on ${reportDate}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      return false;
    }
  }

  /**
   * Load draft data if it exists and hasn't expired
   */
  static loadDraft(stationName: string, reportDate: string): any | null {
    try {
      const key = this.getDraftKey(stationName, reportDate);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const draftData: DraftData = JSON.parse(stored);
      const now = Date.now();

      // Check if draft has expired
      if (now > draftData.expiresAt) {
        console.log(`⏰ Draft expired for ${stationName} on ${reportDate}, removing...`);
        this.deleteDraft(stationName, reportDate);
        return null;
      }

      console.log(`✅ Draft loaded for ${stationName} on ${reportDate}`);
      return draftData.data;
    } catch (error) {
      console.error('❌ Error loading draft:', error);
      return null;
    }
  }

  /**
   * Delete draft data
   */
  static deleteDraft(stationName: string, reportDate: string): void {
    try {
      const key = this.getDraftKey(stationName, reportDate);
      localStorage.removeItem(key);
      console.log(`🗑️ Draft deleted for ${stationName} on ${reportDate}`);
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
    }
  }

  /**
   * Check if draft exists and hasn't expired
   */
  static hasDraft(stationName: string, reportDate: string): boolean {
    try {
      const key = this.getDraftKey(stationName, reportDate);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return false;
      }

      const draftData: DraftData = JSON.parse(stored);
      const now = Date.now();

      return now <= draftData.expiresAt;
    } catch (error) {
      console.error('❌ Error checking draft:', error);
      return false;
    }
  }

  /**
   * Get draft info (timestamp, time remaining)
   */
  static getDraftInfo(stationName: string, reportDate: string): {
    savedAt: Date;
    expiresAt: Date;
    timeRemainingHours: number;
  } | null {
    try {
      const key = this.getDraftKey(stationName, reportDate);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const draftData: DraftData = JSON.parse(stored);
      const now = Date.now();

      if (now > draftData.expiresAt) {
        return null;
      }

      const timeRemainingMs = draftData.expiresAt - now;
      const timeRemainingHours = timeRemainingMs / (60 * 60 * 1000);

      return {
        savedAt: new Date(draftData.timestamp),
        expiresAt: new Date(draftData.expiresAt),
        timeRemainingHours
      };
    } catch (error) {
      console.error('❌ Error getting draft info:', error);
      return null;
    }
  }

  /**
   * Clean up all expired drafts
   */
  static cleanupExpiredDrafts(): number {
    let cleanedCount = 0;

    try {
      const keys = Object.keys(localStorage);
      const draftKeys = keys.filter((key) => key.startsWith(DRAFT_KEY_PREFIX));
      const now = Date.now();

      for (const key of draftKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draftData: DraftData = JSON.parse(stored);
            if (now > draftData.expiresAt) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // If we can't parse the data, remove it
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired drafts`);
      }
    } catch (error) {
      console.error('❌ Error during draft cleanup:', error);
    }

    return cleanedCount;
  }

  /**
   * Get all available drafts
   */
  static getAllDrafts(): Array<{
    station: string;
    reportDate: string;
    savedAt: Date;
    expiresAt: Date;
    timeRemainingHours: number;
  }> {
    try {
      const keys = Object.keys(localStorage);
      const draftKeys = keys.filter((key) => key.startsWith(DRAFT_KEY_PREFIX));
      const now = Date.now();
      const drafts = [];

      for (const key of draftKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draftData: DraftData = JSON.parse(stored);

            // Skip expired drafts
            if (now > draftData.expiresAt) {
              continue;
            }

            // Parse station and date from key
            const keyParts = key.replace(DRAFT_KEY_PREFIX, '').split('_');
            const reportDate = keyParts.pop() || '';
            const station = keyParts.join(' ').toUpperCase();

            const timeRemainingMs = draftData.expiresAt - now;
            const timeRemainingHours = timeRemainingMs / (60 * 60 * 1000);

            drafts.push({
              station,
              reportDate,
              savedAt: new Date(draftData.timestamp),
              expiresAt: new Date(draftData.expiresAt),
              timeRemainingHours
            });
          }
        } catch (error) {
          console.error('Error parsing draft:', error);
        }
      }

      return drafts.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
    } catch (error) {
      console.error('❌ Error getting all drafts:', error);
      return [];
    }
  }
}

export default DraftSavingService;
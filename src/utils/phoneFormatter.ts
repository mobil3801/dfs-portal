// Utility function to format phone numbers consistently
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // If the number is empty after cleaning, return empty string
  if (!cleaned) return '';

  // If it's a 10-digit number, format as +1 (###) ###-####
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // If it's an 11-digit number starting with 1, format as +1 (###) ###-####
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const withoutCountryCode = cleaned.slice(1);
    return `+1 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
  }

  // If it's a different length, try to format it as best as possible
  if (cleaned.length > 10) {
    // For longer numbers, assume first digit is country code
    const withoutCountryCode = cleaned.slice(1);
    if (withoutCountryCode.length === 10) {
      return `+1 (${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
    }
  }

  // For shorter numbers or unusual formats, add +1 prefix and format as much as possible
  if (cleaned.length >= 7 && cleaned.length < 10) {
    if (cleaned.length === 7) {
      return `+1 (###) ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length === 8) {
      return `+1 (###) ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length === 9) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  }

  // If number is too short or in an unrecognized format, just add +1 prefix
  return `+1 ${cleaned}`;
};

// Helper function to format phone for display in tables and forms
export const displayPhoneNumber = (phoneNumber: string): string => {
  const formatted = formatPhoneNumber(phoneNumber);
  return formatted || phoneNumber; // Return original if formatting fails
};

// Helper function to validate phone number format
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) return false;

  const cleaned = phoneNumber.replace(/\D/g, '');

  // Accept 10-digit numbers (US format without country code)
  // Accept 11-digit numbers starting with 1 (US format with country code)
  return cleaned.length === 10 || cleaned.length === 11 && cleaned.startsWith('1');
};

// Helper function to get clean phone number for storage
export const getCleanPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';

  const cleaned = phoneNumber.replace(/\D/g, '');

  // If it's 11 digits starting with 1, keep as is
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned;
  }

  // If it's 10 digits, add country code
  if (cleaned.length === 10) {
    return `1${cleaned}`;
  }

  // Otherwise return as is
  return cleaned;
};
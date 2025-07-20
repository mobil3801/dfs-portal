import { startOfWeek, endOfWeek, addDays, format, isValid, parseISO } from 'date-fns';

/**
 * Pay Period Utilities
 * Handles weekly pay periods that start on Sunday and end on Saturday
 * Pay date is set to the following Sunday after the pay period ends
 */

export interface PayPeriod {
  startDate: Date;
  endDate: Date;
  payDate: Date;
}

/**
 * Get the current pay period based on today's date
 * Pay period: Sunday to Saturday
 * Pay date: Following Sunday after period ends
 */
export const getCurrentPayPeriod = (): PayPeriod => {
  const today = new Date();
  return getPayPeriodForDate(today);
};

/**
 * Get the pay period for a specific date
 * @param date - The date to calculate the pay period for
 */
export const getPayPeriodForDate = (date: Date): PayPeriod => {
  // Get Sunday of the current week (start of pay period)
  const startDate = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday

  // Get Saturday of the current week (end of pay period)
  const endDate = endOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday

  // Pay date is the following Sunday after the pay period ends
  const payDate = addDays(endDate, 1); // Add 1 day to Saturday to get Sunday

  return {
    startDate,
    endDate,
    payDate
  };
};

/**
 * Get the previous pay period
 */
export const getPreviousPayPeriod = (): PayPeriod => {
  const today = new Date();
  const lastWeek = addDays(today, -7);
  return getPayPeriodForDate(lastWeek);
};

/**
 * Get the next pay period
 */
export const getNextPayPeriod = (): PayPeriod => {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  return getPayPeriodForDate(nextWeek);
};

/**
 * Calculate pay date based on pay period end date
 * @param payPeriodEndDate - The end date of the pay period
 */
export const calculatePayDate = (payPeriodEndDate: string | Date): Date => {
  let endDate: Date;

  if (typeof payPeriodEndDate === 'string') {
    endDate = parseISO(payPeriodEndDate);
  } else {
    endDate = payPeriodEndDate;
  }

  if (!isValid(endDate)) {
    throw new Error('Invalid pay period end date');
  }

  // Pay date is the following Sunday after the pay period ends
  return addDays(endDate, 1);
};

/**
 * Validate that a pay period follows the Sunday-Saturday format
 * @param startDate - Pay period start date
 * @param endDate - Pay period end date
 */
export const validatePayPeriod = (startDate: string | Date, endDate: string | Date): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  let start: Date, end: Date;

  try {
    start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  } catch {
    return {
      isValid: false,
      errors: ['Invalid date format']
    };
  }

  if (!isValid(start) || !isValid(end)) {
    errors.push('Invalid date values');
  }

  // Check if start date is Sunday (day 0)
  if (start.getDay() !== 0) {
    errors.push('Pay period must start on Sunday');
  }

  // Check if end date is Saturday (day 6)
  if (end.getDay() !== 6) {
    errors.push('Pay period must end on Saturday');
  }

  // Check if period is exactly 7 days
  const diffTime = end.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays !== 6) {
    errors.push('Pay period must be exactly 7 days (Sunday to Saturday)');
  }

  // Check if start date is before end date
  if (start >= end) {
    errors.push('Start date must be before end date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format pay period for display
 * @param payPeriod - The pay period to format
 */
export const formatPayPeriod = (payPeriod: PayPeriod): string => {
  const startStr = format(payPeriod.startDate, 'MMM dd, yyyy');
  const endStr = format(payPeriod.endDate, 'MMM dd, yyyy');
  const payStr = format(payPeriod.payDate, 'MMM dd, yyyy');

  return `${startStr} - ${endStr} (Pay: ${payStr})`;
};

/**
 * Get formatted date string for HTML date inputs
 * @param date - The date to format
 */
export const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Generate pay period options for select dropdown
 * @param weeksBack - Number of weeks to go back from current week
 * @param weeksForward - Number of weeks to go forward from current week
 */
export const generatePayPeriodOptions = (weeksBack: number = 4, weeksForward: number = 4) => {
  const options: Array<{
    value: string;
    label: string;
    payPeriod: PayPeriod;
  }> = [];

  const today = new Date();

  // Generate past weeks
  for (let i = weeksBack; i > 0; i--) {
    const date = addDays(today, -7 * i);
    const payPeriod = getPayPeriodForDate(date);
    options.push({
      value: formatDateForInput(payPeriod.startDate),
      label: formatPayPeriod(payPeriod),
      payPeriod
    });
  }

  // Current week
  const currentPayPeriod = getCurrentPayPeriod();
  options.push({
    value: formatDateForInput(currentPayPeriod.startDate),
    label: `Current: ${formatPayPeriod(currentPayPeriod)}`,
    payPeriod: currentPayPeriod
  });

  // Generate future weeks
  for (let i = 1; i <= weeksForward; i++) {
    const date = addDays(today, 7 * i);
    const payPeriod = getPayPeriodForDate(date);
    options.push({
      value: formatDateForInput(payPeriod.startDate),
      label: formatPayPeriod(payPeriod),
      payPeriod
    });
  }

  return options;
};

/**
 * Auto-adjust dates to proper pay period when user selects a start date
 * @param selectedStartDate - The date selected by the user
 */
export const adjustToPayPeriod = (selectedStartDate: string | Date): PayPeriod => {
  const date = typeof selectedStartDate === 'string' ? parseISO(selectedStartDate) : selectedStartDate;

  if (!isValid(date)) {
    return getCurrentPayPeriod();
  }

  return getPayPeriodForDate(date);
};
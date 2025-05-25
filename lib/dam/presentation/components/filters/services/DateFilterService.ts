import { format, isValid, parseISO } from 'date-fns';

/**
 * DateFilterService
 * Follows Single Responsibility Principle - handles date filtering logic and validation
 */
export class DateFilterService {
  static readonly DATE_OPTIONS = [
    { value: '', label: 'Anytime' },
    { value: 'today', label: 'Today' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'thisYear', label: 'This year' },
    { value: 'lastYear', label: 'Last year' },
  ];

  static readonly CUSTOM_RANGE_VALUE = 'custom';

  /**
   * Generate button label based on selected option and dates
   */
  static generateButtonLabel(
    selectedOption: string | undefined,
    selectedStartDate?: string,
    selectedEndDate?: string
  ): string {
    if (selectedOption === this.CUSTOM_RANGE_VALUE) {
      return this.generateCustomRangeLabel(selectedStartDate, selectedEndDate);
    }
    
    return this.DATE_OPTIONS.find(opt => opt.value === (selectedOption || ''))?.label || 'Anytime';
  }

  /**
   * Generate label for custom date range
   */
  private static generateCustomRangeLabel(
    selectedStartDate?: string,
    selectedEndDate?: string
  ): string {
    const hasValidStart = selectedStartDate && isValid(parseISO(selectedStartDate));
    const hasValidEnd = selectedEndDate && isValid(parseISO(selectedEndDate));

    if (hasValidStart && hasValidEnd) {
      return `${format(parseISO(selectedStartDate!), 'MMM d, yy')} - ${format(parseISO(selectedEndDate!), 'MMM d, yy')}`;
    }
    
    if (hasValidStart) {
      return `After ${format(parseISO(selectedStartDate!), 'MMM d, yy')}`;
    }
    
    if (hasValidEnd) {
      return `Before ${format(parseISO(selectedEndDate!), 'MMM d, yy')}`;
    }
    
    return 'Custom Range';
  }

  /**
   * Format date for display
   */
  static formatDateForDisplay(date: Date): string {
    return format(date, 'MMM d, yyyy');
  }

  /**
   * Format date for API
   */
  static formatDateForApi(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * Parse date string safely
   */
  static parseDate(dateString: string): Date | undefined {
    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate?: Date, endDate?: Date): {
    isValid: boolean;
    error?: string;
  } {
    if (!startDate && !endDate) {
      return { isValid: true };
    }

    if (startDate && endDate && startDate > endDate) {
      return { 
        isValid: false, 
        error: 'Start date must be before end date' 
      };
    }

    return { isValid: true };
  }
} 

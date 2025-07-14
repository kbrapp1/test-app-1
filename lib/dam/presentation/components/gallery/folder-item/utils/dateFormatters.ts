/**
 * Date formatting utilities for folder items
 * 
 * Single Responsibility: Date formatting and relative time display
 */
export class DateFormatters {
  /**
   * Formats a date as relative time (Today, Yesterday, X days ago, etc.)
   * @param date - Date to format (Date object or string)
   * @returns Formatted relative time string
   */
  static formatRelativeDate(date: Date | string): string {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Unknown date';
    }
  }

  /**
   * Formats a date as absolute date string
   * @param date - Date to format
   * @returns Formatted absolute date string
   */
  static formatAbsoluteDate(date: Date | string): string {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
} 
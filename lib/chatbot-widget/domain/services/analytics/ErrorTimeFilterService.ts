/**
 * Error Time Filter Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for time-based filtering logic
 * - Contains business rules for time calculations
 * - No external dependencies
 * - Encapsulates time interval business logic
 */

export class ErrorTimeFilterService {
  /**
   * Get time filter for database queries based on time range
   */
  public getTimeFilter(timeRange: string): string {
    const now = new Date();
    const hours = this.getHoursForTimeRange(timeRange);
    return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  }

  /**
   * Get appropriate interval for trend analysis
   */
  public getIntervalForTimeRange(timeRange: string): string {
    const intervalMap: Record<string, string> = {
      '1h': '5 minutes',
      '24h': '1 hour',
      '7d': '1 day',
      '30d': '1 day'
    };

    return intervalMap[timeRange] || '1 hour';
  }

  /**
   * Truncate timestamp to specified interval
   */
  public truncateToInterval(timestamp: string, interval: string): string {
    const date = new Date(timestamp);
    
    switch (interval) {
      case '5 minutes':
        date.setMinutes(Math.floor(date.getMinutes() / 5) * 5, 0, 0);
        break;
      case '1 hour':
        date.setMinutes(0, 0, 0);
        break;
      case '1 day':
        date.setHours(0, 0, 0, 0);
        break;
      default:
        date.setHours(0, 0, 0, 0);
    }

    return date.toISOString();
  }

  /**
   * Validate if time range is supported
   */
  public isValidTimeRange(timeRange: string): boolean {
    const validRanges = ['1h', '24h', '7d', '30d'];
    return validRanges.includes(timeRange);
  }

  /**
   * Get human-readable description of time range
   */
  public getTimeRangeDescription(timeRange: string): string {
    const descriptions: Record<string, string> = {
      '1h': 'Last hour',
      '24h': 'Last 24 hours',
      '7d': 'Last 7 days',
      '30d': 'Last 30 days'
    };

    return descriptions[timeRange] || 'Unknown time range';
  }

  private getHoursForTimeRange(timeRange: string): number {
    const hours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[timeRange];

    if (hours === undefined) {
      throw new Error(`Invalid time range: ${timeRange}`);
    }

    return hours;
  }
}
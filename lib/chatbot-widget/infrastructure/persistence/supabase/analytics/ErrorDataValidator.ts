/**
 * Error Data Validator
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure service for data validation
 * - Validates and transforms raw database data
 * - Ensures type safety for domain objects
 * - Single responsibility: data validation only
 */

export interface ErrorRecord {
  error_code: string;
  error_message: string;
  error_category: string;
  severity: string;
  created_at: string;
}

export interface TrendRecord {
  created_at: string;
  error_category: string;
  severity: string;
}

export class ErrorDataValidator {
  /**
   * Validate and transform error records from database
   */
  public validateErrorRecords(data: unknown[]): ErrorRecord[] {
    return data.filter(this.isValidErrorRecord).map(record => ({
      error_code: record.error_code,
      error_message: record.error_message,
      error_category: record.error_category,
      severity: record.severity,
      created_at: record.created_at
    }));
  }

  /**
   * Validate trend records from database
   */
  public validateTrendRecords(data: unknown[]): TrendRecord[] {
    return data.filter(this.isValidTrendRecord).map(record => ({
      created_at: record.created_at,
      error_category: record.error_category,
      severity: record.severity
    }));
  }

  /**
   * Check if record is a valid error record
   */
  private isValidErrorRecord(record: unknown): record is ErrorRecord {
    return (
      typeof record === 'object' &&
      record !== null &&
      'error_code' in record &&
      'error_message' in record &&
      'error_category' in record &&
      'severity' in record &&
      'created_at' in record &&
      typeof (record as ErrorRecord).error_code === 'string' &&
      typeof (record as ErrorRecord).error_message === 'string' &&
      typeof (record as ErrorRecord).error_category === 'string' &&
      typeof (record as ErrorRecord).severity === 'string' &&
      typeof (record as ErrorRecord).created_at === 'string'
    );
  }

  /**
   * Check if record is a valid trend record
   */
  private isValidTrendRecord(record: unknown): record is TrendRecord {
    if (typeof record !== 'object' || record === null) {
      return false;
    }
    
    const obj = record as Record<string, unknown>;
    return (
      'created_at' in obj &&
      'error_category' in obj &&
      'severity' in obj &&
      typeof obj.created_at === 'string' &&
      typeof obj.error_category === 'string' &&
      typeof obj.severity === 'string'
    );
  }
}
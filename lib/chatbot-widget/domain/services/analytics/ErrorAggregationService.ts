/**
 * Error Aggregation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for error aggregation logic
 * - Contains business rules for error counting and grouping
 * - No external dependencies
 * - Encapsulates aggregation business logic
 */

import { ErrorSummary, ErrorSummaryData } from '../../value-objects/analytics/ErrorSummary';
import { ErrorTrend, ErrorTrendData } from '../../value-objects/analytics/ErrorTrend';

export interface ErrorRecordWithTable {
  error_code: string;
  error_message: string;
  error_category: string;
  severity: string;
  created_at: string;
  tableName: string;
}

export interface TrendRecord {
  created_at: string;
  error_category: string;
  severity: string;
}

export class ErrorAggregationService {
  /**
   * Build error summary from error records
   */
  public buildErrorSummary(allErrors: ErrorRecordWithTable[]): ErrorSummary {
    if (allErrors.length === 0) {
      return ErrorSummary.createEmpty();
    }

    const errorsByCode: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByCategory: Record<string, number> = {};
    const errorsByTable: Record<string, number> = {};

    allErrors.forEach(error => {
      errorsByCode[error.error_code] = (errorsByCode[error.error_code] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      errorsByCategory[error.error_category] = (errorsByCategory[error.error_category] || 0) + 1;
      errorsByTable[error.tableName] = (errorsByTable[error.tableName] || 0) + 1;
    });

    const summaryData: ErrorSummaryData = {
      totalErrors: allErrors.length,
      errorsByCode,
      errorsBySeverity,
      errorsByCategory,
      errorsByTable,
      recentErrors: this.getRecentErrors(allErrors)
    };

    return ErrorSummary.create(summaryData);
  }

  /**
   * Build error trends from trend records
   */
  public buildErrorTrends(
    trendRecords: TrendRecord[], 
    timeFilterService: { truncateToInterval: (timestamp: string, interval: string) => string },
    interval: string
  ): ErrorTrend[] {
    if (trendRecords.length === 0) {
      return [];
    }

    // Group by time period, category, and severity
    const trends: Record<string, ErrorTrendData> = {};

    trendRecords.forEach(record => {
      const period = timeFilterService.truncateToInterval(record.created_at, interval);
      const key = `${period}-${record.error_category}-${record.severity}`;

      if (!trends[key]) {
        trends[key] = {
          period,
          errorCount: 0,
          severity: record.severity,
          category: record.error_category
        };
      }

      trends[key].errorCount++;
    });

    return Object.values(trends)
      .map(trendData => ErrorTrend.create(trendData))
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  }

  /**
   * Combine error records from multiple tables
   */
  public combineErrorRecords(
    conversationErrors: any[],
    knowledgeErrors: any[],
    systemErrors: any[]
  ): ErrorRecordWithTable[] {
    const allErrors: ErrorRecordWithTable[] = [
      ...conversationErrors.map(e => ({ ...e, tableName: 'conversation' as const })),
      ...knowledgeErrors.map(e => ({ ...e, tableName: 'knowledge' as const })),
      ...systemErrors.map(e => ({ ...e, tableName: 'system' as const }))
    ];

    // Sort by created_at descending (most recent first)
    return allErrors.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get most recent errors for summary
   */
  private getRecentErrors(allErrors: ErrorRecordWithTable[]): Array<{
    errorCode: string;
    errorMessage: string;
    errorCategory: string;
    severity: string;
    createdAt: string;
    tableName: string;
  }> {
    return allErrors.slice(0, 10).map(error => ({
      errorCode: error.error_code,
      errorMessage: error.error_message,
      errorCategory: error.error_category,
      severity: error.severity,
      createdAt: error.created_at,
      tableName: error.tableName
    }));
  }
}
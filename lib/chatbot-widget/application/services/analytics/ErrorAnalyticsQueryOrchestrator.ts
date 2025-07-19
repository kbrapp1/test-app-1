/**
 * Error Analytics Query Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - Application layer orchestration service
 * - Coordinates multi-table queries efficiently
 * - No business logic - pure coordination
 * - Delegates to domain services for aggregation
 */

import { ErrorAggregationService } from '../../../domain/services/analytics/ErrorAggregationService';
import { ErrorTimeFilterService } from '../../../domain/services/analytics/ErrorTimeFilterService';
import { ErrorAnalyticsFilter } from '../../../domain/value-objects/analytics/ErrorAnalyticsFilter';
import { ErrorSummary } from '../../../domain/value-objects/analytics/ErrorSummary';
import { ErrorTrend } from '../../../domain/value-objects/analytics/ErrorTrend';
import { ErrorAnalyticsSupabaseRepository } from '../../../infrastructure/persistence/supabase/analytics/ErrorAnalyticsSupabaseRepository';

export class ErrorAnalyticsQueryOrchestrator {
  private readonly aggregationService: ErrorAggregationService;
  private readonly timeFilterService: ErrorTimeFilterService;

  constructor(private readonly repository: ErrorAnalyticsSupabaseRepository) {
    this.aggregationService = new ErrorAggregationService();
    this.timeFilterService = new ErrorTimeFilterService();
  }

  /**
   * Orchestrate error summary query across all tables
   */
  async getErrorSummary(filter: ErrorAnalyticsFilter): Promise<ErrorSummary> {
    const timeFilter = this.timeFilterService.getTimeFilter(filter.timeRange);
    
    // Query all error tables in parallel
    const { conversationErrors, knowledgeErrors, systemErrors } = 
      await this.repository.queryAllErrorTables(filter, timeFilter);

    // Combine errors from all tables
    const allErrors = this.aggregationService.combineErrorRecords(
      conversationErrors,
      knowledgeErrors,
      systemErrors
    );

    // Build and return summary
    return this.aggregationService.buildErrorSummary(allErrors);
  }

  /**
   * Orchestrate error trends query across all tables
   */
  async getErrorTrends(filter: ErrorAnalyticsFilter): Promise<ErrorTrend[]> {
    const timeFilter = this.timeFilterService.getTimeFilter(filter.timeRange);
    const interval = this.timeFilterService.getIntervalForTimeRange(filter.timeRange);
    
    // Query trends from all error tables
    const { conversationTrends, knowledgeTrends, systemTrends } = 
      await this.repository.queryAllErrorTrends(filter, timeFilter);

    // Combine all trend records
    const allTrendRecords = [
      ...conversationTrends,
      ...knowledgeTrends,
      ...systemTrends
    ];

    // Build and return trends
    return this.aggregationService.buildErrorTrends(
      allTrendRecords,
      this.timeFilterService,
      interval
    );
  }
}
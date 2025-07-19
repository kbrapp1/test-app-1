/**
 * Error Analytics Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: provide error analytics and query operations
 * - Follow @golden-rule patterns exactly
 * - Keep under 100 lines
 * - Delegate to ErrorAnalyticsService for actual operations
 * - Maintain organizationId security requirements
 */

import { ErrorAnalyticsService, ErrorSummary, ErrorAnalyticsFilter } from './ErrorAnalyticsService';

export class ErrorAnalyticsQueryService {
  /**
   * AI INSTRUCTIONS:
   * - Coordinate error analytics queries
   * - Ensure organizationId is always included for security
   * - Provide clean API for error analytics operations
   * - Delegate to analytics service for actual implementation
   */

  constructor(
    private readonly analyticsService: ErrorAnalyticsService
  ) {}

  async getErrorSummary(organizationId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ErrorSummary> {
    const filter: ErrorAnalyticsFilter = { organizationId, timeRange };
    return this.analyticsService.getErrorSummary(filter);
  }

  async getErrorsBySession(sessionId: string, organizationId: string): Promise<ErrorSummary> {
    return this.analyticsService.getErrorsBySession(sessionId, organizationId);
  }

  async getErrorsByUser(userId: string, organizationId: string): Promise<ErrorSummary> {
    return this.analyticsService.getErrorsByUser(userId, organizationId);
  }

  async getErrorTrends(organizationId: string, timeRange: '7d' | '30d' = '30d'): Promise<ErrorSummary> {
    const filter: ErrorAnalyticsFilter = { organizationId, timeRange };
    return this.analyticsService.getErrorSummary(filter);
  }

  async getErrorsByCategory(organizationId: string, categories: string[], timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ErrorSummary> {
    const filter: ErrorAnalyticsFilter = { organizationId, timeRange, category: categories };
    return this.analyticsService.getErrorSummary(filter);
  }

  async getCriticalErrors(organizationId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ErrorSummary> {
    const filter: ErrorAnalyticsFilter = { organizationId, timeRange, severity: ['critical'] };
    return this.analyticsService.getErrorSummary(filter);
  }
}
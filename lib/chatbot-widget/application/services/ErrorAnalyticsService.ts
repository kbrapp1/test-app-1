/**
 * Error Analytics Service (Legacy Adapter)
 * 
 * AI INSTRUCTIONS:
 * - Maintains backward compatibility
 * - Delegates to new DDD-structured services
 * - Preserves existing API surface
 * - Single responsibility: API compatibility
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ErrorAnalyticsApplicationService } from './analytics/ErrorAnalyticsApplicationService';
import { ErrorAnalyticsFilterData } from '../../domain/value-objects/analytics/ErrorAnalyticsFilter';
import { ErrorSummaryData } from '../../domain/value-objects/analytics/ErrorSummary';
import { ErrorTrendData } from '../../domain/value-objects/analytics/ErrorTrend';

// Legacy interfaces for backward compatibility
export interface ErrorSummary extends ErrorSummaryData {}
export interface ErrorTrend extends ErrorTrendData {}
export interface ErrorAnalyticsFilter extends ErrorAnalyticsFilterData {}

export class ErrorAnalyticsService {
  private readonly applicationService: ErrorAnalyticsApplicationService;

  constructor(supabase: SupabaseClient) {
    this.applicationService = new ErrorAnalyticsApplicationService(supabase);
  }

  async getErrorSummary(filter: ErrorAnalyticsFilter): Promise<ErrorSummary> {
    const summary = await this.applicationService.getErrorSummary(filter);
    return summary.toData();
  }

  async getErrorTrends(filter: ErrorAnalyticsFilter): Promise<ErrorTrend[]> {
    const trends = await this.applicationService.getErrorTrends(filter);
    return trends.map(trend => trend.toData());
  }

  async getErrorsBySession(sessionId: string, organizationId: string): Promise<ErrorSummary> {
    const summary = await this.applicationService.getErrorsBySession(sessionId, organizationId);
    return summary.toData();
  }

  async getErrorsByUser(userId: string, organizationId: string): Promise<ErrorSummary> {
    const summary = await this.applicationService.getErrorsByUser(userId, organizationId);
    return summary.toData();
  }
} 
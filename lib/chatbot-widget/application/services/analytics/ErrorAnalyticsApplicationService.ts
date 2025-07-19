/**
 * Error Analytics Application Service
 * 
 * AI INSTRUCTIONS:
 * - Main application service for error analytics use cases
 * - Orchestrates domain services and repositories
 * - Provides clean API for presentation layer
 * - Maintains organization security throughout
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ErrorAnalyticsFilter, ErrorAnalyticsFilterData } from '../../../domain/value-objects/analytics/ErrorAnalyticsFilter';
import { ErrorSummary } from '../../../domain/value-objects/analytics/ErrorSummary';
import { ErrorTrend } from '../../../domain/value-objects/analytics/ErrorTrend';
import { ErrorAnalyticsSupabaseRepository } from '../../../infrastructure/persistence/supabase/analytics/ErrorAnalyticsSupabaseRepository';
import { ErrorAnalyticsQueryOrchestrator } from './ErrorAnalyticsQueryOrchestrator';

export class ErrorAnalyticsApplicationService {
  private readonly queryOrchestrator: ErrorAnalyticsQueryOrchestrator;

  constructor(supabase: SupabaseClient) {
    const repository = new ErrorAnalyticsSupabaseRepository(supabase);
    this.queryOrchestrator = new ErrorAnalyticsQueryOrchestrator(repository);
  }

  /**
   * Get comprehensive error summary for organization
   */
  async getErrorSummary(filterData: ErrorAnalyticsFilterData): Promise<ErrorSummary> {
    const filter = ErrorAnalyticsFilter.create(filterData);
    return this.queryOrchestrator.getErrorSummary(filter);
  }

  /**
   * Get error trends for organization
   */
  async getErrorTrends(filterData: ErrorAnalyticsFilterData): Promise<ErrorTrend[]> {
    const filter = ErrorAnalyticsFilter.create(filterData);
    return this.queryOrchestrator.getErrorTrends(filter);
  }

  /**
   * Get errors for specific session with organization security
   */
  async getErrorsBySession(sessionId: string, organizationId: string): Promise<ErrorSummary> {
    const filter = ErrorAnalyticsFilter.createForSession(sessionId, organizationId);
    return this.queryOrchestrator.getErrorSummary(filter);
  }

  /**
   * Get errors for specific user with organization security
   */
  async getErrorsByUser(userId: string, organizationId: string): Promise<ErrorSummary> {
    const filter = ErrorAnalyticsFilter.createForUser(userId, organizationId);
    return this.queryOrchestrator.getErrorSummary(filter);
  }
}
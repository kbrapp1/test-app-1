/**
 * Error Analytics Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for error analytics
 * - Single responsibility: query and analyze error data
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines
 * - Coordinate with infrastructure for data access
 * - No business logic - pure coordination
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface ErrorSummary {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsByTable: Record<string, number>;
  recentErrors: Array<{
    errorCode: string;
    errorMessage: string;
    errorCategory: string;
    severity: string;
    createdAt: string;
    tableName: string;
  }>;
}

export interface ErrorTrend {
  period: string;
  errorCount: number;
  severity: string;
  category: string;
}

export interface ErrorAnalyticsFilter {
  organizationId: string;
  timeRange: '1h' | '24h' | '7d' | '30d';
  severity?: string[];
  category?: string[];
  errorCode?: string[];
  sessionId?: string;
  userId?: string;
}

export class ErrorAnalyticsService {
  /**
   * AI INSTRUCTIONS:
   * - Coordinate error analytics queries
   * - Transform raw database results into domain objects
   * - Handle multiple table queries efficiently
   * - Provide rich analytics for monitoring
   */

  constructor(private readonly supabase: SupabaseClient) {}

  async getErrorSummary(filter: ErrorAnalyticsFilter): Promise<ErrorSummary> {
    const timeFilter = this.getTimeFilter(filter.timeRange);
    
    // Query all three error tables in parallel
    const [conversationErrors, knowledgeErrors, systemErrors] = await Promise.all([
      this.queryErrorTable('chatbot_conversation_errors', filter, timeFilter),
      this.queryErrorTable('chatbot_knowledge_errors', filter, timeFilter),
      this.queryErrorTable('chatbot_system_errors', filter, timeFilter)
    ]);

    // Combine all errors with table names
    const allErrors = [
      ...(conversationErrors || []).map(e => ({ ...e, tableName: 'conversation' })),
      ...(knowledgeErrors || []).map(e => ({ ...e, tableName: 'knowledge' })),
      ...(systemErrors || []).map(e => ({ ...e, tableName: 'system' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (allErrors.length === 0) {
      return this.getEmptyErrorSummary();
    }

    return this.buildErrorSummary(allErrors);
  }

  async getErrorTrends(filter: ErrorAnalyticsFilter): Promise<ErrorTrend[]> {
    const timeFilter = this.getTimeFilter(filter.timeRange);
    const interval = this.getIntervalForTimeRange(filter.timeRange);
    
    // Query error trends from all tables
    const [conversationTrends, knowledgeTrends, systemTrends] = await Promise.all([
      this.queryErrorTrends('chatbot_conversation_errors', filter, timeFilter, interval),
      this.queryErrorTrends('chatbot_knowledge_errors', filter, timeFilter, interval),
      this.queryErrorTrends('chatbot_system_errors', filter, timeFilter, interval)
    ]);

    // Combine and sort trends
    const allTrends = [
      ...(conversationTrends || []),
      ...(knowledgeTrends || []),
      ...(systemTrends || [])
    ].sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

    return allTrends;
  }

  async getErrorsBySession(sessionId: string, organizationId: string): Promise<ErrorSummary> {
    const filter: ErrorAnalyticsFilter = {
      organizationId,
      timeRange: '7d',
      sessionId
    };

    return this.getErrorSummary(filter);
  }

  async getErrorsByUser(userId: string, organizationId: string): Promise<ErrorSummary> {
    const filter: ErrorAnalyticsFilter = {
      organizationId,
      timeRange: '7d',
      userId
    };

    return this.getErrorSummary(filter);
  }

  private async queryErrorTable(
    tableName: string,
    filter: ErrorAnalyticsFilter,
    timeFilter: string
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from(tableName)
        .select('error_code, error_message, error_category, severity, created_at')
        .eq('organization_id', filter.organizationId)
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false });

      // Apply additional filters
      if (filter.severity && filter.severity.length > 0) {
        query = query.in('severity', filter.severity);
      }

      if (filter.category && filter.category.length > 0) {
        query = query.in('error_category', filter.category);
      }

      if (filter.errorCode && filter.errorCode.length > 0) {
        query = query.in('error_code', filter.errorCode);
      }

      if (filter.sessionId) {
        query = query.eq('session_id', filter.sessionId);
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error querying ${tableName}:`, error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error(`Error querying ${tableName}:`, err);
      return [];
    }
  }

  private async queryErrorTrends(
    tableName: string,
    filter: ErrorAnalyticsFilter,
    timeFilter: string,
    interval: string
  ): Promise<ErrorTrend[]> {
    try {
      // Use PostgreSQL date_trunc for time grouping
      const { data, error } = await this.supabase
        .from(tableName)
        .select(`
          created_at,
          error_category,
          severity
        `)
        .eq('organization_id', filter.organizationId)
        .gte('created_at', timeFilter);

      if (error) {
        console.error(`Error querying trends from ${tableName}:`, error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Group by time period, category, and severity
      const trends: Record<string, ErrorTrend> = {};

      data.forEach(row => {
        const period = this.truncateToInterval(row.created_at, interval);
        const key = `${period}-${row.error_category}-${row.severity}`;

        if (!trends[key]) {
          trends[key] = {
            period,
            errorCount: 0,
            severity: row.severity,
            category: row.error_category
          };
        }

        trends[key].errorCount++;
      });

      return Object.values(trends);
    } catch (err) {
      console.error(`Error querying trends from ${tableName}:`, err);
      return [];
    }
  }

  private buildErrorSummary(allErrors: any[]): ErrorSummary {
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

    return {
      totalErrors: allErrors.length,
      errorsByCode,
      errorsBySeverity,
      errorsByCategory,
      errorsByTable,
      recentErrors: allErrors.slice(0, 10).map(error => ({
        errorCode: error.error_code,
        errorMessage: error.error_message,
        errorCategory: error.error_category,
        severity: error.severity,
        createdAt: error.created_at,
        tableName: error.tableName
      }))
    };
  }

  private getEmptyErrorSummary(): ErrorSummary {
    return {
      totalErrors: 0,
      errorsByCode: {},
      errorsBySeverity: {},
      errorsByCategory: {},
      errorsByTable: {},
      recentErrors: []
    };
  }

  private getTimeFilter(timeRange: string): string {
    const now = new Date();
    const hours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[timeRange] || 24;

    return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  }

  private getIntervalForTimeRange(timeRange: string): string {
    const intervalMap: Record<string, string> = {
      '1h': '5 minutes',
      '24h': '1 hour',
      '7d': '1 day',
      '30d': '1 day'
    };

    return intervalMap[timeRange] || '1 hour';
  }

  private truncateToInterval(timestamp: string, interval: string): string {
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
} 
/**
 * Error Analytics Supabase Repository
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure layer for database access
 * - Single responsibility: database queries only
 * - Preserve organization-based security filtering
 * - Handle multiple error tables efficiently
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ErrorAnalyticsFilter } from '../../../../domain/value-objects/analytics/ErrorAnalyticsFilter';
import { ErrorRecordWithTable } from '../../../../domain/services/analytics/ErrorAggregationService';
import { ErrorDataValidator, ErrorRecord, TrendRecord } from './ErrorDataValidator';

export class ErrorAnalyticsSupabaseRepository {
  private readonly validator: ErrorDataValidator;

  constructor(private readonly supabase: SupabaseClient) {
    this.validator = new ErrorDataValidator();
  }

  /**
   * Query errors from a specific table with organization security
   */
  async queryErrorTable(
    tableName: string,
    filter: ErrorAnalyticsFilter,
    timeFilter: string
  ): Promise<ErrorRecord[]> {
    try {
      let query = this.supabase
        .from(tableName)
        .select('error_code, error_message, error_category, severity, created_at')
        .eq('organization_id', filter.organizationId) // Security: Organization isolation
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false });

      // Apply additional filters while preserving security
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

      return this.validator.validateErrorRecords(data || []);
    } catch (err) {
      console.error(`Error querying ${tableName}:`, err);
      return [];
    }
  }

  /**
   * Query error trends from a specific table
   */
  async queryErrorTrends(
    tableName: string,
    filter: ErrorAnalyticsFilter,
    timeFilter: string
  ): Promise<TrendRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select(`
          created_at,
          error_category,
          severity
        `)
        .eq('organization_id', filter.organizationId) // Security: Organization isolation
        .gte('created_at', timeFilter);

      if (error) {
        console.error(`Error querying trends from ${tableName}:`, error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return this.validator.validateTrendRecords(data);
    } catch (err) {
      console.error(`Error querying trends from ${tableName}:`, err);
      return [];
    }
  }

  /**
   * Query all error tables in parallel with organization security
   */
  async queryAllErrorTables(
    filter: ErrorAnalyticsFilter,
    timeFilter: string
  ): Promise<{
    conversationErrors: ErrorRecordWithTable[];
    knowledgeErrors: ErrorRecordWithTable[];
    systemErrors: ErrorRecordWithTable[];
  }> {
    const [conversationErrors, knowledgeErrors, systemErrors] = await Promise.all([
      this.queryErrorTable('chatbot_conversation_errors', filter, timeFilter),
      this.queryErrorTable('chatbot_knowledge_errors', filter, timeFilter),
      this.queryErrorTable('chatbot_system_errors', filter, timeFilter)
    ]);

    return {
      conversationErrors: conversationErrors.map(error => ({ ...error, tableName: 'chatbot_conversation_errors' as const })),
      knowledgeErrors: knowledgeErrors.map(error => ({ ...error, tableName: 'chatbot_knowledge_errors' as const })),
      systemErrors: systemErrors.map(error => ({ ...error, tableName: 'chatbot_system_errors' as const }))
    };
  }

  /**
   * Query trends from all error tables in parallel
   */
  async queryAllErrorTrends(
    filter: ErrorAnalyticsFilter,
    timeFilter: string
  ): Promise<{
    conversationTrends: TrendRecord[];
    knowledgeTrends: TrendRecord[];
    systemTrends: TrendRecord[];
  }> {
    const [conversationTrends, knowledgeTrends, systemTrends] = await Promise.all([
      this.queryErrorTrends('chatbot_conversation_errors', filter, timeFilter),
      this.queryErrorTrends('chatbot_knowledge_errors', filter, timeFilter),
      this.queryErrorTrends('chatbot_system_errors', filter, timeFilter)
    ]);

    return {
      conversationTrends,
      knowledgeTrends,
      systemTrends
    };
  }
}
/**
 * Error Persistence Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: persist errors to database
 * - Infrastructure layer - handles database operations
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines
 * - Proper error handling and logging
 * - Table-specific data enrichment
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ErrorCategorization } from '../../../domain/services/ErrorCategorizationDomainService';

export interface ErrorPersistenceContext {
  sessionId?: string;
  userId?: string;
  organizationId?: string;
  conversationId?: string;
  messageId?: string;
  modelName?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalCostCents: number;
  };
  performanceMetrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ErrorPersistenceData {
  errorCode: string;
  errorMessage: string;
  errorContext: Record<string, unknown>;
  timestamp: Date;
  stack?: string;
}

export class ErrorPersistenceService {
  /**
   * AI INSTRUCTIONS:
   * - Handle database persistence for all error types
   * - Enrich data based on target table
   * - Proper error handling with fallback logging
   * - No business logic - pure infrastructure
   */

  constructor(private readonly supabase: SupabaseClient) {}

  async persistError(
    errorData: ErrorPersistenceData,
    categorization: ErrorCategorization,
    context: ErrorPersistenceContext
  ): Promise<void> {
    try {
      const baseData = this.buildBaseErrorData(errorData, categorization, context);
      const enrichedData = this.enrichDataForTable(categorization.tableName, baseData, context, errorData);

      const { error: dbError } = await this.supabase
        .from(categorization.tableName)
        .insert(enrichedData);

      if (dbError) {
        console.error(`Failed to persist chatbot error to ${categorization.tableName}:`, dbError);
        // Fallback to console logging if database fails
        this.logErrorFallback(errorData, categorization, context, dbError);
      }
    } catch (err) {
      console.error('Error persisting chatbot error:', err);
      this.logErrorFallback(errorData, categorization, context, err);
    }
  }

  private buildBaseErrorData(
    errorData: ErrorPersistenceData,
    categorization: ErrorCategorization,
    context: ErrorPersistenceContext
  ): Record<string, unknown> {
    return {
      error_code: errorData.errorCode,
      error_message: errorData.errorMessage,
      error_category: categorization.category,
      severity: categorization.severity,
      session_id: context.sessionId,
      user_id: context.userId,
      organization_id: context.organizationId,
      error_context: {
        ...errorData.errorContext,
        ...context.metadata,
        stack: errorData.stack,
        timestamp: errorData.timestamp.toISOString()
      },
      created_at: errorData.timestamp.toISOString()
    };
  }

  private enrichDataForTable(
    tableName: string,
    baseData: Record<string, unknown>,
    context: ErrorPersistenceContext,
    errorData: ErrorPersistenceData
  ): Record<string, unknown> {
    const enrichedData = { ...baseData };

    switch (tableName) {
      case 'chatbot_conversation_errors':
        return this.enrichConversationErrorData(enrichedData, context, errorData);
      
      case 'chatbot_knowledge_errors':
        return this.enrichKnowledgeErrorData(enrichedData, context, errorData);
      
      case 'chatbot_system_errors':
        return this.enrichSystemErrorData(enrichedData, context, errorData);
      
      default:
        return enrichedData;
    }
  }

  private enrichConversationErrorData(
    baseData: Record<string, unknown>,
    context: ErrorPersistenceContext,
    errorData: ErrorPersistenceData
  ): Record<string, unknown> {
    return {
      ...baseData,
      conversation_id: context.conversationId,
      message_id: context.messageId,
      model_name: context.modelName,
      token_usage: context.tokenUsage,
      prompt_length: errorData.errorContext?.queryLength || null,
      response_length: errorData.errorContext?.responseLength || null,
      user_query: errorData.errorContext?.query || errorData.errorContext?.userQuery || null,
      response_time_ms: context.performanceMetrics?.responseTime || null,
      memory_usage_mb: context.performanceMetrics?.memoryUsage || null,
      stack_trace: errorData.stack || null
    };
  }

  private enrichKnowledgeErrorData(
    baseData: Record<string, unknown>,
    context: ErrorPersistenceContext,
    errorData: ErrorPersistenceData
  ): Record<string, unknown> {
    return {
      ...baseData,
      chatbot_config_id: errorData.errorContext?.chatbotConfigId || null,
      source_url: errorData.errorContext?.url || errorData.errorContext?.sourceUrl || null,
      source_type: errorData.errorContext?.sourceType || 'website',
      content_type: errorData.errorContext?.contentType || errorData.errorContext?.extractionType || null,
      query_text: errorData.errorContext?.query || errorData.errorContext?.userQuery || null,
      vector_dimensions: errorData.errorContext?.vectorDimensions || null,
      similarity_threshold: errorData.errorContext?.threshold || null,
      search_results_count: errorData.errorContext?.resultsFound || null,
      crawl_depth: errorData.errorContext?.depth || null,
      pages_attempted: errorData.errorContext?.pagesAttempted || null,
      pages_successful: errorData.errorContext?.pagesSuccessful || null,
      processing_time_ms: context.performanceMetrics?.responseTime || null,
      memory_usage_mb: context.performanceMetrics?.memoryUsage || null,
      cache_hit_rate: errorData.errorContext?.cacheHitRate || null,
      stack_trace: errorData.stack || null
    };
  }

  private enrichSystemErrorData(
    baseData: Record<string, unknown>,
    context: ErrorPersistenceContext,
    errorData: ErrorPersistenceData
  ): Record<string, unknown> {
    return {
      ...baseData,
      chatbot_config_id: errorData.errorContext?.chatbotConfigId || null,
      component_name: errorData.errorContext?.component || null,
      service_name: errorData.errorContext?.serviceName || null,
      operation_name: errorData.errorContext?.operation || null,
      config_field: errorData.errorContext?.configField || errorData.errorContext?.field || null,
      config_value: errorData.errorContext?.configValue || null,
      integration_type: errorData.errorContext?.integrationType || null,
      threshold_value: errorData.errorContext?.threshold || null,
      actual_value: errorData.errorContext?.actual || null,
      metric_name: errorData.errorContext?.metric || null,
      external_service: errorData.errorContext?.serviceName || errorData.errorContext?.apiProvider || null,
      api_endpoint: errorData.errorContext?.apiEndpoint || null,
      http_status_code: errorData.errorContext?.status || errorData.errorContext?.statusCode || null,
      violation_type: errorData.errorContext?.violationType || null,
      ip_address: errorData.errorContext?.ipAddress || null,
      user_agent: errorData.errorContext?.userAgent || null,
      processing_time_ms: context.performanceMetrics?.responseTime || null,
      memory_usage_mb: context.performanceMetrics?.memoryUsage || null,
      stack_trace: errorData.stack || null
    };
  }

  private logErrorFallback(
    errorData: ErrorPersistenceData,
    categorization: ErrorCategorization,
    context: ErrorPersistenceContext,
    dbError: unknown
  ): void {
    const fallbackLog = {
      errorCode: errorData.errorCode,
      errorMessage: errorData.errorMessage,
      severity: categorization.severity,
      category: categorization.category,
      tableName: categorization.tableName,
      sessionId: context.sessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      timestamp: errorData.timestamp.toISOString(),
      dbError: dbError instanceof Error ? dbError.message : String(dbError),
      fallbackReason: 'Database persistence failed'
    };

    console.error('ERROR_PERSISTENCE_FALLBACK:', JSON.stringify(fallbackLog, null, 2));
  }

  /**
   * AI INSTRUCTIONS:
   * - Batch error persistence for performance
   * - Handle multiple errors in single transaction
   * - Proper error handling for batch operations
   */
  async persistErrorBatch(
    errors: Array<{
      errorData: ErrorPersistenceData;
      categorization: ErrorCategorization;
      context: ErrorPersistenceContext;
    }>
  ): Promise<void> {
    if (errors.length === 0) return;

    // Group errors by table for batch insertion
    const errorsByTable = this.groupErrorsByTable(errors);

    for (const [tableName, tableErrors] of Object.entries(errorsByTable)) {
      try {
        const enrichedData = tableErrors.map(({ errorData, categorization, context }) => {
          const baseData = this.buildBaseErrorData(errorData, categorization, context);
          return this.enrichDataForTable(tableName, baseData, context, errorData);
        });

        const { error: dbError } = await this.supabase
          .from(tableName)
          .insert(enrichedData);

        if (dbError) {
          console.error(`Failed to persist error batch to ${tableName}:`, dbError);
          // Log each error individually as fallback
          tableErrors.forEach(({ errorData, categorization, context }) => {
            this.logErrorFallback(errorData, categorization, context, dbError);
          });
        }
      } catch (err) {
        console.error(`Error persisting error batch to ${tableName}:`, err);
        tableErrors.forEach(({ errorData, categorization, context }) => {
          this.logErrorFallback(errorData, categorization, context, err);
        });
      }
    }
  }

  private groupErrorsByTable(
    errors: Array<{
      errorData: ErrorPersistenceData;
      categorization: ErrorCategorization;
      context: ErrorPersistenceContext;
    }>
  ): Record<string, typeof errors> {
    return errors.reduce((acc, error) => {
      const tableName = error.categorization.tableName;
      if (!acc[tableName]) {
        acc[tableName] = [];
      }
      acc[tableName].push(error);
      return acc;
    }, {} as Record<string, typeof errors>);
  }
} 
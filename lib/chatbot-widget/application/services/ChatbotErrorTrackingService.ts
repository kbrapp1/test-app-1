/**
 * Comprehensive Chatbot Error Tracking Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Track all chatbot widget domain errors
 * - Integrate with centralized error tracking system
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines per method category
 * - Provide rich context for debugging
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  MessageProcessingError,
  ConversationFlowError,
  SessionManagementError,
  ContextExtractionError,
  AIResponseGenerationError,
  TokenLimitExceededError,
  ModelConfigurationError,
  EmbeddingGenerationError,
  KnowledgeRetrievalError,
  VectorSearchError,
  KnowledgeIndexingError,
  KnowledgeCacheError,
  WebsiteCrawlingError,
  ContentExtractionError,
  ContentDeduplicationError,
  UrlNormalizationError,
  ChatbotConfigurationError,
  IntegrationConfigurationError,
  LeadCaptureError,
  LeadQualificationError,
  AnalyticsTrackingError,
  ConversationAnalysisError,
  WidgetRenderingError,
  WidgetConfigurationError,
  ExternalServiceError,
  APIRateLimitError,
  DataPersistenceError,
  DataValidationError,
  SecurityViolationError,
  AuthenticationError,
  AuthorizationError,
  PerformanceThresholdError,
  ResourceExhaustionError
} from '../../domain/errors/ChatbotWidgetDomainErrors';

export interface ChatbotErrorContext {
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
  metadata?: Record<string, any>;
}

export class ChatbotErrorTrackingService {
  constructor(private readonly supabase: SupabaseClient) {}

  // ===== CONVERSATION & MESSAGE PROCESSING ERRORS =====

  async trackMessageProcessingError(
    reason: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new MessageProcessingError(reason, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackConversationFlowError(
    flowStep: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ConversationFlowError(flowStep, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackSessionManagementError(
    operation: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new SessionManagementError(operation, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackContextExtractionError(
    contextType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ContextExtractionError(contextType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== AI & LLM ERRORS =====

  async trackAIResponseGenerationError(
    modelName: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new AIResponseGenerationError(modelName, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackTokenLimitExceededError(
    tokenCount: number,
    limit: number,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new TokenLimitExceededError(tokenCount, limit, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackModelConfigurationError(
    configType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ModelConfigurationError(configType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackEmbeddingGenerationError(
    contentType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new EmbeddingGenerationError(contentType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== KNOWLEDGE BASE ERRORS =====

  async trackKnowledgeRetrievalError(
    queryType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new KnowledgeRetrievalError(queryType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackVectorSearchError(
    searchType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new VectorSearchError(searchType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackKnowledgeIndexingError(
    contentType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new KnowledgeIndexingError(contentType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackKnowledgeCacheError(
    operation: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new KnowledgeCacheError(operation, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== WEBSITE CRAWLING ERRORS =====

  async trackWebsiteCrawlingError(
    url: string,
    reason: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new WebsiteCrawlingError(url, reason, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackContentExtractionError(
    url: string,
    extractionType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ContentExtractionError(url, extractionType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackContentDeduplicationError(
    algorithm: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ContentDeduplicationError(algorithm, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackUrlNormalizationError(
    url: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new UrlNormalizationError(url, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== CONFIGURATION ERRORS =====

  async trackChatbotConfigurationError(
    configField: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ChatbotConfigurationError(configField, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackIntegrationConfigurationError(
    integrationType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new IntegrationConfigurationError(integrationType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== LEAD MANAGEMENT ERRORS =====

  async trackLeadCaptureError(
    captureType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new LeadCaptureError(captureType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackLeadQualificationError(
    qualificationStep: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new LeadQualificationError(qualificationStep, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== ANALYTICS & TRACKING ERRORS =====

  async trackAnalyticsTrackingError(
    eventType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new AnalyticsTrackingError(eventType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackConversationAnalysisError(
    analysisType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ConversationAnalysisError(analysisType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== WIDGET RENDERING ERRORS =====

  async trackWidgetRenderingError(
    component: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new WidgetRenderingError(component, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackWidgetConfigurationError(
    configType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new WidgetConfigurationError(configType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== EXTERNAL SERVICE ERRORS =====

  async trackExternalServiceError(
    serviceName: string,
    operation: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ExternalServiceError(serviceName, operation, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackAPIRateLimitError(
    apiProvider: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new APIRateLimitError(apiProvider, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== DATA PERSISTENCE ERRORS =====

  async trackDataPersistenceError(
    operation: string,
    entityType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new DataPersistenceError(operation, entityType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackDataValidationError(
    field: string,
    validationRule: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new DataValidationError(field, validationRule, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== SECURITY ERRORS =====

  async trackSecurityViolationError(
    violationType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new SecurityViolationError(violationType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackAuthenticationError(
    authType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new AuthenticationError(authType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackAuthorizationError(
    resource: string,
    action: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new AuthorizationError(resource, action, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== PERFORMANCE ERRORS =====

  async trackPerformanceThresholdError(
    metric: string,
    threshold: number,
    actual: number,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new PerformanceThresholdError(metric, threshold, actual, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  async trackResourceExhaustionError(
    resourceType: string,
    context: ChatbotErrorContext
  ): Promise<void> {
    const error = new ResourceExhaustionError(resourceType, context);
    await this.persistError(error, context);
    this.logError(error, context);
  }

  // ===== LEGACY FALLBACK METHODS (for backward compatibility) =====

  async trackResponseExtractionFallback(
    unifiedResult: any,
    sessionId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    await this.trackAIResponseGenerationError('gpt-4o-mini', {
      sessionId,
      userId,
      organizationId,
      metadata: {
        unifiedResultStructure: this.sanitizeUnifiedResult(unifiedResult),
        extractionPath: 'unifiedResult?.analysis?.response?.content',
        fallbackTriggered: true,
        legacyMethod: 'trackResponseExtractionFallback'
      }
    });
  }

  // ===== PRIVATE HELPER METHODS =====

  private async persistError(
    error: any,
    context: ChatbotErrorContext
  ): Promise<void> {
    try {
      const tableName = this.getTableForErrorCode(error.code);
      const errorCategory = this.getErrorCategory(error.code);
      
      const baseData = {
        error_code: error.code,
        error_message: error.message,
        error_category: errorCategory,
        severity: error.severity,
        session_id: context.sessionId,
        user_id: context.userId,
        organization_id: context.organizationId,
        error_context: {
          ...error.context,
          ...context.metadata,
          stack: error.stack,
          timestamp: error.timestamp.toISOString()
        },
        created_at: error.timestamp.toISOString()
      };

      // Add table-specific fields
      const tableData = this.enrichDataForTable(tableName, baseData, context, error);

      const { error: dbError } = await this.supabase
        .from(tableName)
        .insert(tableData);

      if (dbError) {
        console.error(`Failed to persist chatbot error to ${tableName}:`, dbError);
      }
    } catch (err) {
      console.error('Error persisting chatbot error:', err);
    }
  }

  private getTableForErrorCode(errorCode: string): string {
    // Conversation & AI errors
    if ([
      'MESSAGE_PROCESSING_FAILED', 'CONVERSATION_FLOW_ERROR', 'SESSION_MANAGEMENT_ERROR',
      'CONTEXT_EXTRACTION_FAILED', 'AI_RESPONSE_GENERATION_FAILED', 'TOKEN_LIMIT_EXCEEDED',
      'MODEL_CONFIGURATION_ERROR', 'EMBEDDING_GENERATION_FAILED'
    ].includes(errorCode)) {
      return 'chatbot_conversation_errors';
    }

    // Knowledge & crawling errors
    if ([
      'KNOWLEDGE_RETRIEVAL_FAILED', 'VECTOR_SEARCH_FAILED', 'KNOWLEDGE_INDEXING_FAILED',
      'KNOWLEDGE_CACHE_ERROR', 'WEBSITE_CRAWLING_FAILED', 'CONTENT_EXTRACTION_FAILED',
      'CONTENT_DEDUPLICATION_FAILED', 'URL_NORMALIZATION_FAILED'
    ].includes(errorCode)) {
      return 'chatbot_knowledge_errors';
    }

    // System & configuration errors (default)
    return 'chatbot_system_errors';
  }

  private getErrorCategory(errorCode: string): string {
    const categoryMap: Record<string, string> = {
      // Conversation categories
      'MESSAGE_PROCESSING_FAILED': 'message_processing',
      'CONVERSATION_FLOW_ERROR': 'conversation_flow',
      'SESSION_MANAGEMENT_ERROR': 'session_management',
      'CONTEXT_EXTRACTION_FAILED': 'context_extraction',
      'AI_RESPONSE_GENERATION_FAILED': 'ai_response_generation',
      'TOKEN_LIMIT_EXCEEDED': 'token_limit',
      'MODEL_CONFIGURATION_ERROR': 'model_configuration',
      'EMBEDDING_GENERATION_FAILED': 'embedding_generation',

      // Knowledge categories
      'KNOWLEDGE_RETRIEVAL_FAILED': 'knowledge_retrieval',
      'VECTOR_SEARCH_FAILED': 'vector_search',
      'KNOWLEDGE_INDEXING_FAILED': 'knowledge_indexing',
      'KNOWLEDGE_CACHE_ERROR': 'knowledge_cache',
      'WEBSITE_CRAWLING_FAILED': 'website_crawling',
      'CONTENT_EXTRACTION_FAILED': 'content_extraction',
      'CONTENT_DEDUPLICATION_FAILED': 'content_deduplication',
      'URL_NORMALIZATION_FAILED': 'url_normalization',

      // System categories
      'WIDGET_RENDERING_FAILED': 'widget_rendering',
      'WIDGET_CONFIGURATION_ERROR': 'widget_configuration',
      'CHATBOT_CONFIGURATION_ERROR': 'chatbot_configuration',
      'INTEGRATION_CONFIGURATION_ERROR': 'integration_configuration',
      'EXTERNAL_SERVICE_ERROR': 'external_service',
      'API_RATE_LIMIT_EXCEEDED': 'api_rate_limit',
      'DATA_PERSISTENCE_FAILED': 'data_persistence',
      'DATA_VALIDATION_FAILED': 'data_validation',
      'SECURITY_VIOLATION': 'security_violation',
      'AUTHENTICATION_FAILED': 'authentication',
      'AUTHORIZATION_FAILED': 'authorization',
      'PERFORMANCE_THRESHOLD_EXCEEDED': 'performance_threshold',
      'RESOURCE_EXHAUSTION': 'resource_exhaustion',
      'ANALYTICS_TRACKING_FAILED': 'analytics_tracking'
    };

    return categoryMap[errorCode] || 'external_service';
  }

  private enrichDataForTable(tableName: string, baseData: any, context: ChatbotErrorContext, error: any): any {
    const enrichedData = { ...baseData };

    switch (tableName) {
      case 'chatbot_conversation_errors':
        return {
          ...enrichedData,
          conversation_id: context.conversationId,
          message_id: context.messageId,
          model_name: context.modelName,
          token_usage: context.tokenUsage,
          prompt_length: error.context?.queryLength || null,
          response_length: error.context?.responseLength || null,
          user_query: error.context?.query || error.context?.userQuery || null,
          response_time_ms: context.performanceMetrics?.responseTime || null,
          memory_usage_mb: context.performanceMetrics?.memoryUsage || null,
          stack_trace: error.stack || null
        };

      case 'chatbot_knowledge_errors':
        return {
          ...enrichedData,
          chatbot_config_id: error.context?.chatbotConfigId || null,
          source_url: error.context?.url || error.context?.sourceUrl || null,
          source_type: error.context?.sourceType || 'website',
          content_type: error.context?.contentType || error.context?.extractionType || null,
          query_text: error.context?.query || error.context?.userQuery || null,
          vector_dimensions: error.context?.vectorDimensions || null,
          similarity_threshold: error.context?.threshold || null,
          search_results_count: error.context?.resultsFound || null,
          crawl_depth: error.context?.depth || null,
          pages_attempted: error.context?.pagesAttempted || null,
          pages_successful: error.context?.pagesSuccessful || null,
          processing_time_ms: context.performanceMetrics?.responseTime || null,
          memory_usage_mb: context.performanceMetrics?.memoryUsage || null,
          cache_hit_rate: error.context?.cacheHitRate || null,
          stack_trace: error.stack || null
        };

      case 'chatbot_system_errors':
        return {
          ...enrichedData,
          chatbot_config_id: error.context?.chatbotConfigId || null,
          component_name: error.context?.component || null,
          service_name: error.context?.serviceName || null,
          operation_name: error.context?.operation || null,
          config_field: error.context?.configField || error.context?.field || null,
          config_value: error.context?.configValue || null,
          integration_type: error.context?.integrationType || null,
          threshold_value: error.context?.threshold || null,
          actual_value: error.context?.actual || null,
          metric_name: error.context?.metric || null,
          external_service: error.context?.serviceName || error.context?.apiProvider || null,
          api_endpoint: error.context?.apiEndpoint || null,
          http_status_code: error.context?.status || error.context?.statusCode || null,
          violation_type: error.context?.violationType || null,
          ip_address: error.context?.ipAddress || null,
          user_agent: error.context?.userAgent || null,
          processing_time_ms: context.performanceMetrics?.responseTime || null,
          memory_usage_mb: context.performanceMetrics?.memoryUsage || null,
          stack_trace: error.stack || null
        };

      default:
        return enrichedData;
    }
  }

  private logError(
    error: any,
    context: ChatbotErrorContext
  ): void {
    const logData = {
      errorCode: error.code,
      errorMessage: error.message,
      severity: error.severity,
      sessionId: context.sessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      conversationId: context.conversationId,
      messageId: context.messageId,
      modelName: context.modelName,
      tokenUsage: context.tokenUsage,
      performanceMetrics: context.performanceMetrics,
      timestamp: error.timestamp.toISOString(),
      context: error.context
    };

    // Log with appropriate level based on severity
    switch (error.severity) {
      case 'critical':
        console.error('CRITICAL CHATBOT ERROR:', logData);
        break;
      case 'high':
        console.error('HIGH CHATBOT ERROR:', logData);
        break;
      case 'medium':
        console.warn('MEDIUM CHATBOT ERROR:', logData);
        break;
      case 'low':
        console.info('LOW CHATBOT ERROR:', logData);
        break;
      default:
        console.log('CHATBOT ERROR:', logData);
    }
  }

  private sanitizeUnifiedResult(result: any): any {
    // Remove sensitive data and large content for logging
    if (!result) return null;
    
    return {
      hasAnalysis: !!result.analysis,
      hasResponse: !!result.analysis?.response,
      hasContent: !!result.analysis?.response?.content,
      contentLength: result.analysis?.response?.content?.length || 0,
      structure: Object.keys(result).join(', '),
      analysisKeys: result.analysis ? Object.keys(result.analysis).join(', ') : null,
      responseKeys: result.analysis?.response ? Object.keys(result.analysis.response).join(', ') : null
    };
  }

  // ===== UTILITY METHODS =====

  async getErrorSummary(
    organizationId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
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
  }> {
    const timeFilter = this.getTimeFilter(timeRange);
    
    // Query all three error tables
    const [conversationErrors, knowledgeErrors, systemErrors] = await Promise.all([
      this.supabase
        .from('chatbot_conversation_errors')
        .select('error_code, error_message, error_category, severity, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false }),
      
      this.supabase
        .from('chatbot_knowledge_errors')
        .select('error_code, error_message, error_category, severity, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false }),
      
      this.supabase
        .from('chatbot_system_errors')
        .select('error_code, error_message, error_category, severity, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false })
    ]);

    // Combine all errors with table names
    const allErrors = [
      ...(conversationErrors.data || []).map(e => ({ ...e, tableName: 'conversation' })),
      ...(knowledgeErrors.data || []).map(e => ({ ...e, tableName: 'knowledge' })),
      ...(systemErrors.data || []).map(e => ({ ...e, tableName: 'system' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (allErrors.length === 0) {
      return {
        totalErrors: 0,
        errorsByCode: {},
        errorsBySeverity: {},
        errorsByCategory: {},
        errorsByTable: {},
        recentErrors: []
      };
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
} 
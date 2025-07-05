/**
 * Error Categorization Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for error classification and routing
 * - Single responsibility: categorize and route chatbot errors
 * - No external dependencies or infrastructure concerns
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines
 * - Domain-specific error categorization rules
 */

export interface ErrorCategorization {
  readonly tableName: 'chatbot_conversation_errors' | 'chatbot_knowledge_errors' | 'chatbot_system_errors';
  readonly category: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorCategorizationDomainService {
  /**
   * AI INSTRUCTIONS:
   * - Categorize errors based on error codes
   * - Route to appropriate database table
   * - Determine error category for analytics
   * - Pure domain logic, no infrastructure
   */

  categorizeError(errorCode: string): ErrorCategorization {
    const tableName = this.getTableForErrorCode(errorCode);
    const category = this.getErrorCategory(errorCode);
    const severity = this.getErrorSeverity(errorCode);

    return {
      tableName,
      category,
      severity
    };
  }

  private getTableForErrorCode(errorCode: string): ErrorCategorization['tableName'] {
    // Conversation & AI errors
    if (this.isConversationError(errorCode)) {
      return 'chatbot_conversation_errors';
    }

    // Knowledge & crawling errors
    if (this.isKnowledgeError(errorCode)) {
      return 'chatbot_knowledge_errors';
    }

    // System & configuration errors (default)
    return 'chatbot_system_errors';
  }

  private isConversationError(errorCode: string): boolean {
    const conversationErrorCodes = [
      'MESSAGE_PROCESSING_FAILED',
      'CONVERSATION_FLOW_ERROR',
      'SESSION_MANAGEMENT_ERROR',
      'CONTEXT_EXTRACTION_FAILED',
      'AI_RESPONSE_GENERATION_FAILED',
      'TOKEN_LIMIT_EXCEEDED',
      'MODEL_CONFIGURATION_ERROR',
      'EMBEDDING_GENERATION_FAILED'
    ];

    return conversationErrorCodes.includes(errorCode);
  }

  private isKnowledgeError(errorCode: string): boolean {
    const knowledgeErrorCodes = [
      'KNOWLEDGE_RETRIEVAL_FAILED',
      'VECTOR_SEARCH_FAILED',
      'KNOWLEDGE_INDEXING_FAILED',
      'KNOWLEDGE_CACHE_ERROR',
      'WEBSITE_CRAWLING_FAILED',
      'CONTENT_EXTRACTION_FAILED',
      'CONTENT_DEDUPLICATION_FAILED',
      'URL_NORMALIZATION_FAILED'
    ];

    return knowledgeErrorCodes.includes(errorCode);
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
      'ANALYTICS_TRACKING_FAILED': 'analytics_tracking',
      'LEAD_CAPTURE_FAILED': 'lead_capture',
      'LEAD_QUALIFICATION_FAILED': 'lead_qualification',
      'CONVERSATION_ANALYSIS_FAILED': 'conversation_analysis'
    };

    return categoryMap[errorCode] || 'external_service';
  }

  private getErrorSeverity(errorCode: string): ErrorCategorization['severity'] {
    const criticalErrors = [
      'SECURITY_VIOLATION',
      'AUTHENTICATION_FAILED',
      'AUTHORIZATION_FAILED',
      'RESOURCE_EXHAUSTION',
      'DATA_PERSISTENCE_FAILED'
    ];

    const highErrors = [
      'AI_RESPONSE_GENERATION_FAILED',
      'MESSAGE_PROCESSING_FAILED',
      'SESSION_MANAGEMENT_ERROR',
      'EXTERNAL_SERVICE_ERROR',
      'API_RATE_LIMIT_EXCEEDED',
      'WEBSITE_CRAWLING_FAILED',
      'KNOWLEDGE_RETRIEVAL_FAILED'
    ];

    const mediumErrors = [
      'CONVERSATION_FLOW_ERROR',
      'CONTEXT_EXTRACTION_FAILED',
      'TOKEN_LIMIT_EXCEEDED',
      'MODEL_CONFIGURATION_ERROR',
      'VECTOR_SEARCH_FAILED',
      'CONTENT_EXTRACTION_FAILED',
      'WIDGET_RENDERING_FAILED',
      'CHATBOT_CONFIGURATION_ERROR'
    ];

    if (criticalErrors.includes(errorCode)) {
      return 'critical';
    }

    if (highErrors.includes(errorCode)) {
      return 'high';
    }

    if (mediumErrors.includes(errorCode)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * AI INSTRUCTIONS:
   * - Determine if error should be persisted to database
   * - Business rules for error filtering
   * - Consider error frequency and importance
   */
  shouldPersistError(errorCode: string, context: Record<string, any>): boolean {
    // Always persist critical and high severity errors
    const severity = this.getErrorSeverity(errorCode);
    if (['critical', 'high'].includes(severity)) {
      return true;
    }

    // Skip low-priority errors in development
    if (process.env.NODE_ENV === 'development' && severity === 'low') {
      return false;
    }

    // Always persist errors with user/session context
    if (context.sessionId || context.userId || context.conversationId) {
      return true;
    }

    // Default to persisting for production monitoring
    return process.env.NODE_ENV === 'production';
  }

  /**
   * AI INSTRUCTIONS:
   * - Sanitize error context for logging
   * - Remove sensitive data
   * - Limit large content for performance
   */
  sanitizeErrorContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.credentials;

    // Limit large content fields
    if (sanitized.content && typeof sanitized.content === 'string' && sanitized.content.length > 1000) {
      sanitized.content = sanitized.content.substring(0, 1000) + '... [truncated]';
      sanitized.originalContentLength = context.content.length;
    }

    // Limit stack traces
    if (sanitized.stack && typeof sanitized.stack === 'string') {
      const stackLines = sanitized.stack.split('\n');
      if (stackLines.length > 10) {
        sanitized.stack = stackLines.slice(0, 10).join('\n') + '\n... [truncated]';
      }
    }

    return sanitized;
  }
} 
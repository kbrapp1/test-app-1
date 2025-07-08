/**
 * Error Tracking Facade
 * 
 * AI INSTRUCTIONS:
 * - Facade pattern for unified error tracking API
 * - Single responsibility: coordinate error tracking services
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines
 * - Delegate to specialized services
 * - Clean public API for consumers
 */

import { ErrorCategorizationDomainService } from '../../domain/services/ErrorCategorizationDomainService';
import { ErrorPersistenceService, ErrorPersistenceContext, ErrorPersistenceData } from '../../infrastructure/persistence/supabase/ErrorPersistenceService';
import { ErrorAnalyticsService, ErrorSummary, ErrorAnalyticsFilter } from './ErrorAnalyticsService';
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
  organizationId: string; // AI: Required for RLS policies - should never be undefined
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

export class ErrorTrackingFacade {
  /**
   * AI INSTRUCTIONS:
   * - Coordinate error tracking workflow
   * - Use domain service for categorization
   * - Use persistence service for database operations
   * - Use analytics service for querying
   * - Provide clean, simple API for consumers
   */

  constructor(
    private readonly categorizationService: ErrorCategorizationDomainService,
    private readonly persistenceService: ErrorPersistenceService,
    private readonly analyticsService: ErrorAnalyticsService
  ) {}

  // ===== CONVERSATION & MESSAGE PROCESSING ERRORS =====

  async trackMessageProcessingError(reason: string, context: ChatbotErrorContext): Promise<void> {
    const error = new MessageProcessingError(reason, context);
    await this.trackError(error, context);
  }

  async trackConversationFlowError(flowStep: string, context: ChatbotErrorContext): Promise<void> {
    const error = new ConversationFlowError(flowStep, context);
    await this.trackError(error, context);
  }

  async trackSessionManagementError(operation: string, context: ChatbotErrorContext): Promise<void> {
    const error = new SessionManagementError(operation, context);
    await this.trackError(error, context);
  }

  async trackContextExtractionError(contextType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new ContextExtractionError(contextType, context);
    await this.trackError(error, context);
  }

  // ===== AI & LLM ERRORS =====

  async trackAIResponseGenerationError(modelName: string, context: ChatbotErrorContext): Promise<void> {
    const error = new AIResponseGenerationError(modelName, context);
    await this.trackError(error, context);
  }

  async trackTokenLimitExceededError(tokenCount: number, limit: number, context: ChatbotErrorContext): Promise<void> {
    const error = new TokenLimitExceededError(tokenCount, limit, context);
    await this.trackError(error, context);
  }

  async trackModelConfigurationError(configType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new ModelConfigurationError(configType, context);
    await this.trackError(error, context);
  }

  async trackEmbeddingGenerationError(contentType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new EmbeddingGenerationError(contentType, context);
    await this.trackError(error, context);
  }

  // ===== KNOWLEDGE BASE ERRORS =====

  async trackKnowledgeRetrievalError(queryType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new KnowledgeRetrievalError(queryType, context);
    await this.trackError(error, context);
  }

  async trackVectorSearchError(searchType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new VectorSearchError(searchType, context);
    await this.trackError(error, context);
  }

  async trackKnowledgeIndexingError(contentType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new KnowledgeIndexingError(contentType, context);
    await this.trackError(error, context);
  }

  async trackKnowledgeCacheError(operation: string, context: ChatbotErrorContext): Promise<void> {
    const error = new KnowledgeCacheError(operation, context);
    await this.trackError(error, context);
  }

  // ===== WEBSITE CRAWLING ERRORS =====

  async trackWebsiteCrawlingError(url: string, reason: string, context: ChatbotErrorContext): Promise<void> {
    const error = new WebsiteCrawlingError(url, reason, context);
    await this.trackError(error, context);
  }

  async trackContentExtractionError(url: string, extractionType: string, context: ChatbotErrorContext): Promise<void> {
    const reason = `${extractionType} extraction failed for ${url}`;
    const enrichedContext = { ...context.metadata, url, extractionType };
    const error = new ContentExtractionError(reason, enrichedContext);
    await this.trackError(error, context);
  }

  async trackContentDeduplicationError(algorithm: string, context: ChatbotErrorContext): Promise<void> {
    const error = new ContentDeduplicationError(algorithm, context);
    await this.trackError(error, context);
  }

  async trackUrlNormalizationError(url: string, context: ChatbotErrorContext): Promise<void> {
    const error = new UrlNormalizationError(url, context);
    await this.trackError(error, context);
  }

  // ===== CONFIGURATION ERRORS =====

  async trackChatbotConfigurationError(configField: string, context: ChatbotErrorContext): Promise<void> {
    const error = new ChatbotConfigurationError(configField, context);
    await this.trackError(error, context);
  }

  async trackIntegrationConfigurationError(integrationType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new IntegrationConfigurationError(integrationType, context);
    await this.trackError(error, context);
  }

  // ===== LEAD MANAGEMENT ERRORS =====

  async trackLeadCaptureError(captureType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new LeadCaptureError(captureType, context);
    await this.trackError(error, context);
  }

  async trackLeadQualificationError(qualificationStep: string, context: ChatbotErrorContext): Promise<void> {
    const error = new LeadQualificationError(qualificationStep, context);
    await this.trackError(error, context);
  }

  // ===== ANALYTICS & TRACKING ERRORS =====

  async trackAnalyticsTrackingError(eventType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new AnalyticsTrackingError(eventType, context);
    await this.trackError(error, context);
  }

  async trackConversationAnalysisError(analysisType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new ConversationAnalysisError(analysisType, context);
    await this.trackError(error, context);
  }

  // ===== WIDGET RENDERING ERRORS =====

  async trackWidgetRenderingError(component: string, context: ChatbotErrorContext): Promise<void> {
    const error = new WidgetRenderingError(component, context);
    await this.trackError(error, context);
  }

  async trackWidgetConfigurationError(configType: string, context: ChatbotErrorContext): Promise<void> {
    const error = new WidgetConfigurationError(configType, context);
    await this.trackError(error, context);
  }

  // ===== EXTERNAL SERVICE ERRORS =====

  async trackExternalServiceError(serviceName: string, operation: string, context: ChatbotErrorContext): Promise<void> {
    const error = new ExternalServiceError(serviceName, operation, context);
    await this.trackError(error, context);
  }

  async trackAPIRateLimitError(apiProvider: string, context: ChatbotErrorContext): Promise<void> {
    const error = new APIRateLimitError(apiProvider, context);
    await this.trackError(error, context);
  }

  // ===== ANALYTICS METHODS =====

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

  // ===== PRIVATE HELPER METHODS =====

  private async trackError(error: any, context: ChatbotErrorContext): Promise<void> {
    try {
      // Use domain service to categorize error
      const categorization = this.categorizationService.categorizeError(error.code);
      
      // Check if error should be persisted
      const shouldPersist = this.categorizationService.shouldPersistError(error.code, context.metadata || {});
      
      if (shouldPersist) {
        // Sanitize context for persistence
        const sanitizedContext = this.categorizationService.sanitizeErrorContext(context.metadata || {});
        
        // Prepare persistence data
        const persistenceData: ErrorPersistenceData = {
          errorCode: error.code,
          errorMessage: error.message,
          errorContext: { ...error.context, ...sanitizedContext },
          timestamp: error.timestamp,
          stack: error.stack
        };

        const persistenceContext: ErrorPersistenceContext = {
          sessionId: context.sessionId,
          userId: context.userId,
          organizationId: context.organizationId,
          conversationId: context.conversationId,
          messageId: context.messageId,
          modelName: context.modelName,
          tokenUsage: context.tokenUsage,
          performanceMetrics: context.performanceMetrics,
          metadata: sanitizedContext
        };

        // Persist to database
        await this.persistenceService.persistError(persistenceData, categorization, persistenceContext);
      }

      // Always log to console based on severity
      this.logError(error, categorization.severity, context);
    } catch (err) {
      console.error('Failed to track error:', err);
      // Fallback logging
      console.error('Original error:', { code: error.code, message: error.message, context });
    }
  }

  private logError(error: any, severity: string, context: ChatbotErrorContext): void {
    const logData = {
      errorCode: error.code,
      errorMessage: error.message,
      severity,
      sessionId: context.sessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      timestamp: error.timestamp.toISOString()
    };

    switch (severity) {
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
          // AI: Removed console.log - use proper logging service in production
          break;
    }
  }

  private sanitizeUnifiedResult(result: any): any {
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
} 
/**
 * Error Tracking Facade
 * 
 * AI INSTRUCTIONS:
 * - Facade pattern for unified error tracking API
 * - Single responsibility: coordinate error tracking services
 * - Follow @golden-rule patterns exactly
 * - Keep under 120 lines
 * - Delegate to specialized services
 * - Clean public API for consumers
 */

import { ErrorCategorizationDomainService } from '../../domain/services/ErrorCategorizationDomainService';
import { ErrorPersistenceService, ErrorPersistenceContext, ErrorPersistenceData } from '../../infrastructure/persistence/supabase/ErrorPersistenceService';
import { ErrorCategoryTrackersService, ChatbotErrorContext } from './ErrorCategoryTrackersService';
import { ErrorAnalyticsQueryService } from './ErrorAnalyticsQueryService';
import { ErrorTrackingUtilitiesService } from './ErrorTrackingUtilitiesService';
import { ErrorSummary } from './ErrorAnalyticsService';

// Re-export interface for consumers
export type { ChatbotErrorContext } from './ErrorCategoryTrackersService';

export class ErrorTrackingFacade {
  /**
   * AI INSTRUCTIONS:
   * - Coordinate error tracking workflow through specialized services
   * - Use domain service for categorization
   * - Use persistence service for database operations
   * - Delegate specific operations to focused services
   * - Provide clean, simple API for consumers
   */

  private readonly categoryTrackers: ErrorCategoryTrackersService;
  private readonly analyticsQuery: ErrorAnalyticsQueryService;
  private readonly utilities: ErrorTrackingUtilitiesService;

  constructor(
    private readonly categorizationService: ErrorCategorizationDomainService,
    private readonly persistenceService: ErrorPersistenceService,
    analyticsQueryService: ErrorAnalyticsQueryService
  ) {
    this.categoryTrackers = new ErrorCategoryTrackersService(this.trackError.bind(this));
    this.analyticsQuery = analyticsQueryService;
    this.utilities = new ErrorTrackingUtilitiesService();
  }

  // ===== DELEGATION TO CATEGORY TRACKERS =====
  // All specific error tracking methods delegate to ErrorCategoryTrackersService

  async trackMessageProcessingError(reason: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackMessageProcessingError(reason, context);
  }

  async trackConversationFlowError(flowStep: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackConversationFlowError(flowStep, context);
  }

  async trackSessionManagementError(operation: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackSessionManagementError(operation, context);
  }

  async trackContextExtractionError(contextType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackContextExtractionError(contextType, context);
  }

  async trackAIResponseGenerationError(modelName: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackAIResponseGenerationError(modelName, context);
  }

  async trackTokenLimitExceededError(tokenCount: number, limit: number, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackTokenLimitExceededError(tokenCount, limit, context);
  }

  async trackModelConfigurationError(configType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackModelConfigurationError(configType, context);
  }

  async trackEmbeddingGenerationError(contentType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackEmbeddingGenerationError(contentType, context);
  }

  async trackKnowledgeRetrievalError(queryType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackKnowledgeRetrievalError(queryType, context);
  }

  async trackVectorSearchError(searchType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackVectorSearchError(searchType, context);
  }

  async trackKnowledgeIndexingError(contentType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackKnowledgeIndexingError(contentType, context);
  }

  async trackKnowledgeCacheError(operation: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackKnowledgeCacheError(operation, context);
  }

  async trackWebsiteCrawlingError(url: string, reason: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackWebsiteCrawlingError(url, reason, context);
  }

  async trackContentExtractionError(url: string, extractionType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackContentExtractionError(url, extractionType, context);
  }

  async trackContentDeduplicationError(algorithm: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackContentDeduplicationError(algorithm, context);
  }

  async trackUrlNormalizationError(url: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackUrlNormalizationError(url, context);
  }

  async trackChatbotConfigurationError(configField: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackChatbotConfigurationError(configField, context);
  }

  async trackIntegrationConfigurationError(integrationType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackIntegrationConfigurationError(integrationType, context);
  }

  async trackLeadCaptureError(captureType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackLeadCaptureError(captureType, context);
  }

  async trackLeadQualificationError(qualificationStep: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackLeadQualificationError(qualificationStep, context);
  }

  async trackAnalyticsTrackingError(eventType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackAnalyticsTrackingError(eventType, context);
  }

  async trackConversationAnalysisError(analysisType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackConversationAnalysisError(analysisType, context);
  }

  async trackWidgetRenderingError(component: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackWidgetRenderingError(component, context);
  }

  async trackWidgetConfigurationError(configType: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackWidgetConfigurationError(configType, context);
  }

  async trackExternalServiceError(serviceName: string, operation: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackExternalServiceError(serviceName, operation, context);
  }

  async trackAPIRateLimitError(apiProvider: string, context: ChatbotErrorContext): Promise<void> {
    return this.categoryTrackers.trackAPIRateLimitError(apiProvider, context);
  }

  // ===== DELEGATION TO ANALYTICS QUERY SERVICE =====

  async getErrorSummary(organizationId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ErrorSummary> {
    return this.analyticsQuery.getErrorSummary(organizationId, timeRange);
  }

  async getErrorsBySession(sessionId: string, organizationId: string): Promise<ErrorSummary> {
    return this.analyticsQuery.getErrorsBySession(sessionId, organizationId);
  }

  async getErrorsByUser(userId: string, organizationId: string): Promise<ErrorSummary> {
    return this.analyticsQuery.getErrorsByUser(userId, organizationId);
  }

  async getErrorTrends(organizationId: string, timeRange: '7d' | '30d' = '30d'): Promise<ErrorSummary> {
    return this.analyticsQuery.getErrorTrends(organizationId, timeRange);
  }

  async getCriticalErrors(organizationId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ErrorSummary> {
    return this.analyticsQuery.getCriticalErrors(organizationId, timeRange);
  }

  // ===== CORE TRACKING ORCHESTRATION =====

  private async trackError(error: Error & { code: string; context?: unknown; timestamp?: Date }, context: ChatbotErrorContext): Promise<void> {
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
          errorContext: { 
            ...(error.context && typeof error.context === 'object' ? error.context : {}), 
            ...sanitizedContext 
          },
          timestamp: error.timestamp || new Date(),
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

      // Always log to console based on severity using utilities service
      this.utilities.logError(error, categorization.severity, context);
    } catch (err) {
      console.error('Failed to track error:', err);
      // Fallback logging
      console.error('Original error:', { code: error.code, message: error.message, context });
    }
  }
} 
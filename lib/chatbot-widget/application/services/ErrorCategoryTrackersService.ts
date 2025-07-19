/**
 * Error Category Trackers Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: organize error tracking methods by domain category
 * - Follow @golden-rule patterns exactly
 * - Keep under 180 lines
 * - Clean organization of tracking methods
 * - Delegate actual tracking to main facade
 */

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
  APIRateLimitError
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
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ErrorCategoryTrackersService {
  /**
   * AI INSTRUCTIONS:
   * - Organize error tracking methods by domain category
   * - Each method creates appropriate domain error and delegates to tracker
   * - Maintain organizationId in all contexts for security
   * - Keep methods focused and consistent
   */

  constructor(
    private readonly trackError: (error: Error & { code: string; context?: unknown; timestamp?: Date }, context: ChatbotErrorContext) => Promise<void>
  ) {}

  // ===== CONVERSATION & MESSAGE PROCESSING ERRORS =====

  async trackMessageProcessingError(reason: string, context: ChatbotErrorContext): Promise<void> {
    const error = new MessageProcessingError(reason, context as Record<string, unknown>);
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
}
/**
 * Chatbot Widget Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Single source of truth for all chatbot widget domain errors
 * - Follow @golden-rule DDD error handling patterns exactly
 * - Create specific error types for each business rule violation
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Never expose technical details to domain layer
 * - Keep under 250 lines per error category section
 * - Self-contained - no external error dependencies
 */

// ===== DOMAIN ERROR HIERARCHY (Following @golden-rule patterns) =====

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Domain Error Base Class
 * 
 * AI INSTRUCTIONS:
 * - Base class for all chatbot widget domain errors
 * - Include context, severity, and timestamp for tracking
 * - Never expose technical details to domain layer
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly severity: ErrorSeverity;
  
  constructor(
    message: string,
    public readonly context: Record<string, any> = {},
    public readonly timestamp: Date = new Date()
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ===== CONVERSATION & MESSAGE PROCESSING ERRORS =====

export class MessageProcessingError extends DomainError {
  readonly code = 'MESSAGE_PROCESSING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(reason: string, context: Record<string, any> = {}) {
    super(`Message processing failed: ${reason}`, context);
  }
}

export class ConversationFlowError extends DomainError {
  readonly code = 'CONVERSATION_FLOW_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(flowStep: string, context: Record<string, any> = {}) {
    super(`Conversation flow error at step: ${flowStep}`, context);
  }
}

export class SessionManagementError extends DomainError {
  readonly code = 'SESSION_MANAGEMENT_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(operation: string, context: Record<string, any> = {}) {
    super(`Session management error during: ${operation}`, context);
  }
}

export class ContextExtractionError extends DomainError {
  readonly code = 'CONTEXT_EXTRACTION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(contextType: string, context: Record<string, any> = {}) {
    super(`Context extraction failed for: ${contextType}`, context);
  }
}

// ===== CONTEXT MANAGEMENT ERRORS (from ContextManagementErrors.ts) =====

export class ContextWindowExceededError extends DomainError {
  readonly code = 'CONTEXT_WINDOW_EXCEEDED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(currentTokens: number, maxTokens: number, context: Record<string, any> = {}) {
    super(
      `Context window exceeded: ${currentTokens} tokens exceeds limit of ${maxTokens}`,
      { ...context, currentTokens, maxTokens }
    );
  }
}

export class SummarizationFailedError extends DomainError {
  readonly code = 'SUMMARIZATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(reason: string, context: Record<string, any> = {}) {
    super(`Conversation summarization failed: ${reason}`, context);
  }
}

export class InvalidConversationPhaseError extends DomainError {
  readonly code = 'INVALID_CONVERSATION_PHASE';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(currentPhase: string, attemptedPhase: string, context: Record<string, any> = {}) {
    super(
      `Invalid phase transition from ${currentPhase} to ${attemptedPhase}`,
      { ...context, currentPhase, attemptedPhase }
    );
  }
}

export class MessageRelevanceCalculationError extends DomainError {
  readonly code = 'MESSAGE_RELEVANCE_CALCULATION_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(messageId: string, reason: string, context: Record<string, any> = {}) {
    super(
      `Failed to calculate relevance for message ${messageId}: ${reason}`,
      { ...context, messageId, reason }
    );
  }
}

export class ContextCompressionError extends DomainError {
  readonly code = 'CONTEXT_COMPRESSION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(compressionType: string, reason: string, context: Record<string, any> = {}) {
    super(
      `Context compression failed for ${compressionType}: ${reason}`,
      { ...context, compressionType, reason }
    );
  }
}

export class ConversationFlowViolationError extends DomainError {
  readonly code = 'CONVERSATION_FLOW_VIOLATION';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(violation: string, context: Record<string, any> = {}) {
    super(`Conversation flow violation: ${violation}`, context);
  }
}

// ===== RESPONSE PROCESSING ERRORS (from ResponseProcessingErrors.ts) =====

export class ResponseExtractionError extends DomainError {
  readonly code = 'RESPONSE_EXTRACTION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(reason: string, context: Record<string, any> = {}) {
    super(`Response extraction failed: ${reason}`, context);
  }
}

export class UnifiedResultParsingError extends DomainError {
  readonly code = 'UNIFIED_RESULT_PARSING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(expectedStructure: string, actualStructure: any, context: Record<string, any> = {}) {
    super(`Unified result parsing failed: expected ${expectedStructure}`, {
      ...context,
      expectedStructure,
      actualStructure: JSON.stringify(actualStructure, null, 2)
    });
  }
}

export class FallbackResponseTriggeredError extends DomainError {
  readonly code = 'FALLBACK_RESPONSE_TRIGGERED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(reason: string, context: Record<string, any> = {}) {
    super(`Fallback response triggered: ${reason}`, context);
  }
}

// ===== AI & LLM ERRORS =====

export class AIResponseGenerationError extends DomainError {
  readonly code = 'AI_RESPONSE_GENERATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(modelName: string, context: Record<string, any> = {}) {
    super(`AI response generation failed for model: ${modelName}`, context);
  }
}

export class TokenLimitExceededError extends DomainError {
  readonly code = 'TOKEN_LIMIT_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(tokenCount: number, limit: number, context: Record<string, any> = {}) {
    super(`Token limit exceeded: ${tokenCount}/${limit}`, { ...context, tokenCount, limit });
  }
}

export class ModelConfigurationError extends DomainError {
  readonly code = 'MODEL_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(configType: string, context: Record<string, any> = {}) {
    super(`Model configuration error: ${configType}`, context);
  }
}

export class EmbeddingGenerationError extends DomainError {
  readonly code = 'EMBEDDING_GENERATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(contentType: string, context: Record<string, any> = {}) {
    super(`Embedding generation failed for: ${contentType}`, context);
  }
}

// ===== KNOWLEDGE BASE ERRORS =====

export class KnowledgeRetrievalError extends DomainError {
  readonly code = 'KNOWLEDGE_RETRIEVAL_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(queryType: string, context: Record<string, any> = {}) {
    super(`Knowledge retrieval failed for: ${queryType}`, context);
  }
}

export class VectorSearchError extends DomainError {
  readonly code = 'VECTOR_SEARCH_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(searchType: string, context: Record<string, any> = {}) {
    super(`Vector search failed: ${searchType}`, context);
  }
}

export class KnowledgeIndexingError extends DomainError {
  readonly code = 'KNOWLEDGE_INDEXING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(contentType: string, context: Record<string, any> = {}) {
    super(`Knowledge indexing failed for: ${contentType}`, context);
  }
}

export class KnowledgeCacheError extends DomainError {
  readonly code = 'KNOWLEDGE_CACHE_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(operation: string, context: Record<string, any> = {}) {
    super(`Knowledge cache error during: ${operation}`, context);
  }
}

// ===== WEBSITE CRAWLING ERRORS (from WebsiteCrawlingErrors.ts) =====

export class WebsiteCrawlingError extends DomainError {
  readonly code = 'WEBSITE_CRAWLING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(url: string, reason: string, context: Record<string, any> = {}) {
    super(`Website crawling failed for ${url}: ${reason}`, { ...context, url, reason });
  }
}

export class ContentExtractionError extends DomainError {
  readonly code = 'CONTENT_EXTRACTION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(url: string, extractionType: string, context: Record<string, any> = {}) {
    super(`Content extraction failed for ${url}: ${extractionType}`, { ...context, url, extractionType });
  }
}

export class InvalidUrlError extends DomainError {
  readonly code = 'INVALID_URL';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(url: string, reason: string, context: Record<string, any> = {}) {
    super(`Invalid URL: ${url} - ${reason}`, { ...context, url, reason });
  }
}

export class WebsiteAccessibilityError extends DomainError {
  readonly code = 'WEBSITE_INACCESSIBLE';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(url: string, reason: string, context: Record<string, any> = {}) {
    super(`Website accessibility issue for ${url}: ${reason}`, { ...context, url, reason });
  }
}

export class CrawlLimitExceededError extends DomainError {
  readonly code = 'CRAWL_LIMIT_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(limit: number, attempted: number, context: Record<string, any> = {}) {
    super(`Crawl limit exceeded: attempted ${attempted}, limit ${limit}`, { ...context, limit, attempted });
  }
}

export class RobotsTxtViolationError extends DomainError {
  readonly code = 'ROBOTS_TXT_VIOLATION';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(url: string, rule: string, context: Record<string, any> = {}) {
    super(`Robots.txt violation for ${url}: ${rule}`, { ...context, url, rule });
  }
}

export class ContentCategorizationError extends DomainError {
  readonly code = 'CONTENT_CATEGORIZATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(contentType: string, reason: string, context: Record<string, any> = {}) {
    super(`Content categorization failed for ${contentType}: ${reason}`, { ...context, contentType, reason });
  }
}

export class ContentDeduplicationError extends DomainError {
  readonly code = 'CONTENT_DEDUPLICATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(algorithm: string, context: Record<string, any> = {}) {
    super(`Content deduplication failed using: ${algorithm}`, context);
  }
}

export class UrlNormalizationError extends DomainError {
  readonly code = 'URL_NORMALIZATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(url: string, context: Record<string, any> = {}) {
    super(`URL normalization failed for: ${url}`, { ...context, url });
  }
}

// ===== CONFIGURATION ERRORS =====

export class ChatbotConfigurationError extends DomainError {
  readonly code = 'CHATBOT_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(configField: string, context: Record<string, any> = {}) {
    super(`Chatbot configuration error: ${configField}`, context);
  }
}

export class IntegrationConfigurationError extends DomainError {
  readonly code = 'INTEGRATION_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(integrationType: string, context: Record<string, any> = {}) {
    super(`Integration configuration error: ${integrationType}`, context);
  }
}

// ===== LEAD MANAGEMENT ERRORS =====

export class LeadCaptureError extends DomainError {
  readonly code = 'LEAD_CAPTURE_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(captureType: string, context: Record<string, any> = {}) {
    super(`Lead capture failed: ${captureType}`, context);
  }
}

export class LeadQualificationError extends DomainError {
  readonly code = 'LEAD_QUALIFICATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(qualificationStep: string, context: Record<string, any> = {}) {
    super(`Lead qualification failed at step: ${qualificationStep}`, context);
  }
}

// ===== ANALYTICS & TRACKING ERRORS =====

export class AnalyticsTrackingError extends DomainError {
  readonly code = 'ANALYTICS_TRACKING_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(eventType: string, context: Record<string, any> = {}) {
    super(`Analytics tracking failed for event: ${eventType}`, context);
  }
}

export class ConversationAnalysisError extends DomainError {
  readonly code = 'CONVERSATION_ANALYSIS_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(analysisType: string, context: Record<string, any> = {}) {
    super(`Conversation analysis failed: ${analysisType}`, context);
  }
}

// ===== WIDGET RENDERING ERRORS =====

export class WidgetRenderingError extends DomainError {
  readonly code = 'WIDGET_RENDERING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(component: string, context: Record<string, any> = {}) {
    super(`Widget rendering failed for component: ${component}`, context);
  }
}

export class WidgetConfigurationError extends DomainError {
  readonly code = 'WIDGET_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(configType: string, context: Record<string, any> = {}) {
    super(`Widget configuration error: ${configType}`, context);
  }
}

// ===== EXTERNAL SERVICE ERRORS =====

export class ExternalServiceError extends DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(serviceName: string, operation: string, context: Record<string, any> = {}) {
    super(`External service error in ${serviceName} during ${operation}`, { ...context, serviceName, operation });
  }
}

export class APIRateLimitError extends DomainError {
  readonly code = 'API_RATE_LIMIT_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(apiProvider: string, context: Record<string, any> = {}) {
    super(`API rate limit exceeded for: ${apiProvider}`, context);
  }
}

// ===== DATA PERSISTENCE ERRORS =====

export class DataPersistenceError extends DomainError {
  readonly code = 'DATA_PERSISTENCE_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(operation: string, entityType: string, context: Record<string, any> = {}) {
    super(`Data persistence failed: ${operation} on ${entityType}`, { ...context, operation, entityType });
  }
}

export class DataValidationError extends DomainError {
  readonly code = 'DATA_VALIDATION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(field: string, validationRule: string, context: Record<string, any> = {}) {
    super(`Data validation failed for ${field}: ${validationRule}`, { ...context, field, validationRule });
  }
}

// ===== SECURITY ERRORS =====

export class SecurityViolationError extends DomainError {
  readonly code = 'SECURITY_VIOLATION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(violationType: string, context: Record<string, any> = {}) {
    super(`Security violation: ${violationType}`, context);
  }
}

export class AuthenticationError extends DomainError {
  readonly code = 'AUTHENTICATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(authType: string, context: Record<string, any> = {}) {
    super(`Authentication failed: ${authType}`, context);
  }
}

export class AuthorizationError extends DomainError {
  readonly code = 'AUTHORIZATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(resource: string, action: string, context: Record<string, any> = {}) {
    super(`Authorization failed: ${action} on ${resource}`, { ...context, resource, action });
  }
}

// ===== PERFORMANCE ERRORS =====

export class PerformanceThresholdError extends DomainError {
  readonly code = 'PERFORMANCE_THRESHOLD_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(metric: string, threshold: number, actual: number, context: Record<string, any> = {}) {
    super(
      `Performance threshold exceeded for ${metric}: ${actual} > ${threshold}`,
      { ...context, metric, threshold, actual }
    );
  }
}

export class ResourceExhaustionError extends DomainError {
  readonly code = 'RESOURCE_EXHAUSTION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(resourceType: string, context: Record<string, any> = {}) {
    super(`Resource exhaustion: ${resourceType}`, context);
  }
}

// ===== BUSINESS RULE ERRORS (Following @golden-rule patterns) =====

export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Business rule violated: ${rule}`, context);
  }
}

export class InvariantViolationError extends DomainError {
  readonly code = 'INVARIANT_VIOLATION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(invariant: string, context: Record<string, any> = {}) {
    super(`Domain invariant violated: ${invariant}`, context);
  }
}

export class ResourceNotFoundError extends DomainError {
  readonly code = 'RESOURCE_NOT_FOUND';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(resourceType: string, identifier: string, context: Record<string, any> = {}) {
    super(`${resourceType} not found: ${identifier}`, { ...context, resourceType, identifier });
  }
} 
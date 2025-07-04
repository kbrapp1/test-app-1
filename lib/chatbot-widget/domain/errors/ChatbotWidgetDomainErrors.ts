/**
 * Chatbot Widget Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Define specific error types for all chatbot widget scenarios
 * - Include context for debugging and tracking
 * - Follow @golden-rule error handling patterns
 * - Use for comprehensive error tracking across the domain
 */

import { DomainError, ErrorSeverity } from './BusinessRuleViolationError';

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

// ===== WEBSITE CRAWLING ERRORS =====

export class WebsiteCrawlingError extends DomainError {
  readonly code = 'WEBSITE_CRAWLING_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
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
    super(`Lead qualification failed at: ${qualificationStep}`, context);
  }
}

// ===== ANALYTICS & TRACKING ERRORS =====

export class AnalyticsTrackingError extends DomainError {
  readonly code = 'ANALYTICS_TRACKING_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(eventType: string, context: Record<string, any> = {}) {
    super(`Analytics tracking failed for: ${eventType}`, context);
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
    super(`Widget rendering failed for: ${component}`, context);
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
    super(`External service error: ${serviceName} - ${operation}`, { ...context, serviceName, operation });
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
    super(`Data persistence failed: ${operation} ${entityType}`, { ...context, operation, entityType });
  }
}

export class DataValidationError extends DomainError {
  readonly code = 'DATA_VALIDATION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(field: string, validationRule: string, context: Record<string, any> = {}) {
    super(`Data validation failed: ${field} - ${validationRule}`, { ...context, field, validationRule });
  }
}

// ===== SECURITY ERRORS =====

export class SecurityViolationError extends DomainError {
  readonly code = 'SECURITY_VIOLATION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(violationType: string, context: Record<string, any> = {}) {
    super(`Security violation detected: ${violationType}`, context);
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
    super(`Performance threshold exceeded: ${metric} ${actual}ms > ${threshold}ms`, { 
      ...context, 
      metric, 
      threshold, 
      actual 
    });
  }
}

export class ResourceExhaustionError extends DomainError {
  readonly code = 'RESOURCE_EXHAUSTION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(resourceType: string, context: Record<string, any> = {}) {
    super(`Resource exhaustion: ${resourceType}`, context);
  }
} 
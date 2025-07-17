/**
 * Chatbot Widget Domain Errors - Unified Export
 * 
 * AI INSTRUCTIONS:
 * - Single source of truth for all chatbot widget domain errors
 * - Follow @golden-rule DDD error handling patterns exactly
 * - Exports all error types from focused domain error files
 * - Maintains backward compatibility while improving organization
 * - Keep under 250 lines - focused on exports and re-exports
 * - Clean architecture: Each error category in separate focused file
 */

// ===== BASE ERROR FOUNDATION =====
export {
  ErrorSeverity,
  DomainError,
  BusinessRuleViolationError,
  InvariantViolationError,
  ResourceNotFoundError
} from './base/DomainErrorBase';

// Import types for utility classes
import {
  ErrorSeverity,
  DomainError,
  BusinessRuleViolationError,
  InvariantViolationError,
  ResourceNotFoundError
} from './base/DomainErrorBase';

import { DatabaseError } from './InfrastructureErrors';
import { AIResponseGenerationError, KnowledgeRetrievalError } from './AIProcessingErrors';

// ===== CONVERSATION & MESSAGING ERRORS =====
export {
  // Message Processing
  MessageProcessingError,
  ConversationFlowError,
  SessionManagementError,
  ContextExtractionError,
  
  // Context Management
  ContextWindowExceededError,
  SummarizationFailedError,
  InvalidConversationPhaseError,
  MessageRelevanceCalculationError,
  ContextCompressionError,
  ConversationFlowViolationError,
  
  // Response Processing
  ResponseExtractionError,
  UnifiedResultParsingError,
  FallbackResponseTriggeredError,
  
  // Lead Management
  LeadCaptureError,
  LeadQualificationError,
  
  // Analytics & Tracking
  AnalyticsTrackingError,
  ConversationAnalysisError
} from './ConversationErrors';

// ===== AI PROCESSING & KNOWLEDGE MANAGEMENT ERRORS =====
export {
  // AI & LLM Processing
  AIResponseGenerationError,
  TokenLimitExceededError,
  ModelConfigurationError,
  EmbeddingGenerationError,
  
  // Knowledge Base
  KnowledgeRetrievalError,
  VectorSearchError,
  KnowledgeIndexingError,
  KnowledgeCacheError,
  
  // Website Crawling & Content Processing
  WebsiteCrawlingError,
  ContentExtractionError,
  InvalidUrlError,
  WebsiteAccessibilityError,
  CrawlLimitExceededError,
  RobotsTxtViolationError,
  ContentCategorizationError,
  ContentDeduplicationError,
  UrlNormalizationError
} from './AIProcessingErrors';

// ===== INFRASTRUCTURE & EXTERNAL SERVICE ERRORS =====
export {
  // External Services
  ExternalServiceError,
  APIRateLimitError,
  
  // Data Persistence
  DataPersistenceError,
  DatabaseError,
  DataValidationError,
  
  // Security
  SecurityViolationError,
  AuthenticationError,
  AuthorizationError,
  
  // Performance
  PerformanceThresholdError,
  ResourceExhaustionError,
  
  // Widget Rendering
  WidgetRenderingError,
  WidgetConfigurationError
} from './InfrastructureErrors';

// ===== BUSINESS DOMAIN & CONFIGURATION ERRORS =====
export {
  // Configuration
  ChatbotConfigurationError,
  IntegrationConfigurationError
} from './BusinessDomainErrors';

// ===== ERROR UTILITIES & HELPERS =====

/** Error Factory for Common Patterns */
export class ChatbotErrorFactory {
  static createBusinessRuleViolation(rule: string, context?: Record<string, unknown>): BusinessRuleViolationError {
    return new BusinessRuleViolationError(rule, context);
  }
  
  static createResourceNotFound(resourceType: string, identifier: string, context?: Record<string, unknown>): ResourceNotFoundError {
    return new ResourceNotFoundError(resourceType, identifier, context);
  }
  
  static createDatabaseError(message: string, errorDetail?: string | Record<string, unknown>): DatabaseError {
    return new DatabaseError(message, errorDetail);
  }
  
  static createAIProcessingError(modelName: string, context?: Record<string, unknown>): AIResponseGenerationError {
    return new AIResponseGenerationError(modelName, context);
  }
  
  static createKnowledgeRetrievalError(queryType: string, context?: Record<string, unknown>): KnowledgeRetrievalError {
    return new KnowledgeRetrievalError(queryType, context);
  }
}

/** Error Severity Utilities */
export class ErrorSeverityUtils {
  static isCritical(error: DomainError): boolean {
    return error.severity === ErrorSeverity.CRITICAL;
  }
  
  static isHigh(error: DomainError): boolean {
    return error.severity === ErrorSeverity.HIGH;
  }
  
  static requiresImmediateAttention(error: DomainError): boolean {
    return error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH;
  }
  
  static canBeRetried(error: DomainError): boolean {
    // Business rule violations and invariant violations should not be retried
    return !(error instanceof BusinessRuleViolationError || error instanceof InvariantViolationError);
  }
}

/** Error Context Utilities */
export class ErrorContextUtils {
  static enrichWithTimestamp(context: Record<string, unknown>): Record<string, unknown> {
    return {
      ...context,
      timestamp: new Date().toISOString(),
      enrichedAt: Date.now()
    };
  }
  
  static enrichWithSession(context: Record<string, unknown>, sessionId: string): Record<string, unknown> {
    return {
      ...context,
      sessionId,
      sessionContext: true
    };
  }
  
  static enrichWithOperation(context: Record<string, unknown>, operation: string): Record<string, unknown> {
    return {
      ...context,
      operation,
      operationContext: true
    };
  }
} 
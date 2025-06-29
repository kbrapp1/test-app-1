/**
 * Context Management Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Create specific error types for each business rule violation in context management
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Never expose technical details to domain layer
 * - Follow @golden-rule patterns exactly
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

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

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

export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Business rule violated: ${rule}`, context);
  }
} 
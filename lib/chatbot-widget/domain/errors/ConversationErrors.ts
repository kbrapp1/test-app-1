/**
 * Conversation and Messaging Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Conversation flow and message processing errors
 * - Follow @golden-rule DDD error handling patterns exactly
 * - Create specific error types for each conversation business rule
 * - Include relevant context for debugging and user feedback
 * - Keep under 250 lines - focused domain responsibility
 * - Import base patterns from DomainErrorBase
 */

import { DomainError, ErrorSeverity } from './base/DomainErrorBase';

// ===== MESSAGE PROCESSING ERRORS =====

export class MessageProcessingError extends DomainError {
  readonly code = 'MESSAGE_PROCESSING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(reason: string, context: Record<string, unknown> = {}) {
    super(`Message processing failed: ${reason}`, context);
  }
}

export class ConversationFlowError extends DomainError {
  readonly code = 'CONVERSATION_FLOW_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(flowStep: string, context: Record<string, unknown> = {}) {
    super(`Conversation flow error at step: ${flowStep}`, context);
  }
}

export class SessionManagementError extends DomainError {
  readonly code = 'SESSION_MANAGEMENT_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(operation: string, context: Record<string, unknown> = {}) {
    super(`Session management error during: ${operation}`, context);
  }
}

export class ContextExtractionError extends DomainError {
  readonly code = 'CONTEXT_EXTRACTION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(contextType: string, context: Record<string, unknown> = {}) {
    super(`Context extraction failed for: ${contextType}`, context);
  }
}

// ===== CONTEXT MANAGEMENT ERRORS =====

export class ContextWindowExceededError extends DomainError {
  readonly code = 'CONTEXT_WINDOW_EXCEEDED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(currentTokens: number, maxTokens: number, context: Record<string, unknown> = {}) {
    super(
      `Context window exceeded: ${currentTokens} tokens exceeds limit of ${maxTokens}`,
      { ...context, currentTokens, maxTokens }
    );
  }
}

export class SummarizationFailedError extends DomainError {
  readonly code = 'SUMMARIZATION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(reason: string, context: Record<string, unknown> = {}) {
    super(`Conversation summarization failed: ${reason}`, context);
  }
}

export class InvalidConversationPhaseError extends DomainError {
  readonly code = 'INVALID_CONVERSATION_PHASE';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(currentPhase: string, attemptedPhase: string, context: Record<string, unknown> = {}) {
    super(
      `Invalid phase transition from ${currentPhase} to ${attemptedPhase}`,
      { ...context, currentPhase, attemptedPhase }
    );
  }
}

export class MessageRelevanceCalculationError extends DomainError {
  readonly code = 'MESSAGE_RELEVANCE_CALCULATION_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(messageId: string, reason: string, context: Record<string, unknown> = {}) {
    super(
      `Failed to calculate relevance for message ${messageId}: ${reason}`,
      { ...context, messageId, reason }
    );
  }
}

export class ContextCompressionError extends DomainError {
  readonly code = 'CONTEXT_COMPRESSION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(compressionType: string, reason: string, context: Record<string, unknown> = {}) {
    super(
      `Context compression failed for ${compressionType}: ${reason}`,
      { ...context, compressionType, reason }
    );
  }
}

export class ConversationFlowViolationError extends DomainError {
  readonly code = 'CONVERSATION_FLOW_VIOLATION';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(violation: string, context: Record<string, unknown> = {}) {
    super(`Conversation flow violation: ${violation}`, context);
  }
}

// ===== RESPONSE PROCESSING ERRORS =====

export class ResponseExtractionError extends DomainError {
  readonly code = 'RESPONSE_EXTRACTION_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(reason: string, context: Record<string, unknown> = {}) {
    super(`Response extraction failed: ${reason}`, context);
  }
}

export class UnifiedResultParsingError extends DomainError {
  readonly code = 'UNIFIED_RESULT_PARSING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(expectedStructure: string, actualStructure: unknown, context: Record<string, unknown> = {}) {
    super(`Unified result parsing failed: expected ${expectedStructure}`, {
      ...context,
      expectedStructure,
      actualStructure: typeof actualStructure === 'object' ? 
        JSON.stringify(actualStructure, null, 2) : 
        String(actualStructure)
    });
  }
}

export class FallbackResponseTriggeredError extends DomainError {
  readonly code = 'FALLBACK_RESPONSE_TRIGGERED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(reason: string, context: Record<string, unknown> = {}) {
    super(`Fallback response triggered: ${reason}`, context);
  }
}

// ===== LEAD MANAGEMENT ERRORS =====

export class LeadCaptureError extends DomainError {
  readonly code = 'LEAD_CAPTURE_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(captureType: string, context: Record<string, unknown> = {}) {
    super(`Lead capture failed: ${captureType}`, context);
  }
}

export class LeadQualificationError extends DomainError {
  readonly code = 'LEAD_QUALIFICATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(qualificationStep: string, context: Record<string, unknown> = {}) {
    super(`Lead qualification failed at step: ${qualificationStep}`, context);
  }
}

// ===== ANALYTICS & TRACKING ERRORS =====

export class AnalyticsTrackingError extends DomainError {
  readonly code = 'ANALYTICS_TRACKING_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(eventType: string, context: Record<string, unknown> = {}) {
    super(`Analytics tracking failed for event: ${eventType}`, context);
  }
}

export class ConversationAnalysisError extends DomainError {
  readonly code = 'CONVERSATION_ANALYSIS_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(analysisType: string, context: Record<string, unknown> = {}) {
    super(`Conversation analysis failed: ${analysisType}`, context);
  }
} 
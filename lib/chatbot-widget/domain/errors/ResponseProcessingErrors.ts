/**
 * Response Processing Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Define specific error types for response processing failures
 * - Include context for debugging and tracking
 * - Follow @golden-rule error handling patterns
 * - Use for database tracking and logging
 */

import { DomainError, ErrorSeverity } from './BusinessRuleViolationError';

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
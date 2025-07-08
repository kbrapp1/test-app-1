/**
 * ContentValidationError Domain Error
 * 
 * AI INSTRUCTIONS:
 * - Specific error type for content validation failures
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Follow @golden-rule domain error hierarchy patterns
 * - Capture business context without exposing technical details
 */

import { DomainError, ErrorSeverity } from './base/DomainErrorBase';

export class ContentValidationError extends DomainError {
  readonly code = 'CONTENT_VALIDATION_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;

  /**
   * Create a new ContentValidationError
   * 
   * AI INSTRUCTIONS:
   * - Provide clear error message for content validation failures
   * - Include context about what failed validation
   * - Support debugging and error recovery
   * - Maintain user-friendly error messages
   */
  constructor(message: string, context: Record<string, any> = {}) {
    super(`Content validation failed: ${message}`, {
      ...context,
      domain: 'content-processing',
      operation: 'validation'
    });
  }

  /** Create error for invalid content type */
  static invalidContentType(contentType: string, validTypes: string[]): ContentValidationError {
    return new ContentValidationError(
      `Invalid content type: ${contentType}`,
      { 
        providedType: contentType, 
        validTypes,
        errorType: 'invalid_content_type'
      }
    );
  }

  /** Create error for validation rule violation */
  static ruleViolation(rule: string, contentType: string, details?: Record<string, any>): ContentValidationError {
    return new ContentValidationError(
      `Content violates validation rule: ${rule}`,
      { 
        rule, 
        contentType,
        ...details,
        errorType: 'rule_violation'
      }
    );
  }

  /** Create error for empty content */
  static emptyContent(contentType: string): ContentValidationError {
    return new ContentValidationError(
      'Content cannot be empty for validation',
      { 
        contentType,
        errorType: 'empty_content'
      }
    );
  }

  /** Create error for validation processing failure */
  static processingFailure(contentType: string, originalError: Error): ContentValidationError {
    return new ContentValidationError(
      'Failed to process content during validation',
      { 
        contentType,
        originalError: originalError.message,
        errorType: 'processing_failure'
      }
    );
  }

  /**
   * Create error for invalid input parameters
   */
  static invalidInput(parameterName: string, expectedType: string, actualValue: any): ContentValidationError {
    return new ContentValidationError(
      `Invalid input parameter: ${parameterName} must be ${expectedType}`,
      { 
        parameterName,
        expectedType,
        actualValue: typeof actualValue,
        errorType: 'invalid_input'
      }
    );
  }
} 
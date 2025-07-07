/**
 * ContentSanitizationError Domain Error
 * 
 * AI INSTRUCTIONS:
 * - Specific error type for content sanitization failures
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Follow @golden-rule domain error hierarchy patterns
 * - Capture business context without exposing technical details
 */

import { DomainError, ErrorSeverity } from './base/DomainErrorBase';

export class ContentSanitizationError extends DomainError {
  readonly code = 'CONTENT_SANITIZATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;

  /**
   * Create a new ContentSanitizationError
   * 
   * AI INSTRUCTIONS:
   * - Provide clear error message for content sanitization failures
   * - Include context about what failed and why
   * - Support debugging and error recovery
   * - Maintain user-friendly error messages
   */
  constructor(message: string, context: Record<string, any> = {}) {
    super(`Content sanitization failed: ${message}`, {
      ...context,
      domain: 'content-processing',
      operation: 'sanitization'
    });
  }

  /**
   * Create error for invalid content type
   */
  static invalidContentType(contentType: string, validTypes: string[]): ContentSanitizationError {
    return new ContentSanitizationError(
      `Invalid content type: ${contentType}`,
      { 
        providedType: contentType, 
        validTypes,
        errorType: 'invalid_content_type'
      }
    );
  }

  /**
   * Create error for content too long
   */
  static contentTooLong(length: number, maxLength: number, contentType: string): ContentSanitizationError {
    return new ContentSanitizationError(
      `Content exceeds maximum length of ${maxLength} characters`,
      { 
        actualLength: length, 
        maxLength, 
        contentType,
        errorType: 'content_too_long'
      }
    );
  }

  /**
   * Create error for empty content
   */
  static emptyContent(contentType: string): ContentSanitizationError {
    return new ContentSanitizationError(
      'Content cannot be empty',
      { 
        contentType,
        errorType: 'empty_content'
      }
    );
  }

  /**
   * Create error for sanitization processing failure
   */
  static processingFailure(contentType: string, originalError: Error): ContentSanitizationError {
    return new ContentSanitizationError(
      'Failed to process content during sanitization',
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
  static invalidInput(parameterName: string, expectedType: string, actualValue: any): ContentSanitizationError {
    return new ContentSanitizationError(
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
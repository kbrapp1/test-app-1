/**
 * Website Crawling Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Domain-specific error types for website crawling business rules
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Never expose technical details to domain layer
 * - Follow @golden-rule error handling patterns
 */

import { DomainError, ErrorSeverity } from '../../../errors/base';

export class WebsiteCrawlError extends DomainError {
  readonly code = 'WEBSITE_CRAWL_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Website crawling failed: ${rule}`, context);
  }
}

export class ContentExtractionError extends DomainError {
  readonly code = 'CONTENT_EXTRACTION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Content extraction failed: ${rule}`, context);
  }
}

export class InvalidUrlError extends DomainError {
  readonly code = 'INVALID_URL';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Invalid URL: ${rule}`, context);
  }
}

export class WebsiteAccessibilityError extends DomainError {
  readonly code = 'WEBSITE_INACCESSIBLE';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Website accessibility issue: ${rule}`, context);
  }
}

export class CrawlLimitExceededError extends DomainError {
  readonly code = 'CRAWL_LIMIT_EXCEEDED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Crawl limit exceeded: ${rule}`, context);
  }
}

export class RobotsTxtViolationError extends DomainError {
  readonly code = 'ROBOTS_TXT_VIOLATION';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Robots.txt violation: ${rule}`, context);
  }
}

export class ContentCategorizationError extends DomainError {
  readonly code = 'CONTENT_CATEGORIZATION_FAILED';
  readonly severity = ErrorSeverity.LOW;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Content categorization failed: ${rule}`, context);
  }
} 
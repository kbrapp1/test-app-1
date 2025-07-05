/**
 * Domain Error Base Foundation
 * 
 * AI INSTRUCTIONS:
 * - Base foundation for all chatbot widget domain errors
 * - Follow @golden-rule DDD error handling patterns exactly
 * - Include context, severity, and timestamp for comprehensive tracking
 * - Never expose technical details to domain layer
 * - Single responsibility: Provide error foundation infrastructure
 * - Keep under 100 lines - focused on core error patterns
 */

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
 * - Abstract base class for all chatbot widget domain errors
 * - Include context, severity, and timestamp for debugging
 * - Use error codes for programmatic handling
 * - Never expose infrastructure concerns to domain layer
 * - Extend this class for all domain-specific errors
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

/**
 * Business Rule Violation Error
 * 
 * AI INSTRUCTIONS:
 * - Core business rule violation pattern
 * - Use for domain invariant violations
 * - Include specific rule context for debugging
 * - High severity by default - business rules are critical
 */
export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, any> = {}) {
    super(`Business rule violated: ${rule}`, context);
  }
}

/**
 * Invariant Violation Error
 * 
 * AI INSTRUCTIONS:
 * - Use for critical domain invariant violations
 * - Critical severity - indicates system integrity issues
 * - Include invariant details for debugging
 */
export class InvariantViolationError extends DomainError {
  readonly code = 'INVARIANT_VIOLATION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(invariant: string, context: Record<string, any> = {}) {
    super(`Domain invariant violated: ${invariant}`, context);
  }
}

/**
 * Resource Not Found Error
 * 
 * AI INSTRUCTIONS:
 * - Standard pattern for missing resources
 * - Medium severity - expected in normal operations
 * - Include resource type and identifier for context
 */
export class ResourceNotFoundError extends DomainError {
  readonly code = 'RESOURCE_NOT_FOUND';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(resourceType: string, identifier: string, context: Record<string, any> = {}) {
    super(`${resourceType} not found: ${identifier}`, { ...context, resourceType, identifier });
  }
} 
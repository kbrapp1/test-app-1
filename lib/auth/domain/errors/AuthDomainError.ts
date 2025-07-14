/**
 * Auth Domain Error Base Class
 * 
 * AI INSTRUCTIONS:
 * - Create specific error types for each business rule violation
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Never expose technical details to domain layer
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export abstract class AuthDomainError extends Error {
  abstract readonly code: string;
  abstract readonly severity: ErrorSeverity;
  
  constructor(
    message: string,
    public readonly context: Record<string, unknown> = {},
    public readonly timestamp: Date = new Date()
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp
    };
  }
}

export class UserNotFoundError extends AuthDomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(identifier: string, context: Record<string, unknown> = {}) {
    super(`User not found: ${identifier}`, { ...context, identifier });
  }
}

export class OrganizationNotFoundError extends AuthDomainError {
  readonly code = 'ORGANIZATION_NOT_FOUND';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(identifier: string, context: Record<string, unknown> = {}) {
    super(`Organization not found: ${identifier}`, { ...context, identifier });
  }
}

export class InvalidCredentialsError extends AuthDomainError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(context: Record<string, unknown> = {}) {
    super('Invalid authentication credentials', context);
  }
}

export class InsufficientPermissionsError extends AuthDomainError {
  readonly code = 'INSUFFICIENT_PERMISSIONS';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(requiredPermission: string, context: Record<string, unknown> = {}) {
    super(`Insufficient permissions: ${requiredPermission}`, { ...context, requiredPermission });
  }
}

export class BusinessRuleViolationError extends AuthDomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, unknown> = {}) {
    super(`Business rule violated: ${rule}`, context);
  }
}

export class InvariantViolationError extends AuthDomainError {
  readonly code = 'INVARIANT_VIOLATION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(invariant: string, context: Record<string, unknown> = {}) {
    super(`Domain invariant violated: ${invariant}`, context);
  }
}

export class OrganizationMembershipError extends AuthDomainError {
  readonly code = 'ORGANIZATION_MEMBERSHIP_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(operation: string, context: Record<string, unknown> = {}) {
    super(`Organization membership error: ${operation}`, { ...context, operation });
  }
}

export class SessionExpiredError extends AuthDomainError {
  readonly code = 'SESSION_EXPIRED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(context: Record<string, unknown> = {}) {
    super('User session has expired', context);
  }
}

export class DuplicateResourceError extends AuthDomainError {
  readonly code = 'DUPLICATE_RESOURCE';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(resourceType: string, identifier: string, context: Record<string, unknown> = {}) {
    super(`${resourceType} already exists: ${identifier}`, { ...context, resourceType, identifier });
  }
} 
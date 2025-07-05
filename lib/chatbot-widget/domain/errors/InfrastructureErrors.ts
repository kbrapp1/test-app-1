/**
 * Infrastructure and External Service Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Infrastructure, external services, and system errors
 * - Follow @golden-rule DDD error handling patterns exactly
 * - Create specific error types for each infrastructure concern
 * - Include relevant context for debugging and monitoring
 * - Keep under 250 lines - focused domain responsibility
 * - Import base patterns from DomainErrorBase
 */

import { DomainError, ErrorSeverity } from './base/DomainErrorBase';

// ===== EXTERNAL SERVICE ERRORS =====

export class ExternalServiceError extends DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(serviceName: string, operation: string, context: Record<string, any> = {}) {
    super(`External service error in ${serviceName} during ${operation}`, { ...context, serviceName, operation });
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
    super(`Data persistence failed: ${operation} on ${entityType}`, { ...context, operation, entityType });
  }
}

export class DatabaseError extends DomainError {
  readonly code = 'DATABASE_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(message: string, errorDetail?: string | Record<string, any>) {
    const context = typeof errorDetail === 'string' ? { error: errorDetail } : (errorDetail || {});
    super(`Database error: ${message}`, context);
  }
}

export class DataValidationError extends DomainError {
  readonly code = 'DATA_VALIDATION_FAILED';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(field: string, validationRule: string, context: Record<string, any> = {}) {
    super(`Data validation failed for ${field}: ${validationRule}`, { ...context, field, validationRule });
  }
}

// ===== SECURITY ERRORS =====

export class SecurityViolationError extends DomainError {
  readonly code = 'SECURITY_VIOLATION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(violationType: string, context: Record<string, any> = {}) {
    super(`Security violation: ${violationType}`, context);
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
    super(
      `Performance threshold exceeded for ${metric}: ${actual} > ${threshold}`,
      { ...context, metric, threshold, actual }
    );
  }
}

export class ResourceExhaustionError extends DomainError {
  readonly code = 'RESOURCE_EXHAUSTION';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(resourceType: string, context: Record<string, any> = {}) {
    super(`Resource exhaustion: ${resourceType}`, context);
  }
}

// ===== WIDGET RENDERING ERRORS =====

export class WidgetRenderingError extends DomainError {
  readonly code = 'WIDGET_RENDERING_FAILED';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(component: string, context: Record<string, any> = {}) {
    super(`Widget rendering failed for component: ${component}`, context);
  }
}

export class WidgetConfigurationError extends DomainError {
  readonly code = 'WIDGET_CONFIGURATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(configType: string, context: Record<string, any> = {}) {
    super(`Widget configuration error: ${configType}`, context);
  }
} 
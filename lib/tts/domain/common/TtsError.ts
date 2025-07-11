/**
 * TTS Domain Error Types
 * 
 * Standardized error classes for the TTS domain following DDD principles.
 * Provides consistent error handling and categorization across all layers.
 */

/**
 * Base error class for all TTS domain errors
 */
export abstract class TtsError extends Error {
  public readonly code: string;
  public readonly category: TtsErrorCategory;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string, 
    code: string, 
    category: TtsErrorCategory,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.timestamp = new Date();
    this.context = context;
    
    // Ensure stack trace points to the actual error location
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Convert to serializable object for API responses
  toJSON(): TtsErrorResponse {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        category: this.category,
        timestamp: this.timestamp.toISOString(),
        context: this.context,
      }
    };
  }

  // Check if error is retryable
  abstract isRetryable(): boolean;

  // Check if error should be logged
  abstract shouldLog(): boolean;
}

// Domain validation errors
export class TtsValidationError extends TtsError {
  constructor(message: string, field?: string, value?: unknown) {
    super(
      message, 
      'TTS_VALIDATION_ERROR', 
      TtsErrorCategory.VALIDATION,
      { field, value }
    );
  }

  isRetryable(): boolean {
    return false; // Validation errors are not retryable
  }

  shouldLog(): boolean {
    return false; // Client input errors don't need logging
  }
}

// Business rule violations
export class TtsBusinessRuleError extends TtsError {
  constructor(message: string, rule: string, context?: Record<string, unknown>) {
    super(
      message, 
      'TTS_BUSINESS_RULE_ERROR', 
      TtsErrorCategory.BUSINESS_RULE,
      { rule, ...context }
    );
  }

  isRetryable(): boolean {
    return false; // Business rule violations are not retryable
  }

  shouldLog(): boolean {
    return true; // Business rule violations should be logged
  }
}

// Domain entity not found errors
export class TtsEntityNotFoundError extends TtsError {
  constructor(entityType: string, identifier: string) {
    super(
      `${entityType} not found: ${identifier}`, 
      'TTS_ENTITY_NOT_FOUND', 
      TtsErrorCategory.NOT_FOUND,
      { entityType, identifier }
    );
  }

  isRetryable(): boolean {
    return false; // Entity not found is not retryable
  }

  shouldLog(): boolean {
    return false; // Expected condition, no need to log
  }
}

// Infrastructure/external service errors
export class TtsInfrastructureError extends TtsError {
  constructor(message: string, service: string, originalError?: Error) {
    super(
      message, 
      'TTS_INFRASTRUCTURE_ERROR', 
      TtsErrorCategory.INFRASTRUCTURE,
      { 
        service, 
        originalError: originalError?.message,
        originalStack: originalError?.stack 
      }
    );
  }

  isRetryable(): boolean {
    return true; // Infrastructure errors might be temporary
  }

  shouldLog(): boolean {
    return true; // Infrastructure errors should be logged
  }
}

// Provider-specific errors
export class TtsProviderError extends TtsError {
  constructor(
    message: string, 
    provider: string, 
    providerCode?: string,
    originalError?: Error
  ) {
    super(
      message, 
      'TTS_PROVIDER_ERROR', 
      TtsErrorCategory.PROVIDER,
      { 
        provider, 
        providerCode,
        originalError: originalError?.message 
      }
    );
  }

  isRetryable(): boolean {
    return true; // Provider errors might be temporary
  }

  shouldLog(): boolean {
    return true; // Provider errors should be logged
  }
}

// Feature flag/permission errors
export class TtsFeatureError extends TtsError {
  constructor(message: string, feature: string) {
    super(
      message, 
      'TTS_FEATURE_ERROR', 
      TtsErrorCategory.FEATURE,
      { feature }
    );
  }

  isRetryable(): boolean {
    return false; // Feature disabled is not retryable
  }

  shouldLog(): boolean {
    return false; // Expected condition based on configuration
  }
}

// Permission denied errors
export class TtsPermissionDeniedError extends TtsError {
  constructor(message: string, requiredPermission: string, userRole?: string) {
    super(
      message, 
      'TTS_PERMISSION_DENIED', 
      TtsErrorCategory.PERMISSION,
      { requiredPermission, userRole }
    );
  }

  isRetryable(): boolean {
    return false; // Permission denied is not retryable
  }

  shouldLog(): boolean {
    return true; // Permission violations should be logged for security
  }
}

// Feature not available for organization
export class TtsFeatureNotAvailableError extends TtsError {
  constructor(organizationId: string, feature: string = 'TTS') {
    super(
      `${feature} feature is not available for this organization`, 
      'TTS_FEATURE_NOT_AVAILABLE', 
      TtsErrorCategory.FEATURE,
      { organizationId, feature }
    );
  }

  isRetryable(): boolean {
    return false; // Feature availability is not retryable
  }

  shouldLog(): boolean {
    return false; // Expected condition based on organization settings
  }
}

// Organization access errors
export class TtsOrganizationAccessError extends TtsError {
  constructor(message: string, organizationId?: string, userId?: string) {
    super(
      message, 
      'TTS_ORGANIZATION_ACCESS_ERROR', 
      TtsErrorCategory.PERMISSION,
      { organizationId, userId }
    );
  }

  isRetryable(): boolean {
    return false; // Organization access errors are not retryable
  }

  shouldLog(): boolean {
    return true; // Access violations should be logged for security
  }
}

// Configuration errors
export class TtsConfigurationError extends TtsError {
  constructor(message: string, configKey: string) {
    super(
      message, 
      'TTS_CONFIGURATION_ERROR', 
      TtsErrorCategory.CONFIGURATION,
      { configKey }
    );
  }

  isRetryable(): boolean {
    return false; // Configuration errors are not retryable
  }

  shouldLog(): boolean {
    return true; // Configuration errors should be logged
  }
}

// Error categories for classification
export enum TtsErrorCategory {
  VALIDATION = 'validation',
  BUSINESS_RULE = 'business_rule',
  NOT_FOUND = 'not_found',
  INFRASTRUCTURE = 'infrastructure',
  PROVIDER = 'provider',
  FEATURE = 'feature',
  CONFIGURATION = 'configuration',
  PERMISSION = 'permission',
}

// Standardized error response format
export interface TtsErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    category: TtsErrorCategory;
    timestamp: string;
    context?: Record<string, unknown>;
  };
}

// Success response format for consistency
export interface TtsSuccessResponse<T = any> {
  success: true;
  data?: T;
  count?: number;
}

// Union type for all TTS responses
export type TtsResponse<T = any> = TtsSuccessResponse<T> | TtsErrorResponse;

// Error handler utility functions
export class TtsErrorHandler {
  // Convert any error to standardized TtsError
  static standardizeError(error: unknown, context?: Record<string, unknown>): TtsError {
    if (error instanceof TtsError) {
      return error;
    }

    if (error instanceof Error) {
      return new TtsInfrastructureError(
        error.message, 
        'unknown',
        error
      );
    }

    return new TtsInfrastructureError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      'unknown'
    );
  }

  // Create success response
  static success<T>(data?: T, count?: number): TtsSuccessResponse<T> {
    return {
      success: true,
      data,
      count,
    };
  }

  // Create error response from TtsError
  static errorResponse(error: TtsError): TtsErrorResponse {
    return error.toJSON();
  }
} 
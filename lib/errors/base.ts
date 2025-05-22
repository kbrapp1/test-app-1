/**
 * Base error classes for application-wide error handling.
 * 
 * This module defines a hierarchy of error classes that provide:
 * - Consistent error structure across the application
 * - HTTP status code mapping for API responses
 * - Error code system for error type identification
 * - Context attachment for additional error details
 * - Stack trace capture for debugging
 * 
 * Error Hierarchy:
 * - AppError: Base error class with core functionality
 *   ├─ ValidationError (400): Input validation failures
 *   ├─ AuthorizationError (403): Permission and auth failures
 *   ├─ NotFoundError (404): Resource not found
 *   ├─ DatabaseError (500): Database operation failures
 *   └─ ExternalServiceError (502): Third-party service failures
 * 
 * ```
 * 
 * @module errors/base
 */

/**
 * Base error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for validation failures (e.g. invalid input data)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, 400, context);
  }
}

/**
 * Error for authorization failures (e.g. insufficient permissions)
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string,
    code: string = 'AUTHORIZATION_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, 403, context);
  }
}

/**
 * Error for resource not found
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    code: string = 'NOT_FOUND_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, 404, context);
  }
}

/**
 * Error for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    code: string = 'DATABASE_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, 500, context);
  }
}

/**
 * Error for external service failures (e.g. API calls)
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    code: string = 'EXTERNAL_SERVICE_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, 502, context);
  }
}

/**
 * Error for conflicts with existing resources (e.g. duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    code: string = 'CONFLICT_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, 409, context);
  }
} 
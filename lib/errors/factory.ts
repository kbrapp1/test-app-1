/**
 * Error factory module for creating standardized application errors.
 * 
 * This module provides:
 * - Type definitions for error response objects
 * - Factory functions for creating common error types
 * - Standardized error response formatting
 * 
 * The ErrorFactory object provides convenient methods to create specific error instances
 * with consistent formatting and proper context. This ensures that error handling across
 * the application remains uniform and follows best practices.
 * 
 * @module errors/factory
 */

import {
  AppError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
} from './base';

/**
 * Standard error response structure returned by API endpoints
 */
export type ErrorResponse = {
  error: {
    message: string;
    code: string;
    statusCode: number;
    context?: Record<string, unknown>;
  };
};

/**
 * Creates a standardized error response object from an AppError instance.
 * Used by API routes and server actions to ensure consistent error formatting.
 * 
 * @param error - The AppError instance to convert
 * @returns A formatted error response object
 */
export function createErrorResponse(error: AppError): ErrorResponse {
  return {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
    },
  };
}

/**
 * Factory object containing helper functions for creating common error types.
 * Each method creates a properly configured error instance with appropriate
 * status codes, error codes, and context information.
 */
export const ErrorFactory = {
  /**
   * Creates a validation error for general validation failures
   * @param message - Description of the validation error
   * @param context - Additional context about the validation failure
   */
  validation(message: string, context?: Record<string, unknown>) {
    return new ValidationError(message, 'VALIDATION_ERROR', context);
  },

  /**
   * Creates a validation error for invalid input fields
   * @param field - Name of the field that had invalid input
   * @param detail - Optional specific details about why the input was invalid
   */
  invalidInput(field: string, detail?: string) {
    const message = detail || `Invalid value provided for ${field}`;
    return new ValidationError(message, 'INVALID_INPUT', { field });
  },

  /**
   * Creates a validation error for missing required fields
   * @param field - Name of the required field that was missing
   */
  missingField(field: string) {
    return new ValidationError(
      `Required field '${field}' is missing`,
      'MISSING_FIELD',
      { field }
    );
  },

  /**
   * Creates an authorization error for unauthenticated access attempts
   * @param message - Custom unauthorized message (defaults to 'Unauthorized access')
   */
  unauthorized(message = 'Unauthorized access') {
    return new AuthorizationError(message, 'UNAUTHORIZED');
  },

  /**
   * Creates an authorization error for insufficient permissions
   * @param message - Custom forbidden message (defaults to 'Permission denied')
   * @param context - Additional context about the permission failure
   */
  forbidden(message = 'Permission denied', context?: Record<string, unknown>) {
    return new AuthorizationError(message, 'FORBIDDEN', context);
  },

  /**
   * Creates a not found error for missing resources
   * @param resource - Type of resource that wasn't found (e.g., 'User', 'Document')
   * @param id - Optional identifier of the resource that wasn't found
   */
  notFound(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    return new NotFoundError(message, 'RESOURCE_NOT_FOUND', { resource, id });
  },

  /**
   * Creates a database error for database operation failures
   * @param message - Description of the database error
   * @param context - Additional context about the database operation
   */
  database(message: string, context?: Record<string, unknown>) {
    return new DatabaseError(message, 'DATABASE_ERROR', context);
  },

  /**
   * Creates an external service error for third-party service failures
   * @param service - Name of the external service that failed
   * @param message - Custom error message (defaults to 'External service error')
   * @param context - Additional context about the service failure
   */
  externalService(
    service: string,
    message = 'External service error',
    context?: Record<string, unknown>
  ) {
    return new ExternalServiceError(message, 'EXTERNAL_SERVICE_ERROR', {
      service,
      ...context,
    });
  },

  /**
   * Creates a generic error for unexpected failures
   * @param message - Custom error message (defaults to 'An unexpected error occurred')
   * @param context - Additional context about the unexpected error
   */
  unexpected(message = 'An unexpected error occurred', context?: Record<string, unknown>) {
    return new AppError(message, 'UNEXPECTED_ERROR', 500, context);
  },
}; 
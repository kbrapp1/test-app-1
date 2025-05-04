/**
 * Defines a standardized system for application errors, including severity levels
 * (ErrorSeverity), unique error codes (ErrorCodes), default user messages
 * (ErrorMessages), and a mapping between codes and severities (ErrorSeverityMap).
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Validation Errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Authentication Errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Authorization Errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // Not Found Errors (404)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',

  // Conflict Errors (409)
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Server Errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

  // External Service Errors (502, 503, 504)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_ERROR: 'API_ERROR',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE', // e.g., 503
  NETWORK_ERROR: 'NETWORK_ERROR', // e.g., 504 Gateway Timeout or network issue
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT', // Specific DB timeout

  // Rate Limit Errors (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/**
 * Standard error messages
 */
export const ErrorMessages = {
  [ErrorCodes.UNAUTHORIZED]: 'You must be logged in to access this resource',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCodes.INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCodes.ACCOUNT_DISABLED]: 'Your account has been disabled',
  [ErrorCodes.RESOURCE_NOT_FOUND]: 'The requested resource was not found',
  [ErrorCodes.ROUTE_NOT_FOUND]: 'The requested route was not found',
  [ErrorCodes.DATABASE_ERROR]: 'A database error occurred',
  [ErrorCodes.UNEXPECTED_ERROR]: 'An unexpected error occurred',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error occurred',
} as const;

/**
 * Error severity mapping
 */
export const ErrorSeverityMap: Record<string, ErrorSeverity> = {
  [ErrorCodes.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [ErrorCodes.INVALID_INPUT]: ErrorSeverity.LOW,
  [ErrorCodes.MISSING_FIELD]: ErrorSeverity.LOW,
  [ErrorCodes.INVALID_FORMAT]: ErrorSeverity.LOW,
  
  [ErrorCodes.UNAUTHORIZED]: ErrorSeverity.MEDIUM,
  [ErrorCodes.INVALID_CREDENTIALS]: ErrorSeverity.MEDIUM,
  [ErrorCodes.TOKEN_EXPIRED]: ErrorSeverity.MEDIUM,
  [ErrorCodes.INVALID_TOKEN]: ErrorSeverity.MEDIUM,
  
  [ErrorCodes.FORBIDDEN]: ErrorSeverity.HIGH,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: ErrorSeverity.HIGH,
  [ErrorCodes.ACCOUNT_DISABLED]: ErrorSeverity.HIGH,
  
  [ErrorCodes.RESOURCE_NOT_FOUND]: ErrorSeverity.LOW,
  [ErrorCodes.ROUTE_NOT_FOUND]: ErrorSeverity.LOW,
  
  [ErrorCodes.RESOURCE_CONFLICT]: ErrorSeverity.MEDIUM,
  [ErrorCodes.DUPLICATE_ENTRY]: ErrorSeverity.MEDIUM,
  
  [ErrorCodes.DATABASE_ERROR]: ErrorSeverity.CRITICAL,
  [ErrorCodes.UNEXPECTED_ERROR]: ErrorSeverity.HIGH,
  [ErrorCodes.INTERNAL_SERVER_ERROR]: ErrorSeverity.CRITICAL,
  
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: ErrorSeverity.HIGH,
  [ErrorCodes.API_ERROR]: ErrorSeverity.HIGH,
  [ErrorCodes.INTEGRATION_ERROR]: ErrorSeverity.HIGH,
}; 
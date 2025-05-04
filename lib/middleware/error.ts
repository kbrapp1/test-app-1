import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/base';
import { createErrorResponse } from '@/lib/errors/factory';
import { ErrorSeverity, ErrorSeverityMap, ErrorCodes } from '@/lib/errors/constants';
import { logger } from '@/lib/logging'; // We'll create this next

export type ErrorMiddlewareConfig = {
  logErrors?: boolean;
  includeStackTrace?: boolean;
};

/**
 * Wraps an API route handler with error handling
 */
export function withErrorHandling(
  handler: Function,
  config: ErrorMiddlewareConfig = { logErrors: true, includeStackTrace: false }
) {
  return async function errorHandler(...args: any[]) {
    try {
      return await handler(...args);
    } catch (error) {
      // Handle known application errors
      if (error instanceof AppError) {
        const severity = ErrorSeverityMap[error.code] || ErrorSeverity.HIGH;
        
        if (config.logErrors) {
          logger.error({
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            context: error.context,
            severity,
            stack: config.includeStackTrace ? error.stack : undefined,
          });
        }

        return NextResponse.json(
          createErrorResponse(error),
          { status: error.statusCode }
        );
      }

      // Handle unknown errors
      console.error('Unexpected error:', error);
      const unexpectedError = new AppError(
        'An unexpected error occurred',
        ErrorCodes.UNEXPECTED_ERROR,
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      );

      if (config.logErrors) {
        logger.error({
          message: unexpectedError.message,
          code: unexpectedError.code,
          statusCode: unexpectedError.statusCode,
          context: unexpectedError.context,
          severity: ErrorSeverity.HIGH,
          stack: config.includeStackTrace ? (error instanceof Error ? error.stack : undefined) : undefined,
        });
      }

      return NextResponse.json(
        createErrorResponse(unexpectedError),
        { status: 500 }
      );
    }
  };
}

/**
 * HOC to add error handling to server actions
 */
export function withServerActionErrorHandling<T extends (...args: any[]) => Promise<any>>(
  action: T,
  config: ErrorMiddlewareConfig = { logErrors: true, includeStackTrace: false }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await action(...args);
    } catch (error) {
      // Handle known application errors
      if (error instanceof AppError) {
        const severity = ErrorSeverityMap[error.code] || ErrorSeverity.HIGH;
        
        if (config.logErrors) {
          logger.error({
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            context: error.context,
            severity,
            stack: config.includeStackTrace ? error.stack : undefined,
          });
        }

        return {
          error: {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
          },
        };
      }

      // Handle unknown errors
      console.error('Unexpected server action error:', error);
      const unexpectedError = new AppError(
        'An unexpected error occurred',
        ErrorCodes.UNEXPECTED_ERROR,
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      );

      if (config.logErrors) {
        logger.error({
          message: unexpectedError.message,
          code: unexpectedError.code,
          statusCode: unexpectedError.statusCode,
          context: unexpectedError.context,
          severity: ErrorSeverity.HIGH,
          stack: config.includeStackTrace ? (error instanceof Error ? error.stack : undefined) : undefined,
        });
      }

      return {
        error: {
          message: unexpectedError.message,
          code: unexpectedError.code,
          statusCode: unexpectedError.statusCode,
        },
      };
    }
  }) as T;
} 
/**
 * Client-side error handling utilities for React applications.
 * 
 * This module provides three main error handling mechanisms:
 * 1. Toast-based error notifications with severity levels
 * 2. Async operation error wrapping
 * 3. React Error Boundary HOC (Higher Order Component)
 * 
 * Features:
 * - Consistent error message display via toast notifications
 * - Automatic error severity to toast type mapping
 * - Development mode console logging
 * - Special handling for validation and authorization errors
 * - Type-safe async error handler wrapper
 * - React component error boundary wrapper
 * 
 * @module errors/client
 */

import { toast } from 'sonner';
import { AppError, ValidationError, AuthorizationError } from './base';
import { ErrorSeverity } from './constants';
import { ErrorBoundary } from '../../components/error-boundary';
import * as React from 'react';
import type { ComponentType } from 'react';

interface ClientErrorConfig {
  showToast?: boolean;
  toastDuration?: number;
}

const DEFAULT_CONFIG: ClientErrorConfig = {
  showToast: true,
  toastDuration: 5000,
};

/**
 * Maps error severity to toast type
 */
function getToastTypeForSeverity(severity: ErrorSeverity) {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'error';
  }
}

/**
 * Handles client-side errors, showing appropriate toast notifications
 */
export function handleClientError(error: unknown, config: ClientErrorConfig = DEFAULT_CONFIG) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Log all errors to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Client Error:', error);
  }

  if (error instanceof AppError) {
    if (finalConfig.showToast) {
      const toastConfig = {
        duration: finalConfig.toastDuration,
      };

      // Default to HIGH severity if not specified
      const severity = (error as AppError & { severity?: ErrorSeverity }).severity || ErrorSeverity.HIGH;
      const toastType = getToastTypeForSeverity(severity);

      switch (toastType) {
        case 'error':
          toast.error(error.message, toastConfig);
          break;
        case 'warning':
          toast.warning(error.message, toastConfig);
          break;
        case 'info':
          toast.info(error.message, toastConfig);
          break;
        default:
          toast.error(error.message, toastConfig);
      }
    }

    // Handle specific error types
    if (error instanceof ValidationError) {
      // Additional validation error handling if needed
      return;
    }

    if (error instanceof AuthorizationError) {
      // Redirect to login or handle auth errors
      return;
    }

    return;
  }

  // Handle unknown errors
  if (finalConfig.showToast) {
    toast.error('An unexpected error occurred', {
      duration: finalConfig.toastDuration,
      description: 'Please try again or contact support if the problem persists.',
    });
  }
}

/**
 * Creates a safe error handler for async operations
 */
export function createAsyncErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T,
  config?: ClientErrorConfig
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return await handler(...args) as ReturnType<T>;
    } catch (error) {
      handleClientError(error, config);
      throw error; // Re-throw to allow parent handlers to catch if needed
    }
  };
}

/**
 * HOC to add error handling to a React component
 */
export function withErrorHandling<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  function WithErrorHandling(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  
  WithErrorHandling.displayName = `WithErrorHandling(${
    Component.displayName || Component.name || 'Component'
  })`;
  
  return WithErrorHandling;
} 
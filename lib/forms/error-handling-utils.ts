/**
 * Helper utilities for form error handling.
 * 
 * @module forms/error-handling-utils
 */

import { UseFormSetError, FieldValues } from 'react-hook-form';
import { toast as sonnerToast } from 'sonner';
import { AppError, ValidationError } from '../errors/base';
import { FieldError, FormErrorHandlerConfig } from './error-handling-types';

/**
 * Safely display an error toast
 */
export function showErrorToast(message: string, options?: { duration?: number }) {
  sonnerToast.error(message, {
    duration: options?.duration, 
  });
}

/**
 * Extracts field errors from an error object or response
 */
export function extractFieldErrors(error: unknown): FieldError[] {
  if (error instanceof ValidationError && error.context?.fieldErrors) {
    return error.context.fieldErrors as FieldError[];
  }

  if (error instanceof AppError) {
    if (error.context?.fieldErrors) {
      return error.context.fieldErrors as FieldError[];
    }
    if (error.context?.field) {
      return [{ field: error.context.field as string, message: error.message }];
    }
  }

  // Handle API response error format
  if (typeof error === 'object' && error !== null) {
    const apiError = error as any;

    // Check for field errors in common API response formats
    if (apiError.fieldErrors) {
      return apiError.fieldErrors;
    }

    if (apiError.errors && Array.isArray(apiError.errors)) {
      return apiError.errors.map((err: any) => ({
        field: err.field || 'unknown',
        message: err.message,
      }));
    }
  }

  return [];
}

/**
 * Sets form field errors based on extracted field errors
 */
export function setFormErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: FieldError[],
  config?: FormErrorHandlerConfig
) {
  // Optionally clear existing errors before setting new ones
  // Note: clearing logic might need to be handled by the form itself if needed
  // if (config?.clearExistingErrors !== false) {
  //   // form.clearErrors(); // This would need the full form instance
  // }

  fieldErrors.forEach(error => {
    // Check if we need to remap the field name
    const field = config?.fieldMap?.[error.field] || error.field;
    setError(field as any, {
      type: 'manual',
      message: error.message
    });
  });
} 
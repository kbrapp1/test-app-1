/**
 * Core form error handling logic for React Hook Form integration.
 * 
 * This module provides the central `handleFormError` function which orchestrates 
 * error extraction, setting form errors, and displaying toasts based on configuration.
 * 
 * It relies on types and helpers from sibling modules:
 * - `error-handling-types`
 * - `error-handling-utils`
 * 
 * Factories for creating handlers/errors are in `error-handling-factories`.
 * 
 * @module forms/error-handling
 */

import { UseFormSetError, FieldValues } from 'react-hook-form';
import { AppError, ValidationError } from '../errors/base';
import { ApiError, DEFAULT_CONFIG, FormErrorHandlerConfig } from './error-handling-types';
import { extractFieldErrors, setFormErrors, showErrorToast } from './error-handling-utils';

/**
 * Central function to handle errors within a form context.
 * It determines the type of error, extracts relevant details,
 * sets errors on the form using setError, and optionally shows a toast.
 */
export function handleFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  userConfig?: FormErrorHandlerConfig
) {
  // Merge userConfig with DEFAULT_CONFIG
  const config: FormErrorHandlerConfig & typeof DEFAULT_CONFIG = {
    ...DEFAULT_CONFIG,
    ...userConfig
  };

  const rootFieldName = config.rootFieldName; // Use from merged config

  let hasSetFieldErrors = false;
  if (error instanceof ValidationError || error instanceof AppError) {
    const fieldErrors = extractFieldErrors(error);
    if (fieldErrors.length > 0) {
      setFormErrors(setError, fieldErrors, { 
        clearExistingErrors: config.clearExistingErrors, 
        fieldMap: config.fieldMap 
      });
      hasSetFieldErrors = true;
      // No global toast if specific field errors are shown unless explicitly configured?
      // Currently, the logic below handles non-field-specific error messages.
    }
  }

  // Handle generic Error objects (if not already handled as a field error type)
  if (error instanceof Error && !hasSetFieldErrors) {
    setError(rootFieldName as any, {
      type: 'manual',
      message: error.message
    });
    if (config.showToast) {
      showErrorToast(error.message, { duration: config.toastDuration });
    }
    return;
  }

  // Handle string errors (if not already handled)
  if (typeof error === 'string' && !hasSetFieldErrors) {
    setError(rootFieldName as any, {
      type: 'manual',
      message: error
    });
    if (config.showToast) {
      showErrorToast(error, { duration: config.toastDuration });
    }
    return;
  }

  // Handle API errors that might have field errors or just a general message
  if (typeof error === 'object' && error !== null && ('errors' in error || 'fieldErrors' in error || 'message' in error) && !hasSetFieldErrors) {
    const apiFieldErrorObjects = extractFieldErrors(error);
    if (apiFieldErrorObjects.length > 0) {
      setFormErrors(setError, apiFieldErrorObjects, {
        clearExistingErrors: config.clearExistingErrors,
        fieldMap: config.fieldMap
      });
      hasSetFieldErrors = true;
    }

    // Check for a general message, even if field errors were present, and show toast if configured
    const generalMessage = (error as { message?: string }).message;
    if (generalMessage && typeof generalMessage === 'string' && config.showToast && !hasSetFieldErrors) {
      // If no field errors were set above, set the root error and show toast
      setError(rootFieldName as any, { type: 'manual', message: generalMessage });
      showErrorToast(generalMessage, { duration: config.toastDuration });
      return;
    }
    // If we only set field errors from the API response, exit without a general toast
    if (hasSetFieldErrors) return;
  }

  // Fallback for unexpected errors if no errors were set from any known type
  if (!hasSetFieldErrors) {
    if (config.onUnexpectedError) {
      config.onUnexpectedError(error);
    } else {
      console.error('Unexpected form error:', error);
      const unexpectedMessage = 'An unexpected error occurred. Please try again.';
      setError(rootFieldName as any, {
        type: 'manual',
        message: unexpectedMessage
      });
      if (config.showToast) {
        showErrorToast(unexpectedMessage, { duration: config.toastDuration });
      }
    }
  }
}

/**
 * Type guard to check if an error is an API error (used internally)
 * Note: This might not be strictly necessary if the main handler logic is sufficient,
 * but kept for potential clarity or future use.
 */
function _isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

/**
 * Form error handling utilities for React Hook Form integration.
 * 
 * This module provides utilities for:
 * 1. Converting API/server errors to form field errors
 * 2. Handling form submission errors
 * 3. Displaying field-level error messages
 * 4. Integration with our toast notification system
 * 
 * @module forms/error-handling
 */

import { UseFormReturn } from 'react-hook-form';
import { ErrorFactory } from '../errors/factory';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Creates a reusable error handler for a form
 */
export function createFormErrorHandler<T extends FieldValues>(form: UseFormReturn<T>) {
  return (error: unknown, config: FormErrorHandlerConfig = {}) => {
    handleFormError(error, form.setError, config);
  };
}

/**
 * Creates form-specific validation errors
 */
export const FormErrorFactory = {
  /**
   * Creates a validation error for a specific form field
   */
  field(field: string, message: string): ValidationError {
    return ErrorFactory.validation(message, {
      fieldErrors: [{
        field,
        message,
      }],
    });
  },

  /**
   * Creates a validation error for multiple form fields
   */
  fields(fieldErrors: FieldError[]): ValidationError {
    return ErrorFactory.validation('Form validation failed', {
      fieldErrors,
    });
  },

  /**
   * Creates a validation error for a required field
   */
  required(field: string): ValidationError {
    return this.field(field, `${field} is required`);
  },

  /**
   * Creates a validation error for an invalid field value
   */
  invalid(field: string, message?: string): ValidationError {
    return this.field(field, message || `Invalid ${field}`);
  },
}; 
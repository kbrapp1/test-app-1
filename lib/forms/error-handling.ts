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

import { UseFormSetError, UseFormReturn, FieldValues } from 'react-hook-form';
import { toast as sonnerToast } from 'sonner';
import { AppError, ValidationError } from '../errors/base';
import { ErrorFactory } from '../errors/factory';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

/**
 * Configuration for the form error handler.
 */
export interface FormErrorHandlerConfig {
  showToast?: boolean; // Keep as optional, default will be true
  toastDuration?: number;
  clearExistingErrors?: boolean;
  fieldMap?: Record<string, string>;
  rootFieldName?: string;
  onUnexpectedError?: (error: unknown) => void;
}

const DEFAULT_CONFIG: Required<Pick<FormErrorHandlerConfig, 'showToast' | 'toastDuration' | 'clearExistingErrors'>> & Pick<FormErrorHandlerConfig, 'rootFieldName'> = {
  showToast: true, // Explicitly true
  toastDuration: 5000,
  clearExistingErrors: true,
  rootFieldName: 'root', // Add default for rootFieldName as well
};

/**
 * Safely display an error toast
 */
function showErrorToast(message: string, options?: { duration?: number }) {
  sonnerToast.error(message, { 
    duration: options?.duration, // Will be overridden by specific config if provided, otherwise undefined (sonner default)
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
  if (config?.clearExistingErrors !== false) {

  }
  
  fieldErrors.forEach(error => {
    // Check if we need to remap the field name
    const field = config?.fieldMap?.[error.field] || error.field;
    setError(field as any, { 
      type: 'manual',
      message: error.message 
    });
  });
}

export function handleFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  userConfig?: FormErrorHandlerConfig
) {
  // Merge userConfig with DEFAULT_CONFIG, ensuring all relevant fields have defaults
  const config: FormErrorHandlerConfig & typeof DEFAULT_CONFIG = { 
    ...DEFAULT_CONFIG, 
    ...userConfig 
  };

  const rootFieldName = config.rootFieldName; // Use from merged config

  let hasSetFieldErrors = false;
  if (error instanceof ValidationError || error instanceof AppError) {
    const fieldErrors = extractFieldErrors(error);
    if (fieldErrors.length > 0) {
      setFormErrors(setError, fieldErrors, { clearExistingErrors: config.clearExistingErrors });
      hasSetFieldErrors = true;
      // Typically, we don't show a global toast if specific field errors are shown.
      // If a toast is desired here, it should be conditional on config.showToast AND !hasSetFieldErrors
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

  // Handle API errors with field errors (ensure this doesn't double-toast if also an Error instance)
  if (typeof error === 'object' && error !== null && ('errors' in error || 'fieldErrors' in error) && !hasSetFieldErrors) {
    const apiFieldErrorObjects = extractFieldErrors(error);
    if (apiFieldErrorObjects.length > 0) {
      setFormErrors(setError, apiFieldErrorObjects, { 
        clearExistingErrors: config.clearExistingErrors, 
        fieldMap: config.fieldMap 
      });
      hasSetFieldErrors = true;
    }
    // If there's also a general message with API field errors, decide if a toast is needed
    // For instance, if error.message exists and config.showToast is true
    if ((error as any).message && typeof (error as any).message === 'string' && config.showToast && !hasSetFieldErrors) {
        // This might be a bit aggressive if field errors are also present.
        // Consider if root error should be set too.
        setError(rootFieldName as any, { type: 'manual', message: (error as any).message });
        showErrorToast((error as any).message, { duration: config.toastDuration });
        return; 
    }
    if (hasSetFieldErrors) return; // If only field errors from API, no general toast unless explicit message above
  }

  // Fallback for unexpected errors if no field errors were set from any known type
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
 * Type guard to check if an error is an API error
 */
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'message' in error
  );
}

/**
 * Creates a reusable error handler for a form
 */
export function createFormErrorHandler(form: UseFormReturn<any>) {
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
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
import { useToast } from '@/components/ui/use-toast';
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

export interface FormErrorHandlerConfig {
  /**
   * Callback for handling unexpected errors
   */
  onUnexpectedError?: (error: unknown) => void;
  
  /**
   * Map of field names to remap API field names to form field names
   * E.g. { 'user.email': 'email' } would map API error on 'user.email' to form field 'email'
   */
  fieldMap?: Record<string, string>;
  
  /**
   * Root field name to use for general errors not tied to a specific field
   * @default 'root'
   */
  rootFieldName?: string;

  /**
   * Whether to show a toast notification for root errors
   * @default true
   */
  showToast?: boolean;

  /**
   * Duration to show the toast notification in milliseconds
   * @default 5000
   */
  toastDuration?: number;

  /**
   * Whether to clear existing errors before setting new ones
   * @default true
   */
  clearExistingErrors?: boolean;
}

const DEFAULT_CONFIG: FormErrorHandlerConfig = {
  showToast: true,
  toastDuration: 5000,
  clearExistingErrors: true,
};

// Initialize toast outside of component functions
let toast: ReturnType<typeof useToast> | null = null;

// Function to set toast handler for use in this module
export function setToastHandler(toastHandler: ReturnType<typeof useToast>) {
  toast = toastHandler;
}

/**
 * Safely display an error toast
 */
function showErrorToast(message: string, options?: { duration?: number }) {
  if (toast) {
    toast.toast({
      variant: "destructive",
      title: "Error",
      description: message,
      duration: options?.duration || 5000
    });
  } else {
    console.error('Toast not initialized:', message);
  }
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
    // No built-in way to clear all errors in react-hook-form
    // so we'd need to maintain a list of fields to clear
    // This is a workaround for now
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

/**
 * Handles form errors by mapping them to the appropriate fields in the form
 * 
 * Supports handling different types of errors:
 * 1. API errors with a specific structure (message and errors object)
 * 2. Generic errors with just a message
 * 3. Unexpected errors (these are passed to onUnexpectedError if provided)
 */
export function handleFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  config?: FormErrorHandlerConfig
) {
  const rootFieldName = config?.rootFieldName || 'root';
  const fieldErrors = extractFieldErrors(error);
  
  // Set field-specific errors
  if (fieldErrors.length > 0) {
    setFormErrors(setError, fieldErrors, config);
    return;
  }
  
  // Handle known API error format
  if (isApiError(error)) {
    // Set general error message
    if (error.message) {
      setError(rootFieldName as any, { 
        type: 'manual',
        message: error.message 
      });
    }
    
    // Set field-specific errors
    if (error.errors) {
      Object.entries(error.errors).forEach(([field, messages]) => {
        // Check if we need to remap the field name
        const mappedField = config?.fieldMap?.[field] || field;
        setError(mappedField as any, { 
          type: 'manual',
          message: messages[0] || 'Invalid value' 
        });
      });
    }
    
    return;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    setError(rootFieldName as any, { 
      type: 'manual',
      message: error.message 
    });
    
    // Show toast if configured to do so
    if (config?.showToast !== false) {
      showErrorToast(error.message, { duration: config?.toastDuration || 5000 });
    }
    return;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    setError(rootFieldName as any, { 
      type: 'manual',
      message: error 
    });
    
    // Show toast if configured to do so
    if (config?.showToast !== false) {
      showErrorToast(error, { duration: config?.toastDuration || 5000 });
    }
    return;
  }
  
  // Handle unexpected errors
  if (config?.onUnexpectedError) {
    config.onUnexpectedError(error);
  } else if (error && typeof error === 'object') {
    // Default fallback for unexpected errors
    setError(rootFieldName as any, { 
      type: 'manual',
      message: 'An unexpected error occurred. Please try again.' 
    });
    
    // Log error for debugging
    console.error('Unexpected form error:', error);
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
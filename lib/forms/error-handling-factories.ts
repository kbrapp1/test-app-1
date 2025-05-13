/**
 * Factory functions for creating form error handlers and errors.
 * 
 * @module forms/error-handling-factories
 */

import { UseFormReturn, FieldValues } from 'react-hook-form';
import { ValidationError } from '../errors/base';
import { ErrorFactory } from '../errors/factory';
import { handleFormError } from './error-handling'; // Import the core handler
import { FormErrorHandlerConfig, FieldError } from './error-handling-types';

/**
 * Creates a reusable error handler for a specific form instance.
 */
export function createFormErrorHandler<T extends FieldValues>(form: UseFormReturn<T>) {
  return (error: unknown, config: FormErrorHandlerConfig = {}) => {
    // Use the core handleFormError function
    handleFormError(error, form.setError, config);
  };
}

/**
 * Factory for creating form-specific validation errors.
 */
export const FormErrorFactory = {
  /**
   * Creates a validation error for a specific form field.
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
   * Creates a validation error for multiple form fields.
   */
  fields(fieldErrors: FieldError[]): ValidationError {
    return ErrorFactory.validation('Form validation failed', {
      fieldErrors,
    });
  },

  /**
   * Creates a validation error for a required field.
   */
  required(field: string): ValidationError {
    return this.field(field, `${field} is required`);
  },

  /**
   * Creates a validation error for an invalid field value.
   */
  invalid(field: string, message?: string): ValidationError {
    return this.field(field, message || `Invalid ${field}`);
  },
}; 
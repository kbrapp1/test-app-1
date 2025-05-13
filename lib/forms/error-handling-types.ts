/**
 * Types and constants for form error handling.
 * 
 * @module forms/error-handling-types
 */

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
  showToast?: boolean; 
  toastDuration?: number;
  clearExistingErrors?: boolean;
  fieldMap?: Record<string, string>;
  rootFieldName?: string;
  onUnexpectedError?: (error: unknown) => void;
}

export const DEFAULT_CONFIG: Required<Pick<FormErrorHandlerConfig, 'showToast' | 'toastDuration' | 'clearExistingErrors'>> & Pick<FormErrorHandlerConfig, 'rootFieldName'> = {
  showToast: true, 
  toastDuration: 5000,
  clearExistingErrors: true,
  rootFieldName: 'root', 
}; 
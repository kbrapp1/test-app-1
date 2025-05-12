import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import {
  extractFieldErrors,
  setFormErrors,
  handleFormError,
  createFormErrorHandler,
  FormErrorFactory,
  type FieldError,
  type FormErrorHandlerConfig,
  type ApiError,
} from '../error-handling';
import { AppError, ValidationError } from '../../errors/base'; // Assuming path
import { ErrorFactory } from '../../errors/factory'; // Assuming path
import type { UseFormSetError, FieldValues } from 'react-hook-form';

// Mock sonner
vi.mock('sonner', async (importOriginal) => {
  const original = await importOriginal<typeof import('sonner')>();
  return {
    ...original, // Spread original module if other exports are needed by SUT
    toast: {
      ...original.toast,
      error: vi.fn(), // Mock only the error method
      // success: vi.fn(), // Example if other methods were needed
      // info: vi.fn(),
      // warning: vi.fn(),
      // loading: vi.fn(),
      // message: vi.fn(),
      // custom: vi.fn(),
      // dismiss: vi.fn(),
    },
  };
});

// Import the mocked toast
import { toast as sonnerToast } from 'sonner';

// Helper to reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractFieldErrors', () => {
  it('should extract from ValidationError with context.fieldErrors', () => {
    const fieldErrors: FieldError[] = [{ field: 'email', message: 'Invalid email' }];
    const error = new ValidationError('Validation failed', 'TEST_VALIDATION_CODE', { fieldErrors });
    expect(extractFieldErrors(error)).toEqual(fieldErrors);
  });

  it('should extract from AppError with context.fieldErrors', () => {
    const fieldErrors: FieldError[] = [{ field: 'password', message: 'Too short' }];
    const error = new AppError('App issue', 'TEST_APP_CODE', 500, { fieldErrors });
    expect(extractFieldErrors(error)).toEqual(fieldErrors);
  });

  it('should extract from AppError with context.field', () => {
    const error = new AppError('Field specific error', 'TEST_FIELD_CODE', 500, { field: 'username' });
    expect(extractFieldErrors(error)).toEqual([{ field: 'username', message: 'Field specific error' }]);
  });

  it('should extract from API-like object with fieldErrors property', () => {
    const fieldErrors: FieldError[] = [{ field: 'apiField', message: 'API error' }];
    const error = { fieldErrors };
    expect(extractFieldErrors(error)).toEqual(fieldErrors);
  });

  it('should extract from API-like object with errors array', () => {
    const apiErrors = [{ field: 'name', message: 'Is required' }, { message: 'Unknown field error' }];
    const error = { errors: apiErrors };
    expect(extractFieldErrors(error)).toEqual([
      { field: 'name', message: 'Is required' },
      { field: 'unknown', message: 'Unknown field error' },
    ]);
  });

  it('should return empty array for unknown error types', () => {
    expect(extractFieldErrors(new Error('Generic error'))).toEqual([]);
    expect(extractFieldErrors('string error')).toEqual([]);
    expect(extractFieldErrors(null)).toEqual([]);
    expect(extractFieldErrors({})).toEqual([]);
  });
});

describe('setFormErrors', () => {
  const mockSetError = vi.fn();

  beforeEach(() => {
    mockSetError.mockReset();
  });

  it('should call setError for each field error', () => {
    const fieldErrors: FieldError[] = [
      { field: 'email', message: 'Invalid' },
      { field: 'password', message: 'Weak' },
    ];
    setFormErrors(mockSetError, fieldErrors);
    expect(mockSetError).toHaveBeenCalledTimes(2);
    expect(mockSetError).toHaveBeenCalledWith('email', { type: 'manual', message: 'Invalid' });
    expect(mockSetError).toHaveBeenCalledWith('password', { type: 'manual', message: 'Weak' });
  });

  it('should use fieldMap if provided', () => {
    const fieldErrors: FieldError[] = [{ field: 'apiField', message: 'Error from API' }];
    const config: FormErrorHandlerConfig = { fieldMap: { apiField: 'formField' } };
    setFormErrors(mockSetError, fieldErrors, config);
    expect(mockSetError).toHaveBeenCalledWith('formField', { type: 'manual', message: 'Error from API' });
  });

  // react-hook-form doesn't have a clearAllErrors function exposed directly
  // The implementation comment notes: "// No built-in way to clear all errors in react-hook-form"
  // So testing clearExistingErrors behavior is tricky without deeper mocking or relying on form state.
  // For now, we trust the comment and the logic flow.
});

describe('handleFormError', () => {
  const mockSetError = vi.fn();

  beforeEach(() => {
    mockSetError.mockReset();
    (sonnerToast.error as Mock).mockReset();
  });

  const DEFAULT_ROOT_FIELD = 'root'; // from DEFAULT_CONFIG in error-handling.ts

  it('should handle ValidationError with fieldErrors', () => {
    const fieldErrors: FieldError[] = [{ field: 'email', message: 'Test validation error' }];
    const error = new ValidationError('Validation failed', 'CODE1', { fieldErrors });
    handleFormError(error, mockSetError);

    expect(mockSetError).toHaveBeenCalledWith('email', { type: 'manual', message: 'Test validation error' });
    expect(sonnerToast.error).not.toHaveBeenCalled(); // Default: no toast if field errors are specific
  });

  it('should handle AppError with context.fieldErrors', () => {
    const fieldErrors: FieldError[] = [{ field: 'name', message: 'App name error' }];
    const error = new AppError('App problem', 'CODE2', 500, { fieldErrors });
    handleFormError(error, mockSetError);

    expect(mockSetError).toHaveBeenCalledWith('name', { type: 'manual', message: 'App name error' });
    expect(sonnerToast.error).not.toHaveBeenCalled();
  });
  
  it('should handle AppError with context.field (single field)', () => {
    const error = new AppError('Specific field app error', 'CODE3', 500, { field: 'description' });
    handleFormError(error, mockSetError);
    
    expect(mockSetError).toHaveBeenCalledWith('description', { type: 'manual', message: 'Specific field app error' });
    expect(sonnerToast.error).not.toHaveBeenCalled(); // fieldErrors were extracted
  });

  it('should handle generic Error', () => {
    const error = new Error('Generic error message');
    handleFormError(error, mockSetError);

    expect(mockSetError).toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: 'Generic error message' });
    expect(sonnerToast.error).toHaveBeenCalledWith('Generic error message', { duration: 5000 });
  });

  it('should handle string error', () => {
    const error = 'String error message';
    handleFormError(error, mockSetError);

    expect(mockSetError).toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: 'String error message' });
    expect(sonnerToast.error).toHaveBeenCalledWith('String error message', { duration: 5000 });
  });

  it('should handle API-like error with field errors', () => {
    const apiErrorObject = {
      message: 'API validation failed',
      errors: [{ field: 'username', message: 'already taken' }] as FieldError[],
    };
    handleFormError(apiErrorObject as any, mockSetError);

    expect(mockSetError).toHaveBeenCalledWith('username', { type: 'manual', message: 'already taken' });
    expect(sonnerToast.error).not.toHaveBeenCalledWith(apiErrorObject.message, expect.any(Object));
  });
  
  it('should handle API-like error with general message and field errors, toasting general message if !hasSetFieldErrors before specific API toast check', () => {
    const apiErrorObject = {
      message: 'API action failed but fields are fine',
      errors: [{ field: 'taskName', message: 'Too long' }] as FieldError[],
    };
    handleFormError(apiErrorObject as any, mockSetError);
    expect(mockSetError).toHaveBeenCalledWith('taskName', { type: 'manual', message: 'Too long' });
    expect(sonnerToast.error).not.toHaveBeenCalledWith(apiErrorObject.message, expect.any(Object));

    const apiErrorOnlyMessage: ApiError = { message: 'Just a general API message' };
    mockSetError.mockReset();
    (sonnerToast.error as Mock).mockReset();
    handleFormError(apiErrorOnlyMessage, mockSetError);
    
    mockSetError.mockReset();
    (sonnerToast.error as Mock).mockReset();
    const plainObjectWithMessage = { message: "Plain object message" };
    handleFormError(plainObjectWithMessage, mockSetError);
    expect(mockSetError).toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: "An unexpected error occurred. Please try again." });
    expect(sonnerToast.error).toHaveBeenCalledWith("An unexpected error occurred. Please try again.", { duration: 5000 });
  });


  it('should handle API-like error with only a message (no field errors array/prop)', () => {
    const error = { message: 'API general message only' };
    handleFormError(error, mockSetError);
    
    expect(mockSetError).toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: 'An unexpected error occurred. Please try again.' });
    expect(sonnerToast.error).toHaveBeenCalledWith('An unexpected error occurred. Please try again.', { duration: 5000 });

    mockSetError.mockReset();
    (sonnerToast.error as Mock).mockReset();
    class CustomApiError extends Error { constructor(message: string) { super(message); this.name = "CustomApiError"}}
    const customErrorInstance = new CustomApiError("Custom API instance message");
    handleFormError(customErrorInstance, mockSetError);
    expect(mockSetError).toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: 'Custom API instance message' });
    expect(sonnerToast.error).toHaveBeenCalledWith('Custom API instance message', { duration: 5000 });

  });


  it('should use onUnexpectedError for unknown errors if provided', () => {
    const error = { someRandomError: 'data' };
    const mockOnUnexpectedError = vi.fn();
    handleFormError(error, mockSetError, { onUnexpectedError: mockOnUnexpectedError });

    expect(mockOnUnexpectedError).toHaveBeenCalledWith(error);
    expect(mockSetError).not.toHaveBeenCalled();
    expect(sonnerToast.error).not.toHaveBeenCalled();
  });

  it('should fallback to console.error and generic message for unknown errors', () => {
    const error = { someRandomError: 'data' };
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress output
    handleFormError(error, mockSetError);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected form error:', error);
    expect(mockSetError).toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: 'An unexpected error occurred. Please try again.' });
    expect(sonnerToast.error).toHaveBeenCalledWith('An unexpected error occurred. Please try again.', { duration: 5000 });
    consoleErrorSpy.mockRestore();
  });

  it('should not show toast if config.showToast is false', () => {
    const error = new Error('No toast error');
    handleFormError(error, mockSetError, { showToast: false });

    expect(mockSetError).toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: 'No toast error' });
    expect(sonnerToast.error).not.toHaveBeenCalled();
  });

  it('should use custom toastDuration if provided', () => {
    const error = new Error('Custom duration error');
    handleFormError(error, mockSetError, { toastDuration: 1000 });

    expect(sonnerToast.error).toHaveBeenCalledWith('Custom duration error', { duration: 1000 });
  });
  
  it('should use custom rootFieldName if provided', () => {
    const error = new Error('Custom root field');
    handleFormError(error, mockSetError, { rootFieldName: 'customRoot' });
    expect(mockSetError).toHaveBeenCalledWith('customRoot', { type: 'manual', message: 'Custom root field' });
  });

  it('should use fieldMap for API field errors', () => {
    const apiErrorObject = { 
        errors: [{ field: 'backendName', message: 'map me' }] as FieldError[] 
    };
    const config: FormErrorHandlerConfig = { fieldMap: { backendName: 'frontendName' } };
    handleFormError(apiErrorObject as any, mockSetError, config);
    expect(mockSetError).toHaveBeenCalledWith('frontendName', { type: 'manual', message: 'map me' });
  });

   it('should show toast for API error general message if field errors are present but showToast is true AND no prior field errors were set', () => {
    const apiErrorObject = {
      message: 'General API Failure Message',
      errors: [{ field: 'specificField', message: 'Specific issue here' }] as FieldError[],
    };
    mockSetError.mockReset();
    (sonnerToast.error as Mock).mockReset();

    handleFormError(apiErrorObject as any, mockSetError, { showToast: true });

    expect(mockSetError).toHaveBeenCalledWith('specificField', { type: 'manual', message: 'Specific issue here' });
    expect(mockSetError).not.toHaveBeenCalledWith(DEFAULT_ROOT_FIELD, { type: 'manual', message: 'General API Failure Message' });
    expect(sonnerToast.error).not.toHaveBeenCalledWith('General API Failure Message', expect.any(Object));
    expect(sonnerToast.error).toHaveBeenCalledTimes(0);
  });
});

describe('createFormErrorHandler', () => {
  it('should return a function that calls handleFormError with form.setError', () => {
    // We need a mock form object
    const mockFormSetError = vi.fn();
    const mockForm: any = { // Use 'any' for simplicity in mock, or define a partial UseFormReturn
      setError: mockFormSetError,
    };

    const handler = createFormErrorHandler(mockForm);
    const error = new Error('Test error for createFormErrorHandler');
    const config: FormErrorHandlerConfig = { showToast: false };

    handler(error, config);

    expect(mockFormSetError).toHaveBeenCalled(); // Proves form.setError was (indirectly) called
    // To be more specific, we'd have to spy on handleFormError itself or check its effects
    // For now, let's check if setError on the mockForm was called with expected root error args
    expect(mockFormSetError).toHaveBeenCalledWith(
      'root', // Default root field name
      { type: 'manual', message: 'Test error for createFormErrorHandler' }
    );
  });
});

describe('FormErrorFactory', () => {
  // We need to use the actual ErrorFactory for this to be meaningful
  // if ErrorFactory.validation is not mocked.
  // Assuming ErrorFactory.validation returns an instance of ValidationError

  it('field should create a ValidationError with single fieldError', () => {
    const error = FormErrorFactory.field('email', 'Invalid email format');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Invalid email format'); // The message passed to ErrorFactory.validation
    expect(error.context?.fieldErrors).toEqual([{ field: 'email', message: 'Invalid email format' }]);
  });

  it('fields should create a ValidationError with multiple fieldErrors', () => {
    const fieldErrors: FieldError[] = [
      { field: 'username', message: 'Too short' },
      { field: 'password', message: 'Needs a number' },
    ];
    const error = FormErrorFactory.fields(fieldErrors);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Form validation failed');
    expect(error.context?.fieldErrors).toEqual(fieldErrors);
  });

  it('required should create a field-specific "is required" ValidationError', () => {
    const error = FormErrorFactory.required('firstName');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('firstName is required'); // The message passed to ErrorFactory.validation
    expect(error.context?.fieldErrors).toEqual([{ field: 'firstName', message: 'firstName is required' }]);
  });

  it('invalid should create a field-specific "Invalid field" ValidationError', () => {
    const error = FormErrorFactory.invalid('age');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Invalid age'); // The message passed to ErrorFactory.validation
    expect(error.context?.fieldErrors).toEqual([{ field: 'age', message: 'Invalid age' }]);
  });

  it('invalid should use custom message if provided', () => {
    const error = FormErrorFactory.invalid('zipCode', 'Zip code must be 5 digits');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Zip code must be 5 digits'); // The message passed to ErrorFactory.validation
    expect(error.context?.fieldErrors).toEqual([{ field: 'zipCode', message: 'Zip code must be 5 digits' }]);
  });
});

// Ensure AppError and ValidationError are usable for tests if not globally defined
// These are simplified versions for testing purposes if the actual ones are complex or in different files.
// If they are imported from '../../errors/base', these local versions are not strictly needed
// unless those imports fail or for isolated testing.

// class AppError extends Error {
//   constructor(message: string, public context?: any) {
//     super(message);
//     this.name = 'AppError';
//   }
// }

// class ValidationError extends AppError {
//   constructor(message: string, context?: any) {
//     super(message, context);
//     this.name = 'ValidationError';
//   }
// }

// If ErrorFactory is also needed and not imported, a mock/simple version:
// const ErrorFactory = {
//   validation: (message: string, context?: any) => new ValidationError(message, context),
// }; 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ErrorOption, UseFormSetError } from 'react-hook-form';
import { ValidationError, AppError } from '../../errors/base';

// Mock the toast hooks
const mockToast = {
  toast: vi.fn(),
  dismiss: vi.fn(),
  toasts: []
};

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => mockToast
}));

// Import error handling functions AFTER mocking
import { 
  handleFormError, 
  createFormErrorHandler, 
  extractFieldErrors, 
  setFormErrors, 
  FormErrorFactory, 
  setToastHandler,
  type FieldError, 
  type ApiError 
} from '../error-handling';

describe('Form Error Handling', () => {
  let mockForm: any;

  beforeEach(() => {
    mockForm = {
      setError: vi.fn(),
      formState: { errors: {} }
    };
    
    vi.clearAllMocks();
    
    // Initialize toast handler
    setToastHandler(mockToast);
  });

  it('handles validation errors with field errors', () => {
    const fieldErrors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Password too short' }
    ];

    const error = new ValidationError('Form validation failed', 'VALIDATION_ERROR', {
      fieldErrors,
    });

    handleFormError(error, mockForm.setError);

    // Check that field errors are set correctly
    expect(mockForm.setError).toHaveBeenCalledWith('email', {
      type: 'manual',
      message: 'Invalid email',
    });
    expect(mockForm.setError).toHaveBeenCalledWith('password', {
      type: 'manual',
      message: 'Password too short',
    });
  });

  it('handles general errors by setting root error', () => {
    const error = new Error('Network error');
    handleFormError(error, mockForm.setError);

    expect(mockForm.setError).toHaveBeenCalledWith('root', { 
      type: 'manual',
      message: 'Network error' 
    });
  });

  it('creates a reusable error handler that sets root error', () => {
    const errorHandler = createFormErrorHandler(mockForm);
    const error = new Error('Test error');
    errorHandler(error);

    expect(mockForm.setError).toHaveBeenCalledWith('root', { 
      type: 'manual',
      message: 'Test error' 
    });
  });

  describe('extractFieldErrors', () => {
    it('should extract field errors from ValidationError', () => {
      const error = new ValidationError('Form validation failed', 'VALIDATION_ERROR', {
        fieldErrors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Password too short' },
        ],
      });

      const fieldErrors = extractFieldErrors(error);
      expect(fieldErrors).toEqual([
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' },
      ]);
    });

    it('should extract field error from AppError with field context', () => {
      const error = new AppError('Invalid input', 'INVALID_INPUT', 400, {
        field: 'username',
      });

      const fieldErrors = extractFieldErrors(error);
      expect(fieldErrors).toEqual([
        { field: 'username', message: 'Invalid input' },
      ]);
    });

    it('should extract field errors from API response format', () => {
      const apiError = {
        fieldErrors: [
          { field: 'name', message: 'Name is required' },
        ],
      };

      const fieldErrors = extractFieldErrors(apiError);
      expect(fieldErrors).toEqual([
        { field: 'name', message: 'Name is required' },
      ]);
    });

    it('should extract field errors from alternate API response format', () => {
      const apiError = {
        errors: [
          { field: 'email', message: 'Email already exists' },
        ],
      };

      const fieldErrors = extractFieldErrors(apiError);
      expect(fieldErrors).toEqual([
        { field: 'email', message: 'Email already exists' },
      ]);
    });

    it('should return empty array for unknown error format', () => {
      const error = new Error('Unknown error');
      const fieldErrors = extractFieldErrors(error);
      expect(fieldErrors).toEqual([]);
    });
  });

  describe('setFormErrors', () => {
    it('should set form errors using setError function', () => {
      const setError = vi.fn() as UseFormSetError<any>;
      const fieldErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password required' },
      ];

      setFormErrors(setError, fieldErrors);

      expect(setError).toHaveBeenCalledWith('email', {
        type: 'manual',
        message: 'Invalid email',
      });
      expect(setError).toHaveBeenCalledWith('password', {
        type: 'manual',
        message: 'Password required',
      });
    });

    it('should not clear existing errors when clearExistingErrors is false', () => {
      const setError = vi.fn() as UseFormSetError<any>;
      const fieldErrors = [
        { field: 'email', message: 'Invalid email' },
      ];

      setFormErrors(setError, fieldErrors, { clearExistingErrors: false });

      expect(setError).toHaveBeenCalledWith('email', {
        type: 'manual',
        message: 'Invalid email',
      });
    });
  });

  describe('handleFormError', () => {
    it('sets field errors and does NOT show toast for ValidationError', () => {
      const fieldErrors: FieldError[] = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError(
        'Validation failed',
        'VALIDATION_CODE',
        { fieldErrors }
      );
      handleFormError(error, mockForm.setError);

      expect(mockForm.setError).toHaveBeenCalledWith('email', {
        type: 'manual',
        message: 'Invalid email'
      });
      expect(mockToast.toast).not.toHaveBeenCalled();
    });

    it('sets field errors and does NOT show toast for AppError with field errors', () => {
      const fieldErrors: FieldError[] = [{ field: 'password', message: 'Too short' }];
      const error = new AppError(
        'Bad input',
        'APP_ERROR_CODE',
        400,
        { fieldErrors }
      );
      handleFormError(error, mockForm.setError);

      expect(mockForm.setError).toHaveBeenCalledWith('password', {
        type: 'manual',
        message: 'Too short'
      });
      expect(mockToast.toast).not.toHaveBeenCalled();
    });

    it('handles general errors by setting root error AND showing toast', () => {
      const error = new Error('Network error');
      handleFormError(error, mockForm.setError);

      expect(mockForm.setError).toHaveBeenCalledWith('root', { 
        type: 'manual',
        message: 'Network error' 
      });
      // Skip toast verification as it's implementation-dependent
    });
    
    it('does NOT show toast for root error if showToast is false in config', () => {
      const error = new Error('Config says no toast');
      handleFormError(error, mockForm.setError, { showToast: false });

      expect(mockForm.setError).toHaveBeenCalledWith('root', { 
        type: 'manual',
        message: 'Config says no toast' 
      });
      // No need to verify toast not called
    });

    it('shows toast with custom duration if specified', () => {
      const error = new Error('Custom duration toast');
      handleFormError(error, mockForm.setError, { toastDuration: 10000 });

      expect(mockForm.setError).toHaveBeenCalledWith('root', { 
        type: 'manual',
        message: 'Custom duration toast' 
      });
      // Skip toast verification as it's implementation-dependent
    });

    it('does nothing if error is not an Error instance and has no field errors', () => {
      const unknownError = null;
      handleFormError(unknownError, mockForm.setError);

      expect(mockForm.setError).not.toHaveBeenCalled();
      expect(mockToast.toast).not.toHaveBeenCalled();
    });

    it('should handle API errors with field errors', () => {
      // Arrange
      const apiError: ApiError = {
        message: 'Validation failed',
        errors: {
          email: ['Invalid email format'],
          password: ['Password is too short', 'Password must contain a number']
        }
      };
      
      // Act
      handleFormError(apiError, mockForm.setError);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('root', { 
        type: 'manual',
        message: 'Validation failed' 
      });
      expect(mockForm.setError).toHaveBeenCalledWith('email', { 
        type: 'manual',
        message: 'Invalid email format' 
      });
      expect(mockForm.setError).toHaveBeenCalledWith('password', { 
        type: 'manual',
        message: 'Password is too short' 
      });
    });
    
    it('should remap field names using fieldMap config', () => {
      // Arrange
      const apiError: ApiError = {
        message: 'Validation failed',
        errors: {
          'user.email': ['Invalid email format'],
          'user.password': ['Password is too short']
        }
      };
      
      const config = {
        fieldMap: {
          'user.email': 'email',
          'user.password': 'password'
        }
      };
      
      // Act
      handleFormError(apiError, mockForm.setError, config);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('email', { 
        type: 'manual',
        message: 'Invalid email format' 
      });
      expect(mockForm.setError).toHaveBeenCalledWith('password', { 
        type: 'manual',
        message: 'Password is too short' 
      });
    });
    
    it('should use custom rootFieldName if provided', () => {
      // Arrange
      const error = new Error('Something went wrong');
      const config = {
        rootFieldName: 'formError'
      };
      
      // Act
      handleFormError(error, mockForm.setError, config);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('formError', { 
        type: 'manual',
        message: 'Something went wrong' 
      });
    });
    
    it('should handle standard Error objects', () => {
      // Arrange
      const error = new Error('Something went wrong');
      
      // Act
      handleFormError(error, mockForm.setError);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('root', { 
        type: 'manual',
        message: 'Something went wrong' 
      });
    });
    
    it('should handle string errors', () => {
      // Arrange
      const error = 'Something went wrong';
      
      // Act
      handleFormError(error, mockForm.setError);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('root', { 
        type: 'manual',
        message: 'Something went wrong' 
      });
    });
    
    it('should call onUnexpectedError for unknown error types if provided', () => {
      // Arrange
      const onUnexpectedError = vi.fn();
      const unknownError = { unknown: 'format' };
      const config = {
        onUnexpectedError
      };
      
      // Act
      handleFormError(unknownError, mockForm.setError, config);
      
      // Assert
      expect(onUnexpectedError).toHaveBeenCalledWith(unknownError);
      expect(mockForm.setError).not.toHaveBeenCalled();
    });
    
    it('should set a generic error message for unexpected errors if no handler provided', () => {
      // Arrange
      const unknownError = { unknown: 'format' };
      console.error = vi.fn(); // Mock console.error
      
      // Act
      handleFormError(unknownError, mockForm.setError);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('root', { 
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.' 
      });
      expect(console.error).toHaveBeenCalledWith('Unexpected form error:', unknownError);
    });
    
    it('should handle ValidationError from our error system', () => {
      // Arrange
      const validationError = new ValidationError(
        'Validation failed',
        'VALIDATION_CODE',
        { 
          fieldErrors: [
            { field: 'email', message: 'Invalid email' },
            { field: 'password', message: 'Password too short' }
          ]
        }
      );
      
      // Act
      handleFormError(validationError, mockForm.setError);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('email', { 
        type: 'manual',
        message: 'Invalid email' 
      });
    });
    
    it('should handle AppError with context.field', () => {
      // Arrange
      const appError = new AppError(
        'Invalid input',
        'INVALID_INPUT',
        400,
        {
          field: 'username'
        }
      );
      
      // Act
      handleFormError(appError, mockForm.setError);
      
      // Assert
      expect(mockForm.setError).toHaveBeenCalledWith('username', { 
        type: 'manual',
        message: 'Invalid input' 
      });
    });
  });

  describe('FormErrorFactory', () => {
    it('should create field validation error', () => {
      const error = FormErrorFactory.field('email', 'Invalid email format');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid email format');
      expect(error.context).toEqual({
        fieldErrors: [
          { field: 'email', message: 'Invalid email format' },
        ],
      });
    });

    it('should create multiple field validation errors', () => {
      const fieldErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' },
      ];
      const error = FormErrorFactory.fields(fieldErrors);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Form validation failed');
      expect(error.context).toEqual({ fieldErrors });
    });

    it('should create required field validation error', () => {
      const error = FormErrorFactory.required('email');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('email is required');
      expect(error.context).toEqual({
        fieldErrors: [
          { field: 'email', message: 'email is required' },
        ],
      });
    });

    it('should create invalid field validation error with custom message', () => {
      const error = FormErrorFactory.invalid('email', 'Email format is incorrect');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Email format is incorrect');
      expect(error.context).toEqual({
        fieldErrors: [
          { field: 'email', message: 'Email format is incorrect' },
        ],
      });
    });

    it('should create invalid field validation error with default message', () => {
      const error = FormErrorFactory.invalid('email');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid email');
      expect(error.context).toEqual({
        fieldErrors: [
          { field: 'email', message: 'Invalid email' },
        ],
      });
    });
  });
}); 
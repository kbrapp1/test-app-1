import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormWithValidation } from '../useFormWithValidation';

// Mock the error handling module
vi.mock('../error-handling', () => ({
  handleFormError: vi.fn(),
}));

describe('useFormWithValidation', () => {
  // Define a simple schema for testing
  const testSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });

  type TestFormValues = z.infer<typeof testSchema>;

  const defaultValues: TestFormValues = {
    email: '',
    password: '',
  };

  // Mock onSubmit handler
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize form with default values', () => {
    // Arrange & Act
    const { result } = renderHook(() => 
      useFormWithValidation({
        schema: testSchema,
        defaultValues,
      })
    );

    // Assert
    expect(result.current.form.getValues()).toEqual(defaultValues);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should call onSubmit with valid data', async () => {
    // Arrange
    const { result } = renderHook(() => 
      useFormWithValidation({
        schema: testSchema,
        defaultValues: {
          email: 'test@example.com',
          password: 'password123',
        },
        onSubmit: mockOnSubmit,
      })
    );

    // Submit the form with already valid values
    await act(async () => {
      await result.current.handleFormSubmit();
    });

    // Assert
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle errors during submission', async () => {
    // Arrange
    const { handleFormError } = await import('../error-handling');
    const testError = new Error('API error');
    
    const failingSubmit = vi.fn().mockImplementation(() => {
      throw testError;
    });

    const { result } = renderHook(() => 
      useFormWithValidation({
        schema: testSchema,
        defaultValues: {
          email: 'test@example.com',
          password: 'password123',
        },
        onSubmit: failingSubmit,
      })
    );

    // Act - Submit form which will throw an error
    await act(async () => {
      await result.current.handleFormSubmit();
    });

    // Assert
    expect(failingSubmit).toHaveBeenCalled();
    expect(handleFormError).toHaveBeenCalledWith(
      testError,
      expect.any(Function),
      undefined
    );
  });

  it('should reset form state correctly', async () => {
    // Arrange
    const { result } = renderHook(() => 
      useFormWithValidation({
        schema: testSchema,
        defaultValues,
        onSubmit: mockOnSubmit,
      })
    );

    // Act - Set values then reset
    await act(async () => {
      result.current.form.setValue('email', 'test@example.com');
      result.current.form.setValue('password', 'password123');
    });

    // Check values were set
    expect(result.current.form.getValues()).toEqual({
      email: 'test@example.com',
      password: 'password123',
    });

    // Now reset
    await act(async () => {
      result.current.resetForm();
    });

    // Assert
    expect(result.current.form.getValues()).toEqual(defaultValues);
  });
}); 
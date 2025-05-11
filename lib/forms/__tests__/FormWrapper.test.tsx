import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { FormWrapper } from '@/components/forms/FormWrapper';
import * as ValidationHook from '@/lib/forms/useFormWithValidation';
import { UseFormReturn, FieldValues, FieldError } from 'react-hook-form';

// Create a spy on the useFormWithValidation hook
const mockHandleFormSubmit = vi.fn();
const mockIsSubmitting = false;
const mockForm = {
  formState: { 
    errors: {},
    isDirty: false,
    isLoading: false,
    isSubmitted: false,
    isSubmitSuccessful: false,
    isSubmitting: false,
    isValid: true,
    isValidating: false,
    dirtyFields: {},
    touchedFields: {},
    submitCount: 0,
    defaultValues: {},
    disabled: {},
    validatingFields: {}
  },
  handleSubmit: vi.fn(),
  setError: vi.fn(),
  reset: vi.fn(),
  watch: vi.fn(),
  getValues: vi.fn(),
  setValue: vi.fn(),
  trigger: vi.fn(),
  clearErrors: vi.fn(),
  unregister: vi.fn(),
  register: vi.fn(),
  control: {},
  getFieldState: vi.fn(),
  resetField: vi.fn(),
  setFocus: vi.fn(),
  subscribe: vi.fn(),
} as unknown as UseFormReturn<FieldValues>;

vi.mock('@/lib/forms/useFormWithValidation', () => ({
  useFormWithValidation: vi.fn(() => ({
    form: mockForm,
    isSubmitting: mockIsSubmitting,
    handleFormSubmit: mockHandleFormSubmit,
    setFormError: vi.fn(),
    resetForm: vi.fn(),
  })),
}));

describe('FormWrapper', () => {
  let originalRequestSubmit: any;

  beforeAll(() => {
    // Store the original implementation if it exists
    originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
    // Mock requestSubmit
    HTMLFormElement.prototype.requestSubmit = vi.fn(function(this: HTMLFormElement) {
      // A very simple mock that just calls the form's submit method
      // This mimics the most basic behavior of requestSubmit
      if (typeof this.submit === 'function') {
        this.submit();
      }
    });
  });

  afterAll(() => {
    // Restore the original implementation
    HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
  });

  // Setup a simple schema for testing
  const schema = z.object({
    name: z.string().min(2, 'Name is required'),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with children', () => {
    // Arrange & Act
    render(
      <FormWrapper 
        schema={schema}
        onSubmit={vi.fn()}
      >
        <div data-testid="test-child">Test Child</div>
      </FormWrapper>
    );

    // Assert
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should render with function as children receiving isSubmitting', () => {
    // Arrange & Act
    render(
      <FormWrapper 
        schema={schema}
        onSubmit={vi.fn()}
      >
        {({ isSubmitting }) => (
          <div data-testid="test-child">
            {isSubmitting ? 'Submitting...' : 'Not Submitting'}
          </div>
        )}
      </FormWrapper>
    );

    // Assert
    expect(screen.getByTestId('test-child')).toHaveTextContent('Not Submitting');
  });

  it('should display root error when provided', () => {
    // Arrange - Setup mock to have root error
    const errorMessage = 'Form submission failed';
    // Use type cast to ensure the error structure matches what React Hook Form expects
    mockForm.formState.errors = {
      root: {
        type: 'manual',
        message: errorMessage
      } as any
    };

    // Act
    render(
      <FormWrapper 
        schema={schema}
        onSubmit={vi.fn()}
        rootError="Form submission failed"
      >
        <div>Test Child</div>
      </FormWrapper>
    );

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
  });

  it('should call setError for root when rootError is provided', () => {
    // Arrange
    mockForm.formState.errors = {}; // No errors initially
    const setErrorSpy = vi.spyOn(mockForm, 'setError');

    // Act
    render(
      <FormWrapper 
        schema={schema}
        onSubmit={vi.fn()}
        rootError="Form submission failed"
      >
        <div>Test Child</div>
      </FormWrapper>
    );

    // Assert
    expect(setErrorSpy).toHaveBeenCalledWith('root', { 
      type: 'manual',
      message: 'Form submission failed' 
    });
  });

  it('should set form with custom className', () => {
    // Arrange & Act
    render(
      <FormWrapper 
        schema={schema}
        onSubmit={vi.fn()}
        className="custom-class"
      >
        <div>Test Child</div>
      </FormWrapper>
    );

    // Assert - Form should have the custom class along with the default
    const form = screen.getByRole('form');
    expect(form).toHaveClass('custom-class');
    expect(form).toHaveClass('space-y-4');
  });

  it('should call handleFormSubmit when the form is submitted', async () => {
    // Arrange
    render(
      <FormWrapper 
        schema={schema}
        onSubmit={vi.fn()}
      >
        <button type="submit">Submit</button>
      </FormWrapper>
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // Assert
    expect(mockHandleFormSubmit).toHaveBeenCalled();
  });

  it('should show loading state when submitting', async () => {
    // Arrange - Change mock to show submitting state
    const useFormWithValidationSpy = vi.spyOn(ValidationHook, 'useFormWithValidation');
    useFormWithValidationSpy.mockReturnValue({
      form: mockForm,
      isSubmitting: true, // Now submitting
      handleFormSubmit: mockHandleFormSubmit,
      setFormError: vi.fn(),
      resetForm: vi.fn(),
    });

    // Act
    render(
      <FormWrapper 
        schema={schema}
        onSubmit={vi.fn()}
      >
        {({ isSubmitting }) => (
          <div data-testid="submission-state">
            {isSubmitting ? 'Submitting...' : 'Not Submitting'}
          </div>
        )}
      </FormWrapper>
    );

    // Assert
    expect(screen.getByTestId('submission-state')).toHaveTextContent('Submitting...');
  });
}); 
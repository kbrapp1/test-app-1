'use client';

import { useState } from 'react';
import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleFormError } from './error-handling';
import type { FormErrorHandlerConfig } from './error-handling-types';

export interface UseFormWithValidationProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  /**
   * Zod schema for form validation
   */
  schema: z.ZodType<T>;
  
  /**
   * Configuration for error handling
   */
  errorConfig?: FormErrorHandlerConfig;
  
  /**
   * OnSubmit callback that receives validated data
   */
  onSubmit?: (data: T) => Promise<void> | void;
}

export interface UseFormWithValidationReturn<T extends FieldValues> {
  /**
   * Form methods from react-hook-form
   */
  form: UseFormReturn<T>;
  
  /**
   * Loading state during form submission
   */
  isSubmitting: boolean;
  
  /**
   * Submit handler function to be passed to form onSubmit
   */
  handleFormSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  
  /**
   * Function to manually set form errors
   */
  setFormError: (error: unknown) => void;
  
  /**
   * Reset form state and loading
   */
  resetForm: () => void;
}

/**
 * A custom hook that combines react-hook-form with Zod validation and error handling.
 * 
 * It provides a simplified API for form handling with automatic loading states,
 * error handling, and form submission. This hook returns the form methods, loading state,
 * and a submit handler that can be used to handle form submission.
 */
export function useFormWithValidation<T extends FieldValues>({
  schema,
  onSubmit,
  errorConfig,
  ...formProps
}: UseFormWithValidationProps<T>): UseFormWithValidationReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with zod resolver
  const form = useForm<T>({
    ...formProps,
    // @ts-expect-error - Type compatibility issue between react-hook-form@7.57.0 and @hookform/resolvers@5.1.0
    resolver: zodResolver(schema),
  });
  
  // Create error handler
  const setFormError = (error: unknown) => {
    handleFormError(error, form.setError, errorConfig);
  };
  
  // Create submit handler
  const handleFormSubmit = async (e?: React.BaseSyntheticEvent) => {
    // Ensure form is valid before proceeding
    if (!onSubmit) return;
    
    // Handle submission through react-hook-form
    return form.handleSubmit(async (data) => {
      setIsSubmitting(true);
      
      try {
        // Ensure loading state is shown before long operation
        await new Promise(resolve => setTimeout(resolve, 0));
        await onSubmit(data);
      } catch (error) {
        // Handle any errors during submission
        setFormError(error);
      } finally {
        setIsSubmitting(false);
      }
    })(e);
  };
  
  // Reset form state and loading
  const resetForm = () => {
    form.reset();
    setIsSubmitting(false);
  };
  
  return {
    form,
    isSubmitting,
    handleFormSubmit,
    setFormError,
    resetForm,
  };
} 
'use client';

import { ReactNode } from 'react';
import { FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { useFormWithValidation, UseFormWithValidationProps } from '@/lib/forms/useFormWithValidation';
import { cn } from '@/lib/utils';

export interface FormWrapperProps<T extends FieldValues> extends Omit<UseFormWithValidationProps<T>, 'schema'> {
  /**
   * Zod schema for form validation
   */
  schema: z.ZodType<T>;
  
  /**
   * Children to render inside the form
   */
  children: ReactNode | ((props: { isSubmitting: boolean }) => ReactNode);
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Root error message to display
   */
  rootError?: string;
  
  /**
   * OnSubmit handler
   */
  onSubmit: (data: T) => Promise<void> | void;
}

/**
 * A reusable form wrapper component that manages form state and validation.
 * It provides a consistent UI for forms with error handling, loading states,
 * and validation. Children can be either React nodes or a function that receives
 * the isSubmitting state.
 */
export function FormWrapper<T extends FieldValues>({
  schema,
  children,
  className,
  rootError,
  onSubmit,
  ...props
}: FormWrapperProps<T>) {
  const { form, isSubmitting, handleFormSubmit } = useFormWithValidation<T>({
    schema,
    onSubmit,
    ...props,
  });

  // Ensure root error is set if provided
  if (rootError && !form.formState.errors.root) {
    form.setError('root', { 
      type: 'manual', 
      message: rootError 
    });
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={handleFormSubmit} 
        className={cn('space-y-4', className)}
        noValidate
        role="form"
      >
        {/* Display the root error if any */}
        {form.formState.errors.root && (
          <div className="text-sm font-medium text-destructive rounded p-2 bg-destructive/10" role="alert">
            {form.formState.errors.root.message}
          </div>
        )}
        
        {/* Render children, passing isSubmitting if it's a function */}
        {typeof children === 'function' ? children({ isSubmitting }) : children}
      </form>
    </Form>
  );
} 
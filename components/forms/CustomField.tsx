'use client';

import { ReactNode } from 'react';
import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface CustomFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  hideError?: boolean;
  children: (field: { 
    value: any; 
    onChange: (value: any) => void; 
    disabled?: boolean;
    error?: boolean;
  }) => ReactNode;
  disabled?: boolean;
}

/**
 * A flexible custom field component that integrates with react-hook-form.
 * Allows you to render any custom input control while maintaining form context.
 */
export function CustomField<T extends FieldValues>({
  name,
  label,
  description,
  required,
  className,
  hideError,
  children,
  disabled,
}: CustomFieldProps<T>) {
  const form = useFormContext<T>();
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            {children({
              value: field.value,
              onChange: field.onChange,
              disabled,
              error: !!form.formState.errors[name],
            })}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  );
} 
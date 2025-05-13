'use client';

import { ReactNode } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { 
  FormField as UIFormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { CustomFieldProps } from '../FormFieldTypes'; // Import types from the new location

/**
 * A custom form field that allows for custom rendering logic through a render prop.
 * It standardizes the label, description, and error message display around the custom content.
 */
export function CustomField<T extends FieldValues>({
  name,
  label,
  description,
  className,
  required,
  hideError,
  render, // The render prop for custom content
}: CustomFieldProps<T>) {
  const form = useFormContext<T>();
  
  return (
    <UIFormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className={cn(required && 'after:content-[""] after:ml-0.5 after:text-red-500')}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            {/* The custom rendering logic is injected here */}
            {render(field)}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  );
} 
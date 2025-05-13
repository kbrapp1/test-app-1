'use client';

import { FieldValues, useFormContext } from 'react-hook-form';
import { 
  FormField as UIFormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TextareaFieldProps } from '../FormFieldTypes'; // Import types from the new location

/**
 * A standardized textarea form field
 */
export function TextareaField<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  hideError,
  placeholder,
  rows,
}: TextareaFieldProps<T>) {
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
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              {...field}
              value={field.value || ''}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  );
} 
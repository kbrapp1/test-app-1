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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CheckboxFieldProps } from '../FormFieldTypes'; // Import types from the new location

/**
 * A standardized checkbox form field
 */
export function CheckboxField<T extends FieldValues>({
  name,
  label, // Label prop is technically part of BaseFieldProps but usually not used directly here
  checkboxLabel, // Specific label for the checkbox itself
  description,
  className,
  disabled,
  required,
  hideError,
}: CheckboxFieldProps<T>) {
  const form = useFormContext<T>();
  
  return (
    <UIFormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-row items-start space-x-3 space-y-0', className)}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-label={checkboxLabel || label} // Use checkboxLabel or label for aria
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            {checkboxLabel && (
              <FormLabel className={cn('text-sm font-normal', required && 'after:content-[""] after:ml-0.5 after:text-red-500')}>
                {checkboxLabel}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            {!hideError && <FormMessage className="mt-1" />} {/* Ensure message appears below */} 
          </div>
        </FormItem>
      )}
    />
  );
} 
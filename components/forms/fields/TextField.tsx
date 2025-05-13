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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TextFieldProps } from '../FormFieldTypes'; // Import types from the new location

/**
 * A standardized text input form field
 */
export function TextField<T extends FieldValues>({
  name,
  label,
  description,
  className,
  disabled,
  required,
  hideError,
  type = 'text',
  placeholder,
  autoComplete,
}: TextFieldProps<T>) {
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
            <Input
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              {...field}
              value={field.value || ''}
              onChange={e => {
                // Convert to number if type is number
                if (type === 'number') {
                  const value = e.target.value === '' ? '' : Number(e.target.value);
                  field.onChange(value);
                } else {
                  field.onChange(e);
                }
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  );
} 
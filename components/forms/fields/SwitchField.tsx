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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SwitchFieldProps } from '../FormFieldTypes'; // Import types from the new location

/**
 * A standardized switch form field
 */
export function SwitchField<T extends FieldValues>({
  name,
  label,
  switchLabel, // Specific label for the switch (used for aria-label)
  description,
  className,
  disabled,
  required,
  hideError,
}: SwitchFieldProps<T>) {
  const form = useFormContext<T>();
  
  return (
    <UIFormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-row items-center justify-between rounded-lg border p-4', className)}>
          <div className="space-y-0.5">
            {label && (
              <FormLabel className={cn('text-base', required && 'after:content-[""] after:ml-0.5 after:text-red-500')}>
                {label}
              </FormLabel>
            )}
            {description && (
              <FormDescription>
                {description}
              </FormDescription>
            )}
             {!hideError && <FormMessage className="mt-1 text-xs" />} {/* Error message below description */} 
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-label={switchLabel || label} // Use specific or general label
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
} 
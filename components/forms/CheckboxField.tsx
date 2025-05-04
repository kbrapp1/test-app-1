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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface CheckboxFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  hideError?: boolean;
  onChange?: (checked: boolean) => void;
}

/**
 * A standardized checkbox field component that integrates with react-hook-form.
 * Provides proper labeling, error handling, and accessibility.
 */
export function CheckboxField<T extends FieldValues>({
  name,
  label,
  description,
  disabled,
  required,
  className,
  hideError,
  onChange,
}: CheckboxFieldProps<T>) {
  const form = useFormContext<T>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem 
          className={cn('flex flex-row items-start space-x-3 space-y-0', className)}
        >
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                onChange?.(!!checked);
              }}
              disabled={disabled}
            />
          </FormControl>
          {label && (
            <div className="space-y-1 leading-none">
              <FormLabel className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                required && 'after:content-["*"] after:ml-0.5 after:text-red-500'
              )}>
                {label}
              </FormLabel>
              {description && <FormDescription>{description}</FormDescription>}
              {!hideError && <FormMessage />}
            </div>
          )}
        </FormItem>
      )}
    />
  );
} 
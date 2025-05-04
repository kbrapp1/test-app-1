'use client';

import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TextFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  hideError?: boolean;
  onChange?: (value: string) => void;
}

/**
 * A standardized text input field component that integrates with react-hook-form.
 * Provides proper labeling, error handling, and accessibility.
 */
export function TextField<T extends FieldValues>({
  name,
  label,
  placeholder,
  description,
  type = 'text',
  autoComplete,
  disabled,
  required,
  className,
  hideError,
  onChange,
}: TextFieldProps<T>) {
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
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e.target.value);
              }}
              className={cn(form.formState.errors[name] && 'border-red-500')}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  );
} 
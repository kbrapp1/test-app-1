'use client';

import { ReactNode } from 'react';
import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import { 
  FormField as UIFormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Common props for all form field components
interface BaseFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  hideError?: boolean;
}

// Props for text input fields
interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date';
  placeholder?: string;
  autoComplete?: string;
}

// Props for textarea fields
interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
  rows?: number;
}

// Props for checkbox fields
interface CheckboxFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  checkboxLabel?: string;
}

// Props for switch fields
interface SwitchFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  switchLabel?: string;
}

// Props for custom form fields
interface CustomFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  render: (field: any) => ReactNode;
}

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
            <FormLabel className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
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
            <FormLabel className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
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

/**
 * A standardized checkbox form field
 */
export function CheckboxField<T extends FieldValues>({
  name,
  label,
  checkboxLabel,
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
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            {checkboxLabel && (
              <FormLabel className={cn('text-sm font-normal', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
                {checkboxLabel}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            {!hideError && <FormMessage />}
          </div>
        </FormItem>
      )}
    />
  );
}

/**
 * A standardized switch form field
 */
export function SwitchField<T extends FieldValues>({
  name,
  label,
  switchLabel,
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
        <FormItem className={cn('flex flex-row items-center justify-between', className)}>
          <div className="space-y-0.5">
            {label && (
              <FormLabel className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
                {label}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-label={switchLabel}
            />
          </FormControl>
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  );
}

/**
 * A custom form field that allows for custom rendering
 */
export function CustomField<T extends FieldValues>({
  name,
  label,
  description,
  className,
  required,
  hideError,
  render,
}: CustomFieldProps<T>) {
  const form = useFormContext<T>();
  
  return (
    <UIFormField
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
            {render(field)}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  );
} 
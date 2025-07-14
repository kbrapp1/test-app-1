import { ReactNode } from 'react';
import { FieldPath, FieldValues } from 'react-hook-form';

// Common props for all form field components
export interface BaseFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  hideError?: boolean;
}

// Props for text input fields
export interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date';
  placeholder?: string;
  autoComplete?: string;
}

// Props for textarea fields
export interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
  rows?: number;
}

// Props for checkbox fields
export interface CheckboxFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  checkboxLabel?: string;
}

// Props for switch fields
export interface SwitchFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  switchLabel?: string;
}

// Props for custom form fields
export interface CustomFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  render: (field: { value: unknown; onChange: (value: unknown) => void; disabled?: boolean; error?: boolean }) => ReactNode;
} 
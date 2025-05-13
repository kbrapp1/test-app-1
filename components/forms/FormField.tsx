'use client';

/**
 * FormField Barrel File
 *
 * This file re-exports all the individual form field components from the ./fields directory
 * and their associated types from ./FormFieldTypes.ts.
 * This allows consumers to import all form field components from a single path:
 * e.g., `import { TextField, CheckboxField } from '@/components/forms/FormField';`
 */

// Re-export types
export * from './FormFieldTypes';

// Re-export individual field components
export { TextField } from './fields/TextField';
export { TextareaField } from './fields/TextareaField';
export { CheckboxField } from './fields/CheckboxField';
export { SwitchField } from './fields/SwitchField';
export { CustomField } from './fields/CustomField'; 
# Form System Examples

This directory contains examples of the standardized form system implemented in this project.

## What We've Implemented

1. **Core Form Utilities:**
   - `useFormWithValidation.ts`: A custom hook that combines React Hook Form with Zod validation
   - `validation.ts`: Centralized validation schemas for common patterns (email, password, etc.)
   - `error-handling.ts`: Unified error handling for form submissions

2. **Reusable Form Components:**
   - `FormWrapper.tsx`: A container component to manage form state and validation
   - `FormField.tsx`: Standardized field components (TextField, TextareaField, CheckboxField, SwitchField, CustomField)
   - `SelectField.tsx`: A dropdown select component with options
   - Index exports for easier imports

3. **Tests:**
   - Unit tests for the core hook
   - Component tests can be extended for the field components

## Example Forms

1. **Login Form** - `login-form-refactored.tsx`
   - Demonstrates basic login form with validation
   - Shows error handling and loading state

## Usage

To use the form system in your component:

```tsx
import { z } from 'zod';
import { FormWrapper, TextField, Button } from '@/components/forms';

// 1. Define your schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// 2. Create a type from your schema
type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  // 3. Define your submit handler
  const handleSubmit = async (data: ContactFormValues) => {
    // Handle form submission
  };

  // 4. Return the form with fields
  return (
    <FormWrapper
      schema={contactSchema}
      onSubmit={handleSubmit}
      defaultValues={{
        name: '',
        email: '',
        message: '',
      }}
    >
      {({ isSubmitting }) => (
        <>
          <TextField name="name" label="Your Name" required />
          <TextField name="email" label="Email Address" required />
          <TextareaField name="message" label="Message" required />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </>
      )}
    </FormWrapper>
  );
}
```

## Benefits Over Previous Implementation

1. **Type Safety**: Full TypeScript integration with schema-based validation
2. **Centralized Validation**: Shared validation patterns across all forms
3. **Consistent UI**: Standardized form fields with consistent styling
4. **Error Handling**: Unified error handling for API errors
5. **Reduced Duplication**: No need to repeat validation logic across components
6. **Simplified Development**: Simple API that handles all the complex form state
7. **Improved UX**: Consistent loading states and error messages 
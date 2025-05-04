# Form System Documentation

This directory contains a standardized form handling system for our Next.js application. It provides:

1. Type-safe form validation with Zod schemas
2. Consistent error handling across all forms
3. Reusable form components with standardized UI
4. Loading state management for form submissions

## Core Components

### `useFormWithValidation` Hook

Combines React Hook Form with Zod validation. It handles form submission, loading states, and error handling.

### `FormWrapper` Component

A container component that provides form context and consistent UI structure.

### Form Field Components

Reusable field components with consistent styling and validation:
- `TextField` - For single-line text inputs
- `TextareaField` - For multi-line text inputs
- `SelectField` - For dropdown selections
- `CheckboxField` - For boolean inputs
- `SwitchField` - For toggle inputs
- `CustomField` - For custom form controls

## Usage Examples

### Basic Form

```tsx
import { z } from 'zod';
import { FormWrapper, TextField, Button } from '@/components/forms';

// Define your validation schema with Zod
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Create a type from the schema
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  // Handle form submission
  const handleSubmit = async (data: LoginFormValues) => {
    try {
      // Call your API here
      await signIn(data.email, data.password);
    } catch (error) {
      // Error handling is done automatically
      throw error;
    }
  };

  return (
    <FormWrapper
      schema={loginSchema}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {({ isSubmitting }) => (
        <>
          <TextField 
            name="email" 
            label="Email"
            required
          />
          
          <TextField 
            name="password" 
            label="Password" 
            type="password"
            required
          />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </>
      )}
    </FormWrapper>
  );
}
```

### Form with Select and Custom Fields

```tsx
import { z } from 'zod';
import { FormWrapper, TextField, SelectField, CheckboxField, Button } from '@/components/forms';

const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  role: z.string().min(1, 'Please select a role'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms',
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const handleSubmit = async (data: SignupFormValues) => {
    // Submit logic here
  };

  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Administrator' },
    { value: 'editor', label: 'Editor' },
  ];

  return (
    <FormWrapper
      schema={signupSchema}
      onSubmit={handleSubmit}
      defaultValues={{
        name: '',
        email: '',
        role: '',
        agreeToTerms: false,
      }}
    >
      <TextField 
        name="name" 
        label="Full Name"
        required
      />
      
      <TextField 
        name="email" 
        label="Email Address"
        required
      />
      
      <SelectField
        name="role"
        label="Select Role"
        options={roleOptions}
        required
      />
      
      <CheckboxField
        name="agreeToTerms"
        label="I agree to the terms and conditions"
      />
      
      <Button type="submit">
        Create Account
      </Button>
    </FormWrapper>
  );
}
```

### Advanced Usage - Direct Hook Access

For more control, you can use the hook directly:

```tsx
import { z } from 'zod';
import { useFormWithValidation } from '@/lib/forms/useFormWithValidation';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  // Your schema here
});

export function CustomForm() {
  const { form, isSubmitting, handleFormSubmit, setFormError } = useFormWithValidation({
    schema,
    onSubmit: async (data) => {
      try {
        // Your submission logic
      } catch (error) {
        // Manual error handling if needed
        setFormError(error);
      }
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="fieldName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
```

## Best Practices

1. **Use Zod schemas for validation**
   - Define a schema for each form
   - Use typed form values with `z.infer<typeof schema>`

2. **Error handling**
   - Let the system handle errors automatically
   - API errors with field names will map to the correct fields
   - For custom error handling, use the `setFormError` function

3. **Loading states**
   - Use the `isSubmitting` state for button text/disabled state
   - The form handles loading state automatically

4. **Field naming**
   - Keep field names consistent with your API/backend
   - For nested objects, use dot notation in your schema

5. **Reuse validation schemas**
   - Store common validations in `lib/forms/validation.ts`
   - Compose schemas for different forms 
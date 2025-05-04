# Form Handling System

This directory contains a standardized form handling system designed to provide consistent validation patterns, error handling, and UI components across the application.

## Components

- `FormWrapper`: A container component that integrates with react-hook-form and zod validation
- `TextField`: Input field for text, email, password, etc.
- `TextareaField`: Multiline text input field
- `CheckboxField`: Checkbox input field with proper styling
- `SwitchField`: Toggle switch input field
- `SelectField`: Dropdown select field with options
- `CustomField`: Field that allows custom rendering of form controls

## Utilities

- `useFormWithValidation`: Custom hook for form validation and submission
- Validation schemas for common patterns (email, password, etc.)
- Error handling utilities for API errors and field-level errors

## Usage Examples

### Basic Form

```tsx
import { FormWrapper, TextField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { loginFormSchema } from "@/lib/forms/validation";
import { signIn } from "@/lib/auth";

export function LoginForm() {
  const handleLogin = async (data) => {
    await signIn(data);
  };

  return (
    <FormWrapper
      schema={loginFormSchema}
      defaultValues={{
        email: "",
        password: "",
        rememberMe: false,
      }}
      onSubmit={handleLogin}
    >
      {({ isSubmitting }) => (
        <>
          <TextField 
            name="email" 
            label="Email" 
            type="email" 
            autoComplete="email" 
            required 
          />
          <TextField 
            name="password" 
            label="Password" 
            type="password" 
            autoComplete="current-password" 
            required 
          />
          <CheckboxField 
            name="rememberMe" 
            checkboxLabel="Remember me" 
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </>
      )}
    </FormWrapper>
  );
}
```

### Form with Select Field

```tsx
import { FormWrapper, TextField, SelectField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
});

export function UserForm({ onSubmit }) {
  return (
    <FormWrapper
      schema={userFormSchema}
      defaultValues={{
        name: "",
        email: "",
        role: "",
      }}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <>
          <TextField 
            name="name" 
            label="Name" 
            required 
          />
          <TextField 
            name="email" 
            label="Email" 
            type="email" 
            required 
          />
          <SelectField
            name="role"
            label="Role"
            required
            options={[
              { value: "admin", label: "Administrator" },
              { value: "editor", label: "Editor" },
              { value: "viewer", label: "Viewer" },
            ]}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save User"}
          </Button>
        </>
      )}
    </FormWrapper>
  );
}
```

### Using Custom Fields

```tsx
import { FormWrapper, TextField, CustomField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { ColorPicker } from "@/components/ui/color-picker";

const themeFormSchema = z.object({
  themeName: z.string().min(1, "Theme name is required"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Valid hex color required"),
});

export function ThemeForm({ onSubmit }) {
  return (
    <FormWrapper
      schema={themeFormSchema}
      defaultValues={{
        themeName: "",
        primaryColor: "#ffffff",
      }}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <>
          <TextField 
            name="themeName" 
            label="Theme Name" 
            required 
          />
          <CustomField
            name="primaryColor"
            label="Primary Color"
            render={(field) => (
              <ColorPicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Theme"}
          </Button>
        </>
      )}
    </FormWrapper>
  );
}
```

## Best Practices

1. **Centralized Validation**: Define validation schemas in `lib/forms/validation.ts`
2. **Error Handling**: Use the built-in error handling to display field and form-level errors
3. **Accessibility**: All form components include proper ARIA attributes for accessibility
4. **Reusability**: Compose forms using the provided field components for consistency
5. **Loading State**: Use the `isSubmitting` state to show loading indicators during form submission 
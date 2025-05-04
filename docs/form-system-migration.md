# Form System Migration Guide

This document outlines the plan for migrating existing forms to our new standardized form system.

## Migration Benefits

- ✅ Type-safe validation with Zod
- ✅ Consistent error handling across all forms
- ✅ Reduced code duplication
- ✅ Improved accessibility
- ✅ Better loading states
- ✅ Simplified testing

## Form Components Available

- `FormWrapper` - Container for forms with validation and error handling
- `TextField` - Standard text input field 
- `SelectField` - Dropdown selection field
- `CheckboxField` - Boolean checkbox field
- `TextareaField` - Multi-line text input
- `SwitchField` - Toggle switch input
- `CustomField` - For custom form controls

## Migration Process

### Phase 1: Authentication Forms

- [x] **Login Form** (`components/auth/login-form.tsx`)
  - [x] Add form schema with email and password validation
  - [x] Replace manual state handling with `FormWrapper`
  - [x] Replace input elements with `TextField` components
  - [x] Update error handling to use the form system
  - [x] Test form submission and validation
  - [x] Update tests to work with the new form system

- [x] **Signup Form** (`components/auth/signup-form.tsx`)
  - [x] Replace React Hook Form setup with `FormWrapper`
  - [x] Replace FormField components with field components from new system
  - [x] Keep existing validation schema
  - [x] Update error handling to leverage `FormWrapper`
  - [x] Test form submission and validation

### Phase 2: Settings Forms

- [ ] **Password Form** (`components/settings/password-form.tsx`)
  - [ ] Replace React Hook Form setup with `FormWrapper`
  - [ ] Update field components to use new system
  - [ ] Migrate password validation to validation.ts if needed
  - [ ] Test form submission and cross-field validation (password matching)

- [ ] **Profile Form** (`components/settings/profile-form.tsx`)
  - [ ] Replace React Hook Form setup with `FormWrapper`
  - [ ] Update field components to use new system
  - [ ] Migrate validation schema
  - [ ] Test form submission and field validation

### Phase 3: Feature-specific Forms

- [ ] **Add Team Member Form** (`components/team/AddTeamMemberForm.tsx`)
  - [ ] Replace React Hook Form setup with `FormWrapper`
  - [ ] Create custom field for file upload if needed
  - [ ] Update validation schema
  - [ ] Test form submission with file uploads

- [ ] **Note Edit Form** (`components/notes/note-edit-form.tsx`)
  - [ ] Evaluate if migration is appropriate (server actions)
  - [ ] Create client-side validation before server action if applicable
  - [ ] Test form submission

- [ ] **Add Note Form** (`components/notes/add-note-form.tsx`)
  - [ ] Evaluate if migration is appropriate (server actions)
  - [ ] Create client-side validation before server action if applicable
  - [ ] Test form submission

### Phase 4: Data Table Forms and Others

- [ ] **Data Table Forms** (`components/data-table.tsx`)
  - [ ] Identify form sections within the data table
  - [ ] Apply form system where appropriate
  - [ ] Test with data operations

- [ ] **Any remaining forms** discovered during the migration process

## Migration Steps For Each Form

1. [ ] **Analysis**
   - Identify form fields and their types
   - Review existing validation logic
   - Note any custom behaviors or edge cases

2. [ ] **Schema Creation**
   - Create or update Zod validation schema
   - Consider extracting reusable schemas to validation.ts

3. [ ] **Component Migration**
   - Replace form tag with `FormWrapper`
   - Replace input fields with corresponding form components
   - Update submit handler to work with validated data

4. [ ] **Error Handling**
   - Remove manual error state management
   - Ensure API errors are properly thrown to be caught by the form system

5. [ ] **Testing**
   - Test form validation (all field types)
   - Test form submission with successful and error scenarios
   - Test loading states and disabled behaviors

6. [ ] **Documentation**
   - Update component-specific documentation if exists
   - Add comments for any non-standard usage

## Example Migration: Login Form

To help visualize the process, here's how the Login Form migration would look:

### Before:
```tsx
// Manual state management
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState<string | null>(null)
const [isLoading, setIsLoading] = useState(false)

// Manual form handling
<form onSubmit={handleLogin}>
  {error && (
    <div className="error-message">
      {error}
    </div>
  )}
  <div>
    <Label htmlFor="email">Email</Label>
    <Input
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      disabled={isLoading}
    />
  </div>
  {/* More inputs... */}
</form>
```

### After:
```tsx
// Define schema
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password')
});

// Use FormWrapper
<FormWrapper 
  schema={loginSchema} 
  onSubmit={handleLogin}
  defaultValues={{
    email: '',
    password: '',
  }}
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
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </>
  )}
</FormWrapper>
```

## Progress Tracking

- Phase 1: Authentication Forms - 2/2 complete
- Phase 2: Settings Forms - 0/2 complete  
- Phase 3: Feature-specific Forms - 0/3 complete
- Phase 4: Data Table Forms and Others - 0/? complete

## Resources

- Form system documentation: `lib/forms/README.md`
- Example forms: `examples/forms/`
- Validation schemas: `lib/forms/validation.ts`
- Error handling: `lib/forms/error-handling.ts` 
'use client';

import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FormWrapper, TextField, CheckboxField, SelectField } from '@/components/forms';
import { passwordSchema, nameSchema, emailSchema } from '@/lib/forms/validation';

// Define the form schema
const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.string().min(1, 'Please select a role'),
  agreeToTerms: z.boolean().refine(value => value === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type inference from the schema
type SignupFormValues = z.infer<typeof signupSchema>;

/**
 * Example signup form using the refactored form system.
 * 
 * This demonstrates:
 * 1. Complex form with multiple field types
 * 2. Custom validation with schema refinements
 * 3. Form field composition
 * 4. Using predefined validation schemas
 */
export function SignupFormRefactored() {
  const router = useRouter();

  const handleSignup = async (data: SignupFormValues) => {
    try {
      // Example API call (replace with actual implementation)
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      // Successful signup
      router.push('/onboarding');
    } catch (error) {
      // Let the form system handle error display
      throw error;
    }
  };

  const roleOptions = [
    { value: 'user', label: 'Regular User' },
    { value: 'admin', label: 'Administrator' },
    { value: 'editor', label: 'Content Editor' },
  ];

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold">Create an account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign up to get started with our service
        </p>
      </div>

      <FormWrapper 
        schema={signupSchema} 
        onSubmit={handleSignup}
        defaultValues={{
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          agreeToTerms: false,
        }}
      >
        {({ isSubmitting }) => (
          <>
            <TextField
              name="name"
              label="Full Name"
              autoComplete="name"
              required
            />

            <TextField
              name="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
            />

            <SelectField
              name="role"
              label="Select Role"
              options={roleOptions}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                required
              />

              <TextField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>

            <CheckboxField
              name="agreeToTerms"
              label={
                <>
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </>
              }
              required
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </Button>
          </>
        )}
      </FormWrapper>

      <div className="text-center text-sm mt-6">
        <span className="text-gray-600">Already have an account?</span>{' '}
        <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Sign in
        </a>
      </div>
    </div>
  );
} 
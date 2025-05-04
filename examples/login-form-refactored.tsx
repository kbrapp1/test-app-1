'use client';

import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormWrapper, TextField, CheckboxField } from '@/components/forms';
import { loginSchema } from '@/lib/forms/validation';

// Type inference from the schema
type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Example login form using the refactored form system.
 * 
 * This demonstrates:
 * 1. Using Zod schema validation
 * 2. Consuming form loading state
 * 3. Error handling
 * 4. Consistent field styling
 */
export function LoginFormRefactored() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | undefined>();

  const handleLogin = async (data: LoginFormValues) => {
    try {
      // Clear any previous errors
      setRootError(undefined);

      // Example API call (replace with actual implementation)
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Example: handle different error types
        const errorData = await response.json();
        
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        } else if (errorData.errors) {
          // API might return field-specific errors
          throw errorData;
        } else {
          throw new Error(errorData.message || 'Login failed');
        }
      }

      // Successful login
      router.push('/dashboard');
    } catch (error) {
      // If it's a known error type with a message, show it as a root error
      if (error instanceof Error) {
        setRootError(error.message);
      } else {
        // Let the form system handle other error types
        throw error;
      }
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold">Sign in</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your credentials to access your account
        </p>
      </div>

      <FormWrapper 
        schema={loginSchema} 
        onSubmit={handleLogin}
        rootError={rootError}
        defaultValues={{
          email: '',
          password: '',
          rememberMe: false,
        }}
      >
        {({ isSubmitting }) => (
          <>
            <TextField
              name="email"
              label="Email address"
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

            <div className="flex items-center justify-between">
              <CheckboxField
                name="rememberMe"
                label="Remember me"
              />

              <a 
                href="/forgot-password" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </a>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </>
        )}
      </FormWrapper>

      <div className="text-center text-sm mt-6">
        <span className="text-gray-600">Don't have an account?</span>{' '}
        <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
          Sign up
        </a>
      </div>
    </div>
  );
} 
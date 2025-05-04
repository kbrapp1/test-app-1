'use client'

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from 'next/link';
import { toast } from 'sonner';
import { FormWrapper, TextField } from '@/components/forms';
import { emailSchema, passwordSchema } from '@/lib/forms/validation';

// Define the form schema using our validation utilities
const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Type inference from the schema
type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (values: SignupFormValues) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Determine friendly error message
        let message = error.message;
        if (error.message.toLowerCase().includes('already registered')) {
          message = 'User already registered';
        } else if (error.message.toLowerCase().includes('invalid domain')) {
          message = 'Please use an approved email domain.';
        }
        
        // Let the form system handle the error display
        throw new Error(message);
      }

      if (data?.user) {
        toast.success('Please check your email to confirm your account');
        router.refresh();
      }
    } catch (error) {
      // Let the form system handle error display
      throw error;
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign up</CardTitle>
        <CardDescription>
          Create an account to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormWrapper
          schema={signupFormSchema}
          onSubmit={handleSignup}
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
                placeholder="m@example.com"
                autoComplete="email"
                required
              />
              
              <TextField
                name="password"
                label="Password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
              
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'Signing up...' : 'Sign up'}
              </Button>
            </>
          )}
        </FormWrapper>
      </CardContent>
      <CardFooter className="flex-col items-start">
        <div className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 
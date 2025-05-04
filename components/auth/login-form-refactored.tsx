'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FormWrapper, TextField, CheckboxField } from '@/components/forms';
import { loginFormSchema } from '@/lib/forms/validation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    // Ensure we have some artificial delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    toast.success('Logged in successfully');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-semibold tracking-tight">Sign in</h3>
        <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
      </div>
      
      <FormWrapper
        schema={loginFormSchema}
        defaultValues={{
          email: '',
          password: '',
          rememberMe: false,
        }}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <>
            <TextField
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isSubmitting}
              required
            />
            
            <TextField
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              required
            />
            
            <div className="flex items-center justify-between">
              <CheckboxField
                name="rememberMe"
                checkboxLabel="Remember me"
                disabled={isSubmitting}
              />
              
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </>
        )}
      </FormWrapper>
      
      <div className="text-sm text-muted-foreground text-center">
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90">
          Sign up
        </Link>
      </div>
    </div>
  );
} 
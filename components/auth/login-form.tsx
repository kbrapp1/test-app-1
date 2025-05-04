'use client'

import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import Link from 'next/link'
import { z } from 'zod'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FormWrapper, TextField } from "@/components/forms"
import { emailSchema } from "@/lib/forms/validation"

// Define login form schema using our validation utilities
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password')
});

// Infer TypeScript type from the schema
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  // Replace manual state management with form handling through FormWrapper
  const handleLogin = async (data: LoginFormValues) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        throw new Error(signInError.message)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      // Let the form system handle the error
      throw error
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                placeholder="m@example.com"
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
              
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </>
          )}
        </FormWrapper>
      </CardContent>
      <CardFooter className="flex-col items-start">
        <div className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
} 
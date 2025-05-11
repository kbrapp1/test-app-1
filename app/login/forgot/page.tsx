'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormWrapper, TextField } from '@/components/forms'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { emailSchema } from '@/lib/forms/validation'

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const handleForgotPassword = async (data: z.infer<typeof forgotPasswordSchema>) => {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/login/reset/password`
      : process.env.NEXT_PUBLIC_APP_URL + '/login/reset/password'
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo })
    if (error) throw error
    toast({ title: 'Password Reset Email Sent', description: 'Please check your email to reset your password.' })
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormWrapper
            schema={forgotPasswordSchema}
            onSubmit={handleForgotPassword}
            defaultValues={{ email: '' }}
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
                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </>
            )}
          </FormWrapper>
        </CardContent>
        <CardFooter className="flex-col items-start">
          <div className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-primary underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 
'use client'

import { useState } from "react"
import Link from 'next/link'
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignupForm() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Optional: Add password confirmation state if desired
  // const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/confirm`,
        }
      });

      if (signUpError) {
        // Handle known errors silently (don't log to console)
        if (signUpError.message.startsWith('Database error saving new user')) {
          setError('Please use an approved email domain.');
        } else if (signUpError.message.includes('User already exists')) {
          setError('User already exists. Please sign in instead.');
        } 
        // Log and set only UNEXPECTED Supabase errors
        else { 
          console.error('Unexpected Supabase SignUp Error:', signUpError);
          setError(signUpError.message);
        }
      } else if (data.user) {
        // Check if user object exists, indicating successful sign up (pending confirmation)
        setMessage('Check your email to confirm sign up!');
        // Optional: Clear form
        // setEmail('');
        // setPassword('');
      } else {
        // Handle cases where signup might not error but doesn't return a user (should be rare)
        console.warn('Supabase signUp returned successfully but without a user object.', data);
        setError('An unexpected issue occurred during signup. Please try again.');
      }
    } catch (unexpectedError: any) {
      // Catch errors thrown *by* the signUp call itself (e.g., network errors)
      console.error('Critical error during signup process:', unexpectedError);
      setError('An network or unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your email and password to create an account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="grid gap-4">
          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-500 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              {message}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              // Optional: Add pattern for password strength
              // pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              // title="Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters"
            />
          </div>
          {/* Optional: Add password confirmation field */}
          {/* <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div> */}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign up'}
          </Button>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
} 
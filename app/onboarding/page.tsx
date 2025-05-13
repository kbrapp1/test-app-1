'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const {
    loading,
    error,
    fullName,
    setFullName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    validationError,
    submitting,
    needsPasswordSet,
    isComplete,
    handleSubmit,
  } = useOnboarding();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !needsPasswordSet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/')} className="mt-4 w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete || (!needsPasswordSet && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
          <p className="text-green-500">Onboarding successful! Redirecting...</p>
        </div>
      </div>
    );
  }

  if (needsPasswordSet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Account Setup</CardTitle>
            <CardDescription>
              Welcome! Please set your name and password to join the organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {validationError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || loading}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Complete Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Unexpected State</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              An unexpected issue occurred during onboarding. Please try refreshing or contact support.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/')} className="mt-4 w-full">
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
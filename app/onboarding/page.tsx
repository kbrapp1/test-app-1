'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  
  const [invitationData, setInvitationData] = useState<{
    invited_to_org_id?: string;
    assigned_role_id?: string;
    full_name?: string;
  } | null>(null);

  const callCompleteOnboardingFunction = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setError('Session expired or not found. Please try logging in again.');
      toast({
        title: 'Error',
        description: 'Session expired or not found. Please try logging in again.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { data, error: funcError } = await supabase.functions.invoke(
        'complete-onboarding-membership',
        { 
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
         }
      );

      if (funcError) {
        console.error('Error calling complete-onboarding-membership function:', funcError);
        setError(funcError.message || 'Failed to complete onboarding process.');
        toast({
          title: 'Onboarding Error',
          description: funcError.message || 'Could not add you to the organization. Please contact support.',
          variant: 'destructive',
        });
        return false;
      }
      
      console.log('complete-onboarding-membership function response:', data);
      if (data.error) {
        console.error('Error from complete-onboarding-membership function:', data.error);
        setError(data.error.details || data.error.error || 'Failed to complete onboarding process.');
        toast({
          title: 'Onboarding Error',
          description: data.error.details || data.error.error || 'Could not add you to the organization. Please contact support.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success!',
        description: 'You have been successfully added to the organization.',
      });
      return true;
    } catch (e: any) {
      console.error('Exception calling complete-onboarding-membership function:', e);
      setError(e.message || 'An unexpected error occurred during onboarding.');
      toast({
        title: 'Onboarding Error',
        description: e.message || 'An unexpected error occurred. Please contact support.',
        variant: 'destructive',
      });
      return false;
    }
  };
  
  useEffect(() => {
    async function checkAuthStatus() {
      setLoading(true);
      setError(null);

      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessTokenFromHash = params.get('access_token');
        const refreshTokenFromHash = params.get('refresh_token');
        let sessionProcessedFromHash = false;

        if (accessTokenFromHash && refreshTokenFromHash) {
          const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessTokenFromHash,
            refresh_token: refreshTokenFromHash,
          });

          if (setSessionError || !sessionData.session) {
            setError('The invitation link has expired, is invalid, or has already been used. Please request a new invitation or try logging in if you have an account.');
            setLoading(false);
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            }
            return;
          }
          sessionProcessedFromHash = true;
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }

        const { data: userData, error: getUserError } = await supabase.auth.getUser();

        if (getUserError || !userData?.user) {
          setError(sessionProcessedFromHash 
            ? 'Could not retrieve user details after processing the invitation link. Please try again.' 
            : 'No active session found. Please log in or use a valid invitation link.');
          setLoading(false);
          return;
        }

        const user = userData.user;
        const hasPasswordIdentity = user.identities && user.identities.some(identity => identity.provider === 'password');
        const calculatedNeedsPasswordSet = !hasPasswordIdentity;
        setNeedsPasswordSet(calculatedNeedsPasswordSet);

        const metadata = user.user_metadata || {};
        setInvitationData({
          invited_to_org_id: metadata.invited_to_org_id,
          assigned_role_id: metadata.assigned_role_id,
          full_name: metadata.full_name,
        });

        if (metadata.full_name) {
          setFullName(metadata.full_name);
        }

        if (!calculatedNeedsPasswordSet) {
          const onboardingSuccess = await callCompleteOnboardingFunction();
          if (onboardingSuccess) {
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.warn('Session refresh failed after auto-onboarding:', refreshError.message);
              toast({
                title: 'Session Sync Delayed',
                description: 'Your session will update shortly. Redirecting...',
                variant: 'default'
              });
            }
            toast({
              title: 'Welcome Back!',
              description: 'Processing your access and redirecting to the dashboard...',
            });
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } else {
            if (!error) {
               setError('Failed to finalize your membership. Please try refreshing or contact support.');
            }
          }
        } else {
          if (!metadata.invited_to_org_id || !metadata.assigned_role_id) {
            setError('Invitation is incomplete. Missing organization or role information. Please contact your administrator.');
          }
        }
      } catch (err: any) {
        console.error('Error in invitation flow (checkAuthStatus):', err);
        setError('An unexpected error occurred. Please try again or contact support.');
        toast({
          title: 'Invitation Processing Error',
          description: err.message || 'An unexpected error occurred.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    checkAuthStatus();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase.auth]);
  
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      setValidationError('Name is required');
      return false;
    }
    if (!password) {
      setValidationError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    setValidationError(null);
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isComplete) { // If already submitting or completed, do nothing
      return;
    }
    if (!needsPasswordSet || !validateForm() || !invitationData) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
          full_name: fullName,
          // Clear invitation metadata after use, if desired, or let trigger handle
          // invited_to_org: null, 
          // assigned_role_id: null,
        }
      });
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Add to organization via Edge Function
      const onboardingSuccess = await callCompleteOnboardingFunction();

      if (!onboardingSuccess) {
        // Error message already shown by callCompleteOnboardingFunction
        // Set a general error if not already set by the function call
        if (!error) setError('Failed to complete your registration. Please try again or contact support.');
        setSubmitting(false);
        return;
      }
      
      // Update profile with name (this is fine as it targets profiles table with user's own ID)
      const { data: userObj, error: getUserErr } = await supabase.auth.getUser();
      if (getUserErr || !userObj?.user?.id) {
          console.error('Error getting user for profile update:', getUserErr);
          // Non-blocking, but log it
      } else {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userObj.user.id,
            full_name: fullName,
            email: userObj.user.email // Make sure email is also populated
          }, { onConflict: 'id' }); // Added onConflict
          
        if (profileError) {
          console.error('Error updating profile:', profileError);
          toast({
            title: 'Profile Update Warning',
            description: `Your profile name was not updated: ${profileError.message}`,
            variant: 'default',
          });
        }
      }
      
      // Force a session refresh to get the latest JWT with updated custom claims
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Error refreshing session after onboarding:', refreshError);
        // Optionally, inform the user or handle this error, though it might still work if the redirect happens
        // For now, we'll log it and proceed with the redirect.
        toast({
          title: 'Session Sync Issue',
          description: 'Could not immediately sync your session. You may need to re-login if you experience issues.',
          variant: 'default' 
        });
      } else {
        console.log('Session refreshed successfully after onboarding.');
      }

      setIsComplete(true); // Mark as complete

      // setSuccess(true); // Handled by toast
      toast({
        title: 'Account Setup Complete!',
        description: 'Redirecting you to the dashboard...',
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error completing signup:', err);
      setValidationError(err.message || 'Failed to complete signup');
      setError(err.message || 'Failed to complete signup');
      toast({
        title: 'Signup Error',
        description: err.message || 'An unexpected error occurred during signup.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false);
    }
  };
  
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

  if (error && !needsPasswordSet) { // If already processed and there was an error not requiring password set
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
  
  // If user is confirmed and no password needed, they should have been redirected.
  // This UI is primarily for new users setting password, or if initial auto-onboarding failed and requires retry.
  if (!needsPasswordSet && !error) { // Successfully auto-onboarded and redirected.
     return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
          <p className="text-green-500">Onboarding successful! Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show password form if `needsPasswordSet` is true
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
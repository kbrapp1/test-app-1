'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, UserIdentity } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

// Import helpers from their new locations
import { processAuthFromUrlHelper } from '@/lib/auth/onboardingAuthUtils';
import { callCompleteOnboardingFunctionHelper } from '@/lib/services/onboardingService';
import { updateUserProfileHelper } from '@/lib/services/profileService';
import { validateOnboardingForm } from '@/lib/forms/onboardingValidation';

// Helper functions are now external

// --- Hook ---

export function useOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null); // Keep for immediate UI feedback
  const [submitting, setSubmitting] = useState(false);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  // Invitation data remains part of the hook's state
  const [invitationData, setInvitationData] = useState<{
    invited_to_org_id?: string;
    assigned_role_id?: string;
    full_name?: string;
  } | null>(null);

  const _handleError = useCallback((err: any, context: string, toastTitle: string) => {
    console.error(`Error during ${context}:`, err);
    const message = err.message || `An unexpected error occurred during ${context}.`;
    // Use validationError state for form validation issues
    if (context === 'form validation') {
        setValidationError(message);
    } else {
        setError(message); // Use general error state for other issues
        toast({
          title: toastTitle,
          description: message,
          variant: 'destructive',
        });
    }
  }, [toast]);


  useEffect(() => {
    async function checkAuthStatus() {
      setLoading(true);
      setError(null);
      setValidationError(null); // Clear validation errors on load

      try {
        // Use imported helper
        const { user } = await processAuthFromUrlHelper(supabase);
        
        const hasPasswordIdentity = user.identities && user.identities.some((identity: UserIdentity) => identity.provider === 'password');
        const calculatedNeedsPasswordSet = !hasPasswordIdentity;
        setNeedsPasswordSet(calculatedNeedsPasswordSet);

        const metadata = user.user_metadata || {};
        const invData = {
            invited_to_org_id: metadata.invited_to_org_id,
            assigned_role_id: metadata.assigned_role_id,
            full_name: metadata.full_name,
        };
        setInvitationData(invData);

        if (metadata.full_name) {
            setFullName(metadata.full_name);
        }

        if (!calculatedNeedsPasswordSet) {
          // User already has a password (likely logged in before or used social auth)
          // Attempt to complete onboarding automatically
          try {
            // Use imported helper
            await callCompleteOnboardingFunctionHelper(supabase);
            toast({
              title: 'Welcome Back!',
              description: 'Processing your access and redirecting to the dashboard...',
            });
             // Refresh session in background to update claims if needed
             supabase.auth.refreshSession().then(({ error: refreshError }) => {
                if (refreshError) console.warn('Session refresh failed after auto-onboarding:', refreshError.message);
             });
            setIsComplete(true);
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } catch (onboardingError: any) {
             _handleError(
                onboardingError,
                'auto complete onboarding',
                'Onboarding Error'
              );
          }

        } else {
           // Needs to set password, validate invitation data first
           if (!invData.invited_to_org_id || !invData.assigned_role_id) {
               throw new Error('Invitation is incomplete. Missing organization or role information.');
           }
        }
      } catch (err: any) {
        _handleError(err, 'initial auth check', 'Invitation Processing Error');
      } finally {
        setLoading(false);
      }
    }

    checkAuthStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router, toast]); // Keep dependencies minimal, _handleError is memoized

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isComplete) return;

    setSubmitting(true);
    setError(null);
    setValidationError(null);

    try {
      // 1. Validate Form (using imported helper)
      validateOnboardingForm(fullName, password, confirmPassword, needsPasswordSet);

      // 2. Update Auth User (Password and Name)
      const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
        password: password, // Send password even if empty, API handles it
        data: { full_name: fullName } // Update full_name in auth metadata
      });

      if (updateError) throw updateError;
      if (!updatedUserData?.user) throw new Error("Failed to get user details after update.");
      const userAfterUpdate = updatedUserData.user;

      // 3. Call Edge Function to complete membership/roles (using imported helper)
      await callCompleteOnboardingFunctionHelper(supabase);

      // 4. Update Public Profile (using imported helper)
      try {
        await updateUserProfileHelper(supabase, userAfterUpdate, fullName);
      } catch (profileErr: any) {
          // Log profile update errors but don't block the success flow
         console.warn("Profile update failed:", profileErr.message);
         toast({
            title: 'Profile Sync Warning',
            description: `Could not sync profile name: ${profileErr.message}`,
            variant: 'default', // Use default or warning variant
         });
      }

      // 5. Refresh session to ensure claims are updated
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Error refreshing session after onboarding:', refreshError);
        toast({
          title: 'Session Sync Issue',
          description: 'Could not immediately sync your session. You might need to log in again if you experience issues.',
          variant: 'default'
        });
      } else {
        console.log('Session refreshed successfully after onboarding.');
      }

      // 6. Success Feedback and Redirect
      setIsComplete(true);
      toast({ title: 'Account Setup Complete!', description: 'Redirecting to dashboard...' });
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (err: any) {
      // Differentiate validation errors from others
      const isValidationError = [
          'Name is required',
          'Password is required',
          'Password must be at least 8 characters',
          'Passwords do not match'
      ].includes(err.message);

      if (isValidationError) {
         _handleError(err, 'form validation', ''); // Use validationError state
      } else {
          _handleError(err, 'completing signup', 'Signup Error'); // Use general error state and toast
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    isComplete,
    needsPasswordSet,
    fullName,
    password,
    confirmPassword,
    supabase,
    router,
    toast,
    _handleError // _handleError remains internal to the hook
  ]);

  return {
    loading,
    error, // General non-validation errors
    fullName,
    setFullName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    validationError, // Specific form validation errors
    submitting,
    needsPasswordSet,
    isComplete,
    handleSubmit,
  };
} 
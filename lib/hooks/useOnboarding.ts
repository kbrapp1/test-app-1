'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, UserIdentity } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

// Import helpers from their new locations
import { processAuthFromUrlHelper, handleOnboardingError } from '@/lib/auth/onboardingAuthUtils';
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const [invitationData, setInvitationData] = useState<{
    invited_to_org_id?: string;
    assigned_role_id?: string;
    full_name?: string;
  } | null>(null);

  // Helper function within the hook for auto-completing onboarding
  const _tryAutoCompleteOnboarding = async () => {
    try {
      await callCompleteOnboardingFunctionHelper(supabase);
      toast({
        title: 'Welcome Back!',
        description: 'Processing your access and redirecting to the dashboard...',
        variant: 'default'
      });
      supabase.auth.refreshSession().then(({ error: refreshError }) => {
        if (refreshError) console.warn('Session refresh failed after auto-onboarding:', refreshError.message);
      });
      setIsComplete(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (onboardingError: any) {
      handleOnboardingError(onboardingError, 'auto complete onboarding', toast, (msg) => setError(msg), 'Onboarding Error');
    }
  };

  useEffect(() => {
    async function checkAuthStatus() {
      setLoading(true);
      setError(null);
      setValidationError(null);

      try {
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
          await _tryAutoCompleteOnboarding(); // Call the extracted helper
        } else {
           if (!invData.invited_to_org_id || !invData.assigned_role_id) {
               throw new Error('Invitation is incomplete. Missing organization or role information.');
           }
        }
      } catch (err: any) {
        handleOnboardingError(err, 'initial auth check', toast, (msg) => setError(msg), 'Invitation ProcessingError');
      } finally {
        setLoading(false);
      }
    }

    checkAuthStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router, toast]); // _tryAutoCompleteOnboarding is not needed here as it uses hook's scope

  // Helper function within the hook for core onboarding steps after auth update
  const _performCoreOnboardingSteps = async (user: User, currentFullName: string) => {
    // Call Edge Function to complete membership/roles
    await callCompleteOnboardingFunctionHelper(supabase);

    // Update Public Profile (optional, log errors)
    try {
      await updateUserProfileHelper(supabase, user, currentFullName);
    } catch (profileErr: any) {
       console.warn("Profile update failed:", profileErr.message);
       toast({
          title: 'Profile Sync Warning',
          description: `Could not sync profile name: ${profileErr.message}`,
          variant: 'default',
       });
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isComplete) return;

    setSubmitting(true);
    setError(null);
    setValidationError(null);

    try {
      validateOnboardingForm(fullName, password, confirmPassword, needsPasswordSet);

      const { data: updatedAuthUserData, error: updateAuthUserError } = await supabase.auth.updateUser({
        password: password,
        data: { full_name: fullName }
      });

      if (updateAuthUserError) throw updateAuthUserError;
      if (!updatedAuthUserData?.user) throw new Error("Failed to get user details after auth update.");
      const userAfterAuthUpdate = updatedAuthUserData.user;

      await _performCoreOnboardingSteps(userAfterAuthUpdate, fullName);

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

      setIsComplete(true);
      toast({ title: 'Account Setup Complete!', description: 'Redirecting to dashboard...', variant: 'default' });
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (err: any) {
      const isFormValidationError = [
          'Name is required',
          'Password is required',
          'Password must be at least 8 characters',
          'Passwords do not match'
      ].includes(err.message);

      if (isFormValidationError) {
         handleOnboardingError(err, 'form validation', toast, setValidationError);
      } else {
          handleOnboardingError(err, 'completing signup', toast, (msg) => setError(msg), 'Signup Error');
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
  ]);

  return {
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
  };
} 
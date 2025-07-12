/**
 * Onboarding Utilities - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - Handle URL hash processing for auth invitations
 * - Provide error handling utilities for onboarding flows
 * - Keep utilities focused on infrastructure concerns
 * - Maintain backward compatibility with existing usage
 */

import { SupabaseClient, User } from '@supabase/supabase-js';

export interface AuthFromUrlResult {
  user: User;
  processedFromHash: boolean;
}

export interface OnboardingErrorOptions {
  title: string;
  description: string;
  variant: 'destructive' | 'default';
}

export type ToastFunction = (options: OnboardingErrorOptions) => void;

/**
 * Process authentication from URL hash parameters
 * Used for invitation links and auth callbacks
 */
export async function processAuthFromUrlHelper(supabase: SupabaseClient): Promise<AuthFromUrlResult> {
  const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : '';
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
      throw new Error('The invitation link has expired, is invalid, or has already been used. Please request a new invitation or try logging in if you have an account.');
    }
    
    sessionProcessedFromHash = true;
    
    // Clean up URL hash after processing
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  }

  const { data: userData, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !userData?.user) {
    const errorMessage = sessionProcessedFromHash
      ? 'Could not retrieve user details after processing the invitation link. Please try again.'
      : 'No active session found. Please log in or use a valid invitation link.';
    throw new Error(errorMessage);
  }

  return { 
    user: userData.user, 
    processedFromHash: sessionProcessedFromHash 
  };
}

/**
 * Generalized error handler for onboarding processes
 * Provides consistent error handling across onboarding flows
 */
export function handleOnboardingError(
  err: any, 
  context: string, 
  toast: ToastFunction,
  setFormValidationError?: (message: string | null) => void,
  toastTitle?: string
): void {
  console.error(`Error during ${context}:`, err);
  const message = err.message || `An unexpected error occurred during ${context}.`;

  // If a specific setter for form validation errors is provided and context matches, use it
  if (setFormValidationError && (context === 'form validation' || err.code === 'VALIDATION_ERROR')) {
    setFormValidationError(message);
    // Don't show toast for pure form validation errors handled inline
    // unless explicitly requested or if it's a general error presented as validation
  } else {
    // For other errors, or if no specific form error setter is given, show a toast
    toast({
      title: toastTitle || 'Onboarding Error',
      description: message,
      variant: 'destructive',
    });
  }
}

/**
 * Check if current environment supports URL processing
 */
export function canProcessUrlAuth(): boolean {
  return typeof window !== 'undefined' && !!window.location.hash;
}

/**
 * Extract auth parameters from URL hash
 */
export function extractAuthParamsFromHash(): {
  accessToken: string | null;
  refreshToken: string | null;
  hasAuthParams: boolean;
} {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, hasAuthParams: false };
  }

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  return {
    accessToken,
    refreshToken,
    hasAuthParams: !!(accessToken && refreshToken)
  };
}

/**
 * Clean URL hash after processing auth parameters
 */
export function cleanUrlHash(): void {
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }
} 
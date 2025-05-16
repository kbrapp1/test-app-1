import { SupabaseClient, User } from '@supabase/supabase-js';

export async function processAuthFromUrlHelper(supabase: SupabaseClient): Promise<{ user: User, processedFromHash: boolean }> {
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

  return { user: userData.user, processedFromHash: sessionProcessedFromHash };
}

// Generalized error handler for onboarding processes
export function handleOnboardingError(
  err: any, 
  context: string, 
  toast: (options: { title: string; description: string; variant: 'destructive' | 'default' }) => void,
  setFormValidationError?: (message: string | null) => void, // Optional setter for form-specific validation errors
  toastTitle?: string
) {
  console.error(`Error during ${context}:`, err);
  const message = err.message || `An unexpected error occurred during ${context}.`;

  // If a specific setter for form validation errors is provided and context matches, use it.
  if (setFormValidationError && (context === 'form validation' || err.code === 'VALIDATION_ERROR')) {
    setFormValidationError(message);
    // Optionally, don't show a toast for pure form validation errors handled inline
    // unless explicitly requested or if it's a general error presented as validation.
  } else {
    // For other errors, or if no specific form error setter is given, show a toast.
    toast({
      title: toastTitle || 'Onboarding Error',
      description: message,
      variant: 'destructive',
    });
  }
  // The hook itself will manage its general `error` state if needed, 
  // this helper focuses on direct feedback (toast/form validation message).
} 
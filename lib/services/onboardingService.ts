import { SupabaseClient } from '@supabase/supabase-js';

export async function callCompleteOnboardingFunctionHelper(supabase: SupabaseClient): Promise<boolean> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Session expired or not found when trying to complete onboarding.');
  }

  const { data, error: funcError } = await supabase.functions.invoke(
    'complete-onboarding-membership',
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    }
  );

  if (funcError || data?.error) {
    const errorDetail = funcError || data?.error;
    const errorMessage = errorDetail?.message || errorDetail?.details || errorDetail?.error || 'Failed to complete onboarding process via edge function.';
    console.error('Error invoking complete-onboarding-membership:', errorMessage, { funcError, data });
    throw new Error(errorMessage);
  }

  console.log('Successfully invoked complete-onboarding-membership function:', data);
  return true;
} 
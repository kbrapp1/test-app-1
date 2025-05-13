import { SupabaseClient, User } from '@supabase/supabase-js';

export async function updateUserProfileHelper(supabase: SupabaseClient, user: User, name: string): Promise<void> {
  if (!user?.id || !user?.email) {
    // Log a warning but don't throw, as onboarding might succeed even if profile update fails
    console.warn('Cannot update profile: User object is incomplete. Skipping profile upsert.', { userId: user?.id, userEmail: user?.email });
    return;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: name,
      email: user.email
    }, { onConflict: 'id' });

  if (profileError) {
    // Log the error but rethrow it so the calling context (_handleError in the hook) can decide how to inform the user (e.g., non-critical toast)
    console.error('Error upserting profile:', profileError);
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }

  console.log('User profile updated successfully for user:', user.id);
} 
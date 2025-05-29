import { SupabaseClient, User } from '@supabase/supabase-js';

export async function updateUserProfile(supabase: SupabaseClient, user: User): Promise<void> {
  if (!user?.id || !user?.email) {
    console.warn('Cannot update profile: User object is incomplete. Skipping profile upsert.', { userId: user?.id, userEmail: user?.email });
    return;
  }

  const profileData = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (profileError) {
    console.error('Error upserting profile:', profileError);
    throw new Error(`Profile update failed: ${profileError.message || 'Unknown error'}`);
  }
}
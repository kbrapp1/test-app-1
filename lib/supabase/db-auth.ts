import { SupabaseClient } from '@supabase/supabase-js';

// Authentication check utility
export const checkAuth = async (supabase: SupabaseClient) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { authenticated: false, user: null, error: userError };
  }
  
  return { authenticated: true, user, error: null };
}; 
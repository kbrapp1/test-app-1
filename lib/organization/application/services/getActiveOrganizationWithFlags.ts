import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import type { Organization } from '@/lib/auth/services/organization-service';

/**
 * Fetches the full active organization entity, including feature flags.
 * This is an application-layer service intended for use in server-side logic like server actions.
 * @param supabase - An existing Supabase server client instance, created by createSupabaseServerClient().
 * @returns The active organization entity or null if not found.
 * @throws Throws an error if the user is not authenticated.
 */
export async function getActiveOrganizationWithFlags(supabase: ReturnType<typeof createSupabaseServerClient>): Promise<Organization | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated.');
  }

  const { data, error } = await supabase
    .rpc('get_active_organization_id');

  if (error || !data) {
    console.warn('Could not retrieve active organization ID.', error);
    return null;
  }
  
  const activeOrgId = data;

  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', activeOrgId)
    .single();

  if (orgError) {
    console.error(`Error fetching organization details for ID ${activeOrgId}:`, orgError);
    return null;
  }

  // We can assume the shape matches the Organization entity for simplicity here.
  // In a stricter setup, we would use a mapper.
  return orgData as Organization;
} 
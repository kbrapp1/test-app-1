2
import type { Database } from '@/types/supabase'; // Standard Supabase types
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// Define TtsPredictionRow based on your Database types
// This assumes TtsPrediction is a table in your public schema.
// Adjust if your schema or table name differs.
type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

const DEFAULT_PAGE_LIMIT = 10;
const DEFAULT_SORT_BY = 'createdAt' as keyof TtsPredictionRow;
const DEFAULT_SORT_ORDER = 'desc';

interface GetTtsHistoryParams {
  page?: number;
  limit?: number;
  sortBy?: keyof TtsPredictionRow;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

/**
 * Usecase: Fetches TTS generation history for the current user in their active organization.
 */
export async function getTtsHistory(
  params?: GetTtsHistoryParams
): Promise<{
  success: boolean;
  data?: TtsPredictionRow[];
  error?: string;
  count?: number | null; // Total count for pagination
}> {
  try {
    const supabase = await createClient(); // Changed to createClient
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const activeOrgId = await getActiveOrganizationId(); // Changed to getActiveOrganizationId
    if (!activeOrgId) { // getActiveOrganizationId returns string | null
      return { success: false, error: 'Active organization not found' };
    }

    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : DEFAULT_PAGE_LIMIT;
    const sortBy = params?.sortBy || DEFAULT_SORT_BY;
    const sortOrder = params?.sortOrder || DEFAULT_SORT_ORDER;
    const searchQuery = params?.searchQuery?.trim();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('TtsPrediction')
      .select('*', { count: 'exact' })
      .eq('userId', user.id)
      .eq('organization_id', activeOrgId);

    // Apply search query if provided
    if (searchQuery && searchQuery.length > 0) {
      const searchPattern = `%${searchQuery}%`;
      query = query.or(
        `inputText.ilike.${searchPattern},` +
        `voiceId.ilike.${searchPattern},` +
        `status.ilike.${searchPattern}`
      );
    }

    // Apply sorting - TypeScript will help ensure sortBy is a valid keyof TtsPredictionRow.
    // The database will error if an invalid column name is somehow passed for sortBy.
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching TTS history:', error);
      // It might be beneficial to check for specific error codes/messages
      // if an invalid sortBy column was the cause, to return a more specific error.
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [], count };
  } catch (e: any) {
    console.error('Unexpected error in getTtsHistoryUsecase:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

// Alias export to maintain compatibility
export { getTtsHistory as getTtsHistoryUsecase }; 
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { TtsPrediction } from '../../domain/entities/TtsPrediction';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { FindOptions } from '../../domain/repositories/TtsPredictionRepository';

const DEFAULT_PAGE_LIMIT = 10;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';

// Valid sort fields for TTS predictions
type TtsPredictionSortField = 'createdAt' | 'updatedAt' | 'inputText' | 'status' | 'voiceId';

interface GetTtsHistoryParams {
  page?: number;
  limit?: number;
  sortBy?: TtsPredictionSortField;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

/**
 * Usecase: Fetches TTS generation history for the current user in their active organization.
 * Now using repository pattern for proper DDD compliance.
 */
export async function getTtsHistory(
  params?: GetTtsHistoryParams
): Promise<{
  success: boolean;
  data?: TtsPrediction[];
  error?: string;
  count?: number | null; // Total count for pagination
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found' };
    }

    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : DEFAULT_PAGE_LIMIT;
    const sortBy = params?.sortBy || DEFAULT_SORT_BY;
    const sortOrder = params?.sortOrder || DEFAULT_SORT_ORDER;
    const searchQuery = params?.searchQuery?.trim();

    // Use repository pattern instead of direct Supabase calls
    const repository = new TtsPredictionSupabaseRepository();
    
    const findOptions: FindOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
      searchQuery: searchQuery && searchQuery.length > 0 ? searchQuery : undefined
    };

    // Repository handles both user filtering and organization filtering
    const predictions = await repository.findByUserId(user.id, findOptions);
    
    // Get count for pagination (repository should handle this)
    const count = await repository.countByUserId(user.id, {
      searchQuery: findOptions.searchQuery
    });

    return { success: true, data: predictions, count };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

// Alias export to maintain compatibility
export { getTtsHistory as getTtsHistoryUsecase }; 
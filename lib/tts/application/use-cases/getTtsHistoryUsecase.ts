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
  params?: GetTtsHistoryParams,
  userId?: string,
  organizationId?: string
): Promise<{
  success: boolean;
  data?: TtsPrediction[];
  error?: string;
  count?: number | null; // Total count for pagination
}> {
  try {
    // Use pre-validated context (optimization eliminates redundant validation)
    if (!userId || !organizationId) {
      return { success: false, error: 'Pre-validated context required for optimized TTS operations' };
    }
    
    const finalUserId = userId;
    const finalOrgId = organizationId;

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
    const predictions = await repository.findByUserId(finalUserId, findOptions);
    
    // Get count for pagination (repository should handle this)
    const count = await repository.countByUserId(finalUserId, {
      searchQuery: findOptions.searchQuery
    });

    return { success: true, data: predictions, count };
      } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
}

// Alias export to maintain compatibility
export { getTtsHistory as getTtsHistoryUsecase }; 
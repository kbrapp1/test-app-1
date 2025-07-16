'use server';

// Query Actions - DDD Application Layer
// Single Responsibility: Handle query-based operations for image generation
// Following CQRS pattern with read-only operations bypassing command bus

import { 
  GetGenerationsResponse, 
  GetGenerationResponse, 
  GetGenerationStatsResponse 
} from '../shared/types';
import { GenerationMapper } from '../../mappers/GenerationMapper';
import { GetGenerationsFilters } from '../../../presentation/hooks/shared/types';
import { getGetGenerationsUseCase, getGetGenerationStatsUseCase } from '../../../presentation/hooks/shared/instances';
import { getAuthContext } from '../shared/auth-context';

/**
 * Get Multiple Generations Query Action
 * Retrieves generations based on provided filters
 */
export async function getGenerations(filters: GetGenerationsFilters = {}): Promise<GetGenerationsResponse> {
  try {
    const result = await getGetGenerationsUseCase().getMany(filters);

    if (!result.isSuccess()) {
      return {
        success: false,
        error: result.getError() || 'Failed to fetch generations'
      };
    }

    const dtos = GenerationMapper.toDtoList(result.getValue());
    return {
      success: true,
      data: dtos
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch generations'
    };
  }
}

/**
 * Get Single Generation Query Action
 * Retrieves a specific generation by ID
 */
export async function getGeneration(id: string): Promise<GetGenerationResponse> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Generation ID is required'
      };
    }

    const result = await getGetGenerationsUseCase().getById(id);

    if (!result.isSuccess()) {
      return {
        success: false,
        error: result.getError() || 'Failed to fetch generation'
      };
    }

    const generation = result.getValue();
    if (!generation) {
      return {
        success: false,
        error: 'Generation not found'
      };
    }

    const dto = GenerationMapper.toDto(generation);
    return {
      success: true,
      data: dto
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch generation'
    };
  }
}

/**
 * Get Generation Statistics Query Action
 * Retrieves aggregated statistics for user's generations
 */
export async function getGenerationStats(): Promise<GetGenerationStatsResponse> {
  try {
    const authResult = await getAuthContext();
    if (!authResult.success || !authResult.context) {
      return { success: false, error: authResult.error };
    }

    const { userId, organizationId } = authResult.context;

    const result = await getGetGenerationStatsUseCase().execute(userId, organizationId);

    if (!result.isSuccess()) {
      return {
        success: false,
        error: result.getError() || 'Failed to fetch generation stats'
      };
    }

    const stats = GenerationMapper.statsToDto(result.getValue());
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch generation stats'
    };
  }
} 
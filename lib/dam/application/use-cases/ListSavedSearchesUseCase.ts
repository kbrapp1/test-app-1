import { SavedSearch } from '../../domain/entities/SavedSearch';
import { ISavedSearchRepository } from '../../domain/repositories/ISavedSearchRepository';
import { ValidationError, DatabaseError } from '@/lib/errors/base';

export interface ListSavedSearchesRequest {
  userId: string;
  organizationId: string;
  includePopular?: boolean; // Also include popular searches from other users
}

export interface ListSavedSearchesResult {
  userSavedSearches: SavedSearch[];
  popularSavedSearches?: SavedSearch[];
}

export class ListSavedSearchesUseCase {
  constructor(private savedSearchRepository: ISavedSearchRepository) {}

  async execute(request: ListSavedSearchesRequest): Promise<ListSavedSearchesResult> {
    if (!request.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!request.organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    try {
      // Get user's saved searches
      const userSavedSearches = await this.savedSearchRepository.findByUserId(
        request.userId,
        request.organizationId
      );

      // Sort by most recently used, then by most used
      userSavedSearches.sort((a, b) => {
        // First priority: last used (nullish values last)
        if (a.lastUsedAt && b.lastUsedAt) {
          const timeDiff = b.lastUsedAt.getTime() - a.lastUsedAt.getTime();
          if (timeDiff !== 0) return timeDiff;
        } else if (a.lastUsedAt && !b.lastUsedAt) {
          return -1;
        } else if (!a.lastUsedAt && b.lastUsedAt) {
          return 1;
        }
        
        // Second priority: use count
        if (a.useCount !== b.useCount) {
          return b.useCount - a.useCount;
        }
        
        // Final priority: creation date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const result: ListSavedSearchesResult = {
        userSavedSearches,
      };

      // Optionally include popular searches from other users
      if (request.includePopular) {
        const popularSavedSearches = await this.savedSearchRepository.findPopular(
          request.organizationId,
          5 // Limit to top 5 popular searches
        );
        
        // Filter out user's own searches from popular list
        result.popularSavedSearches = popularSavedSearches.filter(
          search => search.userId !== request.userId
        );
      }

      return result;
    } catch (error) {
      console.error('Error listing saved searches:', error);
      throw new DatabaseError(
        'Failed to list saved searches',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
} 
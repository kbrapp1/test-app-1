import { SavedSearch } from '../../../domain/entities/SavedSearch';
import { ISavedSearchRepository } from '../../../domain/repositories/ISavedSearchRepository';
import { SearchDamItemsUseCase, SearchDamItemsParams, SearchDamItemsResult } from './SearchDamItemsUseCase';
import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/base';

export interface ExecuteSavedSearchRequest {
  savedSearchId: string;
  userId: string;
  organizationId: string;
  currentFolderIdForContext?: string | null; // Override folder context if needed
}

export interface ExecuteSavedSearchResult {
  savedSearch: SavedSearch;
  searchResults: SearchDamItemsResult;
}

export class ExecuteSavedSearchUseCase {
  constructor(
    private savedSearchRepository: ISavedSearchRepository,
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(request: ExecuteSavedSearchRequest): Promise<ExecuteSavedSearchResult> {
    if (!request.savedSearchId) {
      throw new ValidationError('Saved search ID is required');
    }

    if (!request.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!request.organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    try {
      // Get the saved search
      const savedSearch = await this.savedSearchRepository.findById(request.savedSearchId);
      
      if (!savedSearch) {
        throw new NotFoundError('Saved search not found');
      }

      // Verify the saved search belongs to the same organization
      if (savedSearch.organizationId !== request.organizationId) {
        throw new ValidationError('Saved search not found in this organization');
      }

      // Build search parameters from saved criteria
      const searchParams: SearchDamItemsParams = {
        organizationId: request.organizationId,
        searchTerm: savedSearch.searchCriteria.searchTerm,
        tagIds: savedSearch.searchCriteria.tagIds,
        filters: savedSearch.searchCriteria.filters ? {
          type: savedSearch.searchCriteria.filters.type,
          creationDateOption: savedSearch.searchCriteria.filters.creationDateOption,
          dateStart: savedSearch.searchCriteria.filters.dateStart,
          dateEnd: savedSearch.searchCriteria.filters.dateEnd,
          ownerId: savedSearch.searchCriteria.filters.ownerId,
          sizeOption: savedSearch.searchCriteria.filters.sizeOption,
          sizeMin: savedSearch.searchCriteria.filters.sizeMin,
          sizeMax: savedSearch.searchCriteria.filters.sizeMax,
        } : undefined,
        sortParams: savedSearch.searchCriteria.sortParams,
        // Use override folder context if provided, otherwise use saved search's folder context
        currentFolderIdForContext: request.currentFolderIdForContext !== undefined 
          ? request.currentFolderIdForContext 
          : savedSearch.searchCriteria.folderId,
      };

      // Execute the search
      const searchUseCase = new SearchDamItemsUseCase(
        this.assetRepository,
        this.folderRepository
      );
      
      const searchResults = await searchUseCase.execute(searchParams);

      // Update usage statistics (async, don't wait for completion)
      this.savedSearchRepository.updateUsage(savedSearch.id).catch(error => {
        console.warn('Failed to update saved search usage:', error);
      });

      return {
        savedSearch,
        searchResults,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('Error executing saved search:', error);
      throw new DatabaseError(
        'Failed to execute saved search',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
} 

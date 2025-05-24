import { SavedSearch } from '../../domain/entities/SavedSearch';
import { ISavedSearchRepository, CreateSavedSearchData } from '../../domain/repositories/ISavedSearchRepository';
import { ValidationError, DatabaseError } from '@/lib/errors/base';

export interface SaveSearchRequest {
  name: string;
  description?: string;
  userId: string;
  organizationId: string;
  searchCriteria: {
    searchTerm?: string;
    folderId?: string | null;
    tagIds?: string[];
    filters?: {
      type?: string;
      creationDateOption?: string;
      dateStart?: string;
      dateEnd?: string;
      ownerId?: string;
      sizeOption?: string;
      sizeMin?: string;
      sizeMax?: string;
    };
    sortParams?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
  };
  isGlobal?: boolean;
}

export class SaveSearchUseCase {
  constructor(private savedSearchRepository: ISavedSearchRepository) {}

  async execute(request: SaveSearchRequest): Promise<SavedSearch> {
    // Validation
    if (!request.name || request.name.trim().length === 0) {
      throw new ValidationError('Search name is required');
    }

    if (request.name.length > 100) {
      throw new ValidationError('Search name must be 100 characters or less');
    }

    if (!request.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!request.organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    // Check if search criteria has any meaningful content
    const hasCriteria = request.searchCriteria.searchTerm ||
      request.searchCriteria.tagIds?.length ||
      (request.searchCriteria.filters && Object.values(request.searchCriteria.filters).some(v => v && v !== 'any')) ||
      request.searchCriteria.sortParams?.sortBy;

    if (!hasCriteria) {
      throw new ValidationError('Search must have at least one filter or search term');
    }

    try {
      const savedSearchData: CreateSavedSearchData = {
        name: request.name.trim(),
        description: request.description?.trim(),
        userId: request.userId,
        organizationId: request.organizationId,
        searchCriteria: request.searchCriteria,
        isGlobal: request.isGlobal ?? true, // Default to global search
      };

      return await this.savedSearchRepository.save(savedSearchData);
    } catch (error) {
      console.error('Error saving search:', error);
      throw new DatabaseError(
        'Failed to save search',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
} 
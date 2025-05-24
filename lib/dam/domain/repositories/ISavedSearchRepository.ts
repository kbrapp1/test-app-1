import { SavedSearch } from '../entities/SavedSearch';

export interface CreateSavedSearchData {
  id?: string;
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
  isGlobal: boolean;
}

export interface UpdateSavedSearchData {
  name?: string;
  description?: string;
  searchCriteria?: CreateSavedSearchData['searchCriteria'];
  isGlobal?: boolean;
}

export interface ISavedSearchRepository {
  findById(id: string): Promise<SavedSearch | null>;
  findByUserId(userId: string, organizationId: string): Promise<SavedSearch[]>;
  findByOrganizationId(organizationId: string): Promise<SavedSearch[]>;
  save(data: CreateSavedSearchData): Promise<SavedSearch>;
  update(id: string, data: UpdateSavedSearchData): Promise<SavedSearch | null>;
  updateUsage(id: string, lastUsedAt?: Date): Promise<SavedSearch | null>;
  delete(id: string): Promise<boolean>;
  findPopular(organizationId: string, limit?: number): Promise<SavedSearch[]>;
} 
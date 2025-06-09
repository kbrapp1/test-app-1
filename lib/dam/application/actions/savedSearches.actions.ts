'use server';

import { createClient } from '@/lib/supabase/server';
import { SupabaseSavedSearchRepository } from '../../infrastructure/persistence/supabase/SupabaseSavedSearchRepository';
import { SaveSearchUseCase, ListSavedSearchesUseCase, ExecuteSavedSearchUseCase } from '../use-cases/search';
import type { SaveSearchRequest } from '../use-cases/search/SaveSearchUseCase';
import type { ListSavedSearchesRequest } from '../use-cases/search/ListSavedSearchesUseCase';
import type { ExecuteSavedSearchRequest } from '../use-cases/search/ExecuteSavedSearchUseCase';
import { SupabaseAssetRepository } from '../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { checkDamFeatureFlag } from '../services/DamFeatureFlagService';

/**
 * Server Actions: Saved Search Management
 * 
 * DDD-compliant server actions for saved search operations.
 * All actions delegate to use cases following clean architecture patterns.
 */

export interface SaveDamSearchRequest {
  name: string;
  description?: string;
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

export interface ListSavedSearchesOptions {
  includePopular?: boolean;
}

export interface ExecuteSavedSearchOptions {
  savedSearchId: string;
  currentFolderIdForContext?: string | null;
}

export async function saveDamSearch(request: SaveDamSearchRequest) {

  try {
    await checkDamFeatureFlag();
    
    const supabase = createClient();
    const activeOrgId = await getActiveOrganizationId();
    
    if (!activeOrgId) {
      return { success: false, error: 'No active organization found' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set up dependencies and execute use case
    const repository = new SupabaseSavedSearchRepository(supabase);
    const useCase = new SaveSearchUseCase(repository);

    const saveRequest: SaveSearchRequest = {
      name: request.name,
      description: request.description,
      userId: user.id,
      organizationId: activeOrgId,
      searchCriteria: request.searchCriteria,
      isGlobal: request.isGlobal,
    };

    const savedSearch = await useCase.execute(saveRequest);
    
    return { 
      success: true, 
      data: {
        id: savedSearch.id,
        name: savedSearch.name,
        description: savedSearch.description,
        userId: savedSearch.userId,
        organizationId: savedSearch.organizationId,
        searchCriteria: savedSearch.searchCriteria,
        isGlobal: savedSearch.isGlobal,
        createdAt: savedSearch.createdAt,
        updatedAt: savedSearch.updatedAt,
        lastUsedAt: savedSearch.lastUsedAt,
        useCount: savedSearch.useCount,
      }
    };
  } catch (error) {
    console.error('Error saving search:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save search' 
    };
  }
}

export async function listSavedSearches(options: ListSavedSearchesOptions = {}) {

  try {
    await checkDamFeatureFlag();
    
    const supabase = createClient();
    const activeOrgId = await getActiveOrganizationId();
    
    if (!activeOrgId) {
      return { success: false, error: 'No active organization found' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set up dependencies and execute use case
    const repository = new SupabaseSavedSearchRepository(supabase);
    const useCase = new ListSavedSearchesUseCase(repository);

    const listRequest: ListSavedSearchesRequest = {
      userId: user.id,
      organizationId: activeOrgId,
      includePopular: options.includePopular,
    };

    const result = await useCase.execute(listRequest);
    
    return { 
      success: true, 
      data: {
        userSavedSearches: result.userSavedSearches.map(search => ({
          id: search.id,
          name: search.name,
          description: search.description,
          userId: search.userId,
          organizationId: search.organizationId,
          searchCriteria: search.searchCriteria,
          isGlobal: search.isGlobal,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt,
          lastUsedAt: search.lastUsedAt,
          useCount: search.useCount,
        })),
        popularSavedSearches: result.popularSavedSearches?.map(search => ({
          id: search.id,
          name: search.name,
          description: search.description,
          userId: search.userId,
          organizationId: search.organizationId,
          searchCriteria: search.searchCriteria,
          isGlobal: search.isGlobal,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt,
          lastUsedAt: search.lastUsedAt,
          useCount: search.useCount,
        })),
      }
    };
  } catch (error) {
    console.error('Error listing saved searches:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list saved searches' 
    };
  }
}

export async function executeSavedSearch(options: ExecuteSavedSearchOptions) {

  try {
    await checkDamFeatureFlag();
    
    const supabase = createClient();
    const activeOrgId = await getActiveOrganizationId();
    
    if (!activeOrgId) {
      return { success: false, error: 'No active organization found' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set up dependencies and execute use case
    const savedSearchRepository = new SupabaseSavedSearchRepository(supabase);
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    
    const useCase = new ExecuteSavedSearchUseCase(
      savedSearchRepository,
      assetRepository,
      folderRepository
    );

    const executeRequest: ExecuteSavedSearchRequest = {
      savedSearchId: options.savedSearchId,
      userId: user.id,
      organizationId: activeOrgId,
      currentFolderIdForContext: options.currentFolderIdForContext,
    };

    const result = await useCase.execute(executeRequest);
    
    return { 
      success: true, 
      data: {
        savedSearch: {
          id: result.savedSearch.id,
          name: result.savedSearch.name,
          description: result.savedSearch.description,
          searchCriteria: result.savedSearch.searchCriteria,
        },
        searchResults: {
          assets: result.searchResults.assets,
          folders: result.searchResults.folders,
          totalCount: result.searchResults.assets.length + result.searchResults.folders.length,
        }
      }
    };
  } catch (error) {
    console.error('Error executing saved search:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to execute saved search' 
    };
  }
} 

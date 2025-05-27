import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { GalleryDataParams, GalleryDataResult } from './GalleryDataTypes';

/**
 * Service responsible for fetching gallery data using DDD use cases
 * Handles authentication, organization context, and data transformation
 */
export class GalleryDataService {
  /**
   * Fetches gallery data based on provided parameters
   * Uses appropriate use case based on whether filters are applied
   */
  async fetchGalleryData(params: GalleryDataParams, forceRefresh: boolean = false): Promise<GalleryDataResult> {
    try {
      
      // Import use cases dynamically to avoid client-side bundling issues
      const { GetDamDataUseCase } = await import('../../../application/use-cases/search/GetDamDataUseCase');
      const { ListFolderContentsUseCase } = await import('../../../application/use-cases/folders/ListFolderContentsUseCase');
      const { SupabaseAssetRepository } = await import('../../../infrastructure/persistence/supabase/SupabaseAssetRepository');
      const { SupabaseFolderRepository } = await import('../../../infrastructure/persistence/supabase/SupabaseFolderRepository');
      
      // Get authenticated user and organization context
      const authContext = await this.getAuthContext();
      if (!authContext.success) {
        return { success: false, error: authContext.error };
      }

      const { user, activeOrgId, supabase } = authContext;

      // Create repositories
      const assetRepository = new SupabaseAssetRepository(supabase);
      const folderRepository = new SupabaseFolderRepository(supabase);

      // Determine which use case to use based on filters
      const hasFilters = this.hasActiveFilters(params);
      let items: GalleryItemDto[];

      if (hasFilters) {
        items = await this.fetchFilteredData(params, user.id, activeOrgId, assetRepository, folderRepository);
      } else {
        items = await this.fetchFolderContents(params, activeOrgId, assetRepository, folderRepository, forceRefresh);
      }



      return { success: true, data: { items } };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets authentication context including user and organization
   */
  private async getAuthContext(): Promise<
    | { success: false; error: string }
    | { success: true; user: NonNullable<any>; activeOrgId: string; supabase: any }
  > {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: 'No session found' };
    }

    // Decode JWT to get organization ID
    const { jwtDecode } = await import('jwt-decode');
    const decodedToken = jwtDecode<any>(session.access_token);
    
    // Try to get organization ID from custom_claims first (auth hook), then fallback to app_metadata
    let activeOrgId = decodedToken.custom_claims?.active_organization_id || 
                      decodedToken.app_metadata?.active_organization_id;
    
    if (!activeOrgId) {
      return { success: false, error: 'No active organization found' };
    }

    return { success: true, user, activeOrgId, supabase };
  }

  /**
   * Checks if any filters are applied to the search
   */
  private hasActiveFilters(params: GalleryDataParams): boolean {
    return Boolean(
      params.searchTerm ||
      params.tagIds ||
      params.filterType ||
      params.filterCreationDateOption ||
      params.filterDateStart ||
      params.filterDateEnd ||
      params.filterOwnerId ||
      params.filterSizeOption ||
      params.filterSizeMin ||
      params.filterSizeMax ||
      params.sortBy ||
      params.sortOrder
    );
  }

  /**
   * Fetches filtered data using GetDamDataUseCase
   */
  private async fetchFilteredData(
    params: GalleryDataParams,
    userId: string,
    activeOrgId: string,
    assetRepository: any,
    folderRepository: any
  ): Promise<GalleryItemDto[]> {
    const { GetDamDataUseCase } = await import('../../../application/use-cases/search/GetDamDataUseCase');
    const getDamDataUseCase = new GetDamDataUseCase(assetRepository, folderRepository);
    
    // Convert string tagIds to array if present
    const tagIdsArray = params.tagIds ? params.tagIds.split(',').filter(id => id.trim()) : undefined;

    // Create request DTO
    const request = {
      organizationId: activeOrgId,
      userId: userId,
      folderId: params.currentFolderId,
      searchTerm: params.searchTerm || '',
      quickSearch: false,
      tagIds: tagIdsArray,
      filters: {
        type: params.filterType,
        creationDateOption: params.filterCreationDateOption,
        dateStart: params.filterDateStart,
        dateEnd: params.filterDateEnd,
        ownerId: params.filterOwnerId,
        sizeOption: params.filterSizeOption,
        sizeMin: params.filterSizeMin,
        sizeMax: params.filterSizeMax,
      },
      sortParams: {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder as 'asc' | 'desc' | undefined,
      },
      limitOptions: {
        quickSearch: false,
        parsedLimit: 100,
      },
    };

    const result = await getDamDataUseCase.execute(request);

    // Transform domain entities to DTOs
    return [
      ...result.folders.map((folder: any) => ({
        type: 'folder' as const,
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
      })),
      ...result.assets.map((asset: any) => ({
        type: 'asset' as const,
        id: asset.id,
        name: asset.name,
        createdAt: asset.createdAt,
        mimeType: asset.mimeType,
        publicUrl: asset.publicUrl,
        size: asset.size,
        userId: asset.userId,
        userFullName: asset.userFullName,
        tags: asset.tags?.map((tag: any) => ({ id: tag.id, name: tag.name })) || [],
      })),
    ];
  }

  /**
   * Fetches simple folder contents using ListFolderContentsUseCase
   */
  private async fetchFolderContents(
    params: GalleryDataParams,
    activeOrgId: string,
    assetRepository: any,
    folderRepository: any,
    forceRefresh: boolean = false
  ): Promise<GalleryItemDto[]> {
    const { ListFolderContentsUseCase } = await import('../../../application/use-cases/folders/ListFolderContentsUseCase');
    const listFolderContentsUseCase = new ListFolderContentsUseCase(assetRepository, folderRepository);
    
    const result = await listFolderContentsUseCase.execute({
      organizationId: activeOrgId,
      currentFolderId: params.currentFolderId,
      forceRefresh,
    });

    return result.items;
  }
} 

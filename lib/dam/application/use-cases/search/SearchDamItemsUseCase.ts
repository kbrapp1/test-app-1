import { Asset } from '../../../domain/entities/Asset';
import { Folder } from '../../../domain/entities/Folder';
import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { DamFilterParameters, DamSortParameters, LimitOptions, AssetSearchCriteria, FolderSearchCriteria } from '../../../application/dto/SearchCriteriaDTO';
import { ValidationError } from '@/lib/errors/base';

export interface SearchDamItemsParams {
  organizationId: string;
  searchTerm?: string;
  tagIds?: string[]; 
  filters?: DamFilterParameters;
  sortParams?: DamSortParameters;
  limitOptions?: LimitOptions; 
  // Consider if folderId/parentFolderId context is needed for global search
  // For instance, if search should be implicitly within a currentFolderId if provided,
  // even with a searchTerm. The repositories handle folderId/parentFolderId in their criteria.
  currentFolderIdForContext?: string | null; 
}

export interface SearchDamItemsResult {
  assets: Asset[];
  folders: Folder[];
}

export class SearchDamItemsUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(params: SearchDamItemsParams): Promise<SearchDamItemsResult> {
    if (!params.organizationId) {
      throw new ValidationError('Organization ID is required for searching DAM items.');
    }

    // Determine if a global search is needed (search term OR global filters)
    // Search term should always search globally across entire DAM
    const hasSearchTerm = !!params.searchTerm && params.searchTerm.trim() !== '';
    const hasGlobalFilters = !hasSearchTerm && 
      (
        (params.tagIds && params.tagIds.length > 0)
        // Only tag filters now trigger global search - all other filters maintain folder context
      );

    let assetFolderContextId: string | null | undefined = params.currentFolderIdForContext;
    let folderParentContextId: string | null | undefined = params.currentFolderIdForContext;

    if (hasSearchTerm || hasGlobalFilters) {
      // For search terms or global filter searches, search across the entire organization
      assetFolderContextId = undefined; // Search all folders for assets
      folderParentContextId = undefined; // Search all folders, not just current context
    }
    // If searchTerm is present, currentFolderIdForContext (if provided) is used to scope search within that folder.
    // If no searchTerm and no global filters, this use case might not be the primary path (listing is),
    // but if called, using currentFolderIdForContext is a reasonable default.

    // Always show folders at root level for navigation, regardless of filters
    // Always show folders when searching (universal search)
    // Only exclude folders for filters that are truly incompatible with folders (size, tags) when in subfolders
    const isAtRootLevel = !params.currentFolderIdForContext || params.currentFolderIdForContext.trim() === '';
    
    // Don't pass type filter to folders since folders shouldn't be filtered by content type
    // Also don't pass owner filter when at root level to maintain navigation
    const folderFilters = params.filters ? { ...params.filters } : undefined;
    if (folderFilters) {
      delete folderFilters.type;
      if (isAtRootLevel) {
        delete folderFilters.ownerId;
      }
    }

    const assetSearchCriteria: AssetSearchCriteria = {
      organizationId: params.organizationId,
      searchTerm: params.searchTerm,
      folderId: assetFolderContextId,
      tagIds: params.tagIds,
      filters: params.filters,
      sortParams: params.sortParams,
      limitOptions: params.limitOptions,
    };

    const folderSearchCriteria: FolderSearchCriteria = {
      organizationId: params.organizationId,
      searchTerm: params.searchTerm,
      parentFolderId: folderParentContextId,
      filters: folderFilters,
      sortParams: params.sortParams,
      limitOptions: params.limitOptions,
    };

    // Perform searches - handle assets and folders separately due to different types
    // Always show folders at root level for navigation, regardless of filters
    // Always show folders when searching (universal search)
    // Only exclude folders for filters that are truly incompatible with folders (size, tags) when in subfolders
    const shouldSearchFolders = hasSearchTerm || isAtRootLevel || (
      !params.filters?.sizeOption &&
      !params.filters?.sizeMin && 
      !params.filters?.sizeMax &&
      (!params.tagIds || params.tagIds.length === 0)
    );

    const [assetsResult, foldersResult] = await Promise.allSettled([
      this.assetRepository.search(assetSearchCriteria),
      shouldSearchFolders 
        ? this.folderRepository.search(
            params.organizationId,
            params.searchTerm || '',
            folderParentContextId,
            params.limitOptions ? { 
              offset: 0, 
              limit: params.limitOptions.parsedLimit 
            } : undefined,
            params.sortParams ? {
              sortBy: params.sortParams.sortBy || undefined,
              sortOrder: params.sortParams.sortOrder || undefined
            } : undefined
          )
        : Promise.resolve([])
    ]);

    const assets: Asset[] = assetsResult.status === 'fulfilled' ? assetsResult.value : [];
    const folders: Folder[] = foldersResult.status === 'fulfilled' ? foldersResult.value : [];

    if (assetsResult.status === 'rejected') {
      console.error('Error searching assets in SearchDamItemsUseCase:', assetsResult.reason);
    }
    if (shouldSearchFolders && foldersResult.status === 'rejected') {
      console.error('Error searching folders in SearchDamItemsUseCase:', foldersResult.reason);
    }

    return { assets, folders };
  }
} 

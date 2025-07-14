import { Asset as DomainAsset } from '../../../domain/entities/Asset';
import { Folder as DomainFolder } from '../../../domain/entities/Folder';
import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { IFolderRepository } from '../../../domain/repositories/IFolderRepository';
import { DamApiRequestDto } from '../../dto/DamApiRequestDto';
import { SearchDamItemsUseCase, SearchDamItemsResult } from './SearchDamItemsUseCase';
import { ListAssetsByFolderUseCase } from '../assets/ListAssetsByFolderUseCase';
import { ListFoldersUseCase } from '../folders/ListFoldersUseCase';
import { DatabaseError } from '@/lib/errors/base';
import { DamFilterParameters, DamSortParameters, LimitOptions } from '../../dto/SearchCriteriaDTO';

export interface GetDamDataResult {
  assets: DomainAsset[];
  folders: DomainFolder[];
}

export class GetDamDataUseCase {
  constructor(
    private assetRepository: IAssetRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(request: DamApiRequestDto): Promise<GetDamDataResult> {
    const { 
      searchTerm, 
      folderId, 
      tagIds, 
      filters, 
      sortParams, 
      limitOptions, 
      organizationId 
    } = request;

    const finalAssets: DomainAsset[] = [];
    const finalFolders: DomainFolder[] = [];

    // Determine operation type
    const hasSearchTerm = !!searchTerm && searchTerm.trim() !== '';
    const isGlobalFilterWithoutSearchOrFolder = 
      !hasSearchTerm && 
      (!folderId || folderId.trim() === '') && 
      !!(tagIds && tagIds.length > 0);

    try {
      if (hasSearchTerm || isGlobalFilterWithoutSearchOrFolder) {
        // Use search operation
        await this.executeSearchOperation({
          organizationId,
          searchTerm: searchTerm || undefined,
          tagIds,
          filters,
          sortParams,
          limitOptions,
          currentFolderIdForContext: folderId,
        }, finalAssets, finalFolders);
      } else {
        // Use list operation
        await this.executeListOperation({
          folderId,
          organizationId,
          filters,
          sortParams,
          tagIds,
        }, finalAssets, finalFolders);
      }
    } catch (error) {
      console.error('Error in GetDamDataUseCase:', error);
      throw new DatabaseError(
        'Failed to fetch DAM data',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return {
      assets: finalAssets,
      folders: finalFolders,
    };
  }

  private async executeSearchOperation(
    searchParams: {
      organizationId: string;
      searchTerm?: string;
      tagIds?: string[];
      filters: DamFilterParameters;
      sortParams: DamSortParameters;
      limitOptions: LimitOptions;
      currentFolderIdForContext: string | null;
    },
    assetsOutput: DomainAsset[],
    foldersOutput: DomainFolder[]
  ): Promise<void> {
    const searchUseCase = new SearchDamItemsUseCase(
      this.assetRepository, 
      this.folderRepository
    );
    
    const searchResult: SearchDamItemsResult = await searchUseCase.execute(searchParams);
    assetsOutput.push(...searchResult.assets);
    
    // Hide folders when tag filtering is active for cleaner UX
    const hasTagFiltering = searchParams.tagIds && searchParams.tagIds.length > 0;
    if (!hasTagFiltering) {
      foldersOutput.push(...searchResult.folders);
    }
  }

  private async executeListOperation(
    params: {
      folderId: string | null;
      organizationId: string;
      filters: DamFilterParameters;
      sortParams: DamSortParameters;
      tagIds?: string[];
    },
    assetsOutput: DomainAsset[],
    foldersOutput: DomainFolder[]
  ): Promise<void> {
    const { folderId, organizationId, filters, sortParams, tagIds } = params;

    // List assets in folder
    const listAssetsUseCase = new ListAssetsByFolderUseCase(this.assetRepository);
    const assets = await listAssetsUseCase.execute({
      folderId,
      organizationId,
      sortParams,
      filters,
    });
    assetsOutput.push(...assets);

    // Determine if we should fetch folders
    const isAtRootLevel = !folderId || folderId.trim() === '';
    const hasTagFiltering = tagIds && tagIds.length > 0;
    const hasTypeFiltering = filters.type && filters.type.trim() !== '';
    
    // Hide folders when filtering is active for cleaner UX
    // Folders should be hidden when:
    // - Tag filtering is active (folders don't have tags)
    // - Type filtering is active (folders don't have content types)
    // - Size filtering is active (folders don't have file sizes)
    const shouldFetchFolders = !hasTagFiltering && !hasTypeFiltering && (isAtRootLevel || (
      !filters.sizeOption &&
      !filters.sizeMin && 
      !filters.sizeMax
    ));

    if (shouldFetchFolders) {
      const listFoldersUseCase = new ListFoldersUseCase(this.folderRepository);
      
      // Don't pass type filter to folders since folders shouldn't be filtered by content type
      // Also don't pass owner filter when at root level to maintain navigation
      const folderFilters = { ...filters };
      delete folderFilters.type;
      if (isAtRootLevel) {
        delete folderFilters.ownerId;
      }
      
      const folders = await listFoldersUseCase.execute({
        parentId: folderId,
        organizationId,
        sortParams,
        filters: folderFilters,
      });
      foldersOutput.push(...folders);
    }
  }
} 

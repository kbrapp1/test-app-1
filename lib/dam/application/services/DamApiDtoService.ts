import { SupabaseClient } from '@supabase/supabase-js';
import { Asset as DomainAsset } from '../../domain/entities/Asset';
import { Folder as DomainFolder } from '../../domain/entities/Folder';
import { DamApiResponseDto, CombinedDamItem, TransformedAsset, TransformedFolder } from '../dto/DamApiRequestDto';
import { GetDamDataResult } from '../use-cases/search/GetDamDataUseCase';
import { SearchSortParams, LimitOptions } from '../dto/SearchCriteriaDTO';

export class DamApiDtoService {
  constructor(private supabase: SupabaseClient) {}

  async transformToApiResponse(
    domainResult: GetDamDataResult,
    organizationId: string,
    sortParams?: SearchSortParams,
    limitOptions?: LimitOptions,
    searchTerm?: string
  ): Promise<DamApiResponseDto> {
    // Transform domain entities to DTOs
    const { assetsWithDetails, foldersWithDetails } = await this.mapDomainEntitiesToApiDtos({
      supabase: this.supabase,
      activeOrgId: organizationId,
      domainAssets: domainResult.assets,
      domainFolders: domainResult.folders,
    });

    // Combine and sort data
    let combinedData = this.combineAndSortData(
      assetsWithDetails, 
      foldersWithDetails, 
      sortParams
    );

    // Apply quick search limits if needed
    if (limitOptions?.quickSearch && 
        typeof limitOptions.parsedLimit === 'number' && 
        limitOptions.parsedLimit > 0 && 
        (!searchTerm || searchTerm.trim() === '')) {
      combinedData = this.applyQuickSearchLimits(
        foldersWithDetails, 
        assetsWithDetails, 
        limitOptions.parsedLimit
      );
    }

    return {
      data: combinedData,
      totalItems: combinedData.length,
      metadata: {
        searchTerm,
        appliedFilters: {}, // Could be expanded later
      }
    };
  }

  private async mapDomainEntitiesToApiDtos(params: {
    supabase: SupabaseClient;
    activeOrgId: string;
    domainAssets: DomainAsset[];
    domainFolders: DomainFolder[];
  }): Promise<{ assetsWithDetails: TransformedAsset[]; foldersWithDetails: TransformedFolder[] }> {
    const { supabase, activeOrgId, domainAssets, domainFolders } = params;

    const allUserIds = new Set<string>();
    const allParentFolderIds = new Set<string>();

    domainFolders.forEach(f => allUserIds.add(f.userId));
    domainAssets.forEach(a => {
      allUserIds.add(a.userId);
      if (a.folderId) allParentFolderIds.add(a.folderId);
    });

    const ownerNamesMap = await this.getOwnerNamesMap(supabase, Array.from(allUserIds));
    const parentFolderNamesMap = await this.getParentFolderNamesMap(
      supabase, 
      Array.from(allParentFolderIds), 
      activeOrgId
    );

    const assetsWithDetails: TransformedAsset[] = domainAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      user_id: asset.userId,
      created_at: asset.createdAt.toISOString(),
      updated_at: asset.updatedAt?.toISOString() || null,
      storage_path: asset.storagePath,
      mime_type: asset.mimeType,
      size: asset.size,
      folder_id: asset.folderId === undefined ? null : asset.folderId,
      organization_id: asset.organizationId,
      type: 'asset',
      publicUrl: asset.publicUrl || null,
      parentFolderName: asset.folderId ? (parentFolderNamesMap.get(asset.folderId) || 'Unknown Folder') : 'Root',
      ownerName: ownerNamesMap.get(asset.userId) || 'Unknown Owner',
      tags: asset.tags?.map(tag => tag.toPlainObject()) || [], 
    }));

    const foldersWithDetails: TransformedFolder[] = domainFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      userId: folder.userId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      parentFolderId: folder.parentFolderId || null,
      organizationId: folder.organizationId,
      has_children: folder.has_children || false,
      type: 'folder',
      ownerName: ownerNamesMap.get(folder.userId) || 'Unknown Owner',
    }));

    return { assetsWithDetails, foldersWithDetails };
  }

  private combineAndSortData(
    assets: TransformedAsset[], 
    folders: TransformedFolder[], 
    sortParams?: SearchSortParams
  ): CombinedDamItem[] {
    const combinedData: CombinedDamItem[] = [...folders, ...assets];

    // Apply sorting if specified
    if (sortParams?.sortBy && sortParams?.sortOrder) {
      combinedData.sort((a, b) => {
        let aValue: string | number | Date | null | undefined;
        let bValue: string | number | Date | null | undefined;
        
        switch (sortParams.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'updated_at':
            aValue = a.type === 'folder' ? (a as TransformedFolder).updatedAt : (a as TransformedAsset).updated_at;
            bValue = b.type === 'folder' ? (b as TransformedFolder).updatedAt : (b as TransformedAsset).updated_at;
            aValue = aValue ? new Date(aValue) : new Date(0);
            bValue = bValue ? new Date(bValue) : new Date(0);
            break;
          case 'size':
            aValue = a.type === 'asset' ? (a as TransformedAsset).size : 0;
            bValue = b.type === 'asset' ? (b as TransformedAsset).size : 0;
            break;
          case 'mime_type':
            aValue = a.type === 'asset' ? (a as TransformedAsset).mime_type : '';
            bValue = b.type === 'asset' ? (b as TransformedAsset).mime_type : '';
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortParams.sortOrder === 'asc' ? -1 : 1;
        if (bValue == null) return sortParams.sortOrder === 'asc' ? 1 : -1;

        // Compare values
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;

        return sortParams.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return combinedData;
  }

  private applyQuickSearchLimits(
    folders: TransformedFolder[], 
    assets: TransformedAsset[], 
    limit: number
  ): CombinedDamItem[] {
    const combined: CombinedDamItem[] = [];
    
    // Prioritize folders
    for (const folder of folders) {
      if (combined.length >= limit) break;
      combined.push(folder);
    }
    
    // Then add assets until limit is reached
    for (const asset of assets) {
      if (combined.length >= limit) break;
      combined.push(asset);
    }
    
    return combined;
  }

  private async getOwnerNamesMap(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
      
    if (error) {
      console.error('Error fetching owner profiles for DTO mapping:', error.message);
      return new Map();
    }
    
    const ownerMap = new Map<string, string>();
    profiles?.forEach(p => { 
      if (p.full_name) ownerMap.set(p.id, p.full_name); 
    });
    
    return ownerMap;
  }

  private async getParentFolderNamesMap(
    supabase: SupabaseClient, 
    folderIds: string[], 
    organizationId: string
  ): Promise<Map<string, string>> {
    if (folderIds.length === 0) return new Map();
    
    const { data: folders, error } = await supabase
      .from('folders')
      .select('id, name')
      .in('id', folderIds)
      .eq('organization_id', organizationId);
      
    if (error) {
      console.error('Error fetching parent folder names for DTO mapping:', error.message);
      return new Map();
    }
    
    const folderNameMap = new Map<string, string>();
    folders?.forEach(f => folderNameMap.set(f.id, f.name));
    
    return folderNameMap;
  }
} 

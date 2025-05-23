import { SupabaseClient } from '@supabase/supabase-js';
import { IFolderRepository, FolderTreeNode, CreateFolderData, UpdateFolderData } from '../../../domain/repositories/IFolderRepository';
import { Folder } from '../../../domain/entities/Folder';
import { Asset } from '../../../domain/entities/Asset';
import { FolderMapper, RawFolderDbRecord } from './mappers/FolderMapper';
import { AssetMapper, RawAssetDbRecord as RawAssetDbRecordForAsset } from './mappers/AssetMapper';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors/base';
import type { DamFilterParameters, DamSortParameters, FolderSearchCriteria } from '../../../application/dto/SearchCriteriaDTO';

// Utility function to apply date filters (adapted from app/api/dam/dam-api.query-builders.ts)
function applyFolderDateFiltersToQuery(query: any, filters: DamFilterParameters): any {
  if (!filters.creationDateOption) {
    return query;
  }

  const now = new Date();
  let dateFilterValue: string;
  let dateEndFilterValue: string | undefined;

  switch (filters.creationDateOption) {
    case 'today':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'last7days':
      const last7DaysDate = new Date(now.valueOf());
      last7DaysDate.setUTCDate(now.getUTCDate() - 7);
      dateFilterValue = new Date(Date.UTC(last7DaysDate.getUTCFullYear(), last7DaysDate.getUTCMonth(), last7DaysDate.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'last30days':
      const last30DaysDate = new Date(now.valueOf());
      last30DaysDate.setUTCDate(now.getUTCDate() - 30);
      dateFilterValue = new Date(Date.UTC(last30DaysDate.getUTCFullYear(), last30DaysDate.getUTCMonth(), last30DaysDate.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'thisYear':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'lastYear':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)).toISOString();
      dateEndFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
      query = query.gte('created_at', dateFilterValue).lt('created_at', dateEndFilterValue);
      break;
    case 'custom':
      if (filters.dateStart) {
        const [year, month, day] = filters.dateStart.split('-').map(Number);
        dateFilterValue = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
        query = query.gte('created_at', dateFilterValue);
      }
      if (filters.dateEnd) {
        const [year, month, day] = filters.dateEnd.split('-').map(Number);
        dateEndFilterValue = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
        query = query.lte('created_at', dateEndFilterValue);
      }
      break;
  }
  return query;
}

export class SupabaseFolderRepository implements IFolderRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createSupabaseServerClient();
  }

  async findById(id: string, organizationId: string): Promise<Folder | null> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching folder by ID:', error.message);
      throw new DatabaseError('Could not fetch folder by ID.', error.message);
    }
    if (!data) {
      return null;
    }
    return FolderMapper.toDomain(data as RawFolderDbRecord);
  }

  async findRootFolders(organizationId: string): Promise<Folder[]> {
    return this.findFoldersByParentId(null, organizationId);
  }

  async findFoldersByParentId(
    parentId: string | null, 
    organizationId: string,
    sortParams?: DamSortParameters,
    filters?: DamFilterParameters,
  ): Promise<Folder[]> {
    let query = this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)')
      .eq('organization_id', organizationId);

    if (parentId === null) {
      query = query.is('parent_folder_id', null);
    } else {
      query = query.eq('parent_folder_id', parentId);
    }
    
    // Apply filters
    if (filters) {
      if (filters.ownerId) {
        query = query.eq('user_id', filters.ownerId);
      }
      // Date filters
      query = applyFolderDateFiltersToQuery(query, filters);
      
      // Type filter for folders:
      // If filters.type is defined and is not 'folder', it means we are looking for specific asset types,
      // so no folders should be returned. This specific logic might be better handled in a use case
      // that combines asset and folder fetching if that's the scenario.
      // For a method that *only* fetches folders, if type is specified and it's not 'folder',
      // it implies an empty result for folders.
      if (filters.type && filters.type !== 'folder') {
        return []; // Return empty array as no folders match an asset-specific type filter
      }
    }

    // Apply sorting
    let effectiveSortBy = sortParams?.sortBy || 'name';
    const sortOrderAsc = (sortParams?.sortOrder || 'asc') === 'asc';

    const validFolderSortColumns = ['name', 'created_at', 'updated_at']; // Define valid sort columns for folders
    if (!validFolderSortColumns.includes(effectiveSortBy)) {
      // If sortBy is not valid for folders (e.g., 'size'), default to 'name'
      effectiveSortBy = 'name';
    }

    query = query.order(effectiveSortBy, { ascending: sortOrderAsc });

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching folders for parent ${parentId}:`, error.message);
      throw new DatabaseError(`Could not fetch folders for parent ${parentId}.`, error.message);
    }
    return (data || []).map(raw => FolderMapper.toDomain(raw as RawFolderDbRecord));
  }
  
  async findByName(name: string, organizationId: string, parentFolderId?: string | null): Promise<Folder | null> {
    let query = this.supabase
      .from('folders')
      .select('*')
      .eq('name', name)
      .eq('organization_id', organizationId);

    if (parentFolderId === null) { 
      query = query.is('parent_folder_id', null);
    } else if (parentFolderId !== undefined) { 
      query = query.eq('parent_folder_id', parentFolderId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching folder by name:', error.message);
      throw new DatabaseError('Could not fetch folder by name.', error.message);
    }
    if (!data) {
      return null;
    }
    return FolderMapper.toDomain(data as RawFolderDbRecord);
  }

  async findChildren(folderId: string, organizationId: string): Promise<(Folder | Asset)[]> {
    const childFolders = await this.findFoldersByParentId(folderId, organizationId);

    const { data: assetsData, error: assetsError } = await this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))')
      .eq('organization_id', organizationId)
      .eq('folder_id', folderId);

    if (assetsError) {
      console.error('Error fetching child assets:', assetsError.message);
      throw new DatabaseError('Could not fetch child assets.', assetsError.message);
    }
    
    const childAssets: Asset[] = (assetsData || []).map(raw => 
      AssetMapper.toDomain(raw as RawAssetDbRecordForAsset)
    );

    return [...childFolders, ...childAssets];
  }

  async getPath(folderId: string, organizationId: string): Promise<string> {
    const { data, error } = await this.supabase.rpc('get_folder_path', { p_folder_id: folderId });

    if (error) {
      console.error('Error fetching folder path:', error.message);
      throw new DatabaseError('Could not fetch folder path.', error.message);
    }
    
    // Convert array path to string path (e.g., "/folder1/folder2/folder3")
    if (!data || data.length === 0) {
      return '/';
    }
    
    const pathSegments = (data as { id: string; name: string }[]).map(segment => segment.name);
    return '/' + pathSegments.join('/');
  }

  async save(folderData: CreateFolderData): Promise<Folder> {
    return this.create(folderData);
  }

  async update(id: string, updates: UpdateFolderData, organizationId: string): Promise<Folder> {
    const persistenceData = FolderMapper.toUpdatePersistence(updates);

    if (Object.keys(persistenceData).length === 0) {
      const existing = await this.findById(id, organizationId);
      if (!existing) {
        throw new NotFoundError('Folder not found for update.');
      }
      return existing;
    }

    const { data: updatedData, error } = await this.supabase
      .from('folders')
      .update(persistenceData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating folder:', error.message);
      if (error.code === 'PGRST116') { 
        throw new NotFoundError('Folder not found for update.');
      }
      throw new DatabaseError('Could not update folder.', error.message);
    }
    if (!updatedData) { 
      throw new NotFoundError('Folder not found for update.');
    }
    return FolderMapper.toDomain(updatedData as RawFolderDbRecord);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const { data: childFoldersResult, error: childFoldersError } = await this.supabase
      .from('folders')
      .select('id', { count: 'exact', head: true })
      .eq('parent_folder_id', id)
      .eq('organization_id', organizationId);

    if (childFoldersError) {
      console.error('Error checking for child folders before delete:', childFoldersError.message);
      throw new DatabaseError('Could not verify child folders for deletion.', childFoldersError.message);
    }
    const childFolderCount = (childFoldersResult as any)?.count;
    if (childFolderCount > 0) {
       throw new DatabaseError('Folder cannot be deleted because it contains sub-folders.');
    }
    
    const { data: childAssetsResult, error: childAssetsError } = await this.supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', id)
      .eq('organization_id', organizationId);

    if (childAssetsError) {
      console.error('Error checking for child assets before delete:', childAssetsError.message);
      throw new DatabaseError('Could not verify child assets for deletion.', childAssetsError.message);
    }
    const childAssetCount = (childAssetsResult as any)?.count;
    if (childAssetCount > 0) {
       throw new DatabaseError('Folder cannot be deleted because it contains assets.');
    }

    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting folder:', error.message);
      throw new DatabaseError('Could not delete folder.', error.message);
    }
  }

  async getFolderTree(organizationId: string, parentFolderId?: string | null): Promise<FolderTreeNode[]> {
    const rootFolders = await this.findFoldersByParentId(parentFolderId === undefined ? null : parentFolderId, organizationId);
    
    const buildTree = async (folders: Folder[]): Promise<FolderTreeNode[]> => {
      const treeNodes: FolderTreeNode[] = [];
      for (const folder of folders) {
        const children = await this.findFoldersByParentId(folder.id, organizationId);
        const childTreeNodes = await buildTree(children);
        
        // Create a new FolderTreeNode by extending the existing Folder with children
        const treeNode: FolderTreeNode = Object.assign(
          Object.create(Object.getPrototypeOf(folder)), // Preserve the Folder class prototype
          folder, // Copy all properties
          { children: childTreeNodes } // Add children property
        );
        
        treeNodes.push(treeNode);
      }
      return treeNodes;
    };

    return buildTree(rootFolders);
  }

  async findFolderPath(folderId: string, organizationId: string): Promise<Folder[]> {
    if (!folderId) {
      throw new ValidationError('Folder ID is required to find folder path.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required to find folder path.');
    }

    // Assuming your RPC is set up to handle organization_id internally for security if needed,
    // or modify the RPC to accept organization_id.
    // For now, proceeding with the assumption that p_folder_id is sufficient
    // and RLS handles organization security.
    const { data, error } = await this.supabase.rpc('get_folder_path', {
      p_folder_id: folderId
      // If your RPC specifically needs orgId: p_organization_id: organizationId,
    });

    if (error) {
      console.error('SupabaseFolderRepository Error - findFolderPath RPC:', error);
      throw new DatabaseError('Failed to fetch folder path.');
    }
    if (!data) {
      return [];
    }
    // The RPC must return data that matches RawFolderDbRecord structure for FolderMapper.toDomain
    return (data as RawFolderDbRecord[]).map(FolderMapper.toDomain);
  }

  async findAllByOrganizationId(organizationId: string): Promise<Folder[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required to list all folders.');
    }

    const { data, error } = await this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)') // Ensure has_children is fetched
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) {
      console.error('SupabaseFolderRepository Error - findAllByOrganizationId:', error);
      throw new DatabaseError('Failed to fetch all folders for organization.');
    }

    return (data || []).map(raw => FolderMapper.toDomain(raw as RawFolderDbRecord));
  }

  async create(folderData: CreateFolderData): Promise<Folder> {
    const persistenceData = FolderMapper.toCreatePersistence(folderData);
    const { data, error } = await this.supabase
      .from('folders')
      .insert(persistenceData)
      .select('*, has_children:folders!parent_folder_id(count)')
      .single();

    if (error || !data) {
      console.error('Error creating folder:', error?.message);
      throw new DatabaseError('Could not create folder.', error?.message);
    }
    return FolderMapper.toDomain(data as RawFolderDbRecord);
  }

  async search(
    organizationId: string, 
    searchQuery: string, 
    currentFolderIdForContext?: string | null, 
    limitOptions?: { offset?: number; limit?: number }, 
    sortParams?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<Folder[]> {
    let query = this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)')
      .eq('organization_id', organizationId);

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    // Parent folder filtering for search (if specified)
    if (currentFolderIdForContext === null) {
      query = query.is('parent_folder_id', null);
    } else if (currentFolderIdForContext !== undefined) {
      query = query.eq('parent_folder_id', currentFolderIdForContext);
    }

    // Sorting for search results
    let effectiveSortBySearch = sortParams?.sortBy || 'name';
    const sortOrderAscSearch = (sortParams?.sortOrder || 'asc') === 'asc';

    const validFolderSortColumnsSearch = ['name', 'created_at', 'updated_at'];
    if (!validFolderSortColumnsSearch.includes(effectiveSortBySearch)) {
      effectiveSortBySearch = 'name';
    }

    query = query.order(effectiveSortBySearch, { ascending: sortOrderAscSearch });

    // Apply limit/pagination from limitOptions
    if (limitOptions?.limit !== undefined && limitOptions.limit > 0) {
      const limit = limitOptions.limit;
      query = query.limit(limit);
      
      if (limitOptions.offset !== undefined && limitOptions.offset > 0) {
        const from = limitOptions.offset;
        const to = from + limit - 1;
        query = query.range(from, to);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching folders:', error.message);
      throw new DatabaseError('Could not search folders.', error.message);
    }
    return (data || []).map(raw => FolderMapper.toDomain(raw as RawFolderDbRecord));
  }
} 
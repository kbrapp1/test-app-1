import { SupabaseClient } from '@supabase/supabase-js';
import { IFolderRepository, FolderTreeNode } from '../../../domain/repositories/IFolderRepository';
import { Folder } from '../../../domain/entities/Folder';
import { Asset } from '../../../domain/entities/Asset';
import { FolderMapper, RawFolderDbRecord } from './mappers/FolderMapper';
import { AssetMapper, RawAssetDbRecord as RawAssetDbRecordForAsset } from './mappers/AssetMapper';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors/base';

export class SupabaseFolderRepository implements IFolderRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createSupabaseServerClient();
  }

  async findById(id: string): Promise<Folder | null> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)')
      .eq('id', id)
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

  async findFoldersByParentId(parentId: string | null, organizationId: string): Promise<Folder[]> {
    let query = this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)')
      .eq('organization_id', organizationId);

    if (parentId === null) {
      query = query.is('parent_folder_id', null);
    } else {
      query = query.eq('parent_folder_id', parentId);
    }
    
    query = query.order('name', { ascending: true });

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

  async getPath(folderId: string): Promise<{ id: string; name: string }[]> {
    const { data, error } = await this.supabase.rpc('get_folder_path', { p_folder_id: folderId });

    if (error) {
      console.error('Error fetching folder path:', error.message);
      throw new DatabaseError('Could not fetch folder path.', error.message);
    }
    return data || [];
  }

  async save(folderData: Pick<Folder, 'name' | 'parentFolderId' | 'organizationId' | 'userId'>): Promise<Folder> {
    const persistenceData = FolderMapper.toPersistence(folderData);
    
    const { data, error } = await this.supabase
      .from('folders')
      .insert(persistenceData)
      .select()
      .single();

    if (error || !data) {
      console.error('Error saving folder:', error?.message);
      throw new DatabaseError('Could not save folder.', error?.message);
    }
    return FolderMapper.toDomain(data as RawFolderDbRecord);
  }

  async update(folderId: string, data: Partial<Pick<Folder, 'name' | 'parentFolderId'>>): Promise<Folder | null> {
    const persistenceData = FolderMapper.toUpdatePersistence(data);

    if (Object.keys(persistenceData).length === 0) {
      return this.findById(folderId);
    }

    const { data: updatedData, error } = await this.supabase
      .from('folders')
      .update(persistenceData)
      .eq('id', folderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating folder:', error.message);
      if (error.code === 'PGRST116') { 
        return null;
      }
      throw new DatabaseError('Could not update folder.', error.message);
    }
    if (!updatedData) { 
        return null;
    }
    return FolderMapper.toDomain(updatedData as RawFolderDbRecord);
  }

  async delete(id: string): Promise<boolean> {
    const { data: childFoldersResult, error: childFoldersError } = await this.supabase
      .from('folders')
      .select('id', { count: 'exact', head: true })
      .eq('parent_folder_id', id);

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
      .eq('folder_id', id);

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
      .eq('id', id);

    if (error) {
      console.error('Error deleting folder:', error.message);
      return false; 
    }
    return true;
  }

  async getFolderTree(organizationId: string, parentFolderId?: string | null): Promise<FolderTreeNode[]> {
    const rootFolders = await this.findFoldersByParentId(parentFolderId === undefined ? null : parentFolderId, organizationId);
    
    const buildTree = async (folders: Folder[]): Promise<FolderTreeNode[]> => {
      const treeNodes: FolderTreeNode[] = [];
      for (const folder of folders) {
        const children = await this.findFoldersByParentId(folder.id, organizationId);
        const childTreeNodes = await buildTree(children);
        treeNodes.push({
          ...folder,
          children: childTreeNodes,
        });
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

  async create(folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    // Minimal stub for now, full implementation should use FolderMapper.toCreatePersistence
    // and handle insertion. This is just to satisfy the linter for the current task.
    const persistenceData = FolderMapper.toCreatePersistence(folderData);
    const { data, error } = await this.supabase
      .from('folders')
      .insert(persistenceData)
      .select('*, has_children:folders!parent_folder_id(count)')
      .single();

    if (error || !data) {
      console.error('Error creating folder (stubbed implementation):', error?.message);
      throw new DatabaseError('Could not create folder (stubbed).', error?.message);
    }
    return FolderMapper.toDomain(data as RawFolderDbRecord);
  }
} 
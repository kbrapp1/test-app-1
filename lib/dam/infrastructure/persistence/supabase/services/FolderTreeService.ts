import { SupabaseClient } from '@supabase/supabase-js';
import { Folder } from '../../../../domain/entities/Folder';
import { Asset } from '../../../../domain/entities/Asset';
import { FolderTreeNode } from '../../../../domain/repositories/IFolderRepository';
import { FolderMapper, RawFolderDbRecord } from '../mappers/FolderMapper';
import { AssetMapper, RawAssetDbRecord } from '../mappers/AssetMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Folder Tree Service
 * Follows Single Responsibility Principle - handles folder tree operations
 */
export class FolderTreeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Build folder tree recursively
   */
  async buildFolderTree(organizationId: string, parentFolderId?: string | null): Promise<FolderTreeNode[]> {
    const rootFolders = await this.getFoldersByParent(parentFolderId === undefined ? null : parentFolderId, organizationId);
    return this.buildTreeRecursively(rootFolders, organizationId);
  }

  /**
   * Get folders by parent ID
   */
  private async getFoldersByParent(parentId: string | null, organizationId: string): Promise<Folder[]> {
    let query = this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)')
      .eq('organization_id', organizationId);

    if (parentId === null) {
      query = query.is('parent_folder_id', null);
    } else {
      query = query.eq('parent_folder_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching folders for parent ${parentId}:`, error.message);
      throw new DatabaseError(`Could not fetch folders for parent ${parentId}.`, error.message);
    }
    
    return (data || []).map(raw => FolderMapper.toDomain(raw as RawFolderDbRecord));
  }

  /**
   * Build tree structure recursively
   */
  private async buildTreeRecursively(folders: Folder[], organizationId: string): Promise<FolderTreeNode[]> {
    const treeNodes: FolderTreeNode[] = [];
    
    for (const folder of folders) {
      const children = await this.getFoldersByParent(folder.id, organizationId);
      const childTreeNodes = await this.buildTreeRecursively(children, organizationId);
      
      // Create a new FolderTreeNode by extending the existing Folder with children
      const treeNode: FolderTreeNode = Object.assign(
        Object.create(Object.getPrototypeOf(folder)), // Preserve the Folder class prototype
        folder, // Copy all properties
        { children: childTreeNodes } // Add children property
      );
      
      treeNodes.push(treeNode);
    }
    
    return treeNodes;
  }

  /**
   * Get folder children (both folders and assets)
   */
  async getFolderChildren(folderId: string, organizationId: string): Promise<(Folder | Asset)[]> {
    // Get child folders
    const childFolders = await this.getFoldersByParent(folderId, organizationId);

    // Get child assets
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
      AssetMapper.toDomain(raw as RawAssetDbRecord)
    );

    return [...childFolders, ...childAssets];
  }

  /**
   * Get folder path as string
   */
  async getFolderPathString(folderId: string): Promise<string> {
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

  /**
   * Get folder path as array of Folder entities
   */
  async getFolderPathArray(folderId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase.rpc('get_folder_path', {
      p_folder_id: folderId
    });

    if (error) {
      console.error('Error fetching folder path:', error.message);
      throw new DatabaseError('Failed to fetch folder path.');
    }
    
    if (!data) {
      return [];
    }
    
    // The RPC must return data that matches RawFolderDbRecord structure for FolderMapper.toDomain
    return (data as RawFolderDbRecord[]).map(FolderMapper.toDomain);
  }
} 

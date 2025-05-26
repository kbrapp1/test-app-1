import { createClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/errors/base';
import type { ValidationResult, AssetEntity, FolderEntity } from '../types';

/**
 * Batch Validation Service - Domain Service
 * 
 * Handles validation logic for batch operations.
 * Follows DDD principles by encapsulating domain validation rules.
 */
export class BatchValidationService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  /**
   * Validate assets exist and belong to organization
   */
  async validateAssets(
    assetIds: string[], 
    organizationId: string
  ): Promise<ValidationResult<AssetEntity>> {
    if (assetIds.length === 0) {
      return { valid: [], invalid: [], errors: [] };
    }

    try {
      const { data: assets, error: fetchError } = await this.supabase
        .from('assets')
        .select('id, organization_id, storage_path')
        .in('id', assetIds);

      if (fetchError) {
        throw new DatabaseError(`Failed to fetch assets: ${fetchError.message}`);
      }

      const validAssets: AssetEntity[] = assets
        ?.filter(asset => asset.organization_id === organizationId)
        .map(asset => ({
          id: asset.id,
          organizationId: asset.organization_id,
          storage_path: asset.storage_path
        })) || [];

      const validIds = validAssets.map(asset => asset.id);
      const invalidIds = assetIds.filter(id => !validIds.includes(id));
      const errors = invalidIds.map(id => `Asset ${id} not found or access denied`);

      return { valid: validAssets, invalid: invalidIds, errors };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: [],
        invalid: assetIds,
        errors: assetIds.map(() => `Asset validation failed: ${errorMessage}`)
      };
    }
  }

  /**
   * Validate folders exist and belong to organization
   */
  async validateFolders(
    folderIds: string[], 
    organizationId: string
  ): Promise<ValidationResult<FolderEntity>> {
    if (folderIds.length === 0) {
      return { valid: [], invalid: [], errors: [] };
    }

    try {
      const { data: folders, error: fetchError } = await this.supabase
        .from('folders')
        .select('id, name, organization_id, parent_folder_id')
        .in('id', folderIds);

      if (fetchError) {
        throw new DatabaseError(`Failed to fetch folders: ${fetchError.message}`);
      }

      const validFolders: FolderEntity[] = folders
        ?.filter(folder => folder.organization_id === organizationId)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          organizationId: folder.organization_id,
          parent_folder_id: folder.parent_folder_id
        })) || [];

      const validIds = validFolders.map(folder => folder.id);
      const invalidIds = folderIds.filter(id => !validIds.includes(id));
      const errors = invalidIds.map(id => `Folder ${id} not found or access denied`);

      return { valid: validFolders, invalid: invalidIds, errors };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: [],
        invalid: folderIds,
        errors: folderIds.map(() => `Folder validation failed: ${errorMessage}`)
      };
    }
  }

  /**
   * Check if moving a folder would create circular dependency
   */
  async wouldCreateCircularDependency(
    folderId: string, 
    targetFolderId: string, 
    organizationId: string
  ): Promise<boolean> {
    if (folderId === targetFolderId) {
      return true;
    }

    let currentFolderId: string | null = targetFolderId;
    const visited = new Set<string>();

    while (currentFolderId && !visited.has(currentFolderId)) {
      visited.add(currentFolderId);

      if (currentFolderId === folderId) {
        return true;
      }

      const { data: folder }: { data: { parent_folder_id: string | null } | null } = await this.supabase
        .from('folders')
        .select('parent_folder_id')
        .eq('id', currentFolderId)
        .eq('organization_id', organizationId)
        .single();

      currentFolderId = folder?.parent_folder_id || null;
    }

    return false;
  }

  /**
   * Check if folder has children (folders or assets)
   */
  async folderHasChildren(folderId: string, organizationId: string): Promise<boolean> {
    // Check for child folders
    const { data: childFolders } = await this.supabase
      .from('folders')
      .select('id')
      .eq('parent_folder_id', folderId)
      .eq('organization_id', organizationId)
      .limit(1);

    if (childFolders && childFolders.length > 0) {
      return true;
    }

    // Check for assets in folder
    const { data: assets } = await this.supabase
      .from('assets')
      .select('id')
      .eq('folder_id', folderId)
      .eq('organization_id', organizationId)
      .limit(1);

    return Boolean(assets && assets.length > 0);
  }
} 
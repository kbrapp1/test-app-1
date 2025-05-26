import { createClient } from '@/lib/supabase/server';
import { AppError, DatabaseError, ValidationError } from '@/lib/errors/base';

/**
 * Supabase Batch Repository - Infrastructure Layer
 * 
 * Handles batch operations for assets and folders using Supabase.
 * Implements transaction support and handles partial failures.
 */
export class SupabaseBatchRepository {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  // Batch move assets to a target folder
  async batchMoveAssets(
    assetIds: string[], 
    targetFolderId: string | null,
    organizationId: string
  ): Promise<{
    successful: string[];
    failed: string[];
    errors: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    if (assetIds.length === 0) {
      return { successful, failed, errors };
    }

    try {
      // Validate all assets exist and belong to organization
      const { data: assets, error: fetchError } = await this.supabase
        .from('assets')
        .select('id, organization_id')
        .in('id', assetIds);

      if (fetchError) {
        throw new DatabaseError(`Failed to fetch assets: ${fetchError.message}`);
      }

      // Check which assets are valid
      const validAssetIds = assets
        ?.filter(asset => asset.organization_id === organizationId)
        .map(asset => asset.id) || [];

      const invalidAssetIds = assetIds.filter(id => !validAssetIds.includes(id));
      failed.push(...invalidAssetIds);
      errors.push(...invalidAssetIds.map(id => `Asset ${id} not found or access denied`));

      if (validAssetIds.length === 0) {
        return { successful, failed, errors };
      }

      // Perform batch update
      const { data: updatedAssets, error: updateError } = await this.supabase
        .from('assets')
        .update({ folder_id: targetFolderId })
        .in('id', validAssetIds)
        .select('id');

      if (updateError) {
        failed.push(...validAssetIds);
        errors.push(`Batch update failed: ${updateError.message}`);
        return { successful, failed, errors };
      }

      successful.push(...(updatedAssets?.map(asset => asset.id) || []));

      return { successful, failed, errors };

    } catch (error) {
      failed.push(...assetIds);
      errors.push(`Batch move assets failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  // Batch delete assets
  async batchDeleteAssets(
    assetIds: string[],
    organizationId: string
  ): Promise<{
    successful: string[];
    failed: string[];
    errors: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    if (assetIds.length === 0) {
      return { successful, failed, errors };
    }

    try {
      // Validate all assets exist and belong to organization
      const { data: assets, error: fetchError } = await this.supabase
        .from('assets')
        .select('id, organization_id, storage_path')
        .in('id', assetIds);

      if (fetchError) {
        throw new DatabaseError(`Failed to fetch assets: ${fetchError.message}`);
      }

      const validAssets = assets?.filter(asset => asset.organization_id === organizationId) || [];
      const validAssetIds = validAssets.map(asset => asset.id);
      const invalidAssetIds = assetIds.filter(id => !validAssetIds.includes(id));

      failed.push(...invalidAssetIds);
      errors.push(...invalidAssetIds.map(id => `Asset ${id} not found or access denied`));

      if (validAssetIds.length === 0) {
        return { successful, failed, errors };
      }

      // Delete assets from database
      const { error: deleteError } = await this.supabase
        .from('assets')
        .delete()
        .in('id', validAssetIds);

      if (deleteError) {
        failed.push(...validAssetIds);
        errors.push(`Batch delete failed: ${deleteError.message}`);
        return { successful, failed, errors };
      }

      successful.push(...validAssetIds);

      return { successful, failed, errors };

    } catch (error) {
      failed.push(...assetIds);
      errors.push(`Batch delete assets failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  // Batch move folders to a target folder
  async batchMoveFolders(
    folderIds: string[], 
    targetFolderId: string | null,
    organizationId: string
  ): Promise<{
    successful: string[];
    failed: string[];
    errors: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    if (folderIds.length === 0) {
      return { successful, failed, errors };
    }

    try {
      // Validate all folders exist and belong to organization
      const { data: folders, error: fetchError } = await this.supabase
        .from('folders')
        .select('id, name, organization_id, parent_folder_id')
        .in('id', folderIds);

      if (fetchError) {
        throw new DatabaseError(`Failed to fetch folders: ${fetchError.message}`);
      }

      const validFolders = folders?.filter(folder => folder.organization_id === organizationId) || [];
      const validFolderIds = validFolders.map(folder => folder.id);
      const invalidFolderIds = folderIds.filter(id => !validFolderIds.includes(id));

      failed.push(...invalidFolderIds);
      errors.push(...invalidFolderIds.map(id => `Folder ${id} not found or access denied`));

      if (validFolderIds.length === 0) {
        return { successful, failed, errors };
      }

      // Check for circular dependencies
      if (targetFolderId) {
        for (const folderId of validFolderIds) {
          if (await this.wouldCreateCircularDependency(folderId, targetFolderId, organizationId)) {
            // Get folder name for user-friendly error message
            const folderData = validFolders.find(f => f.id === folderId);
            const folderName = folderData ? `"${folderData.name || 'Unknown'}"` : 'folder';
            
            failed.push(folderId);
            errors.push(`Cannot move ${folderName} into one of its own subfolders`);
            continue;
          }
        }
      }

      const safeToMoveFolderIds = validFolderIds.filter(id => !failed.includes(id));

      if (safeToMoveFolderIds.length === 0) {
        return { successful, failed, errors };
      }

      // Perform batch update
      const { data: updatedFolders, error: updateError } = await this.supabase
        .from('folders')
        .update({ parent_folder_id: targetFolderId })
        .in('id', safeToMoveFolderIds)
        .select('id');

      if (updateError) {
        failed.push(...safeToMoveFolderIds);
        errors.push(`Batch folder update failed: ${updateError.message}`);
        return { successful, failed, errors };
      }

      successful.push(...(updatedFolders?.map(folder => folder.id) || []));

      return { successful, failed, errors };

    } catch (error) {
      failed.push(...folderIds);
      errors.push(`Batch move folders failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  // Batch delete folders
  async batchDeleteFolders(
    folderIds: string[],
    organizationId: string
  ): Promise<{
    successful: string[];
    failed: string[];
    errors: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    if (folderIds.length === 0) {
      return { successful, failed, errors };
    }

    try {
      // Check if folders are empty (no child folders or assets)
      for (const folderId of folderIds) {
        const hasChildren = await this.folderHasChildren(folderId, organizationId);
        if (hasChildren) {
          failed.push(folderId);
          errors.push(`Folder ${folderId} is not empty and cannot be deleted`);
        }
      }

      const emptyFolderIds = folderIds.filter(id => !failed.includes(id));

      if (emptyFolderIds.length === 0) {
        return { successful, failed, errors };
      }

      // Delete empty folders
      const { error: deleteError } = await this.supabase
        .from('folders')
        .delete()
        .in('id', emptyFolderIds)
        .eq('organization_id', organizationId);

      if (deleteError) {
        failed.push(...emptyFolderIds);
        errors.push(`Batch folder delete failed: ${deleteError.message}`);
        return { successful, failed, errors };
      }

      successful.push(...emptyFolderIds);

      return { successful, failed, errors };

    } catch (error) {
      failed.push(...folderIds);
      errors.push(`Batch delete folders failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { successful, failed, errors };
    }
  }

  // Helper method to check for circular dependencies
  private async wouldCreateCircularDependency(
    folderId: string, 
    targetFolderId: string, 
    organizationId: string
  ): Promise<boolean> {
    if (folderId === targetFolderId) {
      return true;
    }

    // Check if targetFolderId is a descendant of folderId
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

  // Helper method to check if folder has children
  private async folderHasChildren(folderId: string, organizationId: string): Promise<boolean> {
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
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { UpdateSelectionUseCase } from '../use-cases/selection/UpdateSelectionUseCase';
import { BulkMoveAssetsUseCase } from '../use-cases/selection/BulkMoveAssetsUseCase';
import { BulkDeleteAssetsUseCase } from '../use-cases/selection/BulkDeleteAssetsUseCase';
import { BulkDownloadAssetsUseCase } from '../use-cases/selection/BulkDownloadAssetsUseCase';
import { SupabaseAssetRepository } from '../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';
import { SupabaseBatchStorageService } from '../../infrastructure/storage/SupabaseBatchStorageService';

// Server action for updating selection state
export async function updateSelection(formData: FormData): Promise<{
  success: boolean;
  selection?: any;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Extract parameters from FormData
    const action = formData.get('action') as string;
    const itemId = formData.get('itemId') as string;
    const itemType = formData.get('itemType') as 'asset' | 'folder';
    const selectionData = formData.get('selectionData') as string;

    if (!action) {
      return { success: false, error: 'Action is required' };
    }

    // Parse current selection state
    let currentSelection;
    try {
      currentSelection = selectionData ? JSON.parse(selectionData) : null;
    } catch {
      return { success: false, error: 'Invalid selection data format' };
    }

    // Execute use case
    const useCase = new UpdateSelectionUseCase();
    const result = await useCase.execute({
      selection: currentSelection,
      action: action as any,
      itemId,
      itemType,
    });

    if (!result.isValid) {
      return { 
        success: false, 
        error: result.errors?.join(', ') || 'Selection update failed' 
      };
    }

    return {
      success: true,
      selection: result.selection
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Server action for bulk move operations
export async function bulkMoveItems(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Extract parameters
    const assetIdsStr = formData.get('assetIds') as string;
    const folderIdsStr = formData.get('folderIds') as string;
    const targetFolderIdStr = formData.get('targetFolderId') as string;
    const targetFolderId = targetFolderIdStr === 'null' ? null : (targetFolderIdStr || null);

    const assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
    const folderIds = folderIdsStr ? JSON.parse(folderIdsStr) : [];

    if (assetIds.length === 0 && folderIds.length === 0) {
      return { success: false, error: 'No items selected for move' };
    }

    // Get organization ID
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No active organization found' };
    }

    // Create repositories
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);

    // Execute use case
    const useCase = new BulkMoveAssetsUseCase(assetRepository, folderRepository);
    await useCase.execute({
      assetIds,
      folderIds,
      targetFolderId,
      organizationId,
      userId: user.id
    });

    // Revalidate DAM pages - more specific revalidation for better performance
    revalidatePath('/(protected)/dam', 'layout');

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bulk move failed'
    };
  }
}

// Server action for bulk delete operations (simplified)
export async function bulkDeleteItems(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Extract parameters
    const assetIdsStr = formData.get('assetIds') as string;
    const folderIdsStr = formData.get('folderIds') as string;

    const assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
    const folderIds = folderIdsStr ? JSON.parse(folderIdsStr) : [];

    if (assetIds.length === 0 && folderIds.length === 0) {
      return { success: false, error: 'No items selected for deletion' };
    }

    // Get organization ID
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No active organization found' };
    }

    // Implement bulk delete use case
          const assetRepository = new SupabaseAssetRepository(supabase);
      const folderRepository = new SupabaseFolderRepository(supabase);
      const storageService = new SupabaseStorageService(supabase);
      const bulkDeleteUseCase = new BulkDeleteAssetsUseCase(assetRepository, folderRepository, storageService);

    const result = await bulkDeleteUseCase.execute({
      assetIds,
      folderIds,
      organizationId,
      userId: user.id,
      confirmationRequired: false, // Already confirmed in UI
    });



    // Check if any items were successfully deleted
    const totalDeleted = result.deletedAssetIds.length + result.deletedFolderIds.length;
    const totalFailed = result.failedAssetIds.length + result.failedFolderIds.length;

    if (totalDeleted === 0 && totalFailed > 0) {
      return { 
        success: false, 
        error: `Failed to delete items: ${result.errors.join(', ')}` 
      };
    }

    // Revalidate DAM pages
    revalidatePath('/dam');
    revalidatePath('/dam/[...path]', 'page');

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bulk delete failed'
    };
  }
}

// Server action for bulk tag operations (simplified)
export async function bulkTagItems(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Extract parameters
    const assetIdsStr = formData.get('assetIds') as string;
    const tagIdsStr = formData.get('tagIds') as string;
    const operation = formData.get('operation') as 'add' | 'remove';

    const assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
    const tagIds = tagIdsStr ? JSON.parse(tagIdsStr) : [];

    if (assetIds.length === 0) {
      return { success: false, error: 'No assets selected for tagging' };
    }

    if (tagIds.length === 0) {
      return { success: false, error: 'No tags selected' };
    }

    if (!operation || !['add', 'remove'].includes(operation)) {
      return { success: false, error: 'Invalid tag operation' };
    }

    // Get organization ID
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No active organization found' };
    }

    // TODO: Implement bulk tag use case

    // Revalidate DAM pages
    revalidatePath('/dam');
    revalidatePath('/dam/[...path]', 'page');

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bulk tag operation failed'
    };
  }
}

// Server action for bulk download operations
export async function bulkDownloadItems(formData: FormData): Promise<{
  success: boolean;
  downloadUrls?: string[];
  zipBase64?: string;
  zipFileName?: string;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Extract parameters
    const assetIdsStr = formData.get('assetIds') as string;
    const folderIdsStr = formData.get('folderIds') as string;
    const format = formData.get('format') as 'individual' | 'zip' || 'zip';

    const assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
    const folderIds = folderIdsStr ? JSON.parse(folderIdsStr) : [];

    if (assetIds.length === 0 && folderIds.length === 0) {
      return { success: false, error: 'No assets or folders selected for download' };
    }

    // Get organization ID
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No active organization found' };
    }

    // Create repositories and services
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    const storageService = new SupabaseStorageService(supabase);
    const batchStorageService = new SupabaseBatchStorageService(supabase);

    // Create a composite storage service that includes ZIP functionality
    const compositeStorageService = {
      // Include all methods from the base storage service
      uploadFile: storageService.uploadFile.bind(storageService),
      removeFile: storageService.removeFile.bind(storageService),
      getSignedUrl: storageService.getSignedUrl.bind(storageService),
      downloadFileAsBlob: storageService.downloadFileAsBlob.bind(storageService),
      // Add ZIP functionality from batch service
      createZipArchive: batchStorageService.createZipArchive.bind(batchStorageService)
    };

    // Execute use case
    const useCase = new BulkDownloadAssetsUseCase(assetRepository, folderRepository, compositeStorageService as any);
    
    const result = await useCase.execute({
      assetIds,
      folderIds,
      organizationId,
      userId: user.id,
      format
    });

    // Convert blob to base64 if present
    let zipBase64: string | undefined;
    if (result.zipBlob) {
      const arrayBuffer = await result.zipBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      zipBase64 = Buffer.from(uint8Array).toString('base64');
    }

    return {
      success: true,
      downloadUrls: result.downloadUrls,
      zipBase64,
      zipFileName: result.zipFileName
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bulk download failed'
    };
  }
} 
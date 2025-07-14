'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { MoveAssetUseCase } from '../../../application/use-cases/assets/MoveAssetUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { Asset as DomainAsset } from '../../../domain/entities/Asset';
import type { SortByValue, SortOrderValue } from '../search/useDamFilters';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

export interface UseDamPageHandlersParams {
  updateUrlParams: (params: any) => void;
  handleGalleryRefresh: () => void;
  closeMoveDialog: () => void;
}

export interface UseDamPageHandlersReturn {
  // Action handlers
  handleSortChange: (newSortBy: SortByValue | undefined, newSortOrder: SortOrderValue | undefined) => void;
  handleMoveAssetConfirm: (selectedFolderId: string | null, moveAsset: DomainAsset) => Promise<void>;
}

/**
 * useDamPageHandlers - Domain Hook for DAM Page Business Logic
 * 
 * Handles complex business operations:
 * - Sort parameter management
 * - Asset move operations using DDD use cases
 * - Error handling and user feedback
 * 
 * NOTE: Organization members are now handled by shared organization context
 * to avoid duplicate API calls and improve performance.
 */
export function useDamPageHandlers({
  updateUrlParams,
  handleGalleryRefresh,
  closeMoveDialog,
}: UseDamPageHandlersParams): UseDamPageHandlersReturn {
  
  // Get organization context to avoid duplicate RPC calls
  const { activeOrganizationId } = useOrganization();
  
  // Sort change handler
  const handleSortChange = useCallback((
    newSortBy: SortByValue | undefined, 
    newSortOrder: SortOrderValue | undefined
  ) => {
    // Update both parameters together using updateUrlParams directly to avoid race conditions
    if (newSortBy && newSortOrder) {
      // Both are provided, set them together
      updateUrlParams({ sortBy: newSortBy, sortOrder: newSortOrder });
    } else if (newSortBy) {
      // Only sortBy provided, use default order
      updateUrlParams({ sortBy: newSortBy, sortOrder: 'asc' });
    } else {
      // Clear sorting
      updateUrlParams({ sortBy: undefined, sortOrder: undefined });
    }
  }, [updateUrlParams]);

  // Asset move handler using DDD use case
  const handleMoveAssetConfirm = useCallback(async (
    selectedFolderId: string | null, 
    moveAsset: DomainAsset
  ) => {
    if (!moveAsset || !moveAsset.id) {
      toast.error('Error moving asset', { description: 'Asset data is missing.' });
      closeMoveDialog();
      return;
    }

    if (!activeOrganizationId) {
      toast.error('Error moving asset', { description: 'No active organization found.' });
      closeMoveDialog();
      return;
    }

    try {
      // Get auth context for DDD use case
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use organization context from provider (eliminates get_active_organization_id RPC call)
      const assetRepository = new SupabaseAssetRepository(supabase);
      const folderRepository = new SupabaseFolderRepository(supabase);
      const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);

      // Use organization ID from context instead of RPC call
      await moveUseCase.execute({
        assetId: moveAsset.id,
        targetFolderId: selectedFolderId,
        organizationId: activeOrganizationId,
      });

      toast.success('Asset moved', {
        description: `"${moveAsset.name}" has been moved successfully.`,
      });
      handleGalleryRefresh(); // Refresh the gallery to show the asset in its new location
    } catch (error) {
      toast.error('Error moving asset', { 
        description: (error as Error).message || 'An unexpected server error occurred.' 
      });
    } finally {
      closeMoveDialog();
    }
  }, [activeOrganizationId, handleGalleryRefresh, closeMoveDialog]);

  return {
    // Action handlers
    handleSortChange,
    handleMoveAssetConfirm,
  };
} 

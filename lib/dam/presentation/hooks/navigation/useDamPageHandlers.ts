'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';
import { createClient } from '@/lib/supabase/client';
import { MoveAssetUseCase } from '../../../application/use-cases/assets/MoveAssetUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import type { SortByValue, SortOrderValue } from '../search/useDamFilters';
import type { Asset as DomainAsset } from '../../../domain/entities/Asset';

export interface UseDamPageHandlersParams {
  updateUrlParams: (params: { 
    sortBy?: SortByValue | undefined; 
    sortOrder?: SortOrderValue | undefined; 
  }) => void;
  handleGalleryRefresh: () => void;
  closeMoveDialog: () => void;
}

export interface UseDamPageHandlersReturn {
  // Organization members
  organizationMembers: Array<{id: string, name: string}>;
  
  // Action handlers
  handleSortChange: (newSortBy: SortByValue | undefined, newSortOrder: SortOrderValue | undefined) => void;
  handleMoveAssetConfirm: (selectedFolderId: string | null, moveAsset: DomainAsset) => Promise<void>;
}

/**
 * useDamPageHandlers - Domain Hook for DAM Page Business Logic
 * 
 * Handles complex business operations:
 * - Organization members fetching
 * - Sort parameter management
 * - Asset move operations using DDD use cases
 * - Error handling and user feedback
 */
export function useDamPageHandlers({
  updateUrlParams,
  handleGalleryRefresh,
  closeMoveDialog,
}: UseDamPageHandlersParams): UseDamPageHandlersReturn {
  
  // Organization members state
  const [organizationMembers, setOrganizationMembers] = useState<Array<{id: string, name: string}>>([]);

  // Fetch organization members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/team/members');
        if (!response.ok) {
          console.error('Failed to fetch organization members', response.statusText);
          setOrganizationMembers([]);
          return;
        }
        const data = await response.json();
        setOrganizationMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching organization members:', error);
        setOrganizationMembers([]);
      }
    };
    fetchMembers();
  }, []);

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

    try {
      // Get auth context for DDD use case
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session found');
      }

      const decodedToken = jwtDecode<any>(session.access_token);
      const activeOrgId = decodedToken.custom_claims?.active_organization_id;
      
      if (!activeOrgId) {
        throw new Error('No active organization found');
      }

      // Use DDD pattern
      const assetRepository = new SupabaseAssetRepository(supabase);
      const folderRepository = new SupabaseFolderRepository(supabase);
      const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);

      await moveUseCase.execute({
        assetId: moveAsset.id,
        targetFolderId: selectedFolderId,
        organizationId: activeOrgId,
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
  }, [handleGalleryRefresh, closeMoveDialog]);

  return {
    // Organization members
    organizationMembers,
    
    // Action handlers
    handleSortChange,
    handleMoveAssetConfirm,
  };
} 

import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useCallback } from 'react';
import { MoveAssetUseCase } from '../../../application/use-cases/assets/MoveAssetUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { createClient } from '@/lib/supabase/client';
import { jwtDecode } from 'jwt-decode';
import type { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import type { useToast } from '@/components/ui/use-toast'; // Import type

interface UseAssetDragAndDropProps {
  setAllItems: React.Dispatch<React.SetStateAction<GalleryItemDto[]>>;
  setOptimisticallyHiddenItemId: React.Dispatch<React.SetStateAction<string | null>>;
  toast: ReturnType<typeof useToast>['toast']; // Correctly type toast
  // folderTreeChangeVersion and triggerFolderTreeRefresh might be needed if we update folder tree store here
}

/**
 * Domain presentation hook for managing asset drag and drop functionality
 * 
 * Handles:
 * - Drag and drop sensor configuration
 * - Asset movement between folders using DDD use cases
 * - Optimistic UI updates
 * - Error handling and user feedback
 */
export function useAssetDragAndDrop({
  setAllItems,
  setOptimisticallyHiddenItemId,
  toast,
}: UseAssetDragAndDropProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // DDD helper function for authentication
  const getAuthContext = useCallback(async () => {
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

    return { supabase, user, activeOrgId };
  }, []);

  const moveAssetUseCase = useCallback(async (assetId: string, targetFolderId: string | null) => {
    const { supabase, activeOrgId } = await getAuthContext();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);
    
    await moveUseCase.execute({
      assetId,
      targetFolderId,
      organizationId: activeOrgId,
    });
    
    return { success: true };
  }, [getAuthContext]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const isActiveAsset = active.data.current?.type === 'asset';
    const isOverFolder = over.data.current?.type === 'folder' && over.data.current?.accepts?.includes('asset');

    if (isActiveAsset && isOverFolder) {
      const assetId = active.id as string;
      const targetFolderId = over.id as string;
      
      const draggedAsset = active.data.current?.item as GalleryItemDto | undefined;
      if (!draggedAsset) return;

      // Note: We could add a check here if needed, but for now we'll allow the move
      // The backend will handle validation of the move operation

      setOptimisticallyHiddenItemId(assetId);

      try {
        await moveAssetUseCase(assetId, targetFolderId);
        toast({ title: 'Asset moved successfully!' });
        // Optimistic update: remove from current list. The main data fetch will handle the rest.
        setAllItems(prevItems => prevItems.filter(item => item.id !== assetId));
        // Potentially trigger folder tree refresh if needed
        // triggerFolderTreeRefresh(); 
      } catch (error) {
        console.error("Move asset error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({ title: 'Error moving asset', description: errorMessage, variant: 'destructive' });
        setOptimisticallyHiddenItemId(null); // Revert optimistic update
      }
    }
  };

  return { sensors, handleDragEnd };
} 

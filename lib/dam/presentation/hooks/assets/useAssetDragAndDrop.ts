import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
// import { useCallback } from 'react';
import { useAssetMove } from '@/lib/dam/hooks/useAssets';
import type { GalleryItemDto } from '../../../domain/value-objects/GalleryItem';
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

  // Use React Query mutation for move operation
  const moveAssetMutation = useAssetMove();

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
        await moveAssetMutation.mutateAsync({ assetId, targetFolderId });
        toast({ title: 'Asset moved successfully!' });
        // Optimistic update: remove from current list. React Query will handle cache invalidation.
        setAllItems(prevItems => prevItems.filter(item => item.id !== assetId));
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

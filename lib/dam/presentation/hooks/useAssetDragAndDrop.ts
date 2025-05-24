import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { moveAsset } from '@/lib/actions/dam/asset-crud.actions';
import type { ComponentAsset as Asset, CombinedItem } from '../../types/component';
import type { useToast } from '@/components/ui/use-toast'; // Import type

interface UseAssetDragAndDropProps {
  setAllItems: React.Dispatch<React.SetStateAction<CombinedItem[]>>;
  setOptimisticallyHiddenItemId: React.Dispatch<React.SetStateAction<string | null>>;
  toast: ReturnType<typeof useToast>['toast']; // Correctly type toast
  // folderTreeChangeVersion and triggerFolderTreeRefresh might be needed if we update folder tree store here
}

/**
 * Domain presentation hook for managing asset drag and drop functionality
 * 
 * Handles:
 * - Drag and drop sensor configuration
 * - Asset movement between folders
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const isActiveAsset = active.data.current?.type === 'asset';
    const isOverFolder = over.data.current?.type === 'folder' && over.data.current?.accepts?.includes('asset');

    if (isActiveAsset && isOverFolder) {
      const assetId = active.id as string;
      const targetFolderId = over.id as string;
      
      const draggedAsset = active.data.current?.item as Asset | undefined;
      if (!draggedAsset) return;

      if (draggedAsset.folder_id === targetFolderId) {
        toast({ title: 'No Change', description: 'Asset is already in the target folder.', variant: 'default' });
        return;
      }

      setOptimisticallyHiddenItemId(assetId);

      try {
        const result = await moveAsset(assetId, targetFolderId);
        if (result.success) {
          toast({ title: 'Asset moved successfully!' });
          // Optimistic update: remove from current list. The main data fetch will handle the rest.
          setAllItems(prevItems => prevItems.filter(item => item.id !== assetId));
          // Potentially trigger folder tree refresh if needed
          // triggerFolderTreeRefresh(); 
        } else {
          toast({ title: 'Error moving asset', description: result.error, variant: 'destructive' });
          setOptimisticallyHiddenItemId(null); // Revert optimistic update
        }
      } catch (error) {
        console.error("Move asset error:", error);
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        setOptimisticallyHiddenItemId(null); // Revert optimistic update
      }
    }
  };

  return { sensors, handleDragEnd };
} 
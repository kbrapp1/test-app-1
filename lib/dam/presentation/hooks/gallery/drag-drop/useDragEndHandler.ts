/**
 * Application Service: Drag End Handler
 * 
 * Single Responsibility: Orchestrates drag end operations
 * Coordinates between domain services and UI operations
 */

import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';

import { DragOperationFactory } from './services/DragOperationFactory';
// import { DragValidationService } from './services/DragValidationService';
// import { SelectionStateService } from './services/SelectionStateService';
import { MoveOperationsService } from './operations/MoveOperationsService';
import type { DragEndResult, UseDamDragAndDropProps } from './types';
import { useFolderStore } from '@/lib/store/folderStore';
import { useBulkMove } from '@/lib/dam/hooks/useAssets';

export function useDragEndHandler({
  onItemsUpdate,
  onToast,
  onRefreshData
}: UseDamDragAndDropProps) {
  const { moveFolder } = useFolderStore();
  const bulkMoveMutation = useBulkMove();
  
  const handleDragEnd = useCallback(async (
    event: DragEndEvent, 
    selectionState?: { selectedAssets: string[], selectedFolders: string[] }, 
    activeItemData?: GalleryItemDto
  ): Promise<DragEndResult> => {
    
    // 1. Create domain operation
    const operation = DragOperationFactory.createFromEvent(event, activeItemData);
    
    if (!operation) {
      // No valid operation created
      return { success: false, error: 'Invalid drag operation' };
    }

    // 2. Handle bulk move operations using React Query mutation
    if (selectionState && (selectionState.selectedAssets.length > 0 || selectionState.selectedFolders.length > 0)) {
      try {
        // Optimistically update folder positions in store for immediate UI feedback
        if (selectionState.selectedFolders.length > 0) {
          selectionState.selectedFolders.forEach(folderId => {
            moveFolder(folderId, operation.targetId);
          });
        }

        await bulkMoveMutation.mutateAsync({
          assetIds: selectionState.selectedAssets,
          folderIds: selectionState.selectedFolders,
          targetFolderId: operation.targetId
        });

        const totalItems = selectionState.selectedAssets.length + selectionState.selectedFolders.length;
        onToast({ 
          title: `${totalItems} items moved successfully!`,
          description: `Moved ${totalItems} item${totalItems > 1 ? 's' : ''} to ${operation.targetId ? 'folder' : 'root'}.`
        });
        
        // Dispatch folder update event if folders were moved
        if (selectionState.selectedFolders.length > 0) {
          window.dispatchEvent(new CustomEvent('folderUpdated', {
            detail: { type: 'move', folderIds: selectionState.selectedFolders }
          }));
        }
        
        // Exit selection mode after successful bulk move
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('damExitSelectionMode'));
        }, 300);
        
        // Refresh data for consistency
        if (onRefreshData) {
          await onRefreshData();
        }
        
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        
        // Revert optimistic folder moves if the operation failed
        if (selectionState.selectedFolders.length > 0) {
          // Refresh data to revert folder positions
          if (onRefreshData) {
            await onRefreshData();
          }
        }
        
        onToast({ 
          title: 'Error moving items', 
          description: errorMessage, 
          variant: 'destructive' 
        });
        
        return { success: false, error: errorMessage };
      }
    }

    // 3. Early validation for circular dependency (folder moves)
    if (operation.itemType === 'folder' && operation.targetId === operation.itemId) {
      onToast({ 
        title: 'Cannot move folder', 
        description: 'A folder cannot be moved into itself.', 
        variant: 'destructive' 
      });
      return { success: false, error: 'Circular dependency detected' };
    }

    // 4. Exit selection mode for single item operations
    window.dispatchEvent(new CustomEvent('damExitSelectionMode'));

    try {
      // 5. Execute domain operation for single item
      if (operation.itemType === 'asset') {
        await MoveOperationsService.executeAssetMove(operation);
        onToast({ title: 'Asset moved successfully!' });
      } else {
        // Update store immediately for folder moves
        moveFolder(operation.itemId, operation.targetId);
        
        await MoveOperationsService.executeFolderMove(operation);
        onToast({ title: 'Folder moved successfully!' });
        
        // Dispatch folder update event for gallery refresh
        window.dispatchEvent(new CustomEvent('folderUpdated', {
          detail: { type: 'move', folderId: operation.itemId }
        }));
      }

      // 6. Refresh data for consistency (but store should already be updated)
      if (onRefreshData) {
        await onRefreshData();
      }
      
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      
      // Revert optimistic folder move if it failed
      if (operation.itemType === 'folder') {
        // Note: We don't have access to the original parent folder ID in GalleryItemDto
        // The refresh will restore the correct state
      }
      
      onToast({ 
        title: `Error moving ${operation.itemType}`, 
        description: errorMessage, 
        variant: 'destructive' 
      });

      // Revert optimistic update by refreshing
      if (onRefreshData) {
        await onRefreshData();
      }
      
      return { success: false, error: errorMessage };
    }
  }, [onItemsUpdate, onToast, onRefreshData, moveFolder, bulkMoveMutation]);

  return { handleDragEnd };
} 
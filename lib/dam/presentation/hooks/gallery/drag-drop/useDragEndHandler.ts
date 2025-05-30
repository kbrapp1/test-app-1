/**
 * Application Service: Drag End Handler
 * 
 * Single Responsibility: Orchestrates drag end operations
 * Coordinates between domain services and UI operations
 */

import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';

import { DragOperationFactory } from './services/DragOperationFactory';
import { DragValidationService } from './services/DragValidationService';
import { SelectionStateService } from './services/SelectionStateService';
import { BulkMoveOperationsService } from './operations/BulkMoveOperationsService';
import { MoveOperationsService } from './operations/MoveOperationsService';
import type { DragEndParams, DragEndResult, UseDamDragAndDropProps } from './types';
import { useFolderStore } from '@/lib/store/folderStore';

export function useDragEndHandler({
  onItemsUpdate,
  onToast,
  onRefreshData
}: UseDamDragAndDropProps) {
  const { moveFolder } = useFolderStore();
  
  const handleDragEnd = useCallback(async (
    event: DragEndEvent, 
    selectionState?: { selectedAssets: string[], selectedFolders: string[] }, 
    activeItemData?: any
  ): Promise<DragEndResult> => {
    
    // 1. Create domain operation
    const operation = DragOperationFactory.createFromEvent(event, activeItemData);
    
    if (!operation) {
      // No valid operation created
      return { success: false, error: 'Invalid drag operation' };
    }

    // 2. Handle bulk move operations
    if (selectionState && (selectionState.selectedAssets.length > 0 || selectionState.selectedFolders.length > 0)) {
      return await BulkMoveOperationsService.executeBulkMove(
        operation,
        { selectedAssets: selectionState.selectedAssets, selectedFolders: selectionState.selectedFolders },
        { onToast, onRefreshData }
      );
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
        // Move folder back to original location
        const originalParentId = activeItemData?.parentFolderId || null;
        moveFolder(operation.itemId, originalParentId);
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
  }, [onItemsUpdate, onToast, onRefreshData, moveFolder]);

  return { handleDragEnd };
} 
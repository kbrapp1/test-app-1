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

export function useDragEndHandler({
  onItemsUpdate,
  onToast,
  onRefreshData
}: UseDamDragAndDropProps) {
  
  const handleDragEnd = useCallback(async (
    event: DragEndEvent, 
    selectionState?: { selectedAssets: string[], selectedFolders: string[] }, 
    activeItemData?: any
  ): Promise<DragEndResult> => {
    
    // 1. Create domain operation
    const operation = DragOperationFactory.createFromEvent(event, activeItemData);
    if (!operation) {
      // No valid drop target - operation was cancelled
      return { success: false, cancelled: true };
    }

    // 2. Get current selection state
    const selection = await SelectionStateService.getCurrentSelection(selectionState);

    // 3. Check if this is a bulk operation
    const isBulkOperation = BulkMoveOperationsService.shouldPerformBulkMove(operation, selection);

    if (isBulkOperation) {
      // Handle bulk move operation
      return BulkMoveOperationsService.executeBulkMove(
        operation,
        selection,
        { onToast, onRefreshData }
      );
    }

    // 4. Single item operation - validate operation
    const validation = DragValidationService.validate(operation, event.over?.data.current);
    if (!validation.isValid) {
      onToast({ 
        title: validation.reason?.includes('already') ? 'No Change' : 'Invalid Move',
        description: validation.reason,
        variant: validation.reason?.includes('already') ? 'default' : 'destructive'
      });
      return { success: false, cancelled: true, reason: validation.reason };
    }

    // 5. Execute optimistic update for single item
    onItemsUpdate(prevItems => prevItems.filter(item => item.id !== operation.itemId));

    try {
      // 6. Execute domain operation for single item
      if (operation.itemType === 'asset') {
        await MoveOperationsService.executeAssetMove(operation);
        onToast({ title: 'Asset moved successfully!' });
      } else {
        await MoveOperationsService.executeFolderMove(operation);
        onToast({ title: 'Folder moved successfully!' });
        
        // Dispatch folder update event for folder tree refresh
        window.dispatchEvent(new CustomEvent('folderUpdated', {
          detail: { type: 'move', folderId: operation.itemId }
        }));
      }

      // 7. Refresh data for consistency
      if (onRefreshData) {
        await onRefreshData();
      }
      
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      
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
  }, [onItemsUpdate, onToast, onRefreshData]);

  return { handleDragEnd };
} 
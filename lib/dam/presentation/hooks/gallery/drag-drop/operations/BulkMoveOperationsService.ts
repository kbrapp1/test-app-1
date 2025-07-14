/**
 * Application Service: Bulk Move Operations
 * 
 * Single Responsibility: Handles bulk move operations for multiple selected items
 * Uses React Query mutations for proper cache invalidation
 */

import type { BulkMoveSelection, DragOperation, DragEndResult } from '../types';
import { useFolderStore } from '@/lib/store/folderStore';
// import { useBulkMove } from '@/lib/dam/hooks/useAssets';

export interface BulkMoveCallbacks {
  onToast: (toast: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  onRefreshData?: () => Promise<void> | void;
}

export class BulkMoveOperationsService {
  /**
   * Executes a bulk move operation for multiple selected items
   * @param operation - The drag operation containing target information
   * @param selection - The selected assets and folders to move
   * @param callbacks - UI callback functions for notifications and refresh
   * @returns Promise resolving to operation result
   */
  static async executeBulkMove(
    operation: DragOperation,
    selection: BulkMoveSelection,
    callbacks: BulkMoveCallbacks
  ): Promise<DragEndResult> {
    const { selectedAssets, selectedFolders } = selection;
    const { onToast, onRefreshData } = callbacks;
    
    try {
      // Optimistically update folder positions in store for immediate UI feedback
      if (selectedFolders.length > 0) {
        const { moveFolder } = useFolderStore.getState();
        selectedFolders.forEach(folderId => {
          moveFolder(folderId, operation.targetId);
        });
      }
      
      // Use the bulk move action
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(selectedAssets));
      formData.append('folderIds', JSON.stringify(selectedFolders));
      formData.append('targetFolderId', operation.targetId === null ? 'null' : operation.targetId || '');
      
      // Import the bulk move action
      const { bulkMoveItems } = await import('../../../../../application/actions/selection.actions');
      const result = await bulkMoveItems(formData);
      
      if (result.success) {
        const totalItems = selectedAssets.length + selectedFolders.length;
        onToast({ 
          title: `${totalItems} items moved successfully!`,
          description: `Moved ${totalItems} item${totalItems > 1 ? 's' : ''} to ${operation.targetId ? 'folder' : 'root'}.`
        });
        
        // Dispatch folder update event if folders were moved
        if (selectedFolders.length > 0) {
          window.dispatchEvent(new CustomEvent('folderUpdated', {
            detail: { type: 'move', folderIds: selectedFolders }
          }));
        }
        
        // Exit selection mode after successful bulk move
        // Use a longer delay to ensure all UI updates are complete
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('damExitSelectionMode'));
        }, 300);
        
        // Refresh data for consistency
        if (onRefreshData) {
          await onRefreshData();
        }
        return { success: true };
      } else {
        throw new Error(result.error || 'Bulk move failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      
      // Revert optimistic folder moves if the operation failed
      if (selectedFolders.length > 0) {
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

  /**
   * Determines if a bulk operation should be performed
   * @param operation - The drag operation
   * @param selection - The current selection state
   * @returns True if bulk operation should be performed
   */
  static shouldPerformBulkMove(operation: DragOperation, selection: BulkMoveSelection): boolean {
    const { selectedAssets, selectedFolders } = selection;
    
    const isDraggedItemSelected = (operation.itemType === 'asset' && selectedAssets.includes(operation.itemId)) ||
                                 (operation.itemType === 'folder' && selectedFolders.includes(operation.itemId));
    
    return isDraggedItemSelected && (selectedAssets.length + selectedFolders.length > 1);
  }
} 
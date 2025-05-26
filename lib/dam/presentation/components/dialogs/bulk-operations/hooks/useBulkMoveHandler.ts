import { useCallback } from 'react';
import { toast } from 'sonner';
import { bulkMoveItems } from '../../../../../application/actions/selection.actions';

interface UseBulkMoveHandlerParams {
  selectedAssets: string[];
  selectedFolders: string[];
  onOperationComplete: () => void;
  onClose: () => void;
}

/**
 * Hook for handling bulk move operations
 * 
 * Single Responsibility: Business logic for move operations
 */
export function useBulkMoveHandler({
  selectedAssets,
  selectedFolders,
  onOperationComplete,
  onClose
}: UseBulkMoveHandlerParams) {

  const handleBulkMove = useCallback(async (targetFolderId: string | null) => {
    try {
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(selectedAssets));
      formData.append('folderIds', JSON.stringify(selectedFolders));
      formData.append('targetFolderId', targetFolderId === null ? 'null' : targetFolderId || '');
      
      const result = await bulkMoveItems(formData);
      
      if (result.success) {
        const totalItems = selectedAssets.length + selectedFolders.length;
        toast.success('Items moved successfully', {
          description: `${totalItems} item${totalItems > 1 ? 's' : ''} moved successfully.`
        });
        onOperationComplete();
        onClose();
      } else {
        toast.error('Move failed', {
          description: result.error || 'Failed to move items. Please try again.'
        });
      }
    } catch (error) {
      toast.error('Move failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    }
  }, [selectedAssets, selectedFolders, onOperationComplete, onClose]);

  return {
    handleBulkMove
  };
} 
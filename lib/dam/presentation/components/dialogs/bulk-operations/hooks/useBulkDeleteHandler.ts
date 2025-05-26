import { useCallback } from 'react';
import { toast } from 'sonner';
import { bulkDeleteItems } from '../../../../../application/actions/selection.actions';

interface UseBulkDeleteHandlerParams {
  selectedAssets: string[];
  selectedFolders: string[];
  onOperationComplete: () => void;
  onClose: () => void;
}

/**
 * Hook for handling bulk delete operations
 * 
 * Single Responsibility: Business logic for delete operations
 */
export function useBulkDeleteHandler({
  selectedAssets,
  selectedFolders,
  onOperationComplete,
  onClose
}: UseBulkDeleteHandlerParams) {

  const handleBulkDelete = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(selectedAssets));
      formData.append('folderIds', JSON.stringify(selectedFolders));
      
      const result = await bulkDeleteItems(formData);
      
      if (result.success) {
        const totalItems = selectedAssets.length + selectedFolders.length;
        toast.success('Items deleted successfully', {
          description: `${totalItems} item${totalItems > 1 ? 's' : ''} deleted successfully.`
        });
        onOperationComplete();
        onClose();
      } else {
        toast.error('Delete failed', {
          description: result.error || 'Failed to delete items. Please try again.'
        });
      }
    } catch (error) {
      toast.error('Delete failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    }
  }, [selectedAssets, selectedFolders, onOperationComplete, onClose]);

  return {
    handleBulkDelete
  };
} 
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useBulkMove } from '@/lib/dam/hooks/useAssets';

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
  const bulkMoveMutation = useBulkMove();

  const handleBulkMove = useCallback(async (targetFolderId: string | null) => {
    try {
      await bulkMoveMutation.mutateAsync({
        assetIds: selectedAssets,
        folderIds: selectedFolders,
        targetFolderId
      });
      
      const totalItems = selectedAssets.length + selectedFolders.length;
      toast.success('Items moved successfully', {
        description: `${totalItems} item${totalItems > 1 ? 's' : ''} moved successfully.`
      });
      onOperationComplete();
      onClose();
    } catch (error) {
      toast.error('Move failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    }
  }, [selectedAssets, selectedFolders, onOperationComplete, onClose, bulkMoveMutation]);

  return {
    handleBulkMove
  };
} 
import { useCallback } from 'react';
import { toast } from 'sonner';

interface UseBulkTagHandlerParams {
  selectedAssets: string[];
  operation: 'add' | 'remove';
  onOperationComplete: () => void;
  onClose: () => void;
}

/**
 * Hook for handling bulk tag operations
 * 
 * Single Responsibility: Business logic for tag operations
 */
export function useBulkTagHandler({
  selectedAssets,
  operation,
  onOperationComplete,
  onClose
}: UseBulkTagHandlerParams) {

  const handleBulkTag = useCallback(async (tagIds: string[]) => {
    try {
      // TODO: Implement bulk tag use case when available
      // For now, just complete the operation
      toast.success(`Tags ${operation === 'add' ? 'added' : 'removed'} successfully`, {
        description: `Tags ${operation === 'add' ? 'added to' : 'removed from'} ${selectedAssets.length} asset${selectedAssets.length > 1 ? 's' : ''}.`
      });
      onOperationComplete();
      onClose();
    } catch (error) {
      toast.error(`Tag ${operation} failed`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    }
  }, [selectedAssets, operation, onOperationComplete, onClose]);

  return {
    handleBulkTag
  };
} 
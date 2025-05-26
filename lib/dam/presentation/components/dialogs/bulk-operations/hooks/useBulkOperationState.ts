import { useState, useCallback } from 'react';

export type BulkOperationType = 'move' | 'delete' | 'tag' | 'download';

interface BulkOperationState {
  loading: Record<BulkOperationType, boolean>;
}

/**
 * Hook for managing bulk operation state
 * 
 * Single Responsibility: State management for bulk operations
 */
export function useBulkOperationState() {
  const [state, setState] = useState<BulkOperationState>({
    loading: {
      move: false,
      delete: false,
      tag: false,
      download: false
    }
  });

  const setLoading = useCallback((operation: BulkOperationType, isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [operation]: isLoading
      }
    }));
  }, []);

  const startLoading = useCallback((operation: BulkOperationType) => {
    setLoading(operation, true);
  }, [setLoading]);

  const stopLoading = useCallback((operation: BulkOperationType) => {
    setLoading(operation, false);
  }, [setLoading]);

  const resetLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      loading: {
        move: false,
        delete: false,
        tag: false,
        download: false
      }
    }));
  }, []);

  return {
    loading: state.loading,
    setLoading,
    startLoading,
    stopLoading,
    resetLoading
  };
} 
'use client';

import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
// Note: Following the pattern of other presentation hooks by using API endpoints// rather than direct use case instantiation for client-side operations
import { GalleryItemDto } from '../../application/use-cases/ListFolderContentsUseCase';

interface UseDamDragAndDropProps {
  onItemsUpdate: (updater: (items: GalleryItemDto[]) => GalleryItemDto[]) => void;
  onToast: (toast: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

interface DragAndDropState {
  optimisticallyHiddenItemId: string | null;
  isProcessing: boolean;
}

/**
 * Domain-driven hook for drag and drop functionality in DAM gallery
 * 
 * This hook follows DDD principles by:
 * - Using server actions that delegate to domain use cases
 * - Maintaining clean separation between UI state and business logic
 * - Providing proper error handling and optimistic updates
 */
export function useDamDragAndDrop({ onItemsUpdate, onToast }: UseDamDragAndDropProps) {
  const [state, setState] = useState<DragAndDropState>({
    optimisticallyHiddenItemId: null,
    isProcessing: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || state.isProcessing) return;

    const isActiveAsset = active.data.current?.type === 'asset';
    const isOverFolder = over.data.current?.type === 'folder' && over.data.current?.accepts?.includes('asset');

    if (isActiveAsset && isOverFolder) {
      const assetId = active.id as string;
      const targetFolderId = over.id as string;
      
      const draggedAsset = active.data.current?.item;
      if (!draggedAsset) return;

      // Check if asset is already in target folder
      if (draggedAsset.folder_id === targetFolderId) {
        onToast({ 
          title: 'No Change', 
          description: 'Asset is already in the target folder.', 
          variant: 'default' 
        });
        return;
      }

      // Start optimistic update
      setState(prev => ({ 
        ...prev, 
        optimisticallyHiddenItemId: assetId,
        isProcessing: true 
      }));

      try {
        // Use server action (which internally uses the MoveAssetUseCase)
        const { moveAsset } = await import('@/lib/actions/dam/asset-crud.actions');
        const result = await moveAsset(assetId, targetFolderId);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to move asset');
        }

        // Success: Remove from current list optimistically
        onItemsUpdate(prevItems => prevItems.filter(item => item.id !== assetId));
        onToast({ title: 'Asset moved successfully!' });

      } catch (error) {
        console.error('Move asset error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        onToast({ 
          title: 'Error moving asset', 
          description: errorMessage, 
          variant: 'destructive' 
        });
        
        // Revert optimistic update
        setState(prev => ({ 
          ...prev, 
          optimisticallyHiddenItemId: null,
          isProcessing: false 
        }));
        return;
      }
    }

    // Reset state after successful operation
    setState(prev => ({ 
      ...prev, 
      optimisticallyHiddenItemId: null,
      isProcessing: false 
    }));
  };

  const resetOptimisticState = () => {
    setState(prev => ({ 
      ...prev, 
      optimisticallyHiddenItemId: null,
      isProcessing: false 
    }));
  };

  return { 
    sensors, 
    handleDragEnd, 
    optimisticallyHiddenItemId: state.optimisticallyHiddenItemId,
    resetOptimisticState,
  };
} 
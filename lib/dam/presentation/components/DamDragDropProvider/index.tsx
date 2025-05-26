'use client';

import React, { useEffect, useCallback } from 'react';
import { DndContext, DragOverlay as DndKitDragOverlay } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useDragDropState } from './hooks/useDragDropState';
import { useDragHandlers } from './hooks/useDragHandlers';
import { useDropHandlers } from './hooks/useDropHandlers';
import { useDragDropValidation } from './hooks/useDragDropValidation';
import { DragOverlay } from './components/DragOverlay';
import { DragDropOperations } from './services/DragDropOperations';

interface DamDragDropProviderProps {
  children: React.ReactNode;
}

/**
 * DAM Drag & Drop Provider
 * 
 * Provides DndContext for the entire DAM layout including:
 * - Sidebar folder tree
 * - Main gallery content
 * - Multi-asset drag and drop support
 * - Optimized collision detection for smooth UX
 * - DragOverlay for proper z-index handling above all content
 * - Coordinated optimistic updates to prevent snap-back effect
 * 
 * Single Responsibility: Coordination of drag and drop system
 */
export function DamDragDropProvider({ children }: DamDragDropProviderProps) {
  // State management
  const {
    activeItem,
    isProcessing,
    showOverlay,
    selectedAssets,
    selectedFolders,
    startDrag,
    startProcessing,
    completeDragSuccess,
    cancelDrag
  } = useDragDropState();

  // Validation and collision detection
  const { topEdgeCollisionDetection } = useDragDropValidation();

  // Drag handlers
  const { handleDragStart } = useDragHandlers({
    startDrag,
    selectedAssets,
    selectedFolders
  });

  // Drop handlers
  const { handleDragEnd } = useDropHandlers({
    activeItem,
    selectedAssets,
    selectedFolders,
    startProcessing,
    completeDragSuccess,
    cancelDrag
  });

  // Escape key handler for cancelling drag operations
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && showOverlay) {
      // Restore items immediately when cancelled
      const activeItemType = activeItem?.type;
      const activeItemId = activeItem?.item?.id;
      
      if (activeItemId && activeItemType) {
        DragDropOperations.processDragClear(
          activeItemId,
          activeItemType,
          selectedAssets,
          selectedFolders
        );
      }
      
      cancelDrag();
    }
  }, [showOverlay, activeItem, selectedAssets, selectedFolders, cancelDrag]);

  // Setup escape key listener
  useEffect(() => {
    if (showOverlay) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showOverlay, handleEscape]);

  return (
    <DndContext
      collisionDetection={topEdgeCollisionDetection}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
      <DndKitDragOverlay>
        {showOverlay && (
          <DragOverlay 
            activeItem={activeItem} 
            isProcessing={isProcessing}
            selectedAssets={selectedAssets}
            selectedFolders={selectedFolders}
          />
        )}
      </DndKitDragOverlay>
    </DndContext>
  );
} 
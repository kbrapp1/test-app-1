'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, rectIntersection, type CollisionDetection, type DragStartEvent } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useDamDragAndDrop } from '../hooks/gallery/useDamDragAndDrop';
import { toast } from 'sonner';

interface DamDragDropProviderProps {
  children: React.ReactNode;
}

/**
 * Custom collision detection that activates drop zones when the top edge
 * of the dragged item breaches the drop zone boundaries.
 * 
 * Performance optimizations:
 * - Early returns to reduce computation
 * - Simplified distance calculations
 * - Cached rect calculations
 */
const topEdgeCollisionDetection: CollisionDetection = (args) => {
  const { active, droppableRects, droppableContainers } = args;

  // Early return if no active dragging
  if (!active.rect.current.translated) {
    return [];
  }

  const draggedRect = active.rect.current.translated;
  const draggedTopY = draggedRect.top;
  const draggedLeft = draggedRect.left;
  const draggedRight = draggedRect.right;
  
  // Pre-allocate array with known max size for better performance
  const collisions = [];
  
  // Use for...of loop which is typically faster than forEach for this use case
  for (const container of droppableContainers) {
    const rect = droppableRects.get(container.id);
    
    // Early continue if no rect
    if (!rect) continue;
    
    // Quick horizontal bounds check first (most likely to fail)
    if (draggedLeft >= rect.right || draggedRight <= rect.left) continue;
    
    // Then check vertical bounds with top edge
    if (draggedTopY < rect.top || draggedTopY > rect.bottom) continue;
    
    // If we get here, we have a collision
    // Use simpler distance calculation for better performance
    const distanceFromTop = Math.abs(draggedTopY - rect.top);
    
    collisions.push({
      id: container.id,
      data: container.data.current,
      distance: distanceFromTop // Use distance from top edge for more intuitive sorting
    });
  }
  
  // Sort by distance (closest drop zones first)
  return collisions.sort((a, b) => a.distance - b.distance);
};

/**
 * Enhanced drag preview component with success state
 */
function DragPreview({ activeItem, isProcessing }: { activeItem: any; isProcessing: boolean }) {
  if (!activeItem || (activeItem.type !== 'asset' && activeItem.type !== 'folder')) return null;

  if (activeItem.type === 'folder') {
    const folder = activeItem.item;
    return (
      <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[200px] transition-all duration-200 ${
        isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
      }`}>
        <div className="flex flex-col items-center text-center">
          {/* Folder Icon */}
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
            <div className="w-8 h-8 text-blue-600">📁</div>
          </div>
          <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full" title={folder.name}>
            {folder.name}
          </h3>
          <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
            {isProcessing ? 'Moving...' : 'Drag to move'}
          </p>
        </div>
      </div>
    );
  }

  const asset = activeItem.item;
  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');

  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[200px] transition-all duration-200 ${
      isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
    }`}>
      <div className="flex flex-col items-center text-center">
        {/* Image Thumbnail or Icon */}
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
          {isImage && asset.publicUrl ? (
            <img
              src={asset.publicUrl}
              alt={asset.name}
              className="w-full h-full object-cover rounded-lg"
              draggable="false"
            />
          ) : (
            <div className="w-6 h-6 text-gray-500">📄</div>
          )}
        </div>
        <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full" title={asset.name}>
          {asset.name}
        </h3>
        <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
          {isProcessing ? 'Moving...' : 'Drag to move'}
        </p>
      </div>
    </div>
  );
}

/**
 * DAM Drag & Drop Provider
 * 
 * Provides DndContext for the entire DAM layout including:
 * - Sidebar folder tree
 * - Main gallery content
 * - Optimized collision detection for smooth UX
 * - DragOverlay for proper z-index handling above all content
 * - Coordinated optimistic updates to prevent snap-back effect
 */
export function DamDragDropProvider({ children }: DamDragDropProviderProps) {
  const [activeItem, setActiveItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Global drag and drop functionality for the entire DAM interface
  const dragAndDrop = useDamDragAndDrop({
    onItemsUpdate: () => {
      // Individual galleries will handle their own optimistic updates
      // No need to dispatch here since we do it in handleDragEnd
    },
    onToast: (toastData) => {
      if (toastData.variant === 'destructive') {
        toast.error(toastData.title, { description: toastData.description });
      } else {
        toast.success(toastData.title, { description: toastData.description });
      }
    },
    onRefreshData: async () => {
      // Trigger global refresh event
      window.dispatchEvent(new CustomEvent('damDataRefresh'));
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    console.log('🚀 Global drag started:', event.active.id, event.active.data.current?.type);
    setActiveItem(event.active.data.current);
    setShowOverlay(true);
    setIsProcessing(false);
  };

  const handleDragEnd = async (event: any) => {
    console.log('🔄 Drag end - starting processing...');
    
    // Get the item ID that will be optimistically hidden (asset or folder)
    const activeItemType = event.active?.data?.current?.type;
    const activeItemId = (activeItemType === 'asset' || activeItemType === 'folder') ? event.active.id : null;
    
    // Dispatch event with the item ID being processed IMMEDIATELY
    if (activeItemId) {
      window.dispatchEvent(new CustomEvent('damDragDropUpdate', { 
        detail: { 
          itemId: activeItemId, 
          itemType: activeItemType,
          // Legacy support for assets
          assetId: activeItemType === 'asset' ? activeItemId : null 
        } 
      }));
    }
    
    // Start processing state but keep overlay visible
    setIsProcessing(true);
    
    // Small delay to ensure optimistic hiding takes effect before calling drag handler
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Call the actual drag end handler
    await dragAndDrop.handleDragEnd(event);
    
    // Add a delay to ensure optimistic updates have taken effect
    setTimeout(() => {
      console.log('🔄 Drag end - hiding overlay after delay');
      setActiveItem(null);
      setShowOverlay(false);
      setIsProcessing(false);
      
      // Clear the global optimistic state
      if (activeItemId) {
        window.dispatchEvent(new CustomEvent('damDragDropClear', { 
          detail: { 
            itemId: activeItemId, 
            itemType: activeItemType,
            // Legacy support for assets
            assetId: activeItemType === 'asset' ? activeItemId : null 
          } 
        }));
      }
    }, 400); // Slightly longer delay for folders
  };

  // Hide overlay when dragging is cancelled
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOverlay) {
        setActiveItem(null);
        setShowOverlay(false);
        setIsProcessing(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showOverlay]);

  return (
    <DndContext
      sensors={dragAndDrop.sensors}
      collisionDetection={topEdgeCollisionDetection}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
      <DragOverlay>
        {showOverlay && <DragPreview activeItem={activeItem} isProcessing={isProcessing} />}
      </DragOverlay>
    </DndContext>
  );
} 

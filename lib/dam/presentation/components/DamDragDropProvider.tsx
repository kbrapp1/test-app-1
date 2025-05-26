'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
 * Enhanced drag preview component with multi-asset support
 */
function DragPreview({ 
  activeItem, 
  isProcessing, 
  selectedAssets = [], 
  selectedFolders = [] 
}: { 
  activeItem: any; 
  isProcessing: boolean;
  selectedAssets?: string[];
  selectedFolders?: string[];
}) {
  if (!activeItem || (activeItem.type !== 'asset' && activeItem.type !== 'folder')) return null;

  // Check if we're dragging multiple items
  const isDraggingMultiple = (activeItem.type === 'asset' && selectedAssets.length > 1) || 
                            (activeItem.type === 'folder' && selectedFolders.length > 1) ||
                            (selectedAssets.length > 0 && selectedFolders.length > 0);

  const totalCount = selectedAssets.length + selectedFolders.length;

  if (activeItem.type === 'folder') {
    const folder = activeItem.item;
    
    if (isDraggingMultiple) {
      return (
        <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[240px] transition-all duration-200 ${
          isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
        }`}>
          <div className="flex flex-col items-center text-center">
            {/* Stacked folder icons */}
            <div className="relative w-16 h-16 mb-3">
              {/* Background folders */}
              <div className="absolute top-1 left-1 w-14 h-14 rounded-lg bg-blue-50 border border-blue-200 opacity-60"></div>
              <div className="absolute top-0.5 left-0.5 w-15 h-15 rounded-lg bg-blue-75 border border-blue-250 opacity-80"></div>
              {/* Main folder */}
              <div className="absolute top-0 left-0 w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-300">
                <div className="w-8 h-8 text-blue-600">📁</div>
              </div>
              {/* Count badge */}
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                {totalCount}
              </div>
            </div>
            <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full">
              {totalCount} items
            </h3>
            <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
              {isProcessing ? 'Moving...' : 'Drag to move'}
            </p>
          </div>
        </div>
      );
    }

    // Single folder
    return (
      <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[200px] transition-all duration-200 ${
        isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
      }`}>
        <div className="flex flex-col items-center text-center">
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

  if (isDraggingMultiple) {
    return (
      <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[240px] transition-all duration-200 ${
        isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
      }`}>
        <div className="flex flex-col items-center text-center">
          {/* Stacked thumbnails */}
          <div className="relative w-16 h-16 mb-3">
            {/* Background thumbnails */}
            <div className="absolute top-1 left-1 w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 opacity-60"></div>
            <div className="absolute top-0.5 left-0.5 w-15 h-15 rounded-lg bg-gray-75 border border-gray-250 opacity-80"></div>
            {/* Main thumbnail */}
            <div className="absolute top-0 left-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-300">
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
            {/* Count badge */}
            <div className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
              {totalCount}
            </div>
          </div>
          <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full">
            {totalCount} items
          </h3>
          <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
            {isProcessing ? 'Moving...' : 'Drag to move'}
          </p>
        </div>
      </div>
    );
  }

  // Single asset
  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[200px] transition-all duration-200 ${
      isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
    }`}>
      <div className="flex flex-col items-center text-center">
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
 * - Multi-asset drag and drop support
 * - Optimized collision detection for smooth UX
 * - DragOverlay for proper z-index handling above all content
 * - Coordinated optimistic updates to prevent snap-back effect
 */
export function DamDragDropProvider({ children }: DamDragDropProviderProps) {
  const [activeItem, setActiveItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

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
    setActiveItem(event.active.data.current);
    setShowOverlay(true);
    setIsProcessing(false);

    // Get current selection state from the multi-select system
    const selectionEvent = new CustomEvent('damGetSelection');
    window.dispatchEvent(selectionEvent);

    // Immediately hide items for visual feedback during drag
    setTimeout(() => {
      const activeItemType = event.active?.data?.current?.type;
      const activeItemId = (activeItemType === 'asset' || activeItemType === 'folder') ? String(event.active.id) : null;
      
      // Check if this is a multi-select operation
      const isDraggedItemSelected = activeItemId && (
        (activeItemType === 'asset' && selectedAssets.includes(activeItemId)) ||
        (activeItemType === 'folder' && selectedFolders.includes(activeItemId))
      );
      
      const isBulkOperation = isDraggedItemSelected && (selectedAssets.length + selectedFolders.length > 1);
      
      if (isBulkOperation) {
        // Hide all selected items for bulk operation
        const allSelectedItems = [
          ...selectedAssets.map(id => ({ itemId: id, itemType: 'asset' })),
          ...selectedFolders.map(id => ({ itemId: id, itemType: 'folder' }))
        ];
        
        allSelectedItems.forEach(({ itemId, itemType }) => {
          window.dispatchEvent(new CustomEvent('damDragDropUpdate', { 
            detail: { 
              itemId, 
              itemType,
              // Legacy support for assets
              assetId: itemType === 'asset' ? itemId : null 
            } 
          }));
        });
      } else if (activeItemId) {
        // Single item operation
        window.dispatchEvent(new CustomEvent('damDragDropUpdate', { 
          detail: { 
            itemId: activeItemId, 
            itemType: activeItemType,
            // Legacy support for assets
            assetId: activeItemType === 'asset' ? activeItemId : null 
          } 
        }));
      }
    }, 50); // Small delay to ensure selection state is updated
  };

  const handleDragEnd = async (event: any) => {
    
    // Get the item ID that will be optimistically hidden (asset or folder)
    // Use activeItem state if event data is not available (e.g., when cancelled)
    const activeItemType = event.active?.data?.current?.type || activeItem?.type;
    const activeItemId = (activeItemType === 'asset' || activeItemType === 'folder') ? 
      String(event.active.id || activeItem?.item?.id) : null;
    
    // Check if this is a multi-select operation and get all items to hide
    const isDraggedItemSelected = activeItemId && (
      (activeItemType === 'asset' && selectedAssets.includes(activeItemId)) ||
      (activeItemType === 'folder' && selectedFolders.includes(activeItemId))
    );
    
    const isBulkOperation = isDraggedItemSelected && (selectedAssets.length + selectedFolders.length > 1);
    
    // Dispatch event with all items being processed IMMEDIATELY
    if (isBulkOperation) {
      // Hide all selected items for bulk operation
      const allSelectedItems = [
        ...selectedAssets.map(id => ({ itemId: id, itemType: 'asset' })),
        ...selectedFolders.map(id => ({ itemId: id, itemType: 'folder' }))
      ];
      
      allSelectedItems.forEach(({ itemId, itemType }) => {
        window.dispatchEvent(new CustomEvent('damDragDropUpdate', { 
          detail: { 
            itemId, 
            itemType,
            // Legacy support for assets
            assetId: itemType === 'asset' ? itemId : null 
          } 
        }));
      });
    } else if (activeItemId) {
      // Single item operation
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
    
    // Call the actual drag end handler with current selection state and active item
    const result = await dragAndDrop.handleDragEnd(event, { selectedAssets, selectedFolders }, activeItem);
    
    // Handle the result - only clear optimistic hiding if operation was successful
    if (result?.success) {
      // Successful operation - keep items hidden and clear after delay
    setTimeout(() => {
        setActiveItem(null);
        setShowOverlay(false);
        setIsProcessing(false);
        
        // Clear the global optimistic state for all items
        if (isBulkOperation) {
          // Clear all selected items for bulk operation
          const allSelectedItems = [
            ...selectedAssets.map(id => ({ itemId: id, itemType: 'asset' })),
            ...selectedFolders.map(id => ({ itemId: id, itemType: 'folder' }))
          ];
          
          allSelectedItems.forEach(({ itemId, itemType }) => {
            window.dispatchEvent(new CustomEvent('damDragDropClear', { 
              detail: { 
                itemId, 
                itemType,
                // Legacy support for assets
                assetId: itemType === 'asset' ? itemId : null 
              } 
            }));
          });
        } else if (activeItemId) {
          // Single item operation
          window.dispatchEvent(new CustomEvent('damDragDropClear', { 
            detail: { 
              itemId: activeItemId, 
              itemType: activeItemType,
              // Legacy support for assets
              assetId: activeItemType === 'asset' ? activeItemId : null 
            } 
          }));
        }
        
        // Reset selection state
        setSelectedAssets([]);
        setSelectedFolders([]);
      }, 400); // Slightly longer delay for folders
    } else {
      // Failed or cancelled operation - restore items immediately
      setActiveItem(null);
      setShowOverlay(false);
      setIsProcessing(false);
      
      // Restore the items by clearing optimistic hiding immediately
      if (isBulkOperation) {
        // Restore all selected items for bulk operation
        const allSelectedItems = [
          ...selectedAssets.map(id => ({ itemId: id, itemType: 'asset' })),
          ...selectedFolders.map(id => ({ itemId: id, itemType: 'folder' }))
        ];
        
        allSelectedItems.forEach(({ itemId, itemType }) => {
          window.dispatchEvent(new CustomEvent('damDragDropClear', { 
            detail: { 
              itemId, 
              itemType,
              // Legacy support for assets
              assetId: itemType === 'asset' ? itemId : null 
            } 
          }));
        });
      } else if (activeItemId) {
        // Single item operation
        window.dispatchEvent(new CustomEvent('damDragDropClear', { 
          detail: { 
            itemId: activeItemId, 
            itemType: activeItemType,
            // Legacy support for assets
            assetId: activeItemType === 'asset' ? activeItemId : null 
          } 
        }));
      }
      
      // Don't reset selection state on cancellation - keep items selected for next drag
    }
  };

  // Listen for selection updates
  useEffect(() => {
    const handleSelectionUpdate = (event: CustomEvent) => {
      const { selectedAssets: assets, selectedFolders: folders } = event.detail;
      setSelectedAssets(assets || []);
      setSelectedFolders(folders || []);
    };

    window.addEventListener('damSelectionUpdate', handleSelectionUpdate as EventListener);
    return () => window.removeEventListener('damSelectionUpdate', handleSelectionUpdate as EventListener);
  }, []);

  // Stable escape handler using useCallback
  const handleEscape = useCallback((e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOverlay) {
      // Get current drag state to restore items
      const activeItemType = activeItem?.type;
      const activeItemId = activeItem?.item?.id;
      
      // Check if this is a multi-select operation
      const isDraggedItemSelected = activeItemId && (
        (activeItemType === 'asset' && selectedAssets.includes(activeItemId)) ||
        (activeItemType === 'folder' && selectedFolders.includes(activeItemId))
      );
      
      const isBulkOperation = isDraggedItemSelected && (selectedAssets.length + selectedFolders.length > 1);
      
      // Restore items immediately when cancelled
      if (isBulkOperation) {
        // Restore all selected items for bulk operation
        const allSelectedItems = [
          ...selectedAssets.map(id => ({ itemId: id, itemType: 'asset' })),
          ...selectedFolders.map(id => ({ itemId: id, itemType: 'folder' }))
        ];
        
        allSelectedItems.forEach(({ itemId, itemType }) => {
          window.dispatchEvent(new CustomEvent('damDragDropClear', { 
            detail: { 
              itemId, 
              itemType,
              // Legacy support for assets
              assetId: itemType === 'asset' ? itemId : null 
            } 
          }));
        });
      } else if (activeItemId) {
        // Single item operation
        window.dispatchEvent(new CustomEvent('damDragDropClear', { 
          detail: { 
            itemId: activeItemId, 
            itemType: activeItemType,
            // Legacy support for assets
            assetId: activeItemType === 'asset' ? activeItemId : null 
          } 
        }));
      }
      
        setActiveItem(null);
        setShowOverlay(false);
        setIsProcessing(false);
      // Don't reset selection state on escape - keep items selected
      }
  }, [showOverlay, activeItem, selectedAssets, selectedFolders]);

  // Hide overlay when dragging is cancelled
  useEffect(() => {
    if (showOverlay) {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showOverlay, handleEscape]);

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
        {showOverlay && (
          <DragPreview 
            activeItem={activeItem} 
            isProcessing={isProcessing}
            selectedAssets={selectedAssets}
            selectedFolders={selectedFolders}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
} 

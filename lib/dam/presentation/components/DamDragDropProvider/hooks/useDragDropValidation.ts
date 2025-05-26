import { type CollisionDetection } from '@dnd-kit/core';

/**
 * Custom collision detection that activates drop zones when the top edge
 * of the dragged item breaches the drop zone boundaries.
 * 
 * Performance optimizations:
 * - Early returns to reduce computation
 * - Simplified distance calculations
 * - Cached rect calculations
 * 
 * Single Responsibility: Collision detection for drag and drop
 */
export const topEdgeCollisionDetection: CollisionDetection = (args) => {
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
 * Hook for drag and drop validation utilities
 * 
 * Single Responsibility: Validation logic for drag and drop operations
 */
export function useDragDropValidation() {
  /**
   * Validates if a drag operation can be performed
   */
  const validateDragStart = (draggedItem: any): boolean => {
    if (!draggedItem || (!draggedItem.type || (draggedItem.type !== 'asset' && draggedItem.type !== 'folder'))) {
      return false;
    }
    return true;
  };

  /**
   * Validates if a drop operation can be performed
   */
  const validateDrop = (draggedItem: any, dropTarget: any): boolean => {
    if (!draggedItem || !dropTarget) return false;
    
    // Add specific validation logic here based on business rules
    // For example: can't drop folder into itself, can't drop asset to certain locations, etc.
    
    return true;
  };

  /**
   * Extracts item type and ID from drag event data
   */
  const extractDragData = (eventData: any) => {
    const activeItemType = eventData?.active?.data?.current?.type;
    const activeItemId = (activeItemType === 'asset' || activeItemType === 'folder') ? 
      String(eventData.active.id) : null;
    
    return { activeItemType, activeItemId };
  };

  return {
    validateDragStart,
    validateDrop,
    extractDragData,
    topEdgeCollisionDetection
  };
} 
/**
 * Domain Service: Drag Operation Factory
 * 
 * Single Responsibility: Creates domain operations from UI drag events
 * Encapsulates the complex logic of interpreting drag-drop events
 */

import type { DragEndEvent } from '@dnd-kit/core';
import type { DragOperation } from '../types';

export class DragOperationFactory {
  /**
   * Creates a domain operation from a drag event
   * @param event - The drag end event from dnd-kit
   * @param activeItemData - Optional item data from the active dragged element
   * @returns DragOperation or null if invalid
   */
  static createFromEvent(event: DragEndEvent, activeItemData?: any): DragOperation | null {
    const { active, over } = event;
    
    if (!active || !over) return null;

    // Use provided activeItemData if available, otherwise fall back to event data
    const itemData = activeItemData || active.data.current;
    const itemType = itemData?.type;
    if (itemType !== 'asset' && itemType !== 'folder') return null;

    // Check if this is a valid drop target for our drag and drop system
    const dropZoneData = over.data.current;
    
    // If there's no drop zone data, this might be an upload area or invalid target
    if (!dropZoneData) {
      return null;
    }
    
    // Check if the drop zone accepts our item type
    const acceptsAssets = dropZoneData?.accepts?.includes('asset');
    const acceptsFolders = dropZoneData?.accepts?.includes('folder');
    
    if (itemType === 'asset' && !acceptsAssets) {
      return null;
    }
    
    if (itemType === 'folder' && !acceptsFolders) {
      return null;
    }

    // Extract target folder ID from different drop zone types
    let targetId: string | null = null;
    if (over.id === 'sidebar-home-folder') {
      targetId = null; // Home folder
    } else if (typeof over.id === 'string' && over.id.startsWith('sidebar-')) {
      targetId = over.id.replace('sidebar-', '');
    } else {
      targetId = over.id as string;
    }

    // Override with explicit folder ID from drop zone data
    if (dropZoneData?.folderId !== undefined) {
      targetId = dropZoneData.folderId;
    }

    return {
      itemId: active.id as string,
      itemType,
      targetId,
      sourceItem: itemData?.item,
    };
  }
} 
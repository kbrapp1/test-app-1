/**
 * Domain Service: Drag Operation Validation
 * 
 * Single Responsibility: Validates drag operations according to business rules
 * Encapsulates domain validation logic for drag-drop operations
 */

import type { DragOperation, DragValidationResult } from '../types';

interface DropZoneData {
  accepts?: string[];
  folderId?: string | null;
  [key: string]: unknown;
}

export class DragValidationService {
  /**
   * Validates a drag operation against business rules
   * @param operation - The drag operation to validate
   * @param overData - Data from the drop zone
   * @returns Validation result with success/failure and reason
   */
  static validate(operation: DragOperation, overData: DropZoneData): DragValidationResult {
    const { itemType, targetId, sourceItem: _sourceItem } = operation;
    
    // Check drop zone compatibility
    const acceptsAssets = overData?.accepts?.includes('asset');
    const acceptsFolders = overData?.accepts?.includes('folder');
    
    if (itemType === 'asset' && !acceptsAssets) {
      return { isValid: false, reason: 'Drop zone does not accept assets' };
    }
    
    if (itemType === 'folder' && !acceptsFolders) {
      return { isValid: false, reason: 'Drop zone does not accept folders' };
    }

    // Note: Cannot validate no-change scenarios since GalleryItemDto doesn't include parent folder information
    // This validation would need to be done at a higher level with access to full entity data

    // Prevent folder self-move
    if (itemType === 'folder' && operation.itemId === targetId) {
      return { isValid: false, reason: 'Cannot move a folder into itself' };
    }

    return { isValid: true };
  }

  static validateMove(operation: DragOperation): DragValidationResult {
    const { itemId, itemType, targetId, sourceItem: _sourceItem } = operation;
    
    // Basic validation - can't move item to itself
    if (itemId === targetId) {
      return {
        isValid: false,
        reason: 'Cannot move item to itself'
      };
    }

    // Additional move validations can be added here
    return { isValid: true };
  }
} 
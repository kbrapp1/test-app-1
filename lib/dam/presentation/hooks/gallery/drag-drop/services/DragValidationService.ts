/**
 * Domain Service: Drag Operation Validation
 * 
 * Single Responsibility: Validates drag operations according to business rules
 * Encapsulates domain validation logic for drag-drop operations
 */

import type { DragOperation, DragValidationResult } from '../types';

export class DragValidationService {
  /**
   * Validates a drag operation against business rules
   * @param operation - The drag operation to validate
   * @param overData - Data from the drop zone
   * @returns Validation result with success/failure and reason
   */
  static validate(operation: DragOperation, overData: any): DragValidationResult {
    const { itemType, targetId, sourceItem } = operation;
    
    // Check drop zone compatibility
    const acceptsAssets = overData?.accepts?.includes('asset');
    const acceptsFolders = overData?.accepts?.includes('folder');
    
    if (itemType === 'asset' && !acceptsAssets) {
      return { isValid: false, reason: 'Drop zone does not accept assets' };
    }
    
    if (itemType === 'folder' && !acceptsFolders) {
      return { isValid: false, reason: 'Drop zone does not accept folders' };
    }

    // Validate no-change scenarios
    if (itemType === 'asset' && sourceItem?.folder_id === targetId) {
      return { isValid: false, reason: 'Asset is already in the target folder' };
    }
    
    if (itemType === 'folder' && sourceItem?.parentFolderId === targetId) {
      return { isValid: false, reason: 'Folder is already in the target location' };
    }

    // Prevent folder self-move
    if (itemType === 'folder' && operation.itemId === targetId) {
      return { isValid: false, reason: 'Cannot move a folder into itself' };
    }

    return { isValid: true };
  }
} 
import { Selection } from '../entities/Selection';
import { BulkOperation } from '../value-objects/BulkOperation';
import { BulkOperationValidation } from '../value-objects/BulkOperationValidation';

/**
 * Bulk Operation Validator Domain Service - Handles selection-specific validation.
 * Focuses on validating operations against selections, delegates operation validation to value objects.
 */
export class BulkOperationValidator {
  /** Validate if bulk operation can be performed on selection */
  static canPerformOperation(selection: Selection, operation: BulkOperation): boolean {
    if (!selection.hasSelection()) {
      return false;
    }

    switch (operation.type) {
      case 'move':
        return selection.hasSelection() && operation.targetFolderId !== undefined;
      
      case 'delete':
        return selection.hasSelection();
      
      case 'addTags':
      case 'removeTags':
        return selection.selectedAssetIds.size > 0 && 
               !!operation.tagIds && 
               operation.tagIds.length > 0;
      
      case 'download':
        // Allow download for both assets and folders (folders will be downloaded as ZIP containing their assets)
        return selection.hasSelection();
      
      case 'copy':
        return selection.hasSelection() && operation.targetFolderId !== undefined;
      
      default:
        return false;
    }
  }

  /** Get validation errors for bulk operation against selection */
  static getValidationErrors(selection: Selection, operation: BulkOperation): string[] {
    const errors: string[] = [];

    if (!selection.hasSelection()) {
      errors.push('No items selected for bulk operation');
      return errors;
    }

    switch (operation.type) {
      case 'move':
      case 'copy':
        if (operation.targetFolderId === undefined) {
          errors.push('Target folder is required for move/copy operation');
        }
        break;

      case 'addTags':
      case 'removeTags':
        if (selection.selectedAssetIds.size === 0) {
          errors.push('Tag operations can only be performed on assets');
        }
        if (selection.selectedFolderIds.size > 0) {
          errors.push('Cannot perform tag operations on folders');
        }
        if (!operation.tagIds || operation.tagIds.length === 0) {
          errors.push('Tag IDs are required for tag operations');
        }
        break;

      case 'download':
        // Allow download for both assets and folders (folders will be downloaded as ZIP containing their assets)
        if (!selection.hasSelection()) {
          errors.push('At least one item must be selected for download operation');
        }
        break;
    }

    return errors;
  }

  /** Check if operation requires confirmation - delegates to value object validator */
  static requiresConfirmation(operation: BulkOperation): boolean {
    return BulkOperationValidation.requiresConfirmation(operation);
  }

  /** Get operation description - delegates to value object validator */
  static getOperationDescription(operation: BulkOperation): string {
    return BulkOperationValidation.getOperationDescription(operation);
  }

  /** Validate operation parameters - delegates to value object validator */
  static validateOperation(operation: BulkOperation): { isValid: boolean; errors: string[] } {
    return BulkOperationValidation.validateOperation(operation);
  }
} 
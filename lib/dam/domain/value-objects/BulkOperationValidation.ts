import {
  BulkOperation,
  BulkMoveOperation,
  BulkDeleteOperation,
  BulkTagOperation,
  BulkDownloadOperation,
  BulkCopyOperation
} from './BulkOperation';

/**
 * Bulk Operation Validation - Domain Service for validating bulk operations.
 * Follows DDD principles with focused responsibility on validation logic.
 */
export class BulkOperationValidation {
  /** Validate bulk operation parameters */
  static validateOperation(operation: BulkOperation): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Common validation
    if (!operation.type) {
      errors.push('Operation type is required');
    }

    if (!operation.operationId) {
      errors.push('Operation ID is required');
    }

    if (!operation.timestamp) {
      errors.push('Operation timestamp is required');
    }

    // Type-specific validation
    switch (operation.type) {
      case 'move':
        this.validateMoveOperation(operation as BulkMoveOperation, errors);
        break;

      case 'delete':
        this.validateDeleteOperation(operation as BulkDeleteOperation, errors);
        break;

      case 'addTags':
      case 'removeTags':
        this.validateTagOperation(operation as BulkTagOperation, errors);
        break;

      case 'download':
        this.validateDownloadOperation(operation as BulkDownloadOperation, errors);
        break;

      case 'copy':
        this.validateCopyOperation(operation as BulkCopyOperation, errors);
        break;

      default:
        errors.push(`Unknown operation type: ${(operation as BulkOperation & { type: string }).type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /** Check if operation is valid for given selection */
  static isValidForSelection(
    operation: BulkOperation,
    selectedAssetIds: string[],
    selectedFolderIds: string[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const hasAssets = selectedAssetIds.length > 0;
    const hasFolders = selectedFolderIds.length > 0;
    const hasSelection = hasAssets || hasFolders;

    if (!hasSelection) {
      errors.push('No items selected for bulk operation');
      return { isValid: false, errors };
    }

    switch (operation.type) {
      case 'move':
      case 'copy':
        if (!hasSelection) {
          errors.push('At least one item must be selected for move/copy operation');
        }
        break;

      case 'delete':
        if (!hasSelection) {
          errors.push('At least one item must be selected for delete operation');
        }
        break;

      case 'addTags':
      case 'removeTags':
        if (!hasAssets) {
          errors.push('Tag operations can only be performed on assets, not folders');
        }
        if (hasFolders) {
          errors.push('Cannot perform tag operations on folders');
        }
        break;

      case 'download':
        // Allow download for both assets and folders (folders will be downloaded as ZIP containing their assets)
        if (!hasSelection) {
          errors.push('At least one item must be selected for download operation');
        }
        break;

      default:
        errors.push(`Unknown operation type: ${(operation as BulkOperation & { type: string }).type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /** Get operation description for UI display */
  static getOperationDescription(operation: BulkOperation): string {
    switch (operation.type) {
      case 'move':
        const moveOp = operation as BulkMoveOperation;
        return `Move items to ${moveOp.targetFolderId ? 'folder' : 'root'}`;
      
      case 'delete':
        return 'Delete selected items';
      
      case 'addTags':
        const addTagOp = operation as BulkTagOperation;
        return `Add ${addTagOp.tagIds.length} tag(s) to selected assets`;
      
      case 'removeTags':
        const removeTagOp = operation as BulkTagOperation;
        return `Remove ${removeTagOp.tagIds.length} tag(s) from selected assets`;
      
      case 'download':
        const downloadOp = operation as BulkDownloadOperation;
        return `Download selected items as ${downloadOp.format}`;
      
      case 'copy':
        const copyOp = operation as BulkCopyOperation;
        return `Copy items to ${copyOp.targetFolderId ? 'folder' : 'root'}`;
      
      default:
        return 'Unknown operation';
    }
  }

  /** Check if operation requires confirmation */
  static requiresConfirmation(operation: BulkOperation): boolean {
    switch (operation.type) {
      case 'delete':
        return (operation as BulkDeleteOperation).confirmationRequired;
      case 'move':
      case 'copy':
        return true; // Always confirm move/copy operations
      case 'addTags':
      case 'removeTags':
        return false; // Tag operations are usually safe
      case 'download':
        return false; // Download is safe
      default:
        return true; // Default to requiring confirmation
    }
  }

  /** Validate move operation */
  private static validateMoveOperation(operation: BulkMoveOperation, errors: string[]): void {
    // targetFolderId can be null (root folder), so we only check if it's defined
    if (operation.targetFolderId !== null && operation.targetFolderId !== undefined) {
      if (typeof operation.targetFolderId !== 'string' || operation.targetFolderId.trim().length === 0) {
        errors.push('Target folder ID must be a valid string or null');
      }
    }
  }

  /** Validate delete operation */
  private static validateDeleteOperation(operation: BulkDeleteOperation, errors: string[]): void {
    if (typeof operation.confirmationRequired !== 'boolean') {
      errors.push('Confirmation required must be a boolean');
    }
  }

  /** Validate tag operation */
  private static validateTagOperation(operation: BulkTagOperation, errors: string[]): void {
    if (!Array.isArray(operation.tagIds) || operation.tagIds.length === 0) {
      errors.push('Tag IDs array cannot be empty');
    } else {
      const invalidTagIds = operation.tagIds.filter(id => !id || typeof id !== 'string' || id.trim().length === 0);
      if (invalidTagIds.length > 0) {
        errors.push(`Found ${invalidTagIds.length} invalid tag IDs`);
      }
    }
  }

  /** Validate download operation */
  private static validateDownloadOperation(operation: BulkDownloadOperation, errors: string[]): void {
    if (!['individual', 'zip'].includes(operation.format)) {
      errors.push('Download format must be "individual" or "zip"');
    }
    if (typeof operation.includeMetadata !== 'boolean') {
      errors.push('Include metadata must be a boolean');
    }
  }

  /** Validate copy operation */
  private static validateCopyOperation(operation: BulkCopyOperation, errors: string[]): void {
    // targetFolderId can be null (root folder), so we only check if it's defined
    if (operation.targetFolderId !== null && operation.targetFolderId !== undefined) {
      if (typeof operation.targetFolderId !== 'string' || operation.targetFolderId.trim().length === 0) {
        errors.push('Target folder ID must be a valid string or null');
      }
    }
    if (typeof operation.preserveStructure !== 'boolean') {
      errors.push('Preserve structure must be a boolean');
    }
  }
} 
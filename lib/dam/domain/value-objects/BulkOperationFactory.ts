import {
  BulkOperation,
  BulkMoveOperation,
  BulkDeleteOperation,
  BulkTagOperation,
  BulkDownloadOperation,
  BulkCopyOperation
} from './BulkOperation';

/**
 * Bulk Operation Factory - Domain Service for creating bulk operations.
 * Follows DDD principles with focused responsibility on object creation.
 */
export class BulkOperationFactory {
  /** Create a bulk move operation */
  static createMoveOperation(
    targetFolderId: string | null,
    operationId?: string
  ): BulkMoveOperation {
    return {
      type: 'move',
      targetFolderId,
      timestamp: new Date(),
      operationId: operationId || crypto.randomUUID()
    };
  }

  /** Create a bulk delete operation */
  static createDeleteOperation(
    confirmationRequired: boolean = true,
    operationId?: string
  ): BulkDeleteOperation {
    return {
      type: 'delete',
      confirmationRequired,
      timestamp: new Date(),
      operationId: operationId || crypto.randomUUID()
    };
  }

  /** Create a bulk add tags operation */
  static createAddTagsOperation(
    tagIds: string[],
    operationId?: string
  ): BulkTagOperation {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      throw new Error('Tag IDs array cannot be empty for add tags operation');
    }

    // Remove duplicates and validate
    const validTagIds = [...new Set(tagIds.filter(id => id && id.trim().length > 0))];
    
    if (validTagIds.length === 0) {
      throw new Error('No valid tag IDs provided');
    }

    return {
      type: 'addTags',
      tagIds: validTagIds,
      timestamp: new Date(),
      operationId: operationId || crypto.randomUUID()
    };
  }

  /** Create a bulk remove tags operation */
  static createRemoveTagsOperation(
    tagIds: string[],
    operationId?: string
  ): BulkTagOperation {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      throw new Error('Tag IDs array cannot be empty for remove tags operation');
    }

    // Remove duplicates and validate
    const validTagIds = [...new Set(tagIds.filter(id => id && id.trim().length > 0))];
    
    if (validTagIds.length === 0) {
      throw new Error('No valid tag IDs provided');
    }

    return {
      type: 'removeTags',
      tagIds: validTagIds,
      timestamp: new Date(),
      operationId: operationId || crypto.randomUUID()
    };
  }

  /** Create a bulk download operation */
  static createDownloadOperation(
    format: 'individual' | 'zip' = 'zip',
    includeMetadata: boolean = false,
    operationId?: string
  ): BulkDownloadOperation {
    return {
      type: 'download',
      format,
      includeMetadata,
      timestamp: new Date(),
      operationId: operationId || crypto.randomUUID()
    };
  }

  /** Create a bulk copy operation */
  static createCopyOperation(
    targetFolderId: string | null,
    preserveStructure: boolean = true,
    operationId?: string
  ): BulkCopyOperation {
    return {
      type: 'copy',
      targetFolderId,
      preserveStructure,
      timestamp: new Date(),
      operationId: operationId || crypto.randomUUID()
    };
  }
} 
/**
 * Bulk Operation Value Objects - Domain Layer
 * Core types and interfaces for bulk operations on assets and folders.
 */

export type BulkOperationType = 'move' | 'delete' | 'addTags' | 'removeTags' | 'download' | 'copy';

/**
 * Base interface for all bulk operations
 */
export interface BaseBulkOperation {
  type: BulkOperationType;
  timestamp: Date;
  operationId: string;
}

/**
 * Bulk Move Operation
 */
export interface BulkMoveOperation extends BaseBulkOperation {
  type: 'move';
  targetFolderId: string | null; // null means root folder
}

/**
 * Bulk Delete Operation
 */
export interface BulkDeleteOperation extends BaseBulkOperation {
  type: 'delete';
  confirmationRequired: boolean;
}

/**
 * Bulk Tag Operations (Add/Remove)
 */
export interface BulkTagOperation extends BaseBulkOperation {
  type: 'addTags' | 'removeTags';
  tagIds: string[];
}

/**
 * Bulk Download Operation
 */
export interface BulkDownloadOperation extends BaseBulkOperation {
  type: 'download';
  format: 'individual' | 'zip';
  includeMetadata: boolean;
}

/**
 * Bulk Copy Operation
 */
export interface BulkCopyOperation extends BaseBulkOperation {
  type: 'copy';
  targetFolderId: string | null; // null means root folder
  preserveStructure: boolean;
}

/**
 * Union type for all bulk operations
 */
export type BulkOperation = 
  | BulkMoveOperation 
  | BulkDeleteOperation 
  | BulkTagOperation 
  | BulkDownloadOperation 
  | BulkCopyOperation; 
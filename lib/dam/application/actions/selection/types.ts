/**
 * Domain types for selection actions
 * 
 * Single Responsibility: Type definitions and domain modeling
 * Following DDD principles with clear value objects and DTOs
 */

// Common Response Types
export interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

export interface SelectionActionResult extends ActionResult {
  readonly selection?: { selectedAssets: string[]; selectedFolders: string[] };
}

export interface DownloadActionResult extends ActionResult {
  readonly downloadUrls?: string[];
  readonly zipBase64?: string;
  readonly zipFileName?: string;
}

// Request Value Objects
export interface SelectionUpdateRequest {
  readonly action: string;
  readonly itemId: string;
  readonly itemType: 'asset' | 'folder';
  readonly selectionData: string;
}

export interface BulkOperationRequest {
  readonly assetIds: string[];
  readonly folderIds: string[];
  readonly organizationId: string;
  readonly userId: string;
}

export interface BulkMoveRequest extends BulkOperationRequest {
  readonly targetFolderId: string | null;
}

export interface BulkDeleteRequest extends BulkOperationRequest {
  readonly confirmationRequired: boolean;
}

export interface BulkTagRequest extends BulkOperationRequest {
  readonly tagIds: string[];
  readonly operation: 'add' | 'remove';
}

export interface BulkDownloadRequest extends BulkOperationRequest {
  readonly format: 'individual' | 'zip';
}

// Authentication Context
export interface AuthenticatedContext {
  readonly user: { id: string; email: string };
  readonly organizationId: string;
}

// Form Data Extraction Results
export interface ExtractedFormData<T> {
  readonly isValid: boolean;
  readonly data?: T;
  readonly errors: string[];
} 
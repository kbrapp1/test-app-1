/**
 * Domain Service: Download Validation
 * 
 * Single Responsibility: Validates download operations according to business rules
 * Encapsulates domain validation logic for bulk download operations
 */

import { ValidationError } from '@/lib/errors/base';
import { BulkOperationValidation } from '../../../../../domain/value-objects/BulkOperationValidation';
import { BulkOperationFactory } from '../../../../../domain/value-objects/BulkOperationFactory';
import type { DownloadRequest } from '../types';

export class DownloadValidationService {
  /**
   * Validates a download request according to business rules
   * @param request - The download request to validate
   * @throws ValidationError if validation fails
   */
  static validateRequest(request: DownloadRequest): void {
    // Validate required fields
    if (!request.organizationId) {
      throw new ValidationError('Organization ID is required');
    }
    
    if (!request.userId) {
      throw new ValidationError('User ID is required');
    }
    
    if (request.assetIds.length === 0 && request.folderIds.length === 0) {
      throw new ValidationError('At least one asset or folder must be selected for download');
    }
    
    if (!['zip', 'individual'].includes(request.format)) {
      throw new ValidationError('Format must be either "zip" or "individual"');
    }

    // Validate using domain value objects
    const downloadOperation = BulkOperationFactory.createDownloadOperation(
      request.format, 
      request.includeMetadata
    );
    
    const operationValidation = BulkOperationValidation.validateOperation(downloadOperation);
    if (!operationValidation.isValid) {
      throw new ValidationError(`Invalid download operation: ${operationValidation.errors.join(', ')}`);
    }

    const selectionValidation = BulkOperationValidation.isValidForSelection(
      downloadOperation, 
      request.assetIds, 
      request.folderIds
    );
    if (!selectionValidation.isValid) {
      throw new ValidationError(`Invalid selection for download: ${selectionValidation.errors.join(', ')}`);
    }
  }

  /**
   * Determines the selection type for download operations
   * @param assetCount - Number of selected assets
   * @param folderCount - Number of selected folders
   * @returns Selection type classification
   */
  static determineSelectionType(assetCount: number, folderCount: number): 'assets' | 'folders' | 'mixed' {
    if (assetCount > 0 && folderCount > 0) {
      return 'mixed';
    } else if (folderCount > 0) {
      return 'folders';
    } else {
      return 'assets';
    }
  }

  /**
   * Checks if single asset download should be used instead of ZIP
   * @param assetCount - Number of assets to download
   * @param folderCount - Number of folders selected
   * @returns True if single download should be used
   */
  static shouldUseSingleDownload(assetCount: number, folderCount: number): boolean {
    return assetCount === 1 && folderCount === 0;
  }
} 
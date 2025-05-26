/**
 * Domain Service: Form Data Extraction
 * 
 * Single Responsibility: Extracts and validates form data for selection actions
 * Encapsulates form parsing and validation logic
 */

import type {
  ExtractedFormData,
  SelectionUpdateRequest,
  BulkMoveRequest,
  BulkDeleteRequest,
  BulkTagRequest,
  BulkDownloadRequest
} from '../types';

export class FormDataExtractionService {
  /**
   * Extracts selection update data from FormData
   * @param formData - Form data to extract from
   * @returns Extracted and validated selection update request
   */
  static extractSelectionUpdate(formData: FormData): ExtractedFormData<SelectionUpdateRequest> {
    const errors: string[] = [];
    
    const action = formData.get('action') as string;
    const itemId = formData.get('itemId') as string;
    const itemType = formData.get('itemType') as 'asset' | 'folder';
    const selectionData = formData.get('selectionData') as string;

    if (!action) {
      errors.push('Action is required');
    }

    if (!itemId) {
      errors.push('Item ID is required');
    }

    if (!itemType || !['asset', 'folder'].includes(itemType)) {
      errors.push('Valid item type is required');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        action,
        itemId,
        itemType,
        selectionData: selectionData || ''
      },
      errors: []
    };
  }

  /**
   * Extracts bulk move data from FormData
   * @param formData - Form data to extract from
   * @param context - Authenticated context
   * @returns Extracted and validated bulk move request
   */
  static extractBulkMove(formData: FormData, context: { userId: string; organizationId: string }): ExtractedFormData<BulkMoveRequest> {
    const errors: string[] = [];
    
    const assetIdsStr = formData.get('assetIds') as string;
    const folderIdsStr = formData.get('folderIds') as string;
    const targetFolderIdStr = formData.get('targetFolderId') as string;

    let assetIds: string[] = [];
    let folderIds: string[] = [];

    try {
      assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
      folderIds = folderIdsStr ? JSON.parse(folderIdsStr) : [];
    } catch {
      errors.push('Invalid JSON format for asset or folder IDs');
    }

    if (assetIds.length === 0 && folderIds.length === 0) {
      errors.push('No items selected for move');
    }

    const targetFolderId = targetFolderIdStr === 'null' ? null : (targetFolderIdStr || null);

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        assetIds,
        folderIds,
        targetFolderId,
        organizationId: context.organizationId,
        userId: context.userId
      },
      errors: []
    };
  }

  /**
   * Extracts bulk delete data from FormData
   * @param formData - Form data to extract from
   * @param context - Authenticated context
   * @returns Extracted and validated bulk delete request
   */
  static extractBulkDelete(formData: FormData, context: { userId: string; organizationId: string }): ExtractedFormData<BulkDeleteRequest> {
    const errors: string[] = [];
    
    const assetIdsStr = formData.get('assetIds') as string;
    const folderIdsStr = formData.get('folderIds') as string;

    let assetIds: string[] = [];
    let folderIds: string[] = [];

    try {
      assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
      folderIds = folderIdsStr ? JSON.parse(folderIdsStr) : [];
    } catch {
      errors.push('Invalid JSON format for asset or folder IDs');
    }

    if (assetIds.length === 0 && folderIds.length === 0) {
      errors.push('No items selected for deletion');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        assetIds,
        folderIds,
        organizationId: context.organizationId,
        userId: context.userId,
        confirmationRequired: false // Already confirmed in UI
      },
      errors: []
    };
  }

  /**
   * Extracts bulk tag data from FormData
   * @param formData - Form data to extract from
   * @param context - Authenticated context
   * @returns Extracted and validated bulk tag request
   */
  static extractBulkTag(formData: FormData, context: { userId: string; organizationId: string }): ExtractedFormData<BulkTagRequest> {
    const errors: string[] = [];
    
    const assetIdsStr = formData.get('assetIds') as string;
    const tagIdsStr = formData.get('tagIds') as string;
    const operation = formData.get('operation') as 'add' | 'remove';

    let assetIds: string[] = [];
    let tagIds: string[] = [];

    try {
      assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
      tagIds = tagIdsStr ? JSON.parse(tagIdsStr) : [];
    } catch {
      errors.push('Invalid JSON format for asset or tag IDs');
    }

    if (assetIds.length === 0) {
      errors.push('No assets selected for tagging');
    }

    if (tagIds.length === 0) {
      errors.push('No tags selected');
    }

    if (!operation || !['add', 'remove'].includes(operation)) {
      errors.push('Invalid tag operation');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        assetIds,
        folderIds: [], // Tags are only applied to assets
        tagIds,
        operation,
        organizationId: context.organizationId,
        userId: context.userId
      },
      errors: []
    };
  }

  /**
   * Extracts bulk download data from FormData
   * @param formData - Form data to extract from
   * @param context - Authenticated context
   * @returns Extracted and validated bulk download request
   */
  static extractBulkDownload(formData: FormData, context: { userId: string; organizationId: string }): ExtractedFormData<BulkDownloadRequest> {
    const errors: string[] = [];
    
    const assetIdsStr = formData.get('assetIds') as string;
    const folderIdsStr = formData.get('folderIds') as string;
    const format = (formData.get('format') as 'individual' | 'zip') || 'zip';

    let assetIds: string[] = [];
    let folderIds: string[] = [];

    try {
      assetIds = assetIdsStr ? JSON.parse(assetIdsStr) : [];
      folderIds = folderIdsStr ? JSON.parse(folderIdsStr) : [];
    } catch {
      errors.push('Invalid JSON format for asset or folder IDs');
    }

    if (assetIds.length === 0 && folderIds.length === 0) {
      errors.push('No assets or folders selected for download');
    }

    if (!['individual', 'zip'].includes(format)) {
      errors.push('Invalid download format');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        assetIds,
        folderIds,
        format,
        organizationId: context.organizationId,
        userId: context.userId
      },
      errors: []
    };
  }
} 
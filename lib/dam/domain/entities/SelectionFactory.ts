import { Selection, SelectionMode } from './Selection';

/**
 * SelectionFactory - Domain Factory
 * 
 * Provides factory methods for creating Selection entities with proper validation
 * and business rule enforcement.
 */
export class SelectionFactory {
  /**
   * Create an empty selection
   */
  static createEmpty(id?: string): Selection {
    return Selection.createEmpty(id);
  }

  /**
   * Create selection with specific mode
   */
  static createWithMode(mode: SelectionMode, id?: string): Selection {
    return Selection.createWithMode(mode, id);
  }

  /**
   * Create selection from existing IDs with validation
   */
  static createFromIds(
    assetIds: string[],
    folderIds: string[],
    id?: string
  ): Selection {
    // Validate input arrays
    if (!Array.isArray(assetIds) || !Array.isArray(folderIds)) {
      throw new Error('Asset IDs and folder IDs must be arrays');
    }

    // Remove duplicates and filter out empty strings
    const validAssetIds = [...new Set(assetIds.filter(id => id && id.trim().length > 0))];
    const validFolderIds = [...new Set(folderIds.filter(id => id && id.trim().length > 0))];

    // Check for overlap between asset and folder IDs
    const assetIdSet = new Set(validAssetIds);
    const folderIdSet = new Set(validFolderIds);
    const overlap = validAssetIds.some(id => folderIdSet.has(id));
    
    if (overlap) {
      throw new Error('Asset IDs and folder IDs cannot overlap');
    }

    return Selection.createFromIds(validAssetIds, validFolderIds, id);
  }

  /**
   * Create selection for single asset
   */
  static createSingleAsset(assetId: string, id?: string): Selection {
    if (!assetId || assetId.trim().length === 0) {
      throw new Error('Asset ID cannot be empty');
    }

    return Selection.createFromIds([assetId], [], id);
  }

  /**
   * Create selection for single folder
   */
  static createSingleFolder(folderId: string, id?: string): Selection {
    if (!folderId || folderId.trim().length === 0) {
      throw new Error('Folder ID cannot be empty');
    }

    return Selection.createFromIds([], [folderId], id);
  }

  /**
   * Create selection for multiple assets
   */
  static createMultipleAssets(assetIds: string[], id?: string): Selection {
    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      throw new Error('Asset IDs array cannot be empty');
    }

    return this.createFromIds(assetIds, [], id);
  }

  /**
   * Create selection for multiple folders
   */
  static createMultipleFolders(folderIds: string[], id?: string): Selection {
    if (!Array.isArray(folderIds) || folderIds.length === 0) {
      throw new Error('Folder IDs array cannot be empty');
    }

    return this.createFromIds([], folderIds, id);
  }

  /**
   * Create selection for mixed items (assets and folders)
   */
  static createMixed(assetIds: string[], folderIds: string[], id?: string): Selection {
    if ((!assetIds || assetIds.length === 0) && (!folderIds || folderIds.length === 0)) {
      throw new Error('At least one asset or folder ID must be provided');
    }

    return this.createFromIds(assetIds || [], folderIds || [], id);
  }

  /**
   * Validate selection creation parameters
   */
  static validateCreationParams(assetIds: string[], folderIds: string[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if arrays are valid
    if (!Array.isArray(assetIds)) {
      errors.push('Asset IDs must be an array');
    }

    if (!Array.isArray(folderIds)) {
      errors.push('Folder IDs must be an array');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Check for empty or invalid IDs
    const invalidAssetIds = assetIds.filter(id => !id || id.trim().length === 0);
    if (invalidAssetIds.length > 0) {
      errors.push(`Found ${invalidAssetIds.length} invalid asset IDs`);
    }

    const invalidFolderIds = folderIds.filter(id => !id || id.trim().length === 0);
    if (invalidFolderIds.length > 0) {
      errors.push(`Found ${invalidFolderIds.length} invalid folder IDs`);
    }

    // Check for duplicates within arrays
    const uniqueAssetIds = new Set(assetIds);
    if (uniqueAssetIds.size !== assetIds.length) {
      errors.push('Duplicate asset IDs found');
    }

    const uniqueFolderIds = new Set(folderIds);
    if (uniqueFolderIds.size !== folderIds.length) {
      errors.push('Duplicate folder IDs found');
    }

    // Check for overlap between asset and folder IDs
    const assetIdSet = new Set(assetIds);
    const folderIdSet = new Set(folderIds);
    const overlap = assetIds.some(id => folderIdSet.has(id));
    
    if (overlap) {
      errors.push('Asset IDs and folder IDs cannot overlap');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create selection with validation and error handling
   */
  static createSafe(
    assetIds: string[],
    folderIds: string[],
    id?: string
  ): { selection: Selection | null; errors: string[] } {
    const validation = this.validateCreationParams(assetIds, folderIds);
    
    if (!validation.isValid) {
      return {
        selection: null,
        errors: validation.errors
      };
    }

    try {
      const selection = this.createFromIds(assetIds, folderIds, id);
      return {
        selection,
        errors: []
      };
    } catch (error) {
      return {
        selection: null,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }
} 
import { Selection } from '../entities/Selection';

/**
 * Selection Validator Domain Service - Handles validation logic for Selection entities.
 * Follows DDD principles with focused responsibility.
 */
export class SelectionValidator {
  /** Validate selection consistency */
  static isValid(selection: Selection): boolean {
    // Check for duplicate IDs between assets and folders
    const assetArray = Array.from(selection.selectedAssetIds);
    const folderArray = Array.from(selection.selectedFolderIds);
    const allIds = [...assetArray, ...folderArray];
    const uniqueIds = new Set(allIds);
    
    if (allIds.length !== uniqueIds.size) {
      return false;
    }

    // Check selection mode consistency
    const totalCount = selection.getSelectedCount();
    const mode = selection.selectionMode;
    
    // Allow 'multiple' mode even with 0 items (valid when in selection mode)
    if (mode === 'multiple') {
      return true;
    }
    
    // For other modes, check strict consistency
    const expectedMode = this.determineExpectedMode(totalCount);
    return mode === expectedMode;
  }

  /** Get selection summary for debugging */
  static getSummary(selection: Selection): {
    id: string;
    mode: string;
    assetCount: number;
    folderCount: number;
    totalCount: number;
    lastSelected: { id: string | null; type: string | null };
    isValid: boolean;
  } {
    return {
      id: selection.id,
      mode: selection.selectionMode,
      assetCount: selection.selectedAssetIds.size,
      folderCount: selection.selectedFolderIds.size,
      totalCount: selection.getSelectedCount(),
      lastSelected: {
        id: selection.lastSelectedId,
        type: selection.lastSelectedType
      },
      isValid: this.isValid(selection)
    };
  }

  /** Determine expected selection mode based on count */
  private static determineExpectedMode(totalCount: number): string {
    if (totalCount === 0) return 'none';
    if (totalCount === 1) return 'single';
    return 'multiple';
  }
} 
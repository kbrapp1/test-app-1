import { Selection } from '../entities/Selection';
import { Asset } from '../entities/Asset';
import { Folder } from '../entities/Folder';

/**
 * Selection Operations Domain Service - Handles complex selection operations.
 * Follows DDD principles with focused responsibility.
 */
export class SelectionOperations {
  /** Select range of items between two IDs */
  static selectRange(
    selection: Selection,
    startId: string,
    endId: string,
    items: Array<Asset | Folder>
  ): Selection {
    if (!selection.lastSelectedId || selection.selectionMode === 'single') {
      return selection;
    }

    const startIndex = items.findIndex(item => item.id === startId);
    const endIndex = items.findIndex(item => item.id === endId);
    
    if (startIndex === -1 || endIndex === -1) {
      return selection;
    }

    const rangeStart = Math.min(startIndex, endIndex);
    const rangeEnd = Math.max(startIndex, endIndex);
    const rangeItems = items.slice(rangeStart, rangeEnd + 1);

    let newSelection: Selection = selection;
    for (const item of rangeItems) {
      if ('mimeType' in item) {
        newSelection = newSelection.addAsset(item.id);
      } else {
        newSelection = newSelection.addFolder(item.id);
      }
    }

    return newSelection;
  }

  /** Select all items from a list */
  static selectAll(
    selection: Selection,
    items: Array<Asset | Folder>
  ): Selection {
    const assetIds = items
      .filter(item => 'mimeType' in item)
      .map(item => item.id);
    
    const folderIds = items
      .filter(item => !('mimeType' in item))
      .map(item => item.id);

    return Selection.createFromIds(assetIds, folderIds, selection.id);
  }

  /** Toggle multiple items at once */
  static toggleMultiple(
    selection: Selection,
    assetIds: string[] = [],
    folderIds: string[] = []
  ): Selection {
    let newSelection = selection;

    // Toggle assets
    for (const assetId of assetIds) {
      newSelection = newSelection.toggleAsset(assetId);
    }

    // Toggle folders
    for (const folderId of folderIds) {
      newSelection = newSelection.toggleFolder(folderId);
    }

    return newSelection;
  }

  /** Add multiple items at once */
  static addMultiple(
    selection: Selection,
    assetIds: string[] = [],
    folderIds: string[] = []
  ): Selection {
    let newSelection = selection;

    // Add assets
    for (const assetId of assetIds) {
      newSelection = newSelection.addAsset(assetId);
    }

    // Add folders
    for (const folderId of folderIds) {
      newSelection = newSelection.addFolder(folderId);
    }

    return newSelection;
  }

  /** Remove multiple items at once */
  static removeMultiple(
    selection: Selection,
    assetIds: string[] = [],
    folderIds: string[] = []
  ): Selection {
    let newSelection = selection;

    // Remove assets
    for (const assetId of assetIds) {
      newSelection = newSelection.removeAsset(assetId);
    }

    // Remove folders
    for (const folderId of folderIds) {
      newSelection = newSelection.removeFolder(folderId);
    }

    return newSelection;
  }
} 
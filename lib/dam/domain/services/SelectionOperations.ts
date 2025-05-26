import { Selection } from '../entities/Selection';
import { Asset } from '../entities/Asset';
import { Folder } from '../entities/Folder';

// Type for presentation layer DTOs
type GalleryItemDto = 
  | { type: 'folder'; id: string; name: string; createdAt: Date; }
  | { type: 'asset'; id: string; name: string; createdAt: Date; mimeType: string; publicUrl?: string; size: number; userId: string; userFullName?: string | null; tags?: { id: string; name: string; color: string; }[]; folderName?: string | null; };

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
  ): Selection;
  static selectAll(
    selection: Selection,
    items: GalleryItemDto[]
  ): Selection;
  static selectAll(
    selection: Selection,
    items: Array<Asset | Folder> | GalleryItemDto[]
  ): Selection {
    if (items.length === 0) return selection;
    
    // Check if it's DTO format
    const isDto = 'type' in items[0];
    
    if (isDto) {
      const dtoItems = items as GalleryItemDto[];
      const assetIds = dtoItems
        .filter(item => item.type === 'asset')
        .map(item => item.id);
      
      const folderIds = dtoItems
        .filter(item => item.type === 'folder')
        .map(item => item.id);

      return Selection.createFromIds(assetIds, folderIds, selection.id);
    } else {
      const domainItems = items as Array<Asset | Folder>;
      const assetIds = domainItems
        .filter(item => 'mimeType' in item)
        .map(item => item.id);
      
      const folderIds = domainItems
        .filter(item => !('mimeType' in item))
        .map(item => item.id);

      return Selection.createFromIds(assetIds, folderIds, selection.id);
    }
  }

  /** Select all files (assets) from a list */
  static selectAllFiles(
    selection: Selection,
    items: Array<Asset | Folder>
  ): Selection;
  static selectAllFiles(
    selection: Selection,
    items: GalleryItemDto[]
  ): Selection;
  static selectAllFiles(
    selection: Selection,
    items: Array<Asset | Folder> | GalleryItemDto[]
  ): Selection {
    if (items.length === 0) return selection;
    
    // Check if it's DTO format
    const isDto = 'type' in items[0];
    
    if (isDto) {
      const dtoItems = items as GalleryItemDto[];
      const assetIds = dtoItems
        .filter(item => item.type === 'asset')
        .map(item => item.id);
      
      return Selection.createFromIds(assetIds, [], selection.id);
    } else {
      const domainItems = items as Array<Asset | Folder>;
      const assetIds = domainItems
        .filter(item => 'mimeType' in item)
        .map(item => item.id);
      
      return Selection.createFromIds(assetIds, [], selection.id);
    }
  }

  /** Select all folders from a list */
  static selectAllFolders(
    selection: Selection,
    items: Array<Asset | Folder>
  ): Selection;
  static selectAllFolders(
    selection: Selection,
    items: GalleryItemDto[]
  ): Selection;
  static selectAllFolders(
    selection: Selection,
    items: Array<Asset | Folder> | GalleryItemDto[]
  ): Selection {
    if (items.length === 0) return selection;
    
    // Check if it's DTO format
    const isDto = 'type' in items[0];
    
    if (isDto) {
      const dtoItems = items as GalleryItemDto[];
      const folderIds = dtoItems
        .filter(item => item.type === 'folder')
        .map(item => item.id);

      return Selection.createFromIds([], folderIds, selection.id);
    } else {
      const domainItems = items as Array<Asset | Folder>;
      const folderIds = domainItems
        .filter(item => !('mimeType' in item))
        .map(item => item.id);

      return Selection.createFromIds([], folderIds, selection.id);
    }
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
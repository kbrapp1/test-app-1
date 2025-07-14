import { Asset as _Asset } from './Asset';
import { Folder as _Folder } from './Folder';
import { BulkOperation as _BulkOperation } from '../value-objects/BulkOperation';

export type SelectionMode = 'none' | 'single' | 'multiple';
export type ItemType = 'asset' | 'folder';

/**
 * Selection Domain Entity - Core selection state management for assets and folders.
 * Follows DDD principles with immutable operations.
 */
export class Selection {
  private constructor(
    public readonly id: string,
    public readonly selectedAssetIds: Set<string>,
    public readonly selectedFolderIds: Set<string>,
    public readonly selectionMode: SelectionMode,
    public readonly lastSelectedId: string | null,
    public readonly lastSelectedType: ItemType | null
  ) {}

  /** Create a new empty selection */
  static createEmpty(id: string = crypto.randomUUID()): Selection {
    return new Selection(
      id,
      new Set<string>(),
      new Set<string>(),
      'none',
      null,
      null
    );
  }

  /** Create selection with specific mode */
  static createWithMode(mode: SelectionMode, id: string = crypto.randomUUID()): Selection {
    return new Selection(
      id,
      new Set<string>(),
      new Set<string>(),
      mode,
      null,
      null
    );
  }

  /** Create selection from existing IDs */
  static createFromIds(
    assetIds: string[],
    folderIds: string[],
    id: string = crypto.randomUUID()
  ): Selection {
    const mode: SelectionMode = (assetIds.length + folderIds.length) > 1 ? 'multiple' : 
                               (assetIds.length + folderIds.length) === 1 ? 'single' : 'none';
    
    return new Selection(
      id,
      new Set(assetIds),
      new Set(folderIds),
      mode,
      null,
      null
    );
  }

  /** Add asset to selection */
  addAsset(assetId: string): Selection {
    return this.addItem(assetId, 'asset');
  }

  /** Remove asset from selection */
  removeAsset(assetId: string): Selection {
    return this.removeItem(assetId, 'asset');
  }

  /** Add folder to selection */
  addFolder(folderId: string): Selection {
    return this.addItem(folderId, 'folder');
  }

  /** Remove folder from selection */
  removeFolder(folderId: string): Selection {
    return this.removeItem(folderId, 'folder');
  }

  /** Toggle asset selection */
  toggleAsset(assetId: string): Selection {
    return this.selectedAssetIds.has(assetId) 
      ? this.removeAsset(assetId)
      : this.addAsset(assetId);
  }

  /** Toggle folder selection */
  toggleFolder(folderId: string): Selection {
    return this.selectedFolderIds.has(folderId)
      ? this.removeFolder(folderId)
      : this.addFolder(folderId);
  }

  /** Clear all selections */
  clearSelection(): Selection {
    return new Selection(
      this.id,
      new Set<string>(),
      new Set<string>(),
      'none',
      null,
      null
    );
  }

  /** Check if asset is selected */
  isAssetSelected(assetId: string): boolean {
    return this.selectedAssetIds.has(assetId);
  }

  /** Check if folder is selected */
  isFolderSelected(folderId: string): boolean {
    return this.selectedFolderIds.has(folderId);
  }

  /** Get total selected items count */
  getSelectedCount(): number {
    return this.selectedAssetIds.size + this.selectedFolderIds.size;
  }

  /** Get selected asset IDs as array */
  getSelectedAssets(): string[] {
    return Array.from(this.selectedAssetIds);
  }

  /** Get selected folder IDs as array */
  getSelectedFolders(): string[] {
    return Array.from(this.selectedFolderIds);
  }

  /** Check if any items are selected */
  hasSelection(): boolean {
    return this.getSelectedCount() > 0;
  }

  /** Set selection mode */
  setSelectionMode(mode: SelectionMode): Selection {
    if (mode === this.selectionMode) {
      return this;
    }

    if (mode === 'single' && this.getSelectedCount() > 1) {
      return new Selection(
        this.id,
        new Set<string>(),
        new Set<string>(),
        mode,
        null,
        null
      );
    }

    if (mode === 'none') {
      return this.clearSelection();
    }

    return new Selection(
      this.id,
      this.selectedAssetIds,
      this.selectedFolderIds,
      mode,
      this.lastSelectedId,
      this.lastSelectedType
    );
  }

  /** Add item to selection (private helper) */
  private addItem(itemId: string, itemType: ItemType): Selection {
    const isAsset = itemType === 'asset';
    const currentSet = isAsset ? this.selectedAssetIds : this.selectedFolderIds;
    const otherSet = isAsset ? this.selectedFolderIds : this.selectedAssetIds;

    if (currentSet.has(itemId)) {
      return this;
    }

    const newCurrentSet = new Set(currentSet);
    newCurrentSet.add(itemId);

    // In single mode, clear other selections when adding new item
    const newOtherSet = this.selectionMode === 'single' ? new Set<string>() : otherSet;
    const newMode = this.determineSelectionMode(newCurrentSet.size + newOtherSet.size);

    return new Selection(
      this.id,
      isAsset ? newCurrentSet : newOtherSet,
      isAsset ? newOtherSet : newCurrentSet,
      newMode,
      itemId,
      itemType
    );
  }

  /** Remove item from selection (private helper) */
  private removeItem(itemId: string, itemType: ItemType): Selection {
    const isAsset = itemType === 'asset';
    const currentSet = isAsset ? this.selectedAssetIds : this.selectedFolderIds;
    const otherSet = isAsset ? this.selectedFolderIds : this.selectedAssetIds;

    if (!currentSet.has(itemId)) {
      return this;
    }

    const newCurrentSet = new Set(currentSet);
    newCurrentSet.delete(itemId);

    const totalSelected = newCurrentSet.size + otherSet.size;
    const newMode = this.determineSelectionMode(totalSelected);
    const newLastSelectedId = this.lastSelectedId === itemId ? null : this.lastSelectedId;
    const newLastSelectedType = this.lastSelectedId === itemId ? null : this.lastSelectedType;

    return new Selection(
      this.id,
      isAsset ? newCurrentSet : otherSet,
      isAsset ? otherSet : newCurrentSet,
      newMode,
      newLastSelectedId,
      newLastSelectedType
    );
  }

  /** Determine selection mode based on count */
  private determineSelectionMode(totalCount: number): SelectionMode {
    if (totalCount === 0) return 'none';
    if (totalCount === 1) return 'single';
    return 'multiple';
  }
} 
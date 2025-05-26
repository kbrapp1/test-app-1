import { toast } from 'sonner';

/**
 * Domain service for drag and drop operations
 * Handles the business logic and coordination of drag and drop events
 * 
 * Single Responsibility: Drag and drop business operations
 */
export class DragDropOperations {
  /**
   * Dispatches drag drop update events for UI optimization
   */
  static dispatchDragUpdate(itemId: string, itemType: 'asset' | 'folder'): void {
    window.dispatchEvent(new CustomEvent('damDragDropUpdate', { 
      detail: { 
        itemId, 
        itemType,
        // Legacy support for assets
        assetId: itemType === 'asset' ? itemId : null 
      } 
    }));
  }

  /**
   * Dispatches drag drop clear events to restore UI state
   */
  static dispatchDragClear(itemId: string, itemType: 'asset' | 'folder'): void {
    window.dispatchEvent(new CustomEvent('damDragDropClear', { 
      detail: { 
        itemId, 
        itemType,
        // Legacy support for assets
        assetId: itemType === 'asset' ? itemId : null 
      } 
    }));
  }

  /**
   * Dispatches selection request to get current selection state
   */
  static requestCurrentSelection(): void {
    const selectionEvent = new CustomEvent('damGetSelection');
    window.dispatchEvent(selectionEvent);
  }

  /**
   * Dispatches global data refresh event
   */
  static refreshGlobalData(): void {
    window.dispatchEvent(new CustomEvent('damDataRefresh'));
  }

  /**
   * Shows appropriate toast notifications for drag and drop results
   */
  static showToast(toastData: { variant?: 'destructive'; title: string; description?: string }): void {
    if (toastData.variant === 'destructive') {
      toast.error(toastData.title, { description: toastData.description });
    } else {
      toast.success(toastData.title, { description: toastData.description });
    }
  }

  /**
   * Determines if a dragged item is part of a bulk operation
   */
  static isBulkOperation(
    activeItemId: string | null,
    activeItemType: 'asset' | 'folder' | null,
    selectedAssets: string[],
    selectedFolders: string[]
  ): boolean {
    if (!activeItemId || !activeItemType) return false;
    
    const isDraggedItemSelected = (activeItemType === 'asset' && selectedAssets.includes(activeItemId)) ||
                                  (activeItemType === 'folder' && selectedFolders.includes(activeItemId));
    
    return isDraggedItemSelected && (selectedAssets.length + selectedFolders.length > 1);
  }

  /**
   * Gets all items involved in a drag operation (single or bulk)
   */
  static getDragOperationItems(
    activeItemId: string | null,
    activeItemType: 'asset' | 'folder' | null,
    selectedAssets: string[],
    selectedFolders: string[],
    isBulkOperation: boolean
  ): Array<{ itemId: string; itemType: 'asset' | 'folder' }> {
    if (isBulkOperation) {
      return [
        ...selectedAssets.map(id => ({ itemId: id, itemType: 'asset' as const })),
        ...selectedFolders.map(id => ({ itemId: id, itemType: 'folder' as const }))
      ];
    } else if (activeItemId && activeItemType) {
      return [{ itemId: activeItemId, itemType: activeItemType }];
    }
    return [];
  }

  /**
   * Processes drag update for all relevant items
   */
  static processDragUpdate(
    activeItemId: string | null,
    activeItemType: 'asset' | 'folder' | null,
    selectedAssets: string[],
    selectedFolders: string[]
  ): void {
    const isBulk = this.isBulkOperation(activeItemId, activeItemType, selectedAssets, selectedFolders);
    const items = this.getDragOperationItems(activeItemId, activeItemType, selectedAssets, selectedFolders, isBulk);
    
    items.forEach(({ itemId, itemType }) => {
      this.dispatchDragUpdate(itemId, itemType);
    });
  }

  /**
   * Processes drag clear for all relevant items
   */
  static processDragClear(
    activeItemId: string | null,
    activeItemType: 'asset' | 'folder' | null,
    selectedAssets: string[],
    selectedFolders: string[]
  ): void {
    const isBulk = this.isBulkOperation(activeItemId, activeItemType, selectedAssets, selectedFolders);
    const items = this.getDragOperationItems(activeItemId, activeItemType, selectedAssets, selectedFolders, isBulk);
    
    items.forEach(({ itemId, itemType }) => {
      this.dispatchDragClear(itemId, itemType);
    });
  }
} 
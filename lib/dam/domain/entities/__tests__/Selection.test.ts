import { describe, it, expect } from 'vitest';
import { Selection } from '../Selection';
import { SelectionFactory } from '../SelectionFactory';
import { BulkOperationFactory } from '../../value-objects/BulkOperationFactory';
import { SelectionValidator, BulkOperationValidator, SelectionOperations } from '../../services';
import type { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';

describe('Selection Domain Entity', () => {
  describe('Creation', () => {
    it('should create empty selection', () => {
      const selection = Selection.createEmpty();
      
      expect(selection.getSelectedCount()).toBe(0);
      expect(selection.selectionMode).toBe('none');
      expect(selection.hasSelection()).toBe(false);
      expect(SelectionValidator.isValid(selection)).toBe(true);
    });

    it('should create selection with mode', () => {
      const selection = Selection.createWithMode('multiple');
      
      expect(selection.selectionMode).toBe('multiple');
      expect(selection.getSelectedCount()).toBe(0);
    });

    it('should create selection from IDs', () => {
      const selection = Selection.createFromIds(['asset1', 'asset2'], ['folder1']);
      
      expect(selection.getSelectedCount()).toBe(3);
      expect(selection.selectionMode).toBe('multiple');
      expect(selection.getSelectedAssets()).toEqual(['asset1', 'asset2']);
      expect(selection.getSelectedFolders()).toEqual(['folder1']);
    });
  });

  describe('Asset Selection', () => {
    it('should add asset to selection', () => {
      const selection = Selection.createEmpty();
      const newSelection = selection.addAsset('asset1');
      
      expect(newSelection.isAssetSelected('asset1')).toBe(true);
      expect(newSelection.getSelectedCount()).toBe(1);
      expect(newSelection.selectionMode).toBe('single');
    });

    it('should remove asset from selection', () => {
      const selection = Selection.createFromIds(['asset1', 'asset2'], []);
      const newSelection = selection.removeAsset('asset1');
      
      expect(newSelection.isAssetSelected('asset1')).toBe(false);
      expect(newSelection.isAssetSelected('asset2')).toBe(true);
      expect(newSelection.getSelectedCount()).toBe(1);
      expect(newSelection.selectionMode).toBe('single');
    });

    it('should toggle asset selection', () => {
      const selection = Selection.createEmpty();
      
      // Toggle on
      const selected = selection.toggleAsset('asset1');
      expect(selected.isAssetSelected('asset1')).toBe(true);
      
      // Toggle off
      const deselected = selected.toggleAsset('asset1');
      expect(deselected.isAssetSelected('asset1')).toBe(false);
    });
  });

  describe('Folder Selection', () => {
    it('should add folder to selection', () => {
      const selection = Selection.createEmpty();
      const newSelection = selection.addFolder('folder1');
      
      expect(newSelection.isFolderSelected('folder1')).toBe(true);
      expect(newSelection.getSelectedCount()).toBe(1);
      expect(newSelection.selectionMode).toBe('single');
    });

    it('should remove folder from selection', () => {
      const selection = Selection.createFromIds([], ['folder1', 'folder2']);
      const newSelection = selection.removeFolder('folder1');
      
      expect(newSelection.isFolderSelected('folder1')).toBe(false);
      expect(newSelection.isFolderSelected('folder2')).toBe(true);
      expect(newSelection.getSelectedCount()).toBe(1);
    });
  });

  describe('Selection Mode Behavior', () => {
    it('should clear folder selection when adding asset in single mode', () => {
      const selection = Selection.createWithMode('single').addFolder('folder1');
      const newSelection = selection.addAsset('asset1');
      
      expect(newSelection.isFolderSelected('folder1')).toBe(false);
      expect(newSelection.isAssetSelected('asset1')).toBe(true);
      expect(newSelection.getSelectedCount()).toBe(1);
    });

    it('should clear asset selection when adding folder in single mode', () => {
      const selection = Selection.createWithMode('single').addAsset('asset1');
      const newSelection = selection.addFolder('folder1');
      
      expect(newSelection.isAssetSelected('asset1')).toBe(false);
      expect(newSelection.isFolderSelected('folder1')).toBe(true);
      expect(newSelection.getSelectedCount()).toBe(1);
    });

    it('should allow multiple selections in multiple mode', () => {
      const selection = Selection.createWithMode('multiple');
      const newSelection = selection
        .addAsset('asset1')
        .addAsset('asset2')
        .addFolder('folder1');
      
      expect(newSelection.getSelectedCount()).toBe(3);
      expect(newSelection.selectionMode).toBe('multiple');
    });
  });

  describe('Select All and Clear', () => {
    it('should select all items', () => {
      const mockAssets = [
        { id: 'asset1', type: 'asset', name: 'Asset 1', createdAt: new Date(), mimeType: 'image/jpeg', size: 1000, userId: 'user1' },
        { id: 'asset2', type: 'asset', name: 'Asset 2', createdAt: new Date(), mimeType: 'image/png', size: 2000, userId: 'user1' }
      ] as GalleryItemDto[];
      
      const mockFolders = [
        { id: 'folder1', type: 'folder', name: 'Folder 1', createdAt: new Date() }
      ] as GalleryItemDto[];
      
      const items = [...mockAssets, ...mockFolders];
      const selection = Selection.createEmpty();
      const newSelection = SelectionOperations.selectAll(selection, items);
      
      expect(newSelection.getSelectedCount()).toBe(3);
      expect(newSelection.isAssetSelected('asset1')).toBe(true);
      expect(newSelection.isAssetSelected('asset2')).toBe(true);
      expect(newSelection.isFolderSelected('folder1')).toBe(true);
    });

    it('should clear all selections', () => {
      const selection = Selection.createFromIds(['asset1', 'asset2'], ['folder1']);
      const cleared = selection.clearSelection();
      
      expect(cleared.getSelectedCount()).toBe(0);
      expect(cleared.selectionMode).toBe('none');
      expect(cleared.hasSelection()).toBe(false);
    });
  });

  describe('Bulk Operation Validation', () => {
    it('should validate move operation', () => {
      const selection = Selection.createFromIds(['asset1'], []);
      const moveOp = BulkOperationFactory.createMoveOperation('target-folder');
      
      expect(BulkOperationValidator.canPerformOperation(selection, moveOp)).toBe(true);
    });

    it('should validate delete operation', () => {
      const selection = Selection.createFromIds(['asset1'], ['folder1']);
      const deleteOp = BulkOperationFactory.createDeleteOperation();
      
      expect(BulkOperationValidator.canPerformOperation(selection, deleteOp)).toBe(true);
    });

    it('should validate tag operations only for assets', () => {
      const assetSelection = Selection.createFromIds(['asset1'], []);
      const folderSelection = Selection.createFromIds([], ['folder1']);
      const addTagOp = BulkOperationFactory.createAddTagsOperation(['tag1']);
      
      expect(BulkOperationValidator.canPerformOperation(assetSelection, addTagOp)).toBe(true);
      expect(BulkOperationValidator.canPerformOperation(folderSelection, addTagOp)).toBe(false);
    });

    it('should validate download operations for both assets and folders', () => {
      const assetSelection = Selection.createFromIds(['asset1'], []);
      const folderSelection = Selection.createFromIds([], ['folder1']);
      const mixedSelection = Selection.createFromIds(['asset1'], ['folder1']);
      const downloadOp = BulkOperationFactory.createDownloadOperation();
      
      expect(BulkOperationValidator.canPerformOperation(assetSelection, downloadOp)).toBe(true);
      expect(BulkOperationValidator.canPerformOperation(folderSelection, downloadOp)).toBe(true);
      expect(BulkOperationValidator.canPerformOperation(mixedSelection, downloadOp)).toBe(true);
    });

    it('should reject operations with no selection', () => {
      const emptySelection = Selection.createEmpty();
      const moveOp = BulkOperationFactory.createMoveOperation('target-folder');
      
      expect(BulkOperationValidator.canPerformOperation(emptySelection, moveOp)).toBe(false);
    });
  });

  describe('Selection Mode Changes', () => {
    it('should clear selection when switching to none mode', () => {
      const selection = Selection.createFromIds(['asset1'], ['folder1']);
      const newSelection = selection.setSelectionMode('none');
      
      expect(newSelection.getSelectedCount()).toBe(0);
      expect(newSelection.selectionMode).toBe('none');
    });

    it('should clear selection when switching to single mode with multiple items', () => {
      const selection = Selection.createFromIds(['asset1', 'asset2'], []);
      const newSelection = selection.setSelectionMode('single');
      
      expect(newSelection.getSelectedCount()).toBe(0);
      expect(newSelection.selectionMode).toBe('single');
    });

    it('should preserve selection when switching to single mode with one item', () => {
      const selection = Selection.createFromIds(['asset1'], []);
      const newSelection = selection.setSelectionMode('single');
      
      expect(newSelection.getSelectedCount()).toBe(1);
      expect(newSelection.isAssetSelected('asset1')).toBe(true);
      expect(newSelection.selectionMode).toBe('single');
    });
  });

  describe('Validation', () => {
    it('should validate consistent selection', () => {
      const selection = Selection.createFromIds(['asset1', 'asset2'], ['folder1']);
      expect(SelectionValidator.isValid(selection)).toBe(true);
    });

    it('should provide selection summary', () => {
      const selection = Selection.createFromIds(['asset1', 'asset2'], ['folder1']);
      const summary = SelectionValidator.getSummary(selection);
      
      expect(summary.assetCount).toBe(2);
      expect(summary.folderCount).toBe(1);
      expect(summary.totalCount).toBe(3);
      expect(summary.mode).toBe('multiple');
      expect(summary.isValid).toBe(true);
    });
  });
});

describe('SelectionFactory', () => {
  describe('Factory Methods', () => {
    it('should create empty selection', () => {
      const selection = SelectionFactory.createEmpty();
      expect(selection.getSelectedCount()).toBe(0);
    });

    it('should create single asset selection', () => {
      const selection = SelectionFactory.createSingleAsset('asset1');
      expect(selection.isAssetSelected('asset1')).toBe(true);
      expect(selection.getSelectedCount()).toBe(1);
    });

    it('should create single folder selection', () => {
      const selection = SelectionFactory.createSingleFolder('folder1');
      expect(selection.isFolderSelected('folder1')).toBe(true);
      expect(selection.getSelectedCount()).toBe(1);
    });

    it('should create multiple assets selection', () => {
      const selection = SelectionFactory.createMultipleAssets(['asset1', 'asset2']);
      expect(selection.getSelectedCount()).toBe(2);
      expect(selection.selectionMode).toBe('multiple');
    });

    it('should create mixed selection', () => {
      const selection = SelectionFactory.createMixed(['asset1'], ['folder1']);
      expect(selection.getSelectedCount()).toBe(2);
      expect(selection.isAssetSelected('asset1')).toBe(true);
      expect(selection.isFolderSelected('folder1')).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate creation parameters', () => {
      const validation = SelectionFactory.validateCreationParams(['asset1'], ['folder1']);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid parameters', () => {
      const validation = SelectionFactory.validateCreationParams([''], ['folder1']);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should create safe selection with validation', () => {
      const result = SelectionFactory.createSafe(['asset1'], ['folder1']);
      expect(result.selection).toBeTruthy();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle safe creation with invalid data', () => {
      const result = SelectionFactory.createSafe([''], []);
      expect(result.selection).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty asset ID', () => {
      expect(() => SelectionFactory.createSingleAsset('')).toThrow();
    });

    it('should throw error for empty folder ID', () => {
      expect(() => SelectionFactory.createSingleFolder('')).toThrow();
    });

    it('should throw error for empty arrays', () => {
      expect(() => SelectionFactory.createMultipleAssets([])).toThrow();
      expect(() => SelectionFactory.createMultipleFolders([])).toThrow();
    });
  });
}); 
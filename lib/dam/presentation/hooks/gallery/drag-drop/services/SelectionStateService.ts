/**
 * Domain Service: Selection State
 * 
 * Single Responsibility: Retrieves current selection state from the application
 * Encapsulates complex event-based selection state communication
 */

import type { BulkMoveSelection } from '../types';

export class SelectionStateService {
  /**
   * Retrieves the current selection state from the application
   * @param providedSelection - Optional selection state provided directly
   * @returns Promise resolving to current selection state
   */
  static async getCurrentSelection(providedSelection?: BulkMoveSelection): Promise<BulkMoveSelection> {
    if (providedSelection) {
      // Use provided selection state (preferred approach)
      return providedSelection;
    }

    // Fallback to event-based selection retrieval
    return new Promise<BulkMoveSelection>((resolve) => {
      let selectedAssets: string[] = [];
      let selectedFolders: string[] = [];
      
      const handleSelectionResponse = (event: CustomEvent) => {
        selectedAssets = event.detail.selectedAssets || [];
        selectedFolders = event.detail.selectedFolders || [];
        window.removeEventListener('damSelectionUpdate', handleSelectionResponse as EventListener);
        resolve({ selectedAssets, selectedFolders });
      };
      
      window.addEventListener('damSelectionUpdate', handleSelectionResponse as EventListener);
      window.dispatchEvent(new CustomEvent('damGetSelection'));
      
      // Fallback timeout to prevent hanging
      setTimeout(() => {
        window.removeEventListener('damSelectionUpdate', handleSelectionResponse as EventListener);
        resolve({ selectedAssets, selectedFolders });
      }, 100);
    });
  }
} 
import { type FolderNode } from '../folderStore';
import { findAndUpdateNode } from '../folderStoreUtils';

/**
 * Domain Service: Folder UI State Management
 * 
 * Single Responsibility: UI state coordination and management
 * Handles folder UI state operations following DDD principles
 */
export class FolderStateService {
  /**
   * Toggles folder expansion state
   */
  static toggleFolderExpansion(
    rootFolders: FolderNode[], 
    folderId: string
  ): FolderNode[] {
    return findAndUpdateNode(rootFolders, folderId, (node) => ({
      ...node,
      isExpanded: !node.isExpanded,
    }));
  }

  /**
   * Updates folder with domain entity data while preserving UI state
   */
  static updateFolderData(
    rootFolders: FolderNode[], 
    updatedFolder: any
  ): FolderNode[] {
    return findAndUpdateNode(rootFolders, updatedFolder.id, (node) => ({
      ...node,
      ...updatedFolder,
      name: updatedFolder.name,
    }));
  }

  /**
   * Generates next change version for triggering re-renders
   */
  static incrementChangeVersion(currentVersion: number): number {
    return currentVersion + 1;
  }

  /**
   * Validates if folders should be updated
   */
  static shouldUpdateFolders(
    newFolders: any[], 
    currentFolders: FolderNode[]
  ): boolean {
    return !(newFolders.length === 0 && currentFolders.length > 0);
  }

  /**
   * Creates initial state for new store
   */
  static createInitialState() {
    return {
      rootFolders: [],
      selectedFolderId: null,
      searchTerm: '',
      changeVersion: 0,
    };
  }

  /**
   * Updates selected folder state
   */
  static updateSelectedFolder(folderId: string | null) {
    return { selectedFolderId: folderId };
  }

  /**
   * Updates search term state
   */
  static updateSearchTerm(term: string) {
    return { searchTerm: term };
  }

  /**
   * Creates state update with incremented version
   */
  static createStateUpdate(
    updates: Record<string, any>, 
    currentVersion: number
  ) {
    return {
      ...updates,
      changeVersion: this.incrementChangeVersion(currentVersion),
    };
  }
} 
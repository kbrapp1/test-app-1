import { create } from 'zustand';
import { type Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';
import { FolderTreeService } from './services/FolderTreeService';
import { FolderDataService } from './services/FolderDataService';
import { FolderStateService } from './services/FolderStateService';
import { findAndRemoveNode } from './folderStoreUtils';

// FolderNode extends the main DomainFolder entity
export interface FolderNode extends DomainFolder { 
  children: FolderNode[] | null; 
  isExpanded: boolean;
  isLoading: boolean;
  hasError: boolean;
  type?: 'folder';
  ownerName?: string;
}

// Store state and actions interface
interface FolderStoreState {
  rootFolders: FolderNode[];
  selectedFolderId: string | null;
  searchTerm: string;
  changeVersion: number;
  
  // State coordination actions
  setInitialFolders: (folders: DomainFolder[]) => void;
  toggleExpand: (folderId: string) => void;
  fetchAndSetChildren: (folderId: string, fetcher: (id: string) => Promise<DomainFolder[]>) => Promise<void>;
  addFolder: (newFolder: DomainFolder) => void;
  removeFolder: (folderId: string) => void;
  moveFolder: (folderId: string, newParentFolderId: string | null) => void;
  updateFolderNodeInStore: (updatedFolder: DomainFolder) => void;
  setSelectedFolder: (folderId: string | null) => void;
  setSearchTerm: (term: string) => void;
  forceRefresh: () => void;
  refreshFolderTree: () => void;
  refetchFolderData: () => Promise<void>;
}

/**
 * Zustand Store: Folder State Coordination
 * 
 * Single Responsibility: State management coordination
 * Orchestrates folder operations using domain services
 */
export const useFolderStore = create<FolderStoreState>((set, get) => ({
  // Initial state
  ...FolderStateService.createInitialState(),

  setInitialFolders: (folders) => {
    const currentState = get();
    
    if (!FolderStateService.shouldUpdateFolders(folders, currentState.rootFolders)) {
      return;
    }
    
    const folderNodes = FolderTreeService.createFolderNodes(folders, currentState.rootFolders);
    const rootNodes = FolderTreeService.getRootFolders(folderNodes);
    
    set(FolderStateService.createStateUpdate({
      rootFolders: rootNodes,
      selectedFolderId: null,
    }, currentState.changeVersion));
  },

  toggleExpand: (folderId) => {
    set((state) => ({
      rootFolders: FolderStateService.toggleFolderExpansion(state.rootFolders, folderId),
    }));
  },

  fetchAndSetChildren: async (folderId, fetcher) => {
    // Set loading state
    set((state) => ({
      rootFolders: FolderTreeService.setFolderLoading(state.rootFolders, folderId, true),
    }));

    try {
      const childrenData = await fetcher(folderId);
      
      set((state) => ({
        rootFolders: FolderTreeService.setFolderChildren(
          state.rootFolders, 
          folderId, 
          childrenData
        ),
      }));
    } catch (error) {
      console.error("Error fetching children:", error);
      set((state) => ({
        rootFolders: FolderTreeService.setFolderError(state.rootFolders, folderId),
      }));
    }
  },

  addFolder: (newFolder) => {
    set((state) => {
      const updatedFolders = FolderTreeService.addFolderToTree(state.rootFolders, newFolder);
      
      return FolderStateService.createStateUpdate({
        rootFolders: updatedFolders,
        selectedFolderId: newFolder.id,
      }, state.changeVersion);
    });
  },

  removeFolder: (folderId) => {
    set((state) => 
      FolderStateService.createStateUpdate({
        rootFolders: findAndRemoveNode(state.rootFolders, folderId),
      }, state.changeVersion)
    );
  },

  moveFolder: (folderId, newParentFolderId) => {
    set((state) => {
      const updatedFolders = FolderTreeService.moveFolderInTree(
        state.rootFolders, 
        folderId, 
        newParentFolderId
      );
      
      return FolderStateService.createStateUpdate({
        rootFolders: updatedFolders,
      }, state.changeVersion);
    });
  },

  updateFolderNodeInStore: (updatedFolder) => {
    set((state) => {
      const updatedFolders = FolderStateService.updateFolderData(
        state.rootFolders, 
        updatedFolder
      );
      
      return FolderStateService.createStateUpdate({
        rootFolders: updatedFolders,
      }, state.changeVersion);
    });
  },

  setSelectedFolder: (folderId) => {
    set(FolderStateService.updateSelectedFolder(folderId));
  },

  setSearchTerm: (term) => {
    set(FolderStateService.updateSearchTerm(term));
  },

  forceRefresh: () => {
    set((state) => ({
      changeVersion: FolderStateService.incrementChangeVersion(state.changeVersion),
    }));
  },

  refreshFolderTree: () => {
    set((state) => ({
      changeVersion: FolderStateService.incrementChangeVersion(state.changeVersion),
    }));
  },

  refetchFolderData: async () => {
    try {
      const freshFolders = await FolderDataService.fetchRootFolders();
      get().setInitialFolders(freshFolders);
    } catch (error) {
      console.error('Error refetching folder data:', error);
      // Trigger re-render even if fetch failed
      set((state) => ({
        changeVersion: FolderStateService.incrementChangeVersion(state.changeVersion),
      }));
    }
  },
})); 
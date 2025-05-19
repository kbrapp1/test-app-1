import { create } from 'zustand';
import { Folder } from '@/types/dam';
// We might need fetch logic here, but useFolderFetch is not directly used in the store actions provided.
// It was mentioned as a comment in the original code, so keeping the import if it might be used later elsewhere or was planned.
import { useFolderFetch } from '@/hooks/useFolderFetch'; 
import {
  findNodeById, // Removed: local definition
  findAndUpdateNode,
  findAndRemoveNode,
  addNodeToParent,
  buildNodeMap
} from './folderStoreUtils'; // ADDED: Import from utils

// Define the structure for a folder node in the store, including children and expansion state
export interface FolderNode extends Folder {
  children: FolderNode[] | null; // null if not fetched, [] if fetched and empty
  isExpanded: boolean;
  isLoading: boolean;
  hasError: boolean;
}

// Define the store's state and actions
interface FolderStoreState {
  rootFolders: FolderNode[];
  selectedFolderId: string | null; // New state for selected folder
  searchTerm: string; // New state for the search term
  changeVersion: number; // ADDED: Change indicator
  setInitialFolders: (folders: Folder[]) => void;
  toggleExpand: (folderId: string) => void;
  fetchAndSetChildren: (folderId: string, fetcher: (id: string) => Promise<Folder[]>) => Promise<void>;
  addFolder: (newFolder: Folder) => void;
  removeFolder: (folderId: string) => void;
  updateFolderNodeInStore: (updatedFolder: Folder) => void; // ADDED: Action definition
  setSelectedFolder: (folderId: string | null) => void; // New action
  setSearchTerm: (term: string) => void; // New action for search
  // TODO: Add renameFolder action
}

// Create the Zustand store
export const useFolderStore = create<FolderStoreState>((set, get) => ({
  rootFolders: [],
  selectedFolderId: null, // Initialize selectedFolderId
  searchTerm: '', // Initialize search term
  changeVersion: 0, // ADDED: Initialize change indicator

  setInitialFolders: (folders) => {
    const currentState = get();
    const existingNodeMap = buildNodeMap(currentState.rootFolders);

    const initialNodes: FolderNode[] = folders.map(f => {
      const existingNode = existingNodeMap.get(f.id);
      return {
        ...f,
        children: existingNode?.children ?? null, // Preserve existing children if any, otherwise null
        isExpanded: existingNode?.isExpanded ?? false, // Preserve expansion state
        isLoading: existingNode?.isLoading ?? false,
        hasError: existingNode?.hasError ?? false,
      };
    });
    // This simplistic mapping might break tree structure if folders are re-parented or deleted.
    // A more robust approach would rebuild the tree from the new flat list `folders` 
    // while preserving states of nodes that still exist.
    // For now, let's assume `folders` is a flat list of root folders primarily.
    // If `folders` is meant to be the *entire* hierarchy, a tree-building step is needed here.
    // Given the original code, `folders` in `setInitialFolders` are just root folders.
    set({ 
      rootFolders: initialNodes.filter(f => f.parent_folder_id === null).sort((a,b) => a.name.localeCompare(b.name)), 
      selectedFolderId: null,
      // changeVersion: get().changeVersion + 1 // Optionally increment on initial set/reset too
    });
  },

  toggleExpand: (folderId) => {
    set((state) => ({
      rootFolders: findAndUpdateNode(state.rootFolders, folderId, (node) => ({
        isExpanded: !node.isExpanded,
      })),
    }));
  },

  fetchAndSetChildren: async (folderId, fetcher) => {
    const fullCurrentStateMap = buildNodeMap(get().rootFolders); // Get map of the entire current tree

    set((state) => ({ 
        rootFolders: findAndUpdateNode(state.rootFolders, folderId, () => ({ isLoading: true, hasError: false }))
    }));

    try {
      const childrenData = await fetcher(folderId); // This is Folder[]
      const childrenNodes: FolderNode[] = childrenData.map(f_child => {
        const existingChildNode = fullCurrentStateMap.get(f_child.id); // Check if this child existed before
        return {
          ...f_child,
          children: existingChildNode?.children ?? null, // Preserve deeper children
          isExpanded: existingChildNode?.isExpanded ?? false, // Preserve expansion of this child
          isLoading: existingChildNode?.isLoading ?? false,
          hasError: existingChildNode?.hasError ?? false,
        };
      });
      
      set((state) => ({ 
          rootFolders: findAndUpdateNode(state.rootFolders, folderId, (parentNode) => ({ 
              children: childrenNodes.sort((a,b) => a.name.localeCompare(b.name)), 
              isLoading: false, 
              hasError: false,
              // isExpanded: true // Parent is already expanded to trigger this fetch, or was toggled.
          }))
      }));
    } catch (error) {
      console.error("Error fetching children:", error);
      set((state) => ({ 
          rootFolders: findAndUpdateNode(state.rootFolders, folderId, () => ({ 
              isLoading: false, 
              hasError: true, 
              children: [] 
          }))
      }));
    }
  },

  setSelectedFolder: (folderId) => { // Implement setSelectedFolder
    set({ selectedFolderId: folderId });
  },

  setSearchTerm: (term) => { // Implement setSearchTerm
    set({ searchTerm: term });
  },

  addFolder: (newFolderData: Folder) => {
    const newNode: FolderNode = {
        ...newFolderData,
        children: null,
        isExpanded: false, 
        isLoading: false,
        hasError: false,
    };

    set((state) => {
      let updatedRootFolders = [...state.rootFolders];
      const nodeMap = buildNodeMap(updatedRootFolders); // For quick parent lookup

      // Expand all ancestors
      let parentId = newNode.parent_folder_id;
      while (parentId) {
        const parentNode = nodeMap.get(parentId);
        if (parentNode) {
          updatedRootFolders = findAndUpdateNode(
            updatedRootFolders,
            parentId,
            () => ({ isExpanded: true })
          );
          parentId = parentNode.parent_folder_id;
        } else {
          parentId = null; // Parent not found in current tree, stop
        }
      }
      
      updatedRootFolders = addNodeToParent(updatedRootFolders, newNode);
      
      return { 
        rootFolders: updatedRootFolders,
        selectedFolderId: newNode.id,
        changeVersion: state.changeVersion + 1 // ADDED: Increment version
      };
    });
  },

  removeFolder: (folderId) => {
    set((state) => ({ 
      rootFolders: findAndRemoveNode(state.rootFolders, folderId),
      changeVersion: state.changeVersion + 1 // ADDED: Increment version
    }));
  },

  // ADDED: Implementation for updateFolderNodeInStore
  updateFolderNodeInStore: (updatedFolder) => {
    set((state) => ({
      rootFolders: findAndUpdateNode(
        state.rootFolders,
        updatedFolder.id,
        (node) => ({ 
          name: updatedFolder.name,
          // Potentially update other fields from updatedFolder if they can change
          // and are part of FolderNode, e.g., parent_folder_id if moving while renaming (though less common for just rename)
        })
      ),
      changeVersion: state.changeVersion + 1 // ADDED: Increment version
    }));
  },
})); 
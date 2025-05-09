import { create } from 'zustand';
import { Folder } from '@/types/dam';
import { useFolderFetch } from '@/hooks/useFolderFetch'; // We might need fetch logic here

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
  setInitialFolders: (folders: Folder[]) => void;
  toggleExpand: (folderId: string) => void;
  fetchAndSetChildren: (folderId: string, fetcher: (id: string) => Promise<Folder[]>) => Promise<void>;
  addFolder: (newFolder: Folder) => void;
  removeFolder: (folderId: string) => void;
  setSelectedFolder: (folderId: string | null) => void; // New action
  setSearchTerm: (term: string) => void; // New action for search
  // TODO: Add renameFolder action
}

// Helper to recursively find and update a folder node
const findAndUpdateNode = (
  nodes: FolderNode[], 
  folderId: string, 
  updateFn: (node: FolderNode) => Partial<FolderNode>
): FolderNode[] => {
  return nodes.map(node => {
    if (node.id === folderId) {
      return { ...node, ...updateFn(node) };
    }
    if (node.children) {
      return { ...node, children: findAndUpdateNode(node.children, folderId, updateFn) };
    }
    return node;
  });
};

// Helper to recursively find and remove a folder node
const findAndRemoveNode = (nodes: FolderNode[], folderId: string): FolderNode[] => {
  return nodes.filter(node => {
    if (node.id === folderId) {
      return false; // Remove this node
    }
    if (node.children) {
      node.children = findAndRemoveNode(node.children, folderId);
    }
    return true; // Keep other nodes
  });
};

// Helper to add a folder to the correct parent
const addNodeToParent = (
    nodes: FolderNode[], 
    newFolder: FolderNode
): FolderNode[] => {
    if (newFolder.parent_folder_id === null) {
        // Add to root, maintaining alphabetical order
        const newNodes = [...nodes, newFolder];
        return newNodes.sort((a, b) => a.name.localeCompare(b.name));
    }
    return nodes.map(node => {
        if (node.id === newFolder.parent_folder_id) {
            // Add to children if parent is found and children array exists
            const updatedChildren = node.children ? [...node.children, newFolder].sort((a, b) => a.name.localeCompare(b.name)) : [newFolder];
            return { ...node, children: updatedChildren };
        }
        if (node.children) {
            return { ...node, children: addNodeToParent(node.children, newFolder) };
        }
        return node;
    });
};

// Create the Zustand store
export const useFolderStore = create<FolderStoreState>((set, get) => ({
  rootFolders: [],
  selectedFolderId: null, // Initialize selectedFolderId
  searchTerm: '', // Initialize search term

  setInitialFolders: (folders) => {
    const initialNodes: FolderNode[] = folders.map(f => ({
      ...f,
      children: null,
      isExpanded: false,
      isLoading: false,
      hasError: false,
    }));
    set({ rootFolders: initialNodes, selectedFolderId: null }); // Reset selection when setting initial folders
  },

  toggleExpand: (folderId) => {
    set((state) => ({
      rootFolders: findAndUpdateNode(state.rootFolders, folderId, (node) => ({
        isExpanded: !node.isExpanded,
      })),
    }));
  },

  fetchAndSetChildren: async (folderId, fetcher) => {
    // Set loading state
    set((state) => ({ 
        rootFolders: findAndUpdateNode(state.rootFolders, folderId, () => ({ isLoading: true, hasError: false }))
    }));

    try {
      const children = await fetcher(folderId);
      const childrenNodes: FolderNode[] = children.map(f => ({ 
        ...f, 
        children: null, 
        isExpanded: false, 
        isLoading: false, 
        hasError: false 
      }));
      
      // Update node with children and reset loading/error
      set((state) => ({ 
          rootFolders: findAndUpdateNode(state.rootFolders, folderId, () => ({ 
              children: childrenNodes, 
              isLoading: false, 
              hasError: false 
          }))
      }));
    } catch (error) {
      console.error("Error fetching children:", error);
      // Set error state and reset loading
      set((state) => ({ 
          rootFolders: findAndUpdateNode(state.rootFolders, folderId, () => ({ 
              isLoading: false, 
              hasError: true, 
              children: [] // Set empty array on error to prevent re-fetch loops
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

  addFolder: (newFolder) => {
    const newNode: FolderNode = {
        ...newFolder,
        children: null,
        isExpanded: false, // New folders are not expanded by default
        isLoading: false,
        hasError: false,
    };

    set((state) => {
      let updatedRootFolders = state.rootFolders;

      // Expand the parent folder if it exists
      if (newNode.parent_folder_id) {
        updatedRootFolders = findAndUpdateNode(
          updatedRootFolders,
          newNode.parent_folder_id,
          (node) => ({ isExpanded: true }) // Ensure parent is expanded
        );
      }
      
      // Add the new folder to the tree
      updatedRootFolders = addNodeToParent(updatedRootFolders, newNode);
      
      return { 
        rootFolders: updatedRootFolders,
        selectedFolderId: newNode.id // Select the newly created folder
      };
    });
  },

  removeFolder: (folderId) => {
    set((state) => ({ rootFolders: findAndRemoveNode(state.rootFolders, folderId) }));
  },
})); 
import { create } from 'zustand';
import { type Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';
// We might need fetch logic here, but useFolderFetch is not directly used in the store actions provided.
// It was mentioned as a comment in the original code, so keeping the import if it might be used later elsewhere or was planned.
// import { useFolderFetch } from '@/hooks/useFolderFetch'; 
import {
  findNodeById, // Removed: local definition
  findAndUpdateNode,
  findAndRemoveNode,
  addNodeToParent,
  buildNodeMap
} from './folderStoreUtils'; // ADDED: Import from utils

// FolderNode now extends the main DomainFolder entity
export interface FolderNode extends DomainFolder { 
  children: FolderNode[] | null; 
  isExpanded: boolean;
  isLoading: boolean;
  hasError: boolean;
  // TransformedFolder specific fields like 'type' or 'ownerName' can be optionally added if needed by UI directly from FolderNode
  // For now, keep it aligned with DomainFolder + UI state.
  type?: 'folder'; // Optional if we want to store it from TransformedFolder
  ownerName?: string; // Optional
}

// Define the store's state and actions
interface FolderStoreState {
  rootFolders: FolderNode[];
  selectedFolderId: string | null; // New state for selected folder
  searchTerm: string; // New state for the search term
  changeVersion: number; // ADDED: Change indicator
  setInitialFolders: (folders: DomainFolder[]) => void;
  toggleExpand: (folderId: string) => void;
  fetchAndSetChildren: (folderId: string, fetcher: (id: string) => Promise<DomainFolder[]>) => Promise<void>;
  addFolder: (newFolder: DomainFolder) => void;
  removeFolder: (folderId: string) => void;
  updateFolderNodeInStore: (updatedFolder: DomainFolder) => void;
  setSelectedFolder: (folderId: string | null) => void;
  setSearchTerm: (term: string) => void;
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
      
      // Create a proper FolderNode by assigning additional properties to the DomainFolder instance
      const node = Object.assign(f, {
        children: existingNode?.children ?? null, 
        isExpanded: existingNode?.isExpanded ?? false, 
        isLoading: existingNode?.isLoading ?? false,
        hasError: existingNode?.hasError ?? false,
      }) as FolderNode;
      
      return node;
    });
    
    const rootNodes = initialNodes.filter(f => f.parentFolderId === null).sort((a,b) => a.name.localeCompare(b.name));
    
    set({ 
      rootFolders: rootNodes, 
      selectedFolderId: null,
      changeVersion: get().changeVersion + 1
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
      const childrenData = await fetcher(folderId); // childrenData is now DomainFolder[]
      
      const childrenNodes: FolderNode[] = childrenData.map(f_child => { // f_child is DomainFolder
        const existingChildNode = fullCurrentStateMap.get(f_child.id);
        
        // Create a proper FolderNode by assigning additional properties to the DomainFolder instance
        return Object.assign(f_child, {
          children: existingChildNode?.children ?? null, 
          isExpanded: existingChildNode?.isExpanded ?? false, 
          isLoading: existingChildNode?.isLoading ?? false,
          hasError: existingChildNode?.hasError ?? false,
        }) as FolderNode;
      });
      
      set((state) => ({ 
          rootFolders: findAndUpdateNode(state.rootFolders, folderId, (parentNode) => ({ 
              children: childrenNodes.sort((a,b) => a.name.localeCompare(b.name)), 
              isLoading: false, 
              hasError: false,
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

  addFolder: (newFolderData: DomainFolder) => {
    // Create a proper FolderNode by assigning additional properties to the DomainFolder instance
    const newNode: FolderNode = Object.assign(newFolderData, {
        children: null,
        isExpanded: false, 
        isLoading: false,
        hasError: false,
    }) as FolderNode;

    set((state) => {
      let updatedRootFolders = [...state.rootFolders];
      const nodeMap = buildNodeMap(updatedRootFolders); 

      let parentId = newNode.parentFolderId; // Use parentFolderId from DomainFolder
      while (parentId) {
        const parentNode = nodeMap.get(parentId);
        if (parentNode) {
          updatedRootFolders = findAndUpdateNode(
            updatedRootFolders,
            parentId,
            () => ({ isExpanded: true })
          );
          parentId = parentNode.parentFolderId; // Use parentFolderId from DomainFolder
        } else {
          parentId = null; 
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
  updateFolderNodeInStore: (updatedFolder: DomainFolder) => {
    set((state) => ({
      rootFolders: findAndUpdateNode(
        state.rootFolders,
        updatedFolder.id,
        (node) => ({ // node is FolderNode
          ...node, // Preserve existing FolderNode UI state
          ...updatedFolder, // Overlay with updated DomainFolder fields
          // name: updatedFolder.name, (example, spread handles this)
        })
      ),
      changeVersion: state.changeVersion + 1 // ADDED: Increment version
    }));
  },
})); 
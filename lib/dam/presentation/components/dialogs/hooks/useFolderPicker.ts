import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useFolderStore, type FolderNode } from '@/lib/store/folderStore';
import { FolderFetcher } from '../services/FolderFetcher';

interface UseFolderPickerProps {
  isOpen: boolean;
}

interface UseFolderPickerReturn {
  selectedFolderId: string | null | undefined;
  searchTerm: string;
  isInitiallyLoading: boolean;
  rootFolders: FolderNode[];
  setSelectedFolderId: (folderId: string | null) => void;
  setSearchTerm: (term: string) => void;
  handleToggleExpand: (folderId: string) => Promise<void>;
  resetState: () => void;
}

/**
 * useFolderPicker Hook
 * Follows Single Responsibility Principle - manages folder picker state and business logic
 */
export const useFolderPicker = ({ isOpen }: UseFolderPickerProps): UseFolderPickerReturn => {
  const {
    rootFolders,
    toggleExpand: storeToggleExpand,
    fetchAndSetChildren: storeFetchAndSetChildren,
    setInitialFolders: storeSetInitialFolders,
  } = useFolderStore();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitiallyLoading, setIsInitiallyLoading] = useState(false);

  const loadRootFolders = useCallback(async () => {
    setIsInitiallyLoading(true);
    try {
      const rootDomainFolders = await FolderFetcher.fetchFolders(null);
      storeSetInitialFolders(rootDomainFolders);
    } catch (error) {
      console.error("Error during initial root folder load sequence:", error);
      toast.error("Failed to load initial folder structure.");
      storeSetInitialFolders([]);
    }
    setIsInitiallyLoading(false);
  }, [storeSetInitialFolders]);

  // Load root folders when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadRootFolders();
    }
  }, [isOpen, loadRootFolders]);

  const handleToggleExpand = useCallback(async (folderId: string) => {
    storeToggleExpand(folderId);

    // Find the node that was toggled
    const nodeToToggle = findNodeInTree(useFolderStore.getState().rootFolders, folderId);
    
    // Load children if expanding and children not yet loaded
    if (nodeToToggle && nodeToToggle.isExpanded && nodeToToggle.children === null) {
      await storeFetchAndSetChildren(folderId, FolderFetcher.fetchFolders);
    }
  }, [storeToggleExpand, storeFetchAndSetChildren]);

  const resetState = () => {
    setSelectedFolderId(undefined);
    setSearchTerm('');
  };

  return {
    selectedFolderId,
    searchTerm,
    isInitiallyLoading,
    rootFolders,
    setSelectedFolderId,
    setSearchTerm,
    handleToggleExpand,
    resetState,
  };
};

/**
 * Helper function to find a node in the folder tree
 */
function findNodeInTree(nodes: FolderNode[], id: string): FolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const foundInChildren = findNodeInTree(node.children, id);
      if (foundInChildren) return foundInChildren;
    }
  }
  return null;
} 

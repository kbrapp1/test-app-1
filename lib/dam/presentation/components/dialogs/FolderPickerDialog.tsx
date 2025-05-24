'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AlertTriangle, HomeIcon, SearchIcon, XIcon, ChevronRight, Loader2 } from 'lucide-react';
import { FolderTreeItem } from './FolderTreeItem';
import { useFolderStore, type FolderNode } from '@/lib/store/folderStore';
import { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';

interface FolderPickerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFolderSelect: (folderId: string | null) => void;
  currentAssetFolderId?: string | null;
  assetName?: string;
}

export const FolderPickerDialog: React.FC<FolderPickerDialogProps> = ({
  isOpen,
  onOpenChange,
  onFolderSelect,
  currentAssetFolderId,
  assetName,
}) => {
  const {
    rootFolders,
    toggleExpand: storeToggleExpand,
    fetchAndSetChildren: storeFetchAndSetChildren,
    setInitialFolders: storeSetInitialFolders,
  } = useFolderStore();

  const [selectedFolderIdInDialog, setSelectedFolderIdInDialog] = useState<string | null | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitiallyLoading, setIsInitiallyLoading] = useState(false);

  const fetcherFunction = useCallback(async (parentId: string | null): Promise<DomainFolder[]> => {
    const url = parentId 
      ? `/api/dam/folders/tree?parentId=${parentId}` 
      : '/api/dam/folders/tree';
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch folders' }));
        throw new Error(errorData.message || 'Failed to fetch folders');
      }
      const jsonData = await response.json();
      
      if (!Array.isArray(jsonData)) {
        console.error('API did not return an array for folders:', jsonData);
        if (jsonData && typeof jsonData === 'object' && 'message' in jsonData) {
            throw new Error(jsonData.message || 'API returned an object instead of an array and it contained a message property.');
        }
        throw new Error('API did not return an array for folders.');
      }
      
      // The API now returns plain objects from toPlainObject(), create Folder instances directly
      const plainFolders = jsonData as Array<{
        id: string;
        name: string;
        userId: string;
        createdAt: Date;
        updatedAt?: Date;
        parentFolderId?: string | null;
        organizationId: string;
        has_children?: boolean;
      }>;
      
      const domainFolders: DomainFolder[] = plainFolders.map(pf => 
        new DomainFolder({
          id: pf.id,
          name: pf.name,
          userId: pf.userId,
          createdAt: new Date(pf.createdAt),
          updatedAt: pf.updatedAt ? new Date(pf.updatedAt) : undefined,
          parentFolderId: pf.parentFolderId,
          organizationId: pf.organizationId,
          has_children: pf.has_children,
        })
      );
      
      return domainFolders;
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.');
      return [];
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const loadRootFolders = async () => {
        setIsInitiallyLoading(true);
        try {
          const rootDomainFolders = await fetcherFunction(null);
          storeSetInitialFolders(rootDomainFolders);
        } catch (error) {
          console.error("Error during initial root folder load sequence:", error);
          toast.error("Failed to load initial folder structure.");
          storeSetInitialFolders([]);
        }
        setIsInitiallyLoading(false);
      };
      loadRootFolders();
      setSelectedFolderIdInDialog(undefined);
      setSearchTerm('');
    } else {
      storeSetInitialFolders([]);
    }
  }, [isOpen, fetcherFunction, storeSetInitialFolders]);

  const handleToggleExpand = useCallback(async (folderId: string) => {
    storeToggleExpand(folderId);

    // Check if children need to be loaded
    // This requires finding the node in the tree. The store might eventually offer a selector for this.
    let nodeToToggle: FolderNode | null = null;
    const findNode = (nodes: FolderNode[], id: string): FolderNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const foundInChildren = findNode(node.children, id);
          if (foundInChildren) return foundInChildren;
        }
      }
      return null;
    };
    // Get the latest rootFolders from the store if possible, or use the current one.
    // For simplicity, using the current rootFolders reference.
    // A more reactive way would be to get the node directly from a store selector if available.
    const currentRootFolders = useFolderStore.getState().rootFolders; 
    nodeToToggle = findNode(currentRootFolders, folderId);
    
    if (nodeToToggle && nodeToToggle.isExpanded && nodeToToggle.children === null) {
      await storeFetchAndSetChildren(folderId, fetcherFunction);
    }
  }, [storeToggleExpand, storeFetchAndSetChildren, fetcherFunction]); // rootFolders removed as a dependency to avoid re-creating callback too often; using getState()

  const handleSelect = (folderId: string | null) => {
    setSelectedFolderIdInDialog(folderId);
  };

  const handleConfirm = () => {
    if (selectedFolderIdInDialog !== undefined) {
      onFolderSelect(selectedFolderIdInDialog);
    }
  };
  
  const dialogTitle = assetName ? `Move \"${assetName}\"` : 'Move Asset';
  const dialogDescription = 'Select a destination folder or move to root.';

  const renderTree = (nodes: FolderNode[], level: number): React.ReactNode => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <FolderTreeItem
          node={node}
          level={level}
          selectedFolderId={selectedFolderIdInDialog}
          currentAssetFolderId={currentAssetFolderId}
          onSelect={handleSelect}
          toggleExpand={handleToggleExpand} // expandedFolders prop is removed
        />
        {node.isExpanded && node.children && node.children.length > 0 && (
          <div className="pl-6">
            {renderTree(node.children, level + 1)}
          </div>
        )}
        {node.isExpanded && node.isLoading && !node.children && (
             <div className="pl-10 flex items-center text-sm text-muted-foreground py-1">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
            </div>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* TODO: Search input implementation */}
          {/* <div className="relative mb-4">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div> */}
          
          <div className="py-0"> {/* Added py-0 to align with ScrollArea style below */}
            {isInitiallyLoading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading...</div>
            ) : rootFolders.length === 0 && !isInitiallyLoading ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                   <AlertTriangle className="w-10 h-10 mb-2" />
                  <p className="font-semibold">No folders found</p>
                  <p className="text-sm">There are no folders to display.</p>
                </div>
            ) : (
              <ScrollArea className="h-72 w-full rounded-md border p-2">
                <div className="space-y-1" role="tree" aria-label="Folder navigation tree">
                  <Button
                    variant={selectedFolderIdInDialog === null ? 'secondary' : 'ghost'}
                    className={`w-full justify-start text-left h-auto py-2 px-3 ${
                      currentAssetFolderId === null ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => currentAssetFolderId !== null && handleSelect(null)}
                    disabled={currentAssetFolderId === null}
                    aria-pressed={selectedFolderIdInDialog === null}
                    role="treeitem" 
                  >
                    <HomeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    Root
                  </Button>
  
                  {renderTree(rootFolders, 0)}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedFolderIdInDialog === undefined || isInitiallyLoading}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
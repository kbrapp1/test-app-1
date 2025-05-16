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
import { getFoldersForPicker } from '@/lib/actions/dam/folder.actions';
import { toast } from 'sonner';
import { AlertTriangle, HomeIcon, SearchIcon, XIcon } from 'lucide-react';

// Import the new utility and component
import { prepareTreeData, type RawFolderData } from './folderPickerUtils';
import { FolderTreeItem } from './FolderTreeItem';

// FolderTreeNode is now internal to folderPickerUtils or defined there if needed by FolderTreeItem props

interface FolderPickerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFolderSelect: (folderId: string | null) => void;
  currentAssetFolderId?: string | null;
  assetName?: string; 
}

// buildFolderTree, FolderTreeItemProps, FolderTreeItem, and getAncestors have been removed

export const FolderPickerDialog: React.FC<FolderPickerDialogProps> = ({
  isOpen,
  onOpenChange,
  onFolderSelect,
  currentAssetFolderId,
  assetName,
}) => {
  const [rawFolders, setRawFolders] = useState<RawFolderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(undefined);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFolders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getFoldersForPicker();
      if (result.success && result.data) {
        setRawFolders(result.data);
      } else {
        toast.error(result.error || 'Failed to load folders.');
        setRawFolders([]);
      }
    } catch (error) {
      toast.error('An unexpected error occurred while fetching folders.');
      setRawFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      setSelectedFolderId(undefined); // Reset selection
      setSearchTerm(''); // Reset search
      setExpandedFolders(new Set()); // Collapse all
    }
    // Optional: Clear rawFolders when dialog is fully closed (e.g., in onOpenChange(false) if needed)
    // else { setRawFolders([]); } 
  }, [isOpen, fetchFolders]);

  // Use the new prepareTreeData utility
  const { tree: filteredFolderTree, idsToExpandOnSearch } = useMemo(
    () => prepareTreeData(rawFolders, searchTerm),
    [rawFolders, searchTerm]
  );

  // Auto-expand folders based on search results
  useEffect(() => {
    if (searchTerm && idsToExpandOnSearch.size > 0) {
      setExpandedFolders(idsToExpandOnSearch);
    } else if (!searchTerm) {
      // When search is cleared, collapse all folders or maintain user's manual expansions.
      // For simplicity, let's collapse all when search is cleared.
      // If you want to maintain manual expansions, remove the line below or manage it differently.
      // setExpandedFolders(new Set()); // This line is optional
    }
  }, [searchTerm, idsToExpandOnSearch]);


  const handleSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  const toggleExpandFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (selectedFolderId !== undefined) { // Can be null (for Root) or a string ID
      onFolderSelect(selectedFolderId);
    }
  };
  
  const dialogTitle = assetName ? `Move "${assetName}"` : 'Move Asset';
  const dialogDescription = 'Select a destination folder or move to root. You can also search for folders.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 h-9"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="py-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><p>Loading folders...</p></div>
          ) : filteredFolderTree.length === 0 && !searchTerm && rawFolders.length === 0 && !isLoading ? (
             <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mb-2" />
                <p className="font-semibold">No folders available.</p>
                <p className="text-sm">You can move items to the Root.</p>
            </div>
          ) : filteredFolderTree.length === 0 && searchTerm ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <p>No folders match "{searchTerm}".</p>
            </div>
          ) : (
            <ScrollArea className="h-[260px] border rounded-md p-2">
              <div className="space-y-1" role="tree" aria-label="Folder navigation tree">
                {/* Root Option - show if not searching, or if search term allows (e.g. "root") */}
                {/* For simplicity, always show Root if not explicitly filtered out by a very specific search */}
                {/* The prepareTreeData doesn't filter out a conceptual "Root" item, so we add it here. */}
                <Button
                  variant={selectedFolderId === null ? 'secondary' : 'ghost'}
                  className={`w-full justify-start text-left h-auto py-2 px-3 ${
                    currentAssetFolderId === null ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => currentAssetFolderId !== null && handleSelect(null)}
                  disabled={currentAssetFolderId === null}
                  aria-pressed={selectedFolderId === null}
                  role="treeitem" 
                  // aria-level and aria-setsize for root if considering full ARIA tree.
                >
                  <HomeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className='truncate'>Root</span>
                  {currentAssetFolderId === null && <span className="ml-auto text-xs text-muted-foreground">(Current)</span>}
                </Button>

                {filteredFolderTree.map((node) => (
                  <FolderTreeItem
                    key={node.id}
                    node={node}
                    level={0} // Root level items from the filtered tree
                    selectedFolderId={selectedFolderId}
                    currentAssetFolderId={currentAssetFolderId}
                    onSelect={handleSelect}
                    expandedFolders={expandedFolders}
                    toggleExpand={toggleExpandFolder}
                    // searchTerm={searchTerm} // Not needed by FolderTreeItem anymore
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedFolderId === undefined || isLoading}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
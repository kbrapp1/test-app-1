'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderTreeRenderer } from './components/FolderTreeRenderer';
import { useFolderPicker } from './hooks/useFolderPicker';
import { Loader2 } from 'lucide-react';

interface FolderPickerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFolderSelect: (folderId: string | null) => void;
  currentAssetFolderId?: string | null;
  assetName?: string;
  // Optional custom title and description for bulk operations
  dialogTitle?: string;
  dialogDescription?: string;
  // Loading state for move operation
  isMoving?: boolean;
}

export const FolderPickerDialog: React.FC<FolderPickerDialogProps> = ({
  isOpen,
  onOpenChange,
  onFolderSelect,
  currentAssetFolderId,
  assetName,
  dialogTitle: customDialogTitle,
  dialogDescription: customDialogDescription,
  isMoving = false,
}) => {
  // Use domain hook for state management and business logic
  const {
    selectedFolderId,
    searchTerm,
    isInitiallyLoading,
    rootFolders,
    setSelectedFolderId,
    setSearchTerm,
    handleToggleExpand,
    resetState,
  } = useFolderPicker({ isOpen });

  const handleConfirm = () => {
    // Ensure we always pass a valid value (string or null, never undefined)
    if (selectedFolderId !== undefined) {
      onFolderSelect(selectedFolderId);
    } else {
      // This shouldn't happen since the button is disabled when undefined,
      // but as a safety measure, we'll treat undefined as null (root)
  
      onFolderSelect(null);
    }
  };
  
  const dialogTitle = customDialogTitle || (assetName ? `Move \"${assetName}\"` : 'Move Asset');
  const dialogDescription = customDialogDescription || 'Select a destination folder or move to root.';

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
          
          <div className="py-0">
            <FolderTreeRenderer
              rootFolders={rootFolders}
              isInitiallyLoading={isInitiallyLoading}
              selectedFolderId={selectedFolderId}
              currentAssetFolderId={currentAssetFolderId}
              onSelect={setSelectedFolderId}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedFolderId === undefined || isInitiallyLoading || isMoving}
          >
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isMoving ? 'Moving...' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 

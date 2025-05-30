"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { RenameFolderDialog } from '@/lib/dam/presentation/components/dialogs/RenameFolderDialog';
import { DeleteFolderDialog } from '@/lib/dam/presentation/components/dialogs/DeleteFolderDialog';
import { type FolderNode } from '@/lib/store/folderStore';
import { useFolderNavigation } from './hooks/useFolderNavigation';
import { FolderExpandButton } from './components/FolderExpandButton';
import { FolderLink } from './components/FolderLink';
import { FolderActionsMenu } from './components/FolderActionsMenu';

/**
 * Props for the folder navigation item component
 */
export interface FolderNavigationItemProps {
  /** Folder node data from the store */
  folderNode: FolderNode;
  /** Nesting level for visual indentation */
  level: number;
  /** Currently selected folder ID */
  currentFolderId: string | null;
}

/**
 * Domain Folder Navigation Item Component
 * 
 * Recursive component that renders individual folder items in the navigation tree with:
 * - Expandable/collapsible hierarchy
 * - Active state highlighting
 * - Folder management actions (rename, delete)
 * - Loading and error states
 * - Domain entity integration
 * 
 * Follows Single Responsibility Principle - coordinates folder item display and interactions
 * 
 * @component
 * @example
 * ```tsx
 * <FolderNavigationItem 
 *   folderNode={folderNode} 
 *   level={0} 
 *   currentFolderId={selectedId} 
 * />
 * ```
 */
export function FolderNavigationItem({ 
  folderNode,
  level,
  currentFolderId,
}: FolderNavigationItemProps) {

  // Use custom hook for navigation logic
  const {
    isRenameDialogOpen,
    isDeleteDialogOpen,
    dialogKey,
    deleteDialogKey,
    setIsRenameDialogOpen,
    setIsDeleteDialogOpen,
    handleToggleExpand,
    handleOpenRenameDialog,
    handleOpenDeleteDialog,
  } = useFolderNavigation({ folderNode });

  // Drop zone functionality for receiving dragged assets and folders
  const { setNodeRef, isOver } = useDroppable({
    id: `sidebar-${folderNode.id}`, // Unique ID for sidebar folders
    data: { 
      type: 'folder', 
      item: folderNode,
      folderId: folderNode.id, // Keep original folder ID for the move operation
      accepts: ['asset', 'folder']
    }
  });

  const isActive = folderNode.id === currentFolderId;

  return (
    <div>
      {/* Folder Item Row */}
      <div 
        ref={setNodeRef}
        className={cn(
          "flex items-center justify-between px-1 rounded-md group relative py-2 transition-all duration-200",
          isActive 
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
            : "hover:bg-muted/50 text-gray-700 dark:text-gray-300",
          isOver && "bg-blue-100 dark:bg-blue-800 ring-1 ring-blue-300"
        )} 
        style={{ paddingLeft: `${level * 1.25}rem` }}
      >
        
        {/* Expand/Collapse Button and Folder Link */}
        <div className="flex items-center flex-1 min-w-0 mr-2">
          <FolderExpandButton 
            folderNode={folderNode}
            onToggleExpand={handleToggleExpand}
          />
          
          <FolderLink 
            folderNode={folderNode}
            isOver={isOver}
          />
        </div>
        
        {/* Folder Actions Menu */}
        <FolderActionsMenu 
          isActive={isActive}
          onRename={handleOpenRenameDialog}
          onDelete={handleOpenDeleteDialog}
        />
      </div>

      {/* Child Folders (Recursive) */}
      <div className="mt-1">
        {folderNode.isExpanded && folderNode.children && folderNode.children.map(childNode => (
          <FolderNavigationItem 
            key={childNode.id} 
            folderNode={childNode} 
            level={level + 1} 
            currentFolderId={currentFolderId}
          />
        ))}
      </div>

      {/* Management Dialogs */}
      {(
        <>
          <RenameFolderDialog 
            key={`rename-${dialogKey}`}
            isOpen={isRenameDialogOpen} 
            onClose={() => setIsRenameDialogOpen(false)}
            folderId={folderNode.id}
            currentName={folderNode.name}
          />
          <DeleteFolderDialog
            key={`delete-${deleteDialogKey}`}
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            folderId={folderNode.id}
            folderName={folderNode.name}
          />
        </>
      )}
    </div>
  );
} 

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home as HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { NewFolderDialog } from '@/lib/dam/presentation/components/dialogs/NewFolderDialog';

import { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';
import type { PlainFolder } from '@/lib/dam/types/dam.types';
import { FolderNavigationItem } from '.';
import { useFolderStore } from '@/lib/store/folderStore';
import { useSearchParams } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FolderSidebarProps {
  initialFolders: PlainFolder[];
}

/**
 * Domain Folder Sidebar Component
 * 
 * Provides hierarchical folder navigation for the DAM system with:
 * - Home folder navigation
 * - Recursive folder tree display
 * - Folder management capabilities
 * - Domain entity integration
 * - Fast server-side folder loading
 * 
 * @component
 * @example
 * ```tsx
 * <FolderSidebar initialFolders={serverFolders} />
 * ```
 */
export function FolderSidebar({ initialFolders }: FolderSidebarProps) {
  const { rootFolders, setInitialFolders, changeVersion, refetchFolderData } = useFolderStore();
  const searchParams = useSearchParams();
  const [hasInitialized, setHasInitialized] = useState(false);
  




  // Determine current folder ID from URL parameters
  const folderIdFromParams = searchParams.get('folderId');
  const currentFolderId = folderIdFromParams || null;

  // Drop zone for Home folder (null folderId)
  const { setNodeRef: setHomeNodeRef, isOver: isHomeOver } = useDroppable({
    id: 'sidebar-home-folder',
    data: { 
      type: 'folder', 
      item: { id: null, name: 'Home' },
      folderId: null, // Keep original folder ID for the move operation
      accepts: ['asset', 'folder']
    }
  });

  // Load server-provided folders into store (run only once)
  useEffect(() => {
    // Skip if already initialized or no folders to process
    if (hasInitialized || initialFolders.length === 0) {
      return;
    }
    
    const domainFolders = initialFolders.map(plainFolder => {
      return new DomainFolder({
        id: plainFolder.id,
        name: plainFolder.name,
        userId: plainFolder.userId,
        createdAt: plainFolder.createdAt,
        updatedAt: plainFolder.updatedAt,
        parentFolderId: plainFolder.parentFolderId,
        organizationId: plainFolder.organizationId,
        has_children: plainFolder.has_children,
      });
    });
    
    setInitialFolders(domainFolders);
    setHasInitialized(true);
  }, [initialFolders, hasInitialized, setInitialFolders]);

  // Listen for folder move events from drag and drop operations
  useEffect(() => {
    const handleDataRefresh = async () => {
      // Refresh the folder tree when folders are moved
      await refetchFolderData();
    };

    const handleFolderUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type } = customEvent.detail || {};
      
      // Refresh folder tree for any folder operations (rename, delete, move)
      if (type === 'rename' || type === 'delete' || type === 'move') {
        await refetchFolderData();
      }
    };

    // Listen for general data refresh events (includes folder moves)
    window.addEventListener('damDataRefresh', handleDataRefresh);
    
    // Listen for specific folder update events
    window.addEventListener('folderUpdated', handleFolderUpdate);

    return () => {
      window.removeEventListener('damDataRefresh', handleDataRefresh);
      window.removeEventListener('folderUpdated', handleFolderUpdate);
    };
  }, [refetchFolderData]);



  return (
    <aside className="w-55 border-r bg-background px-4 pt-2 pb-4 flex flex-col h-full overflow-y-auto">
      {/* Header with New Folder Action */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Folders</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NewFolderDialog currentFolderId={currentFolderId} asIcon />
            </TooltipTrigger>
            <TooltipContent>
              <p>New Folder</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Home Folder Navigation */}
      <div 
        ref={setHomeNodeRef}
        className={cn(
          "flex items-center rounded-md mb-1 pl-4 py-2 transition-all duration-200",
          currentFolderId === null 
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
            : "hover:bg-muted/50 text-gray-700 dark:text-gray-300",
          isHomeOver && "bg-blue-100 dark:bg-blue-800 ring-1 ring-blue-300"
        )}
      >
        <Link href="/dam" className="flex-1 flex items-center truncate">
          <>
            <HomeIcon className={`h-4 w-4 mr-2 shrink-0 ${isHomeOver ? 'text-blue-600 animate-pulse' : ''}`} /> 
            <span className="font-medium text-sm">Home</span>
            {isHomeOver && (
              <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] ml-1 shrink-0 font-medium">
                Drop
              </span>
            )}
          </>
        </Link>
      </div>

      {/* Folder Tree Navigation */}
      <div className="mt-1" key={`folder-list-${changeVersion}`}>
        {rootFolders.map(folderNode => (
          <FolderNavigationItem
            key={folderNode.id}
            folderNode={folderNode}
            level={0}
            currentFolderId={currentFolderId}
          />
        ))}
      </div>
    </aside>
  );
} 

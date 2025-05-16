"use client"; // Make it a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NewFolderDialog } from './new-folder-dialog';
import { Folder } from '@/types/dam';
import { FolderItem } from './FolderItem';
import { useFolderStore } from '@/lib/store/folderStore';
import { useSearchParams } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Props for the main sidebar component
export interface FolderSidebarProps {
  initialFolders: Folder[];
  // currentFolderId prop is still received from layout but will be overridden by searchParams
  // No need to pass it explicitly if we derive it here from searchParams
}

/**
 * Sidebar component that displays a hierarchical folder structure
 * Provides navigation between folders and folder management
 */
export function FolderSidebar({ initialFolders = [] }: FolderSidebarProps) {
  const { rootFolders, setInitialFolders } = useFolderStore();
  const searchParams = useSearchParams(); // <-- Get searchParams

  // Determine currentFolderId from searchParams
  const folderIdFromParams = searchParams.get('folderId');
  const actualCurrentFolderId = folderIdFromParams || null;

  useEffect(() => {
    // Remove the console log once we confirm it works as expected
    // console.log('FolderSidebar: Initializing store state...');
    setInitialFolders(initialFolders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFolders, setInitialFolders]); // initialFolders from layout props can be a dependency if it can change.
                          // For root folders it might be stable, but good to include.
                          // If setInitialFolders is guaranteed stable, then [setInitialFolders]

  // isRootExpanded state is no longer used for toggling visibility
  // const [isRootExpanded, setIsRootExpanded] = useState(true);

  return (
    <aside className="w-64 border-r bg-background px-4 pt-2 pb-4 flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Folders</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NewFolderDialog currentFolderId={actualCurrentFolderId} asIcon />
            </TooltipTrigger>
            <TooltipContent>
              <p>New Folder</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Home Folder Item - Modified padding and alignment */}
      <div className={cn(
        "flex items-center rounded-md mb-1", // Removed px-1, py will be increased
        // Apply left padding to align with children (who get pl-4 from their container + FolderItem internal padding)
        // FolderItem at level 0 likely has some base padding. Let's assume pl-4 for now to match its container.
        "pl-4 py-2", // Increased py, added pl for alignment. Adjust pl if necessary after seeing FolderItem.
        actualCurrentFolderId === null ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
      )}>
        {/* Placeholder div removed */}
        
        <Link href="/dam" className="flex-1 flex items-center truncate" legacyBehavior={undefined}>
          <>
            <HomeIcon className="h-4 w-4 mr-2 shrink-0" /> 
            <span className="font-medium text-sm">Home</span>
          </>
        </Link>
      </div>
      {/* Root Folders - Children of Home */}
      <div className="mt-1"> {/* This pl-4 is the base indentation for level 0 children */}
        {rootFolders.map(folderNode => (
          <FolderItem
            key={folderNode.id}
            folderNode={folderNode}
            level={0}
            currentFolderId={actualCurrentFolderId}
          />
        ))}
      </div>
    </aside>
  );
} 
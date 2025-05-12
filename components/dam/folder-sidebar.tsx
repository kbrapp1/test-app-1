"use client"; // Make it a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown } from 'lucide-react';
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
  }, [setInitialFolders]); // initialFolders from layout props can be a dependency if it can change.
                          // For root folders it might be stable, but good to include.
                          // If setInitialFolders is guaranteed stable, then [setInitialFolders]

  // Local state for root expansion (can be moved to store if needed globally)
  const [isRootExpanded, setIsRootExpanded] = useState(true);

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
      {/* Root Folder Item */}
      <div className={cn(
        "flex items-center px-1 py-1 rounded-md mb-1",
        actualCurrentFolderId === null ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
      )}>
        {/* Expand/Collapse Button for Root */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsRootExpanded(!isRootExpanded)}
          className="p-1 h-4 w-4 mr-1 flex items-center justify-center"
        >
          {isRootExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        {/* Link to root folder */}
        <Link href="/dam" className="flex-1 flex items-center truncate" legacyBehavior>
          <FolderIcon className="h-4 w-4 mr-2 shrink-0" /> 
          <span className="font-medium text-sm">(Root)</span>
        </Link>
      </div>
      {/* Root Folders */}
      {isRootExpanded && (
        <div className="mt-1 pl-4">
          {rootFolders.map(folderNode => (
            <FolderItem
              key={folderNode.id}
              folderNode={folderNode}
              level={0}
              currentFolderId={actualCurrentFolderId}
            />
          ))}
        </div>
      )}
    </aside>
  );
} 
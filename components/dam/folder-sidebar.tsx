"use client"; // Make it a client component

import React, { useState } from 'react';
import Link from 'next/link';
import { Folder as FolderIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NewFolderDialog } from './new-folder-dialog';
import { Folder } from '@/types/dam';
import { FolderItem } from './FolderItem';
import { useFolderFetch } from '@/hooks/useFolderFetch';

// Props for the main sidebar component
export interface FolderSidebarProps {
  initialFolders: Folder[];
  currentFolderId: string | null;
}

/**
 * Sidebar component that displays a hierarchical folder structure
 * Provides navigation between folders and folder management
 */
export function FolderSidebar({ initialFolders = [], currentFolderId }: FolderSidebarProps) {
  const [isRootExpanded, setIsRootExpanded] = useState(true);
  const { fetchFolderChildren } = useFolderFetch();

  return (
    <aside className="w-64 border-r bg-background p-4 flex flex-col h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Folders</h2>
      
      {/* Root Folder Item */}
      <div className={cn(
        "flex items-center px-1 py-1 rounded-md mb-1",
        currentFolderId === null ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
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
        <Link href="/dam" className="flex-1 flex items-center truncate">
          <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" /> 
          <span className="font-medium text-sm">(Root)</span>
        </Link>
      </div>

      {/* Root Folders */}
      {isRootExpanded && (
        <div className="mt-1 pl-4">
          {initialFolders.map(folder => (
            <FolderItem 
              key={folder.id} 
              folder={folder} 
              level={0}
              currentFolderId={currentFolderId}
              onFetchChildren={fetchFolderChildren}
            />
          ))}
        </div>
      )}

      {/* New Folder Button */}
      <div className="mt-auto pt-4 border-t">
        <NewFolderDialog currentFolderId={currentFolderId} /> 
      </div>
    </aside>
  );
} 
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home as HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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

/**
 * Props for the main sidebar component
 */
export interface FolderSidebarProps {
  /** Initial folders data passed from server-side */
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
 * 
 * @component
 * @example
 * ```tsx
 * <FolderSidebar initialFolders={serverFolders} />
 * ```
 */
export function FolderSidebar({ initialFolders = [] }: FolderSidebarProps) {
  const { rootFolders, setInitialFolders, changeVersion } = useFolderStore();
  const searchParams = useSearchParams();

  // Determine current folder ID from URL parameters
  const folderIdFromParams = searchParams.get('folderId');
  const currentFolderId = folderIdFromParams || null;

  useEffect(() => {
    try {
      // Convert plain objects to domain entities for store management
      const domainFolders = initialFolders.map(plainFolder => {
        const domainFolder = new DomainFolder({
          id: plainFolder.id,
          name: plainFolder.name,
          userId: plainFolder.userId,
          createdAt: plainFolder.createdAt,
          updatedAt: plainFolder.updatedAt,
          parentFolderId: plainFolder.parentFolderId,
          organizationId: plainFolder.organizationId,
          has_children: plainFolder.has_children,
        });
        
        return domainFolder;
      });
      
      setInitialFolders(domainFolders);
    } catch (error) {
      console.error('Error converting folders to domain entities:', error);
    }
  }, [initialFolders, setInitialFolders]);

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
      <div className={cn(
        "flex items-center rounded-md mb-1 pl-4 py-2",
        currentFolderId === null 
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
          : "hover:bg-muted/50 text-gray-700 dark:text-gray-300"
      )}>
        <Link href="/dam" className="flex-1 flex items-center truncate">
          <>
            <HomeIcon className="h-4 w-4 mr-2 shrink-0" /> 
            <span className="font-medium text-sm">Home</span>
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
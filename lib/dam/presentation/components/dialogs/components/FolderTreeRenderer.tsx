'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, HomeIcon, Loader2 } from 'lucide-react';
import { FolderTreeItem } from '../FolderTreeItem';
import { type FolderNode } from '@/lib/store/folderStore';

interface FolderTreeRendererProps {
  rootFolders: FolderNode[];
  isInitiallyLoading: boolean;
  selectedFolderId: string | null | undefined;
  currentAssetFolderId?: string | null;
  onSelect: (folderId: string | null) => void;
  onToggleExpand: (folderId: string) => Promise<void>;
}

/**
 * FolderTreeRenderer Component
 * Follows Single Responsibility Principle - handles folder tree rendering and display
 */
export const FolderTreeRenderer: React.FC<FolderTreeRendererProps> = ({
  rootFolders,
  isInitiallyLoading,
  selectedFolderId,
  currentAssetFolderId,
  onSelect,
  onToggleExpand,
}) => {
  const renderTree = (nodes: FolderNode[], level: number): React.ReactNode => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <FolderTreeItem
          node={node}
          level={level}
          selectedFolderId={selectedFolderId}
          currentAssetFolderId={currentAssetFolderId}
          onSelect={onSelect}
          toggleExpand={onToggleExpand}
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

  if (isInitiallyLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading...
      </div>
    );
  }

  if (rootFolders.length === 0 && !isInitiallyLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
        <AlertTriangle className="w-10 h-10 mb-2" />
        <p className="font-semibold">No folders found</p>
        <p className="text-sm">There are no folders to display.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-72 w-full rounded-md border p-2">
      <div className="space-y-1" role="tree" aria-label="Folder navigation tree">
        <Button
          variant={selectedFolderId === null ? 'secondary' : 'ghost'}
          className={`w-full justify-start text-left h-auto py-2 px-3 ${
            currentAssetFolderId === null ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => currentAssetFolderId !== null && onSelect(null)}
          disabled={currentAssetFolderId === null}
          aria-pressed={selectedFolderId === null}
          role="treeitem" 
        >
          <HomeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          Root
        </Button>

        {renderTree(rootFolders, 0)}
      </div>
    </ScrollArea>
  );
}; 

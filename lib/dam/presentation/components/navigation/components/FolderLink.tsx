'use client';

import React from 'react';
import Link from 'next/link';
import { Folder as FolderIcon } from 'lucide-react';
import { type FolderNode } from '@/lib/store/folderStore';

interface FolderLinkProps {
  folderNode: FolderNode;
  isOver: boolean;
}

/**
 * FolderLink Component
 * Follows Single Responsibility Principle - handles folder link display and navigation
 */
export const FolderLink: React.FC<FolderLinkProps> = ({
  folderNode,
  isOver,
}) => {
  return (
    <Link
      href={`/dam?folderId=${folderNode.id}`}
      className="flex items-center min-w-0 flex-1"
    >
      <FolderIcon className={`h-5 w-5 mr-2 flex-shrink-0 ${isOver ? 'text-blue-600 animate-pulse' : ''}`} />
      <span 
        className="truncate font-medium text-sm flex-1" 
        title={folderNode.name || '[NO NAME]'}
      >
        {folderNode.name || '[NO NAME]'}
      </span>
      {isOver && (
        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] ml-1 shrink-0 font-medium">
          Drop
        </span>
      )}
    </Link>
  );
}; 

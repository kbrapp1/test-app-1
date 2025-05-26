'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react';

interface FolderActionMenuProps {
  folderId: string;
  folderName: string;
  onAction: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
  variant?: 'grid' | 'list';
}

/**
 * FolderActionMenu - Reusable action menu component
 * 
 * Handles folder actions like rename and delete.
 * Follows SRP by focusing solely on action menu concerns.
 */
export const FolderActionMenu: React.FC<FolderActionMenuProps> = ({
  folderId,
  folderName,
  onAction,
  variant = 'grid'
}) => {
  const buttonClasses = variant === 'list' 
    ? "h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
    : "h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={buttonClasses}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          onAction('rename', folderId, folderName);
        }}>
          <Edit3 className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600" 
          onClick={(e) => {
            e.stopPropagation();
            onAction('delete', folderId, folderName);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react';

interface FolderActionMenuProps {
  folderId: string;
  folderName: string;
  variant: 'grid' | 'list';
  onAction: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
}

/**
 * Folder action menu component
 * 
 * Single Responsibility: Folder actions (rename, delete) with dropdown UI
 * Handles positioning and styling for different variants
 */
export const FolderActionMenu: React.FC<FolderActionMenuProps> = ({
  folderId,
  folderName,
  variant,
  onAction
}) => {
  const handleAction = (action: 'rename' | 'delete') => (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(action, folderId, folderName);
  };

  const containerClasses = variant === 'grid' 
    ? 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
    : '';

  const buttonClasses = variant === 'list'
    ? 'h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200'
    : 'h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200';

  const iconClasses = variant === 'grid'
    ? 'h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors duration-200'
    : 'h-4 w-4';

  return (
    <div className={containerClasses}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={buttonClasses}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className={iconClasses} />
            <span className="sr-only">Open folder menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleAction('rename')}>
            <Edit3 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleAction('delete')}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}; 
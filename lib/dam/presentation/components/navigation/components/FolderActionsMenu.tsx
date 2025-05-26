'use client';

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface FolderActionsMenuProps {
  isActive: boolean;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * FolderActionsMenu Component
 * Follows Single Responsibility Principle - handles folder action menu display and interactions
 */
export const FolderActionsMenu: React.FC<FolderActionsMenuProps> = ({
  isActive,
  onRename,
  onDelete,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-6 w-6 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 transition-all duration-200",
            isActive && "opacity-100"
          )}
        >
          <MoreHorizontal className="h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
          <span className="sr-only">Folder options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRename}>
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  X, 
  Move, 
  Trash2, 
  Download, 
  Tag, 
  Copy,
  CheckSquare,
  Square,
  ChevronDown,
  File,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  isVisible: boolean;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onSelectAllFiles: () => void;
  onSelectAllFolders: () => void;
  onMove: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onAddTags: () => void;
  onCopy?: () => void;
  className?: string;
  selectedAssets?: string[];
  selectedFolders?: string[];
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  isVisible,
  onClearSelection,
  onSelectAll,
  onSelectAllFiles,
  onSelectAllFolders,
  onMove,
  onDelete,
  onDownload,
  onAddTags,
  onCopy,
  className,
  selectedAssets = [],
  selectedFolders = []
}) => {
  const selectionPercentage = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  
  const hasAssets = selectedAssets.length > 0;
  const hasFolders = selectedFolders.length > 0;
  const hasOnlyAssets = hasAssets && !hasFolders;
  const hasOnlyFolders = hasFolders && !hasAssets;

  if (!isVisible || selectedCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
      "bg-white border border-gray-200 rounded-lg shadow-lg",
      "px-4 py-3 flex items-center gap-3",
      "transition-all duration-200 ease-in-out",
      "min-w-[400px] max-w-[600px]",
      className
    )}>
      {/* Selection Info */}
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          {selectedCount} selected
        </Badge>
        
        {/* Progress indicator */}
        <div className="flex-1 min-w-[60px] max-w-[100px]">
          <Progress 
            value={selectionPercentage} 
            className="h-2"
        />
      </div>

        <span className="text-sm text-gray-500 whitespace-nowrap">
          {selectedCount} of {totalCount}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Select All Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="Selection options"
            >
              {isAllSelected ? (
                <Square className="w-4 h-4" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem 
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              {isAllSelected ? "Clear All" : "Select All"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onSelectAllFiles}
              className="flex items-center gap-2"
            >
              <File className="w-4 h-4" />
              Select All Files
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onSelectAllFolders}
              className="flex items-center gap-2"
            >
              <Folder className="w-4 h-4" />
              Select All Folders
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Move */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMove}
          className="h-8 px-2"
          title="Move selected items"
          >
          <Move className="w-4 h-4" />
          </Button>

        {/* Download - Always available for ZIP downloads */}
            <Button
              variant="ghost"
              size="sm"
          onClick={onDownload}
          className="h-8 px-2"
          title="Download selected items as ZIP"
            >
          <Download className="w-4 h-4" />
            </Button>

        {/* Add Tags - Only for assets */}
        {selectedAssets.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddTags}
            className="h-8 px-2"
            title="Add tags to selected assets"
          >
            <Tag className="w-4 h-4" />
          </Button>
        )}

        {/* Copy (if provided) */}
        {onCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-8 px-2"
            title="Copy selected items"
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}

        {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Delete selected items"
          >
          <Trash2 className="w-4 h-4" />
          </Button>

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 px-2 ml-2 border-l border-gray-200"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}; 
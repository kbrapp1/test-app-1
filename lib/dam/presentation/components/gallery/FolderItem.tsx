'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2, Folder } from 'lucide-react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';

interface FolderItemProps {
  folder: GalleryItemDto & { type: 'folder' };
  onClick: () => void;
  enableNavigation: boolean;
  onAction?: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
  variant?: 'grid' | 'list';
  isOptimisticallyHidden?: boolean;
  // Selection props
  isSelected?: boolean;
  isSelecting?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

// Safe date formatting helper
const formatDate = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    return 'Unknown date';
  }
};

export const FolderItem: React.FC<FolderItemProps> = ({ 
  folder, 
  onClick,
  enableNavigation,
  onAction,
  variant = 'grid',
  isOptimisticallyHidden = false,
  isSelected,
  isSelecting,
  onSelectionChange
}) => {
  // Drop zone functionality for receiving dragged assets and folders
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: folder.id,
    data: { 
      type: 'folder', 
      item: folder,
      accepts: ['asset', 'folder']
    }
  });

  // Drag functionality for moving this folder
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: folder.id,
    data: { type: 'folder', item: folder },
  });

  // Combine refs for both drag and drop
  const setNodeRef = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  // Style for dragging
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    willChange: isDragging ? 'transform' : 'auto',
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  // Handle click behavior based on selection mode
  const handleClick = (e: React.MouseEvent) => {
    if (isSelecting && onSelectionChange) {
      e.preventDefault();
      e.stopPropagation();
      onSelectionChange(!isSelected);
    } else {
      onClick();
    }
  };


  
  if (variant === 'list') {
    return (
      <div 
        ref={setNodeRef}
        {...attributes}
        style={style}
        className={`group relative flex items-center p-3 border border-gray-200 rounded-lg bg-white transition-all duration-200 ${
          isDragging || isOptimisticallyHidden
            ? 'opacity-0'
            : isSelected
            ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200'
            : isSelecting
            ? 'cursor-pointer hover:bg-blue-25 hover:border-blue-200'
            : isOver
            ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200'
            : `hover:bg-gray-50/70 hover:border-gray-300 ${enableNavigation ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`
        }`}
      >
        <div 
          className="flex items-center flex-1 min-w-0"
          onClick={handleClick}
        >
          <div 
            className={`w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0 transition-colors duration-200 relative ${
              isSelecting ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
            } ${isOver ? 'bg-blue-200 scale-105' : ''}`}
            {...(isSelecting ? {} : listeners)}
          >
            <Folder className={`w-4 h-4 text-blue-600 ${isOver ? 'animate-pulse' : ''}`} />
            
            {/* Selection Overlay for List */}
            {isSelecting && (
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className={`absolute inset-0 border-2 rounded-md transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-transparent'
                  }`}
                />
                {isSelected && (
                  <div className="absolute -top-1 -left-1 z-10">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate" title={folder.name}>
              {folder.name}
            </h3>
            <p className="text-xs text-gray-500">
              {formatDate(folder.createdAt)}
            </p>
          </div>
        </div>
        
        {/* Drop Here Indicator for List View */}
        {isOver && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10">
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded shadow-md whitespace-nowrap border border-blue-200">
              Drop Here
            </span>
          </div>
        )}
        
        {/* Action Menu */}
        {onAction && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onAction('rename', folder.id, folder.name);
              }}>
                <Edit3 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('delete', folder.id, folder.name);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Grid variant
  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={`group relative p-4 border border-gray-200 rounded-lg bg-white transition-all duration-200 ${
        isDragging || isOptimisticallyHidden
          ? 'opacity-0'
          : isSelected
          ? 'bg-blue-50 border-blue-300 shadow-lg ring-1 ring-blue-200 scale-102'
          : isSelecting
          ? 'cursor-pointer hover:bg-blue-25 hover:border-blue-200 hover:scale-[1.01]'
          : isOver
          ? 'bg-blue-50 border-blue-300 shadow-lg ring-1 ring-blue-200 scale-102'
          : `hover:bg-gray-50/70 hover:border-gray-300 ${enableNavigation ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : 'cursor-default'}`
      }`}
    >
      <div 
        className="flex flex-col items-center text-center"
        onClick={handleClick}
      >
        <div 
          className={`w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-150 transition-colors duration-200 relative ${
            isSelecting ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
          } ${isOver ? 'bg-blue-200 scale-105' : ''}`}
          {...(isSelecting ? {} : listeners)}
        >
          <Folder className={`w-6 h-6 text-blue-600 ${isOver ? 'animate-pulse' : ''}`} />
          
          {/* Selection Overlay for Grid */}
          {isSelecting && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className={`absolute inset-0 border-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-transparent'
                }`}
              />
              {isSelected && (
                <div className="absolute -top-1 -left-1 z-10">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {isOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-lg border-2 border-blue-300 border-dashed">
            <span className="text-xs font-medium text-blue-700 bg-white/95 px-2 py-1 rounded shadow-sm">
              Drop Here
            </span>
          </div>
        )}
        <h3 className="font-medium text-sm text-gray-900 mb-1 truncate w-full" title={folder.name}>
          {folder.name}
        </h3>
        <p className="text-xs text-gray-500">
          {formatDate(folder.createdAt)}
        </p>
      </div>
      
      {/* Action Menu */}
      {onAction && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
                <span className="sr-only">Open folder menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('rename', folder.id, folder.name);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('delete', folder.id, folder.name);
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}; 






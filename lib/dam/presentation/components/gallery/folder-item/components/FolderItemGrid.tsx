'use client';

import React from 'react';
import { GalleryItemDto } from '../../../../../application/use-cases/folders/ListFolderContentsUseCase';
import { FolderThumbnail } from './FolderThumbnail';
import { FolderActionMenu } from './FolderActionMenu';
import { DateFormatters } from '../utils/dateFormatters';

interface FolderItemGridProps {
  folder: GalleryItemDto & { type: 'folder' };
  // State props
  isDragging: boolean;
  isOptimisticallyHidden: boolean;
  isSelected: boolean;
  isSelecting: boolean;
  isOver: boolean;
  // Event props
  onClick: (e: React.MouseEvent) => void;
  // Drag props
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: any;
  style: React.CSSProperties;
  listeners: any;
  // Action props
  onAction?: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
  enableNavigation: boolean;
}

/**
 * Grid variant of folder item component
 * 
 * Single Responsibility: Grid layout and styling for folder items
 * Handles vertical card layout with thumbnail, name, date, and actions
 */
export const FolderItemGrid: React.FC<FolderItemGridProps> = ({
  folder,
  isDragging,
  isOptimisticallyHidden,
  isSelected,
  isSelecting,
  isOver,
  onClick,
  setNodeRef,
  attributes,
  style,
  listeners,
  onAction,
  enableNavigation
}) => {
  const containerClasses = `group relative p-4 border border-gray-200 rounded-lg bg-white transition-all duration-200 ${
    isDragging || isOptimisticallyHidden
      ? 'opacity-0'
      : isSelected
      ? 'bg-blue-50 border-blue-300 shadow-lg ring-1 ring-blue-200 scale-102'
      : isSelecting
      ? 'cursor-pointer hover:bg-blue-25 hover:border-blue-200 hover:scale-[1.01]'
      : isOver
      ? 'bg-blue-50 border-blue-300 shadow-lg ring-1 ring-blue-200 scale-102'
      : `hover:bg-gray-50/70 hover:border-gray-300 ${enableNavigation ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : 'cursor-default'}`
  }`;

  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={containerClasses}
    >
      <div 
        className="flex flex-col items-center text-center"
        onClick={onClick}
      >
        <FolderThumbnail
          variant="grid"
          isSelecting={isSelecting}
          isSelected={isSelected}
          isOver={isOver}
          listeners={listeners}
        />
        
        {/* Drop overlay for grid view */}
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
          {DateFormatters.formatRelativeDate(folder.createdAt)}
        </p>
      </div>
      
      {/* Action Menu */}
      {onAction && (
        <FolderActionMenu
          folderId={folder.id}
          folderName={folder.name}
          variant="grid"
          onAction={onAction}
        />
      )}
    </div>
  );
}; 
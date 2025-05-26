'use client';

import React from 'react';
import { GalleryItemDto } from '../../../../../application/use-cases/folders/ListFolderContentsUseCase';
import { FolderThumbnail } from './FolderThumbnail';
import { FolderActionMenu } from './FolderActionMenu';
import { DateFormatters } from '../utils/dateFormatters';

interface FolderItemListProps {
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
 * List variant of folder item component
 * 
 * Single Responsibility: List layout and styling for folder items
 * Handles horizontal layout with thumbnail, name, date, and actions
 */
export const FolderItemList: React.FC<FolderItemListProps> = ({
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
  const containerClasses = `group relative flex items-center p-3 border border-gray-200 rounded-lg bg-white transition-all duration-200 ${
    isDragging || isOptimisticallyHidden
      ? 'opacity-0'
      : isSelected
      ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200'
      : isSelecting
      ? 'cursor-pointer hover:bg-blue-25 hover:border-blue-200'
      : isOver
      ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200'
      : `hover:bg-gray-50/70 hover:border-gray-300 ${enableNavigation ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`
  }`;

  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={containerClasses}
    >
      <div 
        className="flex items-center flex-1 min-w-0"
        onClick={onClick}
      >
        <FolderThumbnail
          variant="list"
          isSelecting={isSelecting}
          isSelected={isSelected}
          isOver={isOver}
          listeners={listeners}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate" title={folder.name}>
            {folder.name}
          </h3>
          <p className="text-xs text-gray-500">
            {DateFormatters.formatRelativeDate(folder.createdAt)}
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
        <FolderActionMenu
          folderId={folder.id}
          folderName={folder.name}
          variant="list"
          onAction={onAction}
        />
      )}
    </div>
  );
}; 
'use client';

import React from 'react';
import { SelectionOverlay } from '../../../selection/SelectionOverlay';
import { FolderActionMenu } from './FolderActionMenu';
import { FolderThumbnail } from './FolderThumbnail';
import { formatDate } from '../utils/dateFormatters';
import type { FolderComponentProps } from '../types';

/**
 * SelectableFolderList - List view variant
 * 
 * Handles list view display of selectable folders.
 * Follows SRP by focusing solely on list presentation.
 */
export const SelectableFolderList: React.FC<FolderComponentProps> = ({
  folder,
  onClick,
  enableNavigation,
  onAction,
  isSelected,
  isSelecting,
  onSelectionChange,
  state
}) => {
  const { 
    nodeRef, 
    dragAttributes, 
    dragListeners, 
    style, 
    isOver, 
    shouldHide,
    dropClasses 
  } = state;

  return (
    <div 
      ref={nodeRef}
      {...dragAttributes}
      style={style}
      className={`group relative transition-all duration-200 ${
        shouldHide ? 'opacity-0' : 'hover:scale-[1.01]'
      }`}
    >
      <SelectionOverlay
        isSelected={isSelected}
        isSelecting={isSelecting}
        onSelectionChange={onSelectionChange}
      >
        <div 
          className={`flex items-center p-3 border border-gray-200 rounded-lg bg-white transition-all duration-200 relative ${
            dropClasses || `hover:bg-gray-50/70 hover:border-gray-300 ${enableNavigation ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`
          }`}
          onClick={onClick}
        >
          {/* Drag handle with grip lines at top center */}
          <div 
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
            {...dragListeners}
            onMouseDown={(e) => e.stopPropagation()}
            title="Drag to move folder"
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>
          
          <FolderThumbnail 
            isOver={isOver}
            variant="list"
            dragListeners={dragListeners}
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate" title={folder.name}>
              {folder.name}
            </h3>
            <p className="text-xs text-gray-500">
              {formatDate(folder.createdAt)}
            </p>
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
              onAction={onAction}
              variant="list"
            />
          )}
        </div>
      </SelectionOverlay>
    </div>
  );
}; 
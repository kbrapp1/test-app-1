'use client';

import React from 'react';
import { SelectionOverlay } from '../../../selection/SelectionOverlay';
import { FolderActionMenu } from './FolderActionMenu';
import { FolderThumbnail } from './FolderThumbnail';
import { formatDate } from '../utils/dateFormatters';
import type { FolderComponentProps } from '../types';

/**
 * SelectableFolderGrid - Grid view variant
 * 
 * Handles grid view display of selectable folders.
 * Follows SRP by focusing solely on grid presentation.
 */
export const SelectableFolderGrid: React.FC<FolderComponentProps> = ({
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
        shouldHide ? 'opacity-0' : 'hover:scale-[1.02] hover:shadow-lg'
      }`}
    >
      <SelectionOverlay
        isSelected={isSelected}
        isSelecting={isSelecting}
        onSelectionChange={onSelectionChange}
      >
        <div 
          className={`p-4 border border-gray-200 rounded-lg bg-white transition-all duration-200 relative ${
            dropClasses || `hover:bg-gray-50/70 hover:border-gray-300 ${enableNavigation ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`
          }`}
          onClick={onClick}
        >
          {/* Drag handle with grip lines at top center */}
          <div 
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
            {...state.dragListeners}
            onMouseDown={(e) => e.stopPropagation()}
            title="Drag to move folder"
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <FolderThumbnail 
              isOver={isOver}
              variant="grid"
              dragListeners={state.dragListeners}
            />
            
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
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <FolderActionMenu
                folderId={folder.id}
                folderName={folder.name}
                onAction={onAction}
                variant="grid"
              />
            </div>
          )}
        </div>
      </SelectionOverlay>
    </div>
  );
}; 
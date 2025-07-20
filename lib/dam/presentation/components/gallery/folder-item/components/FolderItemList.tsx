'use client';

import React from 'react';
import { GalleryItemDto } from '../../../../../domain/value-objects/GalleryItem';
import { useFolderItemState } from '../hooks/useFolderItemState';
import { FolderThumbnail } from './FolderThumbnail';

interface FolderItemListProps {
  folder: GalleryItemDto & { type: 'folder' };
  onFolderClick: (folderId: string) => void;
  onFolderSelect: (folderId: string, isShiftKey: boolean) => void;
}

/**
 * FolderItemList - Presentation Layer Component
 * 
 * Single Responsibility: Render folder item in list layout
 * Follows DDD principles by focusing solely on presentation concerns
 */
export const FolderItemList: React.FC<FolderItemListProps> = ({ 
  folder, 
  onFolderClick, 
  onFolderSelect 
}) => {
  const folderState = useFolderItemState({ 
    folder, 
    onFolderClick, 
    onFolderSelect 
  });

  return (
    <div
      className={`
        flex items-center p-2 rounded-lg border transition-all duration-200
        ${folderState.isHovered ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
        ${folderState.isPressed ? 'scale-95' : 'scale-100'}
        hover:shadow-sm cursor-pointer
      `}
      onMouseEnter={folderState.handleMouseEnter}
      onMouseLeave={folderState.handleMouseLeave}
      onMouseDown={folderState.handleMouseDown}
      onMouseUp={folderState.handleMouseUp}
      onClick={folderState.handleClick}
      onDoubleClick={folderState.handleDoubleClick}
    >
      <FolderThumbnail folder={folder} />
      <div className="ml-3 flex-1">
        <div className="text-sm font-medium text-gray-900 truncate">
          {folder.name}
        </div>
        <div className="text-xs text-gray-500">
          Folder
        </div>
      </div>
    </div>
  );
}; 
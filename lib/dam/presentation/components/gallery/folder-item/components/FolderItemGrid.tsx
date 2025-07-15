'use client';

import React from 'react';
import { GalleryItemDto } from '../../../../../application/use-cases/folders/ListFolderContentsUseCase';
import { useFolderItemState } from '../hooks/useFolderItemState';
import { FolderThumbnail } from './FolderThumbnail';

interface FolderItemGridProps {
  folder: GalleryItemDto & { type: 'folder' };
  onFolderClick: (folderId: string) => void;
  onFolderSelect: (folderId: string, isShiftKey: boolean) => void;
}

/**
 * FolderItemGrid - Presentation Layer Component
 * 
 * Single Responsibility: Render folder item in grid layout
 * Follows DDD principles by focusing solely on presentation concerns
 */
export const FolderItemGrid: React.FC<FolderItemGridProps> = ({ 
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
        relative p-2 rounded-lg border-2 transition-all duration-200
        ${folderState.isHovered ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
        ${folderState.isPressed ? 'scale-95' : 'scale-100'}
        hover:shadow-md cursor-pointer
      `}
      onMouseEnter={folderState.handleMouseEnter}
      onMouseLeave={folderState.handleMouseLeave}
      onMouseDown={folderState.handleMouseDown}
      onMouseUp={folderState.handleMouseUp}
      onClick={folderState.handleClick}
      onDoubleClick={folderState.handleDoubleClick}
    >
      <FolderThumbnail folder={folder} />
      <div className="mt-2 text-sm font-medium text-gray-900 truncate">
        {folder.name}
      </div>
    </div>
  );
}; 
'use client';

import React from 'react';
import { Folder, File, CheckSquare } from 'lucide-react';
import { GalleryItemDto } from '../../../../domain/value-objects/GalleryItem';
import { GalleryMultiSelectState } from '../../../types/gallery-types';

interface ContentSectionsProps {
  folders: (GalleryItemDto & { type: 'folder' })[];
  assets: (GalleryItemDto & { type: 'asset' })[];
  renderFolders: () => React.ReactNode;
  renderAssets: () => React.ReactNode;
  enableMultiSelect?: boolean;
  multiSelect?: GalleryMultiSelectState;
}

export const ContentSections: React.FC<ContentSectionsProps> = ({
  folders,
  assets,
  renderFolders,
  renderAssets,
  enableMultiSelect = true,
  multiSelect,
}) => {
  const selectedFolderCount = enableMultiSelect && multiSelect ? multiSelect.selectedFolders.length : 0;
  const selectedAssetCount = enableMultiSelect && multiSelect ? multiSelect.selectedAssets.length : 0;

  return (
    <>
      {folders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Folder className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Folders</h2>
            <span className="text-sm text-gray-500">({folders.length})</span>
            {enableMultiSelect && multiSelect?.isSelecting && selectedFolderCount > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {selectedFolderCount} selected
                </span>
              </div>
            )}
          </div>
          {renderFolders()}
        </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <File className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Assets</h2>
            <span className="text-sm text-gray-500">({assets.length})</span>
            {enableMultiSelect && multiSelect?.isSelecting && selectedAssetCount > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {selectedAssetCount} selected
                </span>
              </div>
            )}
          </div>
          {renderAssets()}
        </div>
      )}
    </>
  );
}; 

'use client';

import React from 'react';
import { Folder, File } from 'lucide-react';
import { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';

interface ContentSectionsProps {
  folders: (GalleryItemDto & { type: 'folder' })[];
  assets: (GalleryItemDto & { type: 'asset' })[];
  renderFolders: () => React.ReactNode;
  renderAssets: () => React.ReactNode;
}

export const ContentSections: React.FC<ContentSectionsProps> = ({
  folders,
  assets,
  renderFolders,
  renderAssets,
}) => {
  return (
    <>
      {folders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Folder className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Folders</h2>
            <span className="text-sm text-gray-500">({folders.length})</span>
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
          </div>
          {renderAssets()}
        </div>
      )}
    </>
  );
}; 

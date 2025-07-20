'use client';

import React from 'react';
import { Folder } from 'lucide-react';
import { GalleryItemDto } from '../../../../../domain/value-objects/GalleryItem';

interface FolderThumbnailProps {
  folder: GalleryItemDto & { type: 'folder' };
}

/**
 * FolderThumbnail - Presentation Layer Component
 * 
 * Single Responsibility: Display folder icon and basic styling
 * Follows DDD principles by focusing solely on presentation concerns
 */
export const FolderThumbnail: React.FC<FolderThumbnailProps> = ({ folder: _folder }) => {
  return (
    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
      <Folder className="w-6 h-6 text-blue-600" />
    </div>
  );
}; 
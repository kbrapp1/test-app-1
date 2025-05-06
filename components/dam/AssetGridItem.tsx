import React from 'react';
import { AssetThumbnail } from './AssetThumbnail';
import { FolderThumbnail } from './FolderThumbnail';
import { Asset, Folder, CombinedItem } from '@/types/dam';

interface AssetGridItemProps {
  item: CombinedItem;
  index: number;
  priorityThreshold: number;
  style?: React.CSSProperties;
}

/**
 * Renders a single item in the asset grid, handling both folders and assets
 */
export function AssetGridItem({ item, index, priorityThreshold, style }: AssetGridItemProps) {
  // Inner container for styling (padding and fill parent)
  const innerStyle: React.CSSProperties = {
    padding: '0.5rem',
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    ...style
  };

  return (
    <div style={innerStyle} className="flex flex-col items-center text-center relative group">
      {/* Filename displayed at the top */}
      <div 
        className="w-full px-1 pt-1 pb-0.5 text-xs font-medium text-gray-800 dark:text-gray-200 truncate text-center bg-gray-100 dark:bg-gray-700 rounded-t-md border-b border-gray-200 dark:border-gray-600"
        title={item.name}
      >
        {item.name}
      </div>

      {/* Thumbnail Area */}
      <div className="w-full h-full flex-grow relative">
        {item.type === 'folder' ? (
          <FolderThumbnail folder={item as Folder} />
        ) : (
          <AssetThumbnail
            src={(item as Asset).publicUrl}
            alt={item.name}
            assetId={item.id}
            storagePath={(item as Asset).storage_path}
            folderId={(item as Asset).folder_id}
            type={item.type}
            isPriority={index < priorityThreshold && (item as Asset).mime_type.startsWith('image/')}
            mimeType={(item as Asset).mime_type}
          />
        )}
      </div>
    </div>
  );
} 
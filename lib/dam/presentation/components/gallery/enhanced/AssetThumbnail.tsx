'use client';

import React from 'react';
import NextImage from 'next/image';
import { File, Folder, Image as ImageIcon } from 'lucide-react';

interface AssetThumbnailProps {
  item: {
    id: string;
    name: string;
    type: 'asset' | 'folder';
    mimeType?: string;
    thumbnailUrl?: string;
    publicUrl?: string;
  };
  _isSelected: boolean;
  _onSelect: (id: string) => void;
  _dragListeners?: Record<string, unknown>;
  _dragAttributes?: Record<string, unknown>;
  isDragging?: boolean;
}

/**
 * AssetThumbnail - Enhanced asset thumbnail with clear drag/click distinction
 * 
 * Provides visual cues to distinguish between click-to-preview and drag-to-move.
 * Follows SRP by focusing solely on thumbnail presentation and interaction hints.
 */
export const AssetThumbnail: React.FC<AssetThumbnailProps> = ({
  item,
  _isSelected,
  _onSelect,
  _dragListeners,
  _dragAttributes,
  isDragging
}) => {
  const [imageError, setImageError] = React.useState(false);
  const isImage = item.mimeType?.toLowerCase().startsWith('image/');

  const getAssetIcon = () => {
    const mimeType = item.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-9 h-9 text-green-600" />;
    if (mimeType.startsWith('video/')) return <Folder className="w-9 h-9 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <Folder className="w-9 h-9 text-orange-600" />;
    if (mimeType.includes('text')) return <File className="w-9 h-9 text-gray-600" />;
    
    return <Folder className="w-9 h-9 text-gray-500" />;
  };

  return (
    <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden relative group">
        {/* Main clickable preview area */}
        {isImage && item.publicUrl && !imageError ? (
          <NextImage
            src={item.publicUrl}
            alt={item.name}
            width={200}
            height={200}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImageError(true)}
            draggable="false"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getAssetIcon()}
          </div>
        )}
        
        {/* File type badge - only visible on hover */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {item.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
        </div>
        
        {/* Drag overlay for visual feedback */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-400 border-dashed rounded-lg flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700 bg-white/95 px-2 py-1 rounded shadow-sm">
              Moving...
            </span>
          </div>
        )}
      </div>
  );
}; 
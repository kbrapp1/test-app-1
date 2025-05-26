'use client';

import React, { useState } from 'react';
import { Image, Video, Music, FileText, File, GripVertical } from 'lucide-react';

interface AssetThumbnailProps {
  asset: {
    id: string;
    name: string;
    mimeType?: string;
    publicUrl?: string;
  };
  dragListeners: any;
  isDragging: boolean;
}

/**
 * AssetThumbnail - Enhanced asset thumbnail with clear drag/click distinction
 * 
 * Provides visual cues to distinguish between click-to-preview and drag-to-move.
 * Follows SRP by focusing solely on thumbnail presentation and interaction hints.
 */
export const AssetThumbnail: React.FC<AssetThumbnailProps> = ({
  asset,
  dragListeners,
  isDragging
}) => {
  const [imageError, setImageError] = useState(false);
  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');

  const getAssetIcon = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return <Image className="w-9 h-9 text-green-600" />;
    if (mimeType.startsWith('video/')) return <Video className="w-9 h-9 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-9 h-9 text-orange-600" />;
    if (mimeType.includes('text')) return <FileText className="w-9 h-9 text-gray-600" />;
    
    return <File className="w-9 h-9 text-gray-500" />;
  };

  return (
    <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden relative group">
        {/* Main clickable preview area */}
        {isImage && asset.publicUrl && !imageError ? (
          <img
            src={asset.publicUrl}
            alt={asset.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
            draggable="false"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getAssetIcon()}
          </div>
        )}
        
        {/* File type badge - only visible on hover */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {asset.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
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
'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit3, Navigation, Trash2, Image, Video, Music, FileText, File } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { SelectionOverlay } from '../selection/SelectionOverlay';
import { ColoredTag } from '../assets/ColoredTag';
import { TagColorName } from '../../../domain/value-objects/TagColor';

interface AssetListItemProps {
  asset: GalleryItemDto & { type: 'asset' };
  onViewDetails: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClick: () => void;
  isOptimisticallyHidden?: boolean;
  // Selection props
  isSelected?: boolean;
  _isSelecting?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

// Safe date formatting helper
const formatDate = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return 'Unknown date';
  }
};

// File size formatting helper
const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const AssetListItem: React.FC<AssetListItemProps> = ({
  asset,
  onViewDetails,
  onRename,
  onMove,
  onDelete,
  onClick,
  isOptimisticallyHidden = false,
  isSelected,
  _isSelecting,
  onSelectionChange
}) => {
  const [imageError, setImageError] = useState(false);
  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');

  // Drag and drop functionality
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: asset.id,
    data: { type: 'asset', item: asset },
  });

  // Optimized style for smooth dragging
  const style: React.CSSProperties = {
    // Use translate3d for hardware acceleration
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    // Enable hardware acceleration
    willChange: isDragging ? 'transform' : 'auto',
    // Disable pointer events on children when dragging to prevent interference
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  const getAssetIcon = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <Image className="w-5 h-5 text-green-600" />
    );
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-orange-600" />;
    if (mimeType.includes('text')) return <FileText className="w-5 h-5 text-gray-600" />;
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getAssetTypeLabel = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('text')) return 'Text';
    
    return 'File';
  };

  // Handle click behavior - always trigger onClick, selection handled by overlay
  const handleClick = () => {
    onClick();
  };

  return (
    <SelectionOverlay
      isSelected={isSelected || false}
      onSelectionChange={onSelectionChange}
      className="w-full"
    >
      <div 
        ref={setNodeRef}
        {...attributes}
        className={`relative flex items-center p-3 border border-gray-200 rounded-lg bg-white transition-all duration-200 group cursor-pointer ${
          isDragging || isOptimisticallyHidden
            ? 'opacity-0'
            : 'hover:bg-gray-50/70 hover:border-gray-300 hover:shadow-md'
        }`}
        style={style}
        onClick={handleClick}
      >
      <div className="flex-shrink-0 mr-3 relative">
        <div 
          className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden transition-all duration-200 relative hover:bg-gray-200"
        >
          {/* Drag handle covering entire thumbnail while avoiding checkbox area */}
          <div 
            className="absolute inset-0 z-5 cursor-grab active:cursor-grabbing"
            style={{
              clipPath: 'polygon(0 28px, 100% 0, 100% 100%, 0 100%), polygon(28px 0, 100% 0, 100% 28px, 28px 28px)'
            }}
            {...listeners}
            onMouseDown={(e) => e.stopPropagation()}
          />
          {isImage && asset.publicUrl && !imageError ? (
            <NextImage
              src={asset.publicUrl}
              alt={asset.name}
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-lg transition-transform duration-200 hover:scale-105"
              onError={() => setImageError(true)}
              draggable="false"
            />
          ) : (
            getAssetIcon()
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate text-gray-900">{asset.name}</h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {getAssetTypeLabel()}
          </span>
          
          <span className="text-xs text-gray-400">|</span>
          
          <span className="text-xs text-gray-500">{formatFileSize(asset.size)}</span>
          
          {/* Folder name display */}
          <>
            <span className="text-xs text-gray-400">|</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-600 border border-gray-200">
              📁 {asset.folderName || 'Root'}
            </span>
          </>
          
          {/* Tags display - show up to 2 tags with overflow indicator */}
          {asset.tags && asset.tags.length > 0 && (
            <>
              <span className="text-xs text-gray-400">|</span>
              {asset.tags.slice(0, 2).map(tag => (
                <ColoredTag
                  key={tag.id}
                  name={tag.name}
                  color={tag.color as TagColorName || 'blue'}
                  size="sm"
                  className="text-xs"
                />
              ))}
              {asset.tags.length > 2 && (
                <span className="text-xs text-gray-400 font-medium">
                  +{asset.tags.length - 2} more
                </span>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Responsive metadata columns */}
      <div className="hidden md:flex flex-col items-end text-right mr-4 min-w-0">
        <p className="text-xs text-gray-500 truncate">
          {asset.userFullName || `User ${asset.userId.slice(0, 8)}...`}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(asset.createdAt)}
        </p>
      </div>
      
      {/* Mobile-only date */}
      <div className="md:hidden flex-shrink-0 text-right mr-4">
        <p className="text-xs text-gray-500">
          {formatDate(asset.createdAt)}
        </p>
      </div>
      {/* Action Menu */}
      <div className={`flex-shrink-0 opacity-0 group-hover:opacity-100 z-20 ${
        isDragging ? '' : 'transition-opacity duration-200'
      }`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 shadow-sm border border-gray-300 transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}>
              <Edit3 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onMove();
            }}>
              <Navigation className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </SelectionOverlay>
  );
}; 

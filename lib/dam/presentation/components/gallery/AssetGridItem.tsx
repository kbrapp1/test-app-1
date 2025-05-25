'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit3, Navigation, Trash2, Image, Video, Music, FileText, File, Tag } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';

interface AssetGridItemProps {
  asset: GalleryItemDto & { type: 'asset' };
  onViewDetails: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClick: () => void;
  isOptimisticallyHidden?: boolean;
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
  } catch (error) {
    return 'Unknown date';
  }
};

export const AssetGridItem: React.FC<AssetGridItemProps> = ({ 
  asset, 
  onViewDetails,
  onRename,
  onMove,
  onDelete,
  onClick,
  isOptimisticallyHidden = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
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
    // No longer need high z-index since DragOverlay handles the visual preview
    // Enable hardware acceleration
    willChange: isDragging ? 'transform' : 'auto',
    // Disable pointer events on children when dragging to prevent interference
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  const getAssetIcon = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6 text-green-600" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-6 h-6 text-orange-600" />;
    if (mimeType.includes('text')) return <FileText className="w-6 h-6 text-gray-600" />;
    
    return <File className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      className={`group relative p-4 border border-gray-200 rounded-lg bg-white cursor-pointer ${
        isDragging || isOptimisticallyHidden
          ? 'opacity-0' // Hide original during drag or when optimistically hidden
          : 'hover:bg-gray-50/70 hover:border-gray-300 transition-all duration-200 hover:shadow-md hover:scale-[1.01]' // More subtle hover effects
      }`}
      style={style}
      onClick={onClick}
    >


      {/* Tag indicator - always visible if asset has tags */}
      {asset.tags && asset.tags.length > 0 && (
        <div className="absolute bottom-2 right-2 z-50">
          <div 
            className="flex items-center justify-center w-6 h-6 bg-white/90 rounded-full shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 8
              });
              setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Tag className="w-3 h-3 text-gray-600" />
            {asset.tags.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                {asset.tags.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Portal tooltip that appears below the icon */}
      {showTooltip && asset.tags && asset.tags.length > 0 && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-white border border-gray-200 rounded-md shadow-lg p-2 max-w-80 w-max">
            <div className="flex flex-wrap gap-1">
              {asset.tags.map(tag => (
                <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                  {tag.name}
                </span>
              ))}
            </div>
            {/* Arrow pointing up to the icon */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-200"></div>
          </div>
        </div>,
        document.body
      )}

      {/* Action Menu - Better Positioning */}
      <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-20 ${
        isDragging ? '' : 'transition-opacity duration-200' // Only apply transitions when not dragging
      }`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm border border-gray-200/50"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-gray-600" />
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
      
      <div className="flex flex-col items-center text-center">
        {/* Image Thumbnail or Icon - Draggable */}
        <div 
          className={`w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-3 overflow-hidden cursor-grab active:cursor-grabbing ${
            isDragging ? 'bg-gray-200' : 'group-hover:bg-gray-200 transition-colors duration-200'
          }`}
          {...listeners}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isImage && asset.publicUrl && !imageError ? (
            <img
              src={asset.publicUrl}
              alt={asset.name}
              loading="lazy"
              className="w-full h-full object-cover rounded-lg"
              onError={() => setImageError(true)}
              draggable="false"
            />
          ) : (
            getAssetIcon()
          )}
        </div>
        <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full" title={asset.name}>
          {asset.name}
        </h3>
        <p className="text-xs text-gray-500">
          {formatDate(asset.createdAt)}
        </p>
      </div>
    </div>
  );
}; 

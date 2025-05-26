'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { SelectionOverlay } from '../selection/SelectionOverlay';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit3, Navigation, Trash2, Image, Video, Music, FileText, File, Tag } from 'lucide-react';

export interface SelectableAssetGridItemProps {
  asset: GalleryItemDto & { type: 'asset' };
  onViewDetails: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClick: () => void;
  isOptimisticallyHidden?: boolean;
  // Selection props
  isSelected: boolean;
  isSelecting?: boolean;
  onSelectionChange: (selected: boolean) => void;
}

/**
 * SelectableAssetGridItem - Asset Grid Item with Multi-Select Support
 * 
 * Combines drag functionality with selection functionality at the wrapper level
 * to ensure proper drag data propagation.
 */
export const SelectableAssetGridItem: React.FC<SelectableAssetGridItemProps> = ({
  asset,
  onViewDetails,
  onRename,
  onMove,
  onDelete,
  onClick,
  isOptimisticallyHidden = false,
  isSelected,
  isSelecting = false,
  onSelectionChange
}) => {
  const [imageError, setImageError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');

  // Drag and drop functionality at the wrapper level
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: asset.id,
    data: { type: 'asset', item: asset },
  });

  // Optimized style for smooth dragging
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    willChange: isDragging ? 'transform' : 'auto',
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  const getAssetIcon = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return <Image className="w-9 h-9 text-green-600" />;
    if (mimeType.startsWith('video/')) return <Video className="w-9 h-9 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-9 h-9 text-orange-600" />;
    if (mimeType.includes('text')) return <FileText className="w-9 h-9 text-gray-600" />;
    
    return <File className="w-9 h-9 text-gray-500" />;
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`relative group transition-all duration-200 ${
        isDragging || isOptimisticallyHidden
          ? 'opacity-0'
          : 'hover:scale-[1.02] hover:shadow-lg'
      }`}
      style={style}
    >
      <SelectionOverlay
        isSelected={isSelected}
        isSelecting={isSelecting}
        onSelectionChange={onSelectionChange}
      >
        <div 
          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-md"
          onClick={onClick}
        >
          {/* Asset thumbnail */}
          <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden relative">
            {/* Drag handle - positioned to provide large drag area while avoiding checkbox */}
            <div 
              className="absolute top-12 left-0 bottom-0 right-0 z-5 cursor-grab active:cursor-grabbing"
              {...listeners}
              onMouseDown={(e) => e.stopPropagation()}
            />
            {/* Additional drag handle for right side */}
            <div 
              className="absolute top-0 left-12 bottom-0 right-0 z-5 cursor-grab active:cursor-grabbing"
              {...listeners}
              onMouseDown={(e) => e.stopPropagation()}
            />
            
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
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {asset.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
            </div>
          </div>



          {/* Asset info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate text-sm flex-1">
                {asset.name}
              </h3>
              
              {/* Tag indicator in name row */}
              {asset.tags && asset.tags.length > 0 && (
                <div 
                  className="flex-shrink-0 relative p-1 -m-1 rounded-md hover:bg-gray-50 transition-all duration-200 cursor-pointer"
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
                  <div className="flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full hover:bg-gray-200 transition-all duration-200">
                    <Tag className="w-3 h-3 text-gray-600" />
                  </div>
                  {asset.tags.length > 1 && (
                    <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium text-[10px] leading-none z-10">
                      {asset.tags.length}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDate(asset.createdAt)}</span>
              {asset.size && (
                <span>{(asset.size / 1024 / 1024).toFixed(1)} MB</span>
              )}
            </div>
          </div>

          {/* Action menu */}
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-gray-300 hover:bg-white hover:border-blue-500 hover:shadow-md hover:scale-110 focus:bg-white focus:border-blue-500 focus:shadow-md focus:scale-110 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                  <Navigation className="mr-2 h-4 w-4" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>



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
        </div>
      </SelectionOverlay>
    </div>
  );
}; 
'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { SelectionOverlay } from '../selection/SelectionOverlay';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit3, Navigation, Trash2, Tag } from 'lucide-react';
import { ColoredTag } from './ColoredTag';
import { TagColorName } from '../../../domain/value-objects/TagColor';
import { AssetThumbnail } from '../gallery/enhanced/AssetThumbnail';

export interface SelectableEnhancedAssetGridItemProps {
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
 * SelectableEnhancedAssetGridItem - Enhanced Asset Grid Item with Multi-Select and Dedicated Drag Handle
 * 
 * Combines the enhanced click vs drag functionality with multi-select support.
 */
export const SelectableEnhancedAssetGridItem: React.FC<SelectableEnhancedAssetGridItemProps> = ({
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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
          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-md relative"
          onClick={onClick}
        >
          {/* Drag handle with grip lines at top center */}
          <div 
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing z-50"
            {...listeners}
            onMouseDown={(e) => e.stopPropagation()}
            title="Drag to move asset"
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>

          {/* Portal tooltip for tags */}
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
                    <ColoredTag
                      key={tag.id}
                      name={tag.name}
                      color={(tag as any).color as TagColorName || 'blue'}
                      size="sm"
                    />
                  ))}
                </div>
                {/* Arrow pointing up to the icon */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-200"></div>
              </div>
            </div>,
            document.body
          )}

          {/* Action Menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-20 transition-opacity duration-200">
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
          
          {/* Enhanced Asset Thumbnail */}
          <AssetThumbnail 
            item={asset}
            isSelected={isSelected}
            onSelect={(id) => onSelectionChange(!isSelected)}
            _dragListeners={undefined}
            _dragAttributes={undefined}
            isDragging={isDragging}
          />

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
                  onClick={(e) => e.stopPropagation()}
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
        </div>
      </SelectionOverlay>
    </div>
  );
}; 
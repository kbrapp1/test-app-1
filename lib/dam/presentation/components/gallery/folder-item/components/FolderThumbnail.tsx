'use client';

import React from 'react';
import { Folder } from 'lucide-react';
import { SelectionOverlay } from './SelectionOverlay';

interface FolderThumbnailProps {
  variant: 'grid' | 'list';
  isSelecting: boolean;
  isSelected: boolean;
  isOver: boolean;
  listeners: any;
}

/**
 * Folder thumbnail component
 * 
 * Single Responsibility: Folder icon display and drag interaction
 * Handles visual states for different variants and interaction modes
 */
export const FolderThumbnail: React.FC<FolderThumbnailProps> = ({
  variant,
  isSelecting,
  isSelected,
  isOver,
  listeners
}) => {
  const containerClasses = variant === 'grid' 
    ? 'w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3'
    : 'w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0';

  const iconClasses = variant === 'grid' ? 'w-6 h-6' : 'w-4 h-4';
  
  const interactionClasses = isSelecting 
    ? 'cursor-pointer' 
    : 'cursor-grab active:cursor-grabbing';

  const hoverEffects = variant === 'grid' 
    ? 'group-hover:bg-blue-150' 
    : '';

  const dropEffects = isOver 
    ? 'bg-blue-200 scale-105 animate-pulse' 
    : '';

  return (
    <div 
      className={`${containerClasses} ${interactionClasses} ${hoverEffects} ${dropEffects} transition-colors duration-200 relative`}
      {...(isSelecting ? {} : listeners)}
    >
      <Folder className={`${iconClasses} text-blue-600`} />
      
      <SelectionOverlay 
        isSelecting={isSelecting}
        isSelected={isSelected}
        variant={variant}
      />
    </div>
  );
}; 
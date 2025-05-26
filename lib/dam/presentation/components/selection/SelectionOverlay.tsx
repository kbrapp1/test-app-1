'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectionOverlayProps {
  isSelected: boolean;
  isSelecting?: boolean; // Made optional since we'll show checkboxes on hover regardless
  children: React.ReactNode;
  onSelectionChange?: (selected: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  isSelected,
  isSelecting = false,
  children,
  onSelectionChange,
  className,
  disabled = false
}) => {
  const handleCheckboxClick = (event: React.MouseEvent) => {
    if (disabled) return;
    
    event.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange(!isSelected);
    }
  };

  return (
    <div
      className={cn(
        'relative group',
        className
      )}
    >
      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-200 ease-out',
          {
            // Removed ring styling to reduce visual noise
            // Only keep subtle scale animation for selected items
            'scale-[0.98]': isSelected && isSelecting,
            'hover:scale-[1.01]': isSelecting && !isSelected && !disabled,
          }
        )}
      >
        {children}
      </div>

      {/* Selection indicator overlay - removed to reduce visual noise */}

      {/* Selection checkmark - always show when selected */}
      {isSelected && (
        <div className="absolute top-2 left-2 z-20 pointer-events-auto">
          <div 
            className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200 cursor-pointer"
            onClick={handleCheckboxClick}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag interference
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Selection checkbox - show on hover when not selected */}
      {!isSelected && onSelectionChange && (
        <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
          <div 
            className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
            onClick={handleCheckboxClick}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag interference
          >
            <div className="w-3 h-3 border border-gray-400 rounded-sm" />
          </div>
        </div>
      )}

      {/* Ripple effect on selection - removed to reduce visual noise */}
    </div>
  );
}; 
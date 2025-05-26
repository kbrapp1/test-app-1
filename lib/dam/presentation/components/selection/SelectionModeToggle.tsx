'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionModeToggleProps {
  isSelecting: boolean;
  selectedCount: number;
  onToggle: () => void;
  onClear?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SelectionModeToggle: React.FC<SelectionModeToggleProps> = ({
  isSelecting,
  selectedCount,
  onToggle,
  onClear,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-5 text-base'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (!isSelecting) {
    // Show "Select" button when not in selection mode
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className={cn(
          sizeClasses[size],
          'transition-all duration-200 ease-out',
          'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          className
        )}
      >
        <Square className={cn(iconSizes[size], 'mr-2')} />
        Select
      </Button>
    );
  }

  // Show selection controls when in selection mode
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Selection count and status */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
        <CheckSquare className={cn(iconSizes[size], 'text-blue-600')} />
        <span className="text-sm font-medium text-blue-900">
          {selectedCount > 0 ? `${selectedCount} selected` : 'Select items'}
        </span>
      </div>

      {/* Clear selection button */}
      {selectedCount > 0 && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className={cn(
            'h-8 w-8 p-0',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'transition-all duration-200 ease-out'
          )}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* Exit selection mode button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={cn(
          'transition-all duration-200 ease-out',
          'hover:bg-gray-50 border-gray-300',
          'focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
        )}
      >
        Done
      </Button>
    </div>
  );
}; 
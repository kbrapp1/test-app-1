'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectToggleProps {
  isSelecting: boolean;
  selectedCount: number;
  onToggle: () => void;
  className?: string;
}

export const MultiSelectToggle: React.FC<MultiSelectToggleProps> = ({
  isSelecting,
  selectedCount,
  onToggle,
  className
}) => {
  return (
    <Button
      variant={isSelecting ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className={cn(
        "h-8 px-3 text-sm font-medium transition-all duration-200",
        {
          "bg-blue-600 hover:bg-blue-700 text-white": isSelecting,
          "border-gray-300 hover:bg-gray-50": !isSelecting,
        },
        className
      )}
    >
      {isSelecting ? (
        <CheckSquare className="w-4 h-4 mr-2" />
      ) : (
        <Square className="w-4 h-4 mr-2" />
      )}
      {isSelecting ? (
        selectedCount > 0 ? `${selectedCount} Selected` : 'Selecting'
      ) : (
        'Select'
      )}
    </Button>
  );
}; 
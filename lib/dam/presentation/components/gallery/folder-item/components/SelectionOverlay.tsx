'use client';

import React from 'react';

interface SelectionOverlayProps {
  isSelecting: boolean;
  isSelected: boolean;
  variant: 'grid' | 'list';
}

/**
 * Selection overlay component for folder items
 * 
 * Single Responsibility: Visual selection state and checkmark display
 * Reusable across both grid and list variants
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  isSelecting,
  isSelected,
  variant
}) => {
  if (!isSelecting) return null;

  const borderRadiusClass = variant === 'grid' ? 'rounded-lg' : 'rounded-md';
  const checkmarkSize = variant === 'grid' ? 'w-5 h-5' : 'w-4 h-4';
  const checkmarkIconSize = variant === 'grid' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className={`absolute inset-0 border-2 transition-all duration-200 ${borderRadiusClass} ${
          isSelected
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-transparent'
        }`}
      />
      {isSelected && (
        <div className="absolute -top-1 -left-1 z-10">
          <div className={`${checkmarkSize} bg-blue-500 rounded-full flex items-center justify-center shadow-lg`}>
            <svg
              className={`${checkmarkIconSize} text-white`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
    </div>
  );
}; 
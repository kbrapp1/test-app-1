'use client';

import React from 'react';

interface InteractionHintProps {
  show: boolean;
  variant: 'click' | 'drag';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * InteractionHint - Subtle UX guidance component
 * 
 * Provides contextual hints for click vs drag interactions.
 * Follows SRP by focusing solely on user guidance.
 */
export const InteractionHint: React.FC<InteractionHintProps> = ({
  show,
  variant,
  position = 'top'
}) => {
  if (!show) return null;
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-800'
  };
  
  const message = variant === 'click' 
    ? 'Click to open' 
    : 'Drag to move';
  
  return (
    <div className={`absolute z-50 ${positionClasses[position]}`}>
      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap relative">
        {message}
        <div 
          className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
        />
      </div>
    </div>
  );
}; 
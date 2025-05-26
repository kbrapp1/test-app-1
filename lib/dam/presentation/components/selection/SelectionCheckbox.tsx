'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}

export const SelectionCheckbox: React.FC<SelectionCheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Select item'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center rounded-md border-2 cursor-pointer transition-all duration-200 ease-out',
        // Size
        sizeClasses[size],
        // States
        {
          // Unchecked state
          'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50': !checked && !indeterminate && !disabled,
          // Checked state
          'border-blue-500 bg-blue-500 hover:border-blue-600 hover:bg-blue-600': (checked || indeterminate) && !disabled,
          // Disabled state
          'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50': disabled,
          // Focus state
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2': !disabled,
          // Smooth scale animation
          'hover:scale-105 active:scale-95': !disabled,
        },
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Checkmark or indeterminate icon */}
      <div
        className={cn(
          'transition-all duration-200 ease-out',
          {
            // Show icon when checked or indeterminate
            'opacity-100 scale-100': checked || indeterminate,
            // Hide icon when unchecked
            'opacity-0 scale-50': !checked && !indeterminate,
          }
        )}
      >
        {indeterminate ? (
          <Minus 
            className={cn(iconSizes[size], 'text-white')}
            strokeWidth={3}
          />
        ) : (
          <Check 
            className={cn(iconSizes[size], 'text-white')}
            strokeWidth={3}
          />
        )}
      </div>

      {/* Ripple effect on click */}
      <div
        className={cn(
          'absolute inset-0 rounded-md opacity-0 transition-opacity duration-150',
          'bg-white/20',
          {
            'animate-ping': checked || indeterminate,
          }
        )}
        style={{
          animationDuration: '0.3s',
          animationIterationCount: '1',
        }}
      />
    </div>
  );
}; 
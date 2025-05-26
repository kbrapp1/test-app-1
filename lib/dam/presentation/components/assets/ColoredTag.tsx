'use client';

import React from 'react';
import { TagColor, TagColorName } from '../../../domain/value-objects/TagColor';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ColoredTagProps {
  name: string;
  color: TagColorName;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * ColoredTag Component
 * 
 * Displays a tag with its associated color following DDD principles.
 * Uses the TagColor value object for color management.
 */
export const ColoredTag: React.FC<ColoredTagProps> = ({
  name,
  color,
  size = 'sm',
  variant = 'default',
  removable = false,
  onRemove,
  className,
  onClick,
  disabled = false
}) => {
  const tagColor = TagColor.fromStringSafe(color);
  const colorClasses = tagColor.getTailwindClasses();

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  // Variant styles
  const variantClasses = {
    default: `${colorClasses.background} ${colorClasses.text} ${colorClasses.border} border`,
    outline: `bg-white ${colorClasses.text} ${colorClasses.border} border-2`,
    solid: `${colorClasses.background.replace('100', '500')} text-white border border-transparent`
  };

  // Interactive states
  const interactiveClasses = {
    clickable: onClick && !disabled ? `cursor-pointer ${colorClasses.hover} transition-colors duration-200` : '',
    disabled: disabled ? 'opacity-50 cursor-not-allowed' : ''
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) {
      onRemove();
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium select-none',
        sizeClasses[size],
        variantClasses[variant],
        interactiveClasses.clickable,
        interactiveClasses.disabled,
        className
      )}
      onClick={handleClick}
      title={name}
    >
      <span className="truncate max-w-32">{name}</span>
      
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center rounded-full p-0.5',
            'hover:bg-black/10 transition-colors duration-200',
            'focus:outline-none focus:ring-1 focus:ring-offset-1',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
          aria-label={`Remove tag ${name}`}
        >
          <X className={cn(
            'text-current',
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3'
          )} />
        </button>
      )}
    </span>
  );
};

/**
 * TagColorPicker Component
 * 
 * Allows users to select a color for a tag
 */
export interface TagColorPickerProps {
  selectedColor: TagColorName;
  onColorSelect: (color: TagColorName) => void;
  disabled?: boolean;
  className?: string;
}

export const TagColorPicker: React.FC<TagColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  disabled = false,
  className
}) => {
  const allColors = TagColor.getAllColors();

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {allColors.map((colorName) => {
        const tagColor = new TagColor(colorName);
        const colorClasses = tagColor.getTailwindClasses();
        const isSelected = colorName === selectedColor;

        return (
          <button
            key={colorName}
            type="button"
            onClick={() => !disabled && onColorSelect(colorName)}
            disabled={disabled}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-all duration-200',
              colorClasses.background,
              isSelected 
                ? 'border-gray-900 ring-2 ring-gray-300 ring-offset-1' 
                : 'border-gray-300 hover:border-gray-400',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
            )}
            title={`Select ${colorName} color`}
            aria-label={`Select ${colorName} color`}
          />
        );
      })}
    </div>
  );
}; 
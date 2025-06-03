'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings } from 'lucide-react';

export interface ImageSize {
  label: string;
  width: number;
  height: number;
  value: string;
}

interface ImageSizeSelectorProps {
  selectedSize: ImageSize;
  onSizeChange: (size: ImageSize) => void;
  disabled?: boolean;
  className?: string;
}

const IMAGE_SIZES: ImageSize[] = [
  { label: "Square (1:1)", width: 1024, height: 1024, value: "1024x1024" },
  { label: "Portrait (3:4)", width: 768, height: 1024, value: "768x1024" },
  { label: "Landscape (4:3)", width: 1024, height: 768, value: "1024x768" },
  { label: "Wide (16:9)", width: 1344, height: 756, value: "1344x756" },
];

export const ImageSizeSelector: React.FC<ImageSizeSelectorProps> = ({
  selectedSize,
  onSizeChange,
  disabled = false,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCustomSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || (dimension === 'width' ? 1024 : 1024);
    const clampedValue = Math.min(2048, Math.max(256, numValue));
    
    onSizeChange({
      ...selectedSize,
      [dimension]: clampedValue,
      value: `${dimension === 'width' ? clampedValue : selectedSize.width}x${dimension === 'height' ? clampedValue : selectedSize.height}`,
      label: "Custom"
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Image size
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs h-6 px-2"
          disabled={disabled}
        >
          <Settings className="w-3 h-3 mr-1" />
          Advanced
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {IMAGE_SIZES.map((size) => (
          <Button
            key={size.value}
            variant={selectedSize.value === size.value ? "default" : "outline"}
            size="sm"
            onClick={() => onSizeChange(size)}
            disabled={disabled}
            className="h-auto p-3 flex flex-col items-center text-xs"
          >
            <div className="text-xs font-medium">{size.label}</div>
            <div className="text-xs opacity-70">{size.value}</div>
          </Button>
        ))}
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700">Advanced Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Width
              </label>
              <Input
                type="number"
                value={selectedSize.width}
                onChange={(e) => handleCustomSizeChange('width', e.target.value)}
                className="text-sm h-8"
                min="256"
                max="2048"
                step="64"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Height
              </label>
              <Input
                type="number"
                value={selectedSize.height}
                onChange={(e) => handleCustomSizeChange('height', e.target.value)}
                className="text-sm h-8"
                min="256"
                max="2048"
                step="64"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
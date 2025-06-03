'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AspectRatioSelectorProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  className?: string;
}

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:4', label: 'Portrait (3:4)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '9:16', label: 'Mobile (9:16)' },
];

/**
 * Component for aspect ratio selection
 * Single Responsibility: Aspect ratio input management
 */
export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  aspectRatio,
  onAspectRatioChange,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Aspect Ratio
      </label>
      <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ASPECT_RATIOS.map((ratio) => (
            <SelectItem key={ratio.value} value={ratio.value}>
              {ratio.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 
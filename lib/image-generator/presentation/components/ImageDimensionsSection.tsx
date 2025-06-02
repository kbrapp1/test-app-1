'use client';

import React from 'react';
import { Square, RectangleHorizontal, RectangleVertical, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ImageDimensionsSectionProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  supportedAspectRatios?: string[];
}

const ASPECT_RATIOS = [
  { value: '2:3', label: '2:3', icon: RectangleVertical },
  { value: '1:1', label: '1:1', icon: Square },
  { value: '16:9', label: '16:9', icon: RectangleHorizontal },
  { value: 'custom', label: 'Custom', icon: Monitor },
];

// API supports ratios between 21:9 (2.33) and 9:21 (0.43)
const MIN_RATIO = 9/21; // 0.43 (9:21)
const MAX_RATIO = 21/9; // 2.33 (21:9)

/**
 * ImageDimensionsSection Component
 * Single Responsibility: Manage aspect ratio selection with icon-based UI and custom ratio validation
 */
export const ImageDimensionsSection: React.FC<ImageDimensionsSectionProps> = ({
  aspectRatio,
  onAspectRatioChange,
  supportedAspectRatios,
}) => {
  const [customRatio, setCustomRatio] = React.useState('');
  const [customError, setCustomError] = React.useState('');

  const validateCustomRatio = (ratio: string): boolean => {
    if (!ratio.includes(':')) return false;
    
    const [widthStr, heightStr] = ratio.split(':');
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return false;
    
    const calculatedRatio = width / height;
    return calculatedRatio >= MIN_RATIO && calculatedRatio <= MAX_RATIO;
  };

  const handleCustomRatioChange = (value: string) => {
    setCustomRatio(value);
    setCustomError('');
    
    if (value.trim()) {
      if (validateCustomRatio(value)) {
        onAspectRatioChange(value);
      } else {
        setCustomError('Ratio must be between 21:9 and 9:21 (e.g., 4:5, 3:2)');
      }
    }
  };

  const handlePresetSelect = (value: string) => {
    if (value === 'custom') {
      setCustomRatio('');
      setCustomError('');
    }
    onAspectRatioChange(value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-foreground">Image Dimensions</h3>
        <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">?</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {ASPECT_RATIOS.map((ratio) => {
          const Icon = ratio.icon;
          const isSelected = aspectRatio === ratio.value || (ratio.value === 'custom' && !ASPECT_RATIOS.find(r => r.value === aspectRatio));
          return (
            <button
              key={ratio.value}
              onClick={() => handlePresetSelect(ratio.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{ratio.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Ratio Input */}
      {(aspectRatio === 'custom' || !ASPECT_RATIOS.find(r => r.value === aspectRatio)) && (
        <div className="space-y-2">
          <Input
            placeholder="e.g., 4:5, 3:2, 21:9"
            value={customRatio}
            onChange={(e) => handleCustomRatioChange(e.target.value)}
            className={cn(
              "bg-background border-border text-foreground",
              customError ? "border-destructive" : ""
            )}
          />
          {customError && (
            <p className="text-xs text-destructive">{customError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Custom ratios between 21:9 (ultra-wide) and 9:21 (tall) supported
          </p>
        </div>
      )}
    </div>
  );
}; 
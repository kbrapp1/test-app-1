'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// cn utility not used in this component

interface SettingsSectionProps {
  safetyTolerance: number;
  onSafetyToleranceChange: (value: number) => void;
  outputFormat: 'jpg' | 'png';
  onOutputFormatChange: (value: 'jpg' | 'png') => void;
  hasInputImage?: boolean; // For dynamic safety tolerance limit
  maxSafetyTolerance?: number;
  minSafetyTolerance?: number;
  supportedOutputFormats?: string[];
}

/**
 * SettingsSection Component
 * Single Responsibility: Manage advanced settings (safety level and output format)
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  safetyTolerance,
  onSafetyToleranceChange,
  outputFormat,
  onOutputFormatChange,
  hasInputImage = false,
  maxSafetyTolerance: propMaxSafetyTolerance,
  minSafetyTolerance: propMinSafetyTolerance,
  supportedOutputFormats: _supportedOutputFormats,
}) => {
  // Dynamic safety tolerance max: use provider setting or fallback to input image logic
  const maxSafetyTolerance = propMaxSafetyTolerance ?? (hasInputImage ? 2 : 6);
  const minSafetyTolerance = propMinSafetyTolerance ?? 0;
  
  // Ensure current value doesn't exceed max
  React.useEffect(() => {
    if (safetyTolerance > maxSafetyTolerance) {
      onSafetyToleranceChange(maxSafetyTolerance);
    }
  }, [hasInputImage, safetyTolerance, maxSafetyTolerance, onSafetyToleranceChange]);

  return (
    <div className="space-y-4">
      {/* Output Format */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Output Format</label>
        <Select value={outputFormat} onValueChange={onOutputFormatChange}>
          <SelectTrigger className="w-full bg-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="png" className="text-foreground">PNG</SelectItem>
            <SelectItem value="jpg" className="text-foreground">JPEG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Safety Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Safety Level: {safetyTolerance}
          {hasInputImage && (
            <span className="text-xs text-muted-foreground ml-2">(Max 2 with input image)</span>
          )}
        </label>
        <div className="px-1">
          <Slider
            value={[safetyTolerance]}
            onValueChange={(value) => onSafetyToleranceChange(value[0])}
            max={maxSafetyTolerance}
            min={minSafetyTolerance}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Strict</span>
            <span>Balanced</span>
            <span>{hasInputImage ? 'Max' : 'Permissive'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 
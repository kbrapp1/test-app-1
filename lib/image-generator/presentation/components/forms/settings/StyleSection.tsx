'use client';

import React, { useCallback } from 'react';
import { Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StyleSectionProps {
  vibe: string;
  onVibeChange: (value: string) => void;
  lighting: string;
  onLightingChange: (value: string) => void;
  shotType: string;
  onShotTypeChange: (value: string) => void;
  colorTheme: string;
  onColorThemeChange: (value: string) => void;
}

const VIBE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'photography', label: 'Photography' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'painting', label: 'Painting' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'cinematic', label: 'Cinematic' },
];

const LIGHTING_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'natural', label: 'Natural' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'soft', label: 'Soft' },
  { value: 'neon', label: 'Neon' },
  { value: 'golden-hour', label: 'Golden Hour' },
];

const SHOT_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'close-up', label: 'Close-up' },
  { value: 'medium-shot', label: 'Medium Shot' },
  { value: 'wide-shot', label: 'Wide Shot' },
  { value: 'aerial', label: 'Aerial' },
  { value: 'macro', label: 'Macro' },
];

const COLOR_THEME_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'pastel', label: 'Pastel' },
];

/**
 * StyleSection Component
 * Single Responsibility: Manage style-related controls and randomization
 */
export const StyleSection: React.FC<StyleSectionProps> = ({
  vibe,
  onVibeChange,
  lighting,
  onLightingChange,
  shotType,
  onShotTypeChange,
  colorTheme,
  onColorThemeChange,
}) => {
  // Memoize randomize functions to prevent unnecessary re-renders
  const randomizeVibe = useCallback(() => {
    const options = VIBE_OPTIONS.filter(opt => opt.value !== 'none');
    const randomOption = options[Math.floor(Math.random() * options.length)];
    onVibeChange(randomOption.value);
  }, [onVibeChange]);

  const randomizeLighting = useCallback(() => {
    const options = LIGHTING_OPTIONS.filter(opt => opt.value !== 'none');
    const randomOption = options[Math.floor(Math.random() * options.length)];
    onLightingChange(randomOption.value);
  }, [onLightingChange]);

  const randomizeShotType = useCallback(() => {
    const options = SHOT_TYPE_OPTIONS.filter(opt => opt.value !== 'none');
    const randomOption = options[Math.floor(Math.random() * options.length)];
    onShotTypeChange(randomOption.value);
  }, [onShotTypeChange]);

  const randomizeColorTheme = useCallback(() => {
    const options = COLOR_THEME_OPTIONS.filter(opt => opt.value !== 'none');
    const randomOption = options[Math.floor(Math.random() * options.length)];
    onColorThemeChange(randomOption.value);
  }, [onColorThemeChange]);

  return (
    <div className="space-y-4">
      {/* Vibe */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Vibe</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={randomizeVibe}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Shuffle className="w-3 h-3 mr-1" />
            Randomize
          </Button>
        </div>
        <Select value={vibe} onValueChange={onVibeChange}>
          <SelectTrigger className="w-full bg-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {VIBE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-foreground">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lighting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Lighting</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={randomizeLighting}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Shuffle className="w-3 h-3 mr-1" />
            Randomize
          </Button>
        </div>
        <Select value={lighting} onValueChange={onLightingChange}>
          <SelectTrigger className="w-full bg-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {LIGHTING_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-foreground">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Shot Type */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Shot Type</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={randomizeShotType}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Shuffle className="w-3 h-3 mr-1" />
            Randomize
          </Button>
        </div>
        <Select value={shotType} onValueChange={onShotTypeChange}>
          <SelectTrigger className="w-full bg-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {SHOT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-foreground">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Theme */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Color Theme</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={randomizeColorTheme}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Shuffle className="w-3 h-3 mr-1" />
            Randomize
          </Button>
        </div>
        <Select value={colorTheme} onValueChange={onColorThemeChange}>
          <SelectTrigger className="w-full bg-background border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {COLOR_THEME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-foreground">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}; 
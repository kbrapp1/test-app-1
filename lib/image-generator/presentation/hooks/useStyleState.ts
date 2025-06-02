import { useState, useEffect } from 'react';

interface StyleState {
  style: string;
  lighting: string;
  shotType: string;
  colorTheme: string;
  outputFormat: 'jpeg' | 'png';
}

interface UseStyleStateProps {
  initialStyle: string;
  onStylesChange?: (styles: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  }) => void;
}

/**
 * useStyleState Hook
 * Single Responsibility: Manage style-related state and coordinate style changes
 * Presentation Layer - State coordination for style controls
 */
export function useStyleState({ initialStyle, onStylesChange }: UseStyleStateProps) {
  const [lighting, setLighting] = useState('none');
  const [shotType, setShotType] = useState('none');
  const [colorTheme, setColorTheme] = useState('none');
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png'>('png');

  // Notify parent when styles change
  useEffect(() => {
    onStylesChange?.({
      vibe: initialStyle,
      lighting,
      shotType,
      colorTheme
    });
  }, [initialStyle, lighting, shotType, colorTheme, onStylesChange]);

  const clearAllStyles = () => {
    setLighting('none');
    setShotType('none');
    setColorTheme('none');
  };

  const randomizeAllStyles = () => {
    const vibeOptions = ['photography', 'digital-art', 'painting', 'sketch', 'cinematic'];
    const lightingOptions = ['natural', 'dramatic', 'soft', 'neon', 'golden-hour'];
    const shotTypeOptions = ['close-up', 'medium-shot', 'wide-shot', 'aerial', 'macro'];
    const colorThemeOptions = ['warm', 'cool', 'monochrome', 'vibrant', 'pastel'];
    
    setLighting(lightingOptions[Math.floor(Math.random() * lightingOptions.length)]);
    setShotType(shotTypeOptions[Math.floor(Math.random() * shotTypeOptions.length)]);
    setColorTheme(colorThemeOptions[Math.floor(Math.random() * colorThemeOptions.length)]);
  };

  return {
    lighting,
    setLighting,
    shotType,
    setShotType,
    colorTheme,
    setColorTheme,
    outputFormat,
    setOutputFormat,
    clearAllStyles,
    randomizeAllStyles
  };
} 
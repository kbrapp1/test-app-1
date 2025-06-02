import { useState, useCallback } from 'react';

/**
 * useImageGeneratorState Hook
 * Single Responsibility: Coordinate form state management for image generation
 * Presentation Layer - State coordination only, no business logic
 */
export const useImageGeneratorState = () => {
  // Form state management
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('none');
  const [mood, setMood] = useState('none');
  const [safetyTolerance, setSafetyTolerance] = useState(2);
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<string | null>(null);
  
  // Style values state for prompt enhancement
  const [styleValues, setStyleValues] = useState({
    vibe: 'none',
    lighting: 'none',
    shotType: 'none',
    colorTheme: 'none'
  });

  // Style change handler
  const handleStylesChange = useCallback((styles: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  }) => {
    setStyleValues(styles);
  }, []);

  // Clear error handler
  const handleClearError = useCallback(() => {
    setCurrentGeneratedImage(null);
  }, []);

  return {
    // State values
    prompt,
    aspectRatio,
    style,
    mood,
    safetyTolerance,
    currentGeneratedImage,
    styleValues,
    
    // State setters
    setPrompt,
    setAspectRatio,
    setStyle,
    setMood,
    setSafetyTolerance,
    setCurrentGeneratedImage,
    
    // Handlers
    handleStylesChange,
    handleClearError,
  };
}; 
import { useState, useMemo, useCallback } from 'react';
import { ImageSize } from '../components/ImageSizeSelector';

const DEFAULT_SIZE: ImageSize = {
  label: "Square (1:1)",
  width: 1024,
  height: 1024,
  value: "1024x1024"
};

export const useImageGeneratorForm = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState<ImageSize>(DEFAULT_SIZE);

  // Memoized cost calculation service
  const estimatedCost = useMemo(() => {
    const basePrice = 0.05;
    const sizeMultiplier = (selectedSize.width * selectedSize.height) / (1024 * 1024);
    return (basePrice * sizeMultiplier).toFixed(3);
  }, [selectedSize.width, selectedSize.height]);

  // Memoized form validation
  const isFormValid = useMemo(() => {
    return prompt.trim().length > 0;
  }, [prompt]);

  // Memoized handlers to prevent unnecessary re-renders
  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
  }, []);

  const handleSizeChange = useCallback((newSize: ImageSize) => {
    setSelectedSize(newSize);
  }, []);

  const handlePresetSelect = useCallback((presetPrompt: string) => {
    setPrompt(presetPrompt);
  }, []);

  const clearForm = useCallback(() => {
    setPrompt('');
  }, []);

  return {
    // State
    prompt,
    selectedSize,
    estimatedCost,
    isFormValid,
    
    // Actions
    handlePromptChange,
    handleSizeChange,
    handlePresetSelect,
    clearForm,
  };
}; 
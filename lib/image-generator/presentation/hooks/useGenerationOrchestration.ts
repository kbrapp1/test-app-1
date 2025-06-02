import { useCallback } from 'react';

/**
 * useGenerationOrchestration Hook
 * Single Responsibility: Orchestrate image generation workflow
 * Presentation Layer - Generation coordination only
 */
export const useGenerationOrchestration = () => {
  // Image generation handler
  const handleGenerate = useCallback(async (
    prompt: string,
    aspectRatio: string,
    safetyTolerance: number,
    selectedProviderId: string,
    selectedModelId: string,
    enhancePromptWithStyles: (prompt: string) => string,
    generate: (prompt: string, width?: number, height?: number, safetyTolerance?: number, providerId?: string, modelId?: string) => Promise<any>,
    setCurrentGeneratedImage: (image: string | null) => void
  ) => {
    if (!prompt.trim()) return;

    try {
      setCurrentGeneratedImage(null);
      
      const providerId = selectedProviderId || 'replicate';
      const modelId = selectedModelId || 'flux-schnell';
      
      // Enhance prompt with style values
      const enhancedPrompt = enhancePromptWithStyles(prompt.trim());
      
      // Convert aspect ratio to dimensions
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const baseSize = 1024;
      const width = Math.round(baseSize * Math.sqrt(widthRatio / heightRatio));
      const height = Math.round(baseSize * Math.sqrt(heightRatio / widthRatio));

      await generate(enhancedPrompt, width, height, safetyTolerance, providerId, modelId);
    } catch (error) {
      // Error handling managed by provider system
    }
  }, []);

  // Image editing handler
  const handleEditImage = useCallback((
    baseImageUrl: string, 
    originalPrompt: string,
    stripStyleQualifiers: (prompt: string) => string,
    setBaseImageUrl: (url: string) => void,
    setPrompt: (prompt: string) => void,
    setCurrentGeneratedImage: (image: string | null) => void,
    closeHistory: () => void
  ) => {
    setBaseImageUrl(baseImageUrl);
    // Strip any style qualifiers from the original prompt
    const cleanPrompt = stripStyleQualifiers(originalPrompt);
    setPrompt(cleanPrompt);
    setCurrentGeneratedImage(baseImageUrl);
    closeHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Image selection handler
  const handleImageSelect = useCallback((
    imageUrl: string,
    setCurrentGeneratedImage: (image: string | null) => void,
    closeHistory: () => void
  ) => {
    setCurrentGeneratedImage(imageUrl);
    closeHistory();
  }, []);

  return {
    handleGenerate,
    handleEditImage,
    handleImageSelect,
  };
}; 
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
    generate: (prompt: string, width?: number, height?: number, safetyTolerance?: number, providerId?: string, modelId?: string, aspectRatio?: string) => Promise<any>,
    setCurrentGeneratedImage: (image: string | null) => void
  ) => {
    if (!prompt.trim()) return;

    try {
      setCurrentGeneratedImage(null);
      
      const providerId = selectedProviderId || 'replicate';
      const modelId = selectedModelId || 'flux-schnell';
      
      // Enhance prompt with style values
      const enhancedPrompt = enhancePromptWithStyles(prompt.trim());
      
      // Pass aspect ratio directly instead of converting to dimensions
      // This prevents the database constraint violation from calculated aspect ratios
      await generate(
        enhancedPrompt, 
        undefined, // width - let the system calculate from aspect ratio
        undefined, // height - let the system calculate from aspect ratio
        safetyTolerance, 
        providerId, 
        modelId,
        aspectRatio // Pass aspect ratio directly
      );
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
import { useState, useEffect, useCallback } from 'react';
import { UseFileUploadReturn } from './useFileUpload';
import { GenerationDto } from '../../application/dto';

// Import for GenerationRequest type
export interface GenerationRequest {
  prompt: string;
  aspectRatio: string;
  safetyTolerance: number;
  providerId: string;
  modelId: string;
  baseImageUrl?: string;
}

// Helper function to check if a model supports image editing
const modelSupportsImageEditing = (modelId: string): boolean => {
  // flux-schnell only supports text-to-image
  return modelId !== 'flux-schnell';
};

/**
 * Coordinator hook that demonstrates proper usage of the refactored core hooks
 * Single Responsibility: Coordinate generation workflow with file upload integration
 */
interface UseImageGeneratorCoordinatorProps {
  prompt: string;
  aspectRatio: string;
  safetyTolerance: number;
  selectedProviderId: string;
  selectedModelId: string;
  styleValues: Record<string, string>;
  fileUpload: UseFileUploadReturn;
  latestGeneration: GenerationDto | null;
  enhancePromptWithStyles: (prompt: string, styles: any) => string;
  orchestrationHandleGenerate: (
    prompt: string,
    aspectRatio: string,
    safetyTolerance: number,
    providerId: string,
    modelId: string,
    enhancePrompt: (prompt: string) => string,
    generate: any,
    setCurrentImage: (image: string | null) => void,
    baseImageUrl?: string
  ) => Promise<void>;
  generate: any;
  setCurrentGeneratedImage: (image: string | null) => void;
}

export const useImageGeneratorCoordinator = ({
  prompt,
  aspectRatio,
  safetyTolerance,
  selectedProviderId,
  selectedModelId,
  styleValues,
  fileUpload,
  latestGeneration,
  enhancePromptWithStyles,
  orchestrationHandleGenerate,
  generate,
  setCurrentGeneratedImage,
}: UseImageGeneratorCoordinatorProps) => {
  
  // Inline generation state management (from deleted useImageGeneratorCore)
  const [isGenerationClicked, setIsGenerationClicked] = useState(false);

  // Reset click state when generation enters processing
  useEffect(() => {
    if (latestGeneration && ['pending', 'processing'].includes(latestGeneration.status)) {
      setIsGenerationClicked(false);
    }
  }, [latestGeneration?.status]);

  const formIsGenerating = isGenerationClicked || Boolean(
    latestGeneration && ['pending', 'processing'].includes(latestGeneration.status)
  );

  const latestGenerationError = latestGeneration?.status === 'failed' ? latestGeneration.errorMessage : null;

  // Create a simplified generate function for the component
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerationClicked(true);

    // Only include baseImageUrl if the model supports image editing and we have a valid URL
    const supportsImageEditing = modelSupportsImageEditing(selectedModelId);
    const hasValidBaseImage = fileUpload.baseImageUrl && fileUpload.baseImageUrl.trim();
    
    const request: GenerationRequest = {
      prompt: prompt.trim(),
      aspectRatio,
      safetyTolerance,
      providerId: selectedProviderId,
      modelId: selectedModelId,
      baseImageUrl: supportsImageEditing && hasValidBaseImage 
        ? fileUpload.baseImageUrl! 
        : undefined,
    };
    
    // Debug log to verify the request is correct
    console.debug('Generation request:', {
      modelId: selectedModelId,
      supportsImageEditing,
      hasValidBaseImage,
      finalBaseImageUrl: request.baseImageUrl
    });

    try {
      // Inline the orchestration logic
      const enhancedPrompt = enhancePromptWithStyles(request.prompt, styleValues);
      const enhancePromptFn = (prompt: string) => enhancedPrompt;
      
      await orchestrationHandleGenerate(
        request.prompt,
        request.aspectRatio,
        request.safetyTolerance,
        request.providerId,
        request.modelId,
        enhancePromptFn,
        generate,
        setCurrentGeneratedImage,
        request.baseImageUrl
      );
    } catch (error) {
      setIsGenerationClicked(false);
      
      // Handle the base image upload error case
      if (error instanceof Error && error.message.includes('Base image must be uploaded')) {
        // Reset the file upload state if needed
        if (fileUpload.baseImageUrl) {
          fileUpload.setBaseImageUrl(fileUpload.baseImageUrl);
        }
      }
      throw error;
    }
  }, [
    prompt,
    aspectRatio,
    safetyTolerance,
    selectedProviderId,
    selectedModelId,
    fileUpload.baseImageUrl,
    fileUpload.setBaseImageUrl,
    enhancePromptWithStyles,
    styleValues,
    orchestrationHandleGenerate,
    generate,
    setCurrentGeneratedImage,
  ]);

  return {
    handleGenerate,
    formIsGenerating,
    latestGenerationError,
    isGenerationClicked,
    setIsGenerationClicked,
  };
}; 
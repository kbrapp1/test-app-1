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
  secondImageUrl?: string; // NEW: For multi-image models
}

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
    baseImageUrl?: string,
    secondImageUrl?: string // NEW: Second image parameter
  ) => Promise<void>;
  generate: any;
  setCurrentGeneratedImage: (image: string | null) => void;
  capabilities: {
    supportsImageEditing: boolean;
    supportsStyleControls: boolean;
    supportsMultipleImages?: boolean;
    requiredImages?: number;
    maxSafetyTolerance?: number;
    minSafetyTolerance?: number;
    supportedAspectRatios: string[];
    supportedOutputFormats: string[];
  };
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
  capabilities,
}: UseImageGeneratorCoordinatorProps) => {
  
  // Inline generation state management (from deleted useImageGeneratorCore)
  const [isGenerationClicked, setIsGenerationClicked] = useState(false);

  // Reset click state when generation enters processing
  useEffect(() => {
    if (latestGeneration && ['pending', 'processing'].includes(latestGeneration.status)) {
      setIsGenerationClicked(false);
    }
  }, [latestGeneration]);

  const formIsGenerating = isGenerationClicked || Boolean(
    latestGeneration && ['pending', 'processing'].includes(latestGeneration.status)
  );

  const latestGenerationError = latestGeneration?.status === 'failed' ? latestGeneration.errorMessage : null;

  // Create a simplified generate function for the component
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerationClicked(true);

    // Use actual model capabilities instead of hard-coded function
    const supportsImageEditing = capabilities.supportsImageEditing;
    const hasValidBaseImage = fileUpload.baseImageUrl && fileUpload.baseImageUrl.trim();
    const hasValidSecondImage = fileUpload.secondImageUrl && fileUpload.secondImageUrl.trim();
    
    const request: GenerationRequest = {
      prompt: prompt.trim(),
      aspectRatio,
      safetyTolerance,
      providerId: selectedProviderId,
      modelId: selectedModelId,
      baseImageUrl: supportsImageEditing && hasValidBaseImage 
        ? fileUpload.baseImageUrl! 
        : undefined,
      secondImageUrl: supportsImageEditing && hasValidSecondImage 
        ? fileUpload.secondImageUrl! 
        : undefined,
    };
    
    // Debug log to verify the request is correct
    console.debug('Generation request:', {
      modelId: selectedModelId,
      supportsImageEditing,
      supportsMultipleImages: capabilities.supportsMultipleImages,
      hasValidBaseImage,
      hasValidSecondImage,
      finalBaseImageUrl: request.baseImageUrl,
      finalSecondImageUrl: request.secondImageUrl
    });

    try {
      // Inline the orchestration logic
      const enhancedPrompt = enhancePromptWithStyles(request.prompt, styleValues);
      const enhancePromptFn = (_prompt: string) => enhancedPrompt;
      
      await orchestrationHandleGenerate(
        request.prompt,
        request.aspectRatio,
        request.safetyTolerance,
        request.providerId,
        request.modelId,
        enhancePromptFn,
        generate,
        setCurrentGeneratedImage,
        request.baseImageUrl,
        request.secondImageUrl // NEW: Pass second image
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
    capabilities.supportsImageEditing,
    capabilities.supportsMultipleImages,
    fileUpload,
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
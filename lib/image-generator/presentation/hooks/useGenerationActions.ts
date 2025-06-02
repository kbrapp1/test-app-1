import { useCallback } from 'react';
import { GenerationDto } from '../../application/dto';

export interface UseGenerationActionsProps {
  onImageSelect?: (imageUrl: string) => void;
  onEditImage?: (baseImageUrl: string, originalPrompt: string) => void;
}

export interface UseGenerationActionsReturn {
  handleImageClick: (generation: GenerationDto) => void;
  handleEditClick: (generation: GenerationDto) => void;
  copyImageUrl: (imageUrl: string) => Promise<void>;
  downloadImage: (imageUrl: string, prompt: string) => Promise<void>;
}

export const useGenerationActions = ({ 
  onImageSelect, 
  onEditImage 
}: UseGenerationActionsProps): UseGenerationActionsReturn => {
  
  const handleImageClick = useCallback((generation: GenerationDto) => {
    if (generation.imageUrl && onImageSelect) {
      onImageSelect(generation.imageUrl);
    }
  }, [onImageSelect]);

  const handleEditClick = useCallback((generation: GenerationDto) => {
    if (generation.imageUrl && onEditImage) {
      onEditImage(generation.imageUrl, generation.prompt);
    }
  }, [onEditImage]);

  const copyImageUrl = useCallback(async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
    } catch (err) {
      // Silent error handling
    }
  }, []);

  const downloadImage = useCallback(async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Silent error handling
    }
  }, []);

  return {
    handleImageClick,
    handleEditClick,
    copyImageUrl,
    downloadImage,
  };
}; 
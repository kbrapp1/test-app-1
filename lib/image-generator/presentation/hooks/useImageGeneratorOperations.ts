import { useCallback } from 'react';
import { UseFileUploadReturn } from './useFileUpload';

interface ImageGeneratorOperationsProps {
  fileUpload: UseFileUploadReturn;
  setCurrentGeneratedImage: (image: string | null) => void;
  setPrompt: (prompt: string) => void;
  closeHistory: () => void;
}

export const useImageGeneratorOperations = ({
  fileUpload,
  setCurrentGeneratedImage,
  setPrompt,
  closeHistory,
}: ImageGeneratorOperationsProps) => {
  const handleMakeBaseImage = useCallback(() => {
    if (!fileUpload.baseImageUrl) return;
    
    fileUpload.setBaseImageUrl(fileUpload.baseImageUrl);
    setCurrentGeneratedImage(null);
  }, [fileUpload.baseImageUrl, fileUpload.setBaseImageUrl, setCurrentGeneratedImage]);

  const handleMakeBaseImageFromHistory = useCallback((imageUrl: string) => {
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      import('sonner').then(({ toast }) => {
        toast.error('Invalid image URL', {
          description: 'The selected image cannot be used as a base image.'
        });
      });
      return;
    }

    fileUpload.setBaseImageUrl(imageUrl);
    setCurrentGeneratedImage(null);
    setPrompt('');
    closeHistory();
    
    import('sonner').then(({ toast }) => {
      toast.success('Image loaded as base image', {
        description: 'You can now edit this image or use it as a reference for new generations.'
      });
    });
  }, [fileUpload.setBaseImageUrl, setCurrentGeneratedImage, setPrompt, closeHistory]);

  const handleMakeBaseImageFromCurrent = useCallback((currentImage: string | null) => {
    if (currentImage) {
      fileUpload.setBaseImageUrl(currentImage);
      setCurrentGeneratedImage(null);
    }
  }, [fileUpload.setBaseImageUrl, setCurrentGeneratedImage]);

  return {
    handleMakeBaseImage,
    handleMakeBaseImageFromHistory,
    handleMakeBaseImageFromCurrent,
  };
}; 
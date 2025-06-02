import { useState, useCallback } from 'react';

export interface UseFileUploadReturn {
  baseImage: File | null;
  baseImageUrl: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearBaseImage: () => void;
  setBaseImageUrl: (url: string) => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setBaseImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBaseImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const clearBaseImage = useCallback(() => {
    setBaseImage(null);
    setBaseImageUrl(null);
  }, []);

  const setBaseImageUrlDirect = useCallback((url: string) => {
    setBaseImageUrl(url);
  }, []);

  return {
    baseImage,
    baseImageUrl,
    handleFileUpload,
    clearBaseImage,
    setBaseImageUrl: setBaseImageUrlDirect,
  };
}; 
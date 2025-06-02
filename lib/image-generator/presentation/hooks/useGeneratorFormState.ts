'use client';

import { useState, useCallback } from 'react';

export type GenerationType = 'text-to-image' | 'image-editing' | 'style-transfer' | 'background-swap';

export interface GeneratorFormState {
  generationType: GenerationType;
  baseImageUrl: string | null;
  aspectRatio: string;
  damAssetId: string | null;
}

export interface GeneratorFormActions {
  setGenerationType: (type: GenerationType) => void;
  setBaseImageUrl: (url: string | null) => void;
  setAspectRatio: (ratio: string) => void;
  setDamAssetId: (id: string | null) => void;
  clearBaseImage: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface UseGeneratorFormStateReturn {
  state: GeneratorFormState;
  actions: GeneratorFormActions;
}

/**
 * Hook for managing generator form state
 * Single Responsibility: State coordination for form inputs
 */
export const useGeneratorFormState = (): UseGeneratorFormStateReturn => {
  const [generationType, setGenerationType] = useState<GenerationType>('text-to-image');
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [damAssetId, setDamAssetId] = useState<string | null>(null);

  const clearBaseImage = useCallback(() => {
    setBaseImageUrl(null);
    setDamAssetId(null);
    setGenerationType('text-to-image');
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBaseImageUrl(result);
        if (generationType === 'text-to-image') {
          setGenerationType('image-editing');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [generationType]);

  return {
    state: {
      generationType,
      baseImageUrl,
      aspectRatio,
      damAssetId,
    },
    actions: {
      setGenerationType,
      setBaseImageUrl,
      setAspectRatio,
      setDamAssetId,
      clearBaseImage,
      handleFileUpload,
    },
  };
}; 
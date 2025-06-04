import { useEffect } from 'react';

interface ImageGeneratorEffectsProps {
  toggleHistory: () => void;
}

export const useImageGeneratorEffects = ({ toggleHistory }: ImageGeneratorEffectsProps) => {
  // History panel event listener effect
  useEffect(() => {
    const handleToggleHistory = () => {
      toggleHistory();
    };

    window.addEventListener('toggleImageGeneratorHistory', handleToggleHistory);
    return () => {
      window.removeEventListener('toggleImageGeneratorHistory', handleToggleHistory);
    };
  }, [toggleHistory]);

  // Header portal cleanup effect
  useEffect(() => {
    const headerContainer = document.getElementById('image-generator-model-selector');
    
    if (!headerContainer) return;

    return () => {
      headerContainer.innerHTML = '';
    };
  }, []);
}; 
import { useCallback, useEffect, useMemo } from 'react';
import {
  useFileUpload,
  useImageGeneratorState,
  usePromptEnhancement,
  useProviderSelection,
  useHistoryPanel,
  useInfiniteGenerations,
  useLatestGeneration,
  useImageGeneratorCoordinator,
  useGenerateImage
} from '.';
import type { GenerationDto } from '../../application/dto/GenerationDto';
import { useCacheCleanup } from '@/lib/infrastructure/query/useCacheInvalidation';
import { preloadComponents } from '../components/LazyComponentLoader';
import { useImageGeneratorOperations } from './useImageGeneratorOperations';
import { useImageGeneratorEffects } from './useImageGeneratorEffects';

/**
 * Hook: useImageGeneratorMain
 * Presentation Logic for ImageGeneratorMain
 * Single Responsibility: manage state, handlers, and effects
 */
export function useImageGeneratorMain() {
  const formState = useImageGeneratorState();
  const promptEnhancement = usePromptEnhancement();

  // No-op action handlers for toolbar
  const actionHandlers = {
    handleEditAction: () => {},
    handleDownloadAction: () => {},
    handleSaveToDAMAction: () => {},
    handleShareAction: () => {},
    handleDeleteAction: () => {}
  };

  const fileUpload = useFileUpload();

  const {
    selectedProviderId,
    selectedModelId,
    availableProviders,
    onProviderChange,
    getSelectedCapabilities
  } = useProviderSelection();

  const capabilities = getSelectedCapabilities();

  const {
    generations: allGenerations,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchGenerations,
    isLoading
  } = useInfiniteGenerations({}, { enabled: true });

  const generations = useMemo(() => allGenerations.slice(0, 20), [allGenerations]);
  const historyGenerations = allGenerations;

  const historyPanel = useHistoryPanel();

  const generateImageMutation = useGenerateImage();
  const _generate = useCallback(
    async (
      prompt: string,
      width?: number,
      height?: number,
      safetyTolerance?: number,
      providerId?: string,
      modelId?: string,
      aspectRatio?: string,
      baseImageUrl?: string,
      secondImageUrl?: string // NEW: Second image parameter
    ): Promise<GenerationDto> => {
      return await generateImageMutation.mutateAsync({
        prompt,
        width,
        height,
        aspectRatio,
        safetyTolerance,
        providerId,
        modelId,
        baseImageUrl,
        secondImageUrl // NEW: Pass second image to mutation
      });
    },
    [generateImageMutation]
  );

  const { latestGeneration } = useLatestGeneration({
    generations,
    onImageComplete: (imageUrl: string) => {
      formState.setCurrentGeneratedImage(imageUrl);
    }
  });

  // Orchestration logic matching coordinator signature
  const orchestrationHandleGenerate = useCallback(
    async (
      prompt: string,
      aspectRatio: string,
      safetyTolerance: number,
      providerId: string,
      modelId: string,
      enhancePrompt: (prompt: string) => string,
      generateFn: (prompt: string, width?: number, height?: number, safetyTolerance?: number, providerId?: string, modelId?: string, aspectRatio?: string, baseImageUrl?: string, secondImageUrl?: string) => Promise<GenerationDto>,
      setCurrentImage: (image: string | null) => void,
      baseImageUrl?: string,
      secondImageUrl?: string // NEW: Second image parameter
    ): Promise<void> => {
      if (!prompt.trim()) return;
      try {
        setCurrentImage(null);
        const enhanced = enhancePrompt(prompt.trim());
        await generateFn(enhanced, undefined, undefined, safetyTolerance, providerId, modelId, aspectRatio, baseImageUrl, secondImageUrl);
      } catch {
        // errors handled upstream
      }
    },
    []
  );

  // Coordinator handles generation workflow
  const coreGeneration = useImageGeneratorCoordinator({
    prompt: formState.prompt,
    aspectRatio: formState.aspectRatio,
    safetyTolerance: formState.safetyTolerance,
    selectedProviderId,
    selectedModelId,
    styleValues: formState.styleValues,
    fileUpload,
    latestGeneration,
    enhancePromptWithStyles: (prompt: string, styles: Record<string, string>) => {
      const styleValues = {
        vibe: styles.vibe || '',
        lighting: styles.lighting || '',
        shotType: styles.shotType || '',
        colorTheme: styles.colorTheme || ''
      };
      return promptEnhancement.enhancePromptWithStyles(prompt, styleValues);
    },
    orchestrationHandleGenerate: (prompt: string, aspectRatio: string, safetyTolerance: number, providerId: string, modelId: string, enhancePrompt: (prompt: string) => string, generate: unknown, setCurrentImage: (image: string | null) => void, baseImageUrl?: string, secondImageUrl?: string) => orchestrationHandleGenerate(prompt, aspectRatio, safetyTolerance, providerId, modelId, enhancePrompt, _generate, setCurrentImage, baseImageUrl, secondImageUrl),
    generate: generateImageMutation,
    setCurrentGeneratedImage: formState.setCurrentGeneratedImage,
    capabilities
  });

  const imageOperations = useImageGeneratorOperations({
    fileUpload,
    setCurrentGeneratedImage: formState.setCurrentGeneratedImage,
    setPrompt: formState.setPrompt,
    closeHistory: historyPanel.closeHistory
  });

  useImageGeneratorEffects({ toggleHistory: historyPanel.toggleHistory });
  useCacheCleanup();

  // Preload components for performance
  useEffect(() => {
    preloadComponents.all();
    const handleUserInteraction = () => {
      preloadComponents.providerSelector();
      preloadComponents.imageEditor();
    };
    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, handleUserInteraction, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handleUserInteraction));
  }, []);

  const handleEditImage = useCallback(
    (baseImageUrl: string, originalPrompt: string) => {
      fileUpload.setBaseImageUrl(baseImageUrl);
      formState.setPrompt(promptEnhancement.stripStyleQualifiers(originalPrompt));
      formState.setCurrentGeneratedImage(null);
      historyPanel.closeHistory();
    },
    [fileUpload, formState, historyPanel, promptEnhancement]
  );

  const handleImageSelect = useCallback(
    (imageUrl: string) => {
      formState.setCurrentGeneratedImage(imageUrl);
      historyPanel.closeHistory();
    },
    [formState, historyPanel]
  );

  const handleClearAction = useCallback(
    () => { formState.setCurrentGeneratedImage(null); },
    [formState]
  );

  return {
    formState,
    promptEnhancement,
    actionHandlers,
    fileUpload,
    selectedProviderId,
    selectedModelId,
    availableProviders,
    onProviderChange,
    capabilities,
    generations,
    historyGenerations,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetchGenerations,
    isLoading,
    generateImageMutation,
    coreGeneration,
    latestGeneration,
    imageOperations,
    historyPanel,
    handleEditImage,
    handleImageSelect,
    handleClearAction
  };
} 
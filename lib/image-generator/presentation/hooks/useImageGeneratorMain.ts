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
  const generate = useCallback(
    async (
      prompt: string,
      width?: number,
      height?: number,
      safetyTolerance?: number,
      providerId?: string,
      modelId?: string,
      aspectRatio?: string,
      baseImageUrl?: string
    ): Promise<any> => {
      return await generateImageMutation.mutateAsync({
        prompt,
        width,
        height,
        aspectRatio,
        safetyTolerance,
        providerId,
        modelId,
        baseImageUrl
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
      generateFn: any,
      setCurrentImage: (image: string | null) => void,
      baseImageUrl?: string
    ): Promise<void> => {
      if (!prompt.trim()) return;
      try {
        setCurrentImage(null);
        const enhanced = enhancePrompt(prompt.trim());
        await generateFn(enhanced, undefined, undefined, safetyTolerance, providerId, modelId, aspectRatio, baseImageUrl);
      } catch {
        // errors handled upstream
      }
    },
    [generate]
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
    enhancePromptWithStyles: promptEnhancement.enhancePromptWithStyles,
    orchestrationHandleGenerate,
    generate,
    setCurrentGeneratedImage: formState.setCurrentGeneratedImage
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
    [fileUpload.setBaseImageUrl, promptEnhancement.stripStyleQualifiers, formState.setPrompt, formState.setCurrentGeneratedImage, historyPanel.closeHistory]
  );

  const handleImageSelect = useCallback(
    (imageUrl: string) => {
      formState.setCurrentGeneratedImage(imageUrl);
      historyPanel.closeHistory();
    },
    [formState.setCurrentGeneratedImage, historyPanel.closeHistory]
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
'use client';

import React, { useCallback, useMemo } from 'react';
import { ImagePromptForm } from '../forms/prompt/ImagePromptForm';
import { ImageDisplayArea } from './ImageDisplayArea';
import { HistoryPanel } from '../generation/history/HistoryPanel';
import { ActionButtonsToolbar } from './ActionButtonsToolbar';
import { HeaderModelSelector } from '../providers/HeaderModelSelector';
import { 
  useInfiniteGenerations,
  useFileUpload, 
  useHistoryPanel, 
  useLatestGeneration,
  useImageGeneratorState,
  usePromptEnhancement,
  useProviderSelection,
  useImageGeneratorCoordinator
} from '../../hooks';
import { useGenerateImage } from '../../hooks/mutations/useGenerateImage';
import { useImageGeneratorOperations } from '../../hooks/useImageGeneratorOperations';
import { useImageGeneratorEffects } from '../../hooks/useImageGeneratorEffects';
import { useCacheCleanup } from '@/lib/infrastructure/query/useCacheInvalidation';

interface ImageGeneratorMainProps {
  className?: string;
}


export const ImageGeneratorMain: React.FC<ImageGeneratorMainProps> = ({ className }) => {
  const formState = useImageGeneratorState();
  const promptEnhancement = usePromptEnhancement();
  // Simple inline action handlers (replacing deleted useActionHandlers)
  const actionHandlers = {
    handleEditAction: () => {
      // TODO: Implement image editing functionality
    },
    handleDownloadAction: () => {
      // TODO: Implement download functionality  
    },
    handleSaveToDAMAction: () => {
      // TODO: Implement save to DAM functionality
    },
    handleShareAction: () => {
      // TODO: Implement share functionality
    },
    handleDeleteAction: () => {
      // TODO: Implement delete generation functionality
    },
  };
  // Inline orchestration handlers (replacing deleted useGenerationOrchestration)
  const orchestration = {
    handleGenerate: async (
      prompt: string,
      aspectRatio: string,
      safetyTolerance: number,
      selectedProviderId: string,
      selectedModelId: string,
      enhancePromptWithStyles: (prompt: string) => string,
      generate: any,
      setCurrentGeneratedImage: (image: string | null) => void,
      baseImageUrl?: string
    ) => {
      if (!prompt.trim()) return;
      try {
        setCurrentGeneratedImage(null);
        const providerId = selectedProviderId || 'replicate';
        const modelId = selectedModelId || 'flux-schnell';
        const enhancedPrompt = enhancePromptWithStyles(prompt.trim());
        await generate(enhancedPrompt, undefined, undefined, safetyTolerance, providerId, modelId, aspectRatio, baseImageUrl);
      } catch (error) {
        // Error handling managed by provider system
      }
    },
    handleEditImage: (
      baseImageUrl: string,
      originalPrompt: string,
      stripStyleQualifiers: (prompt: string) => string,
      setBaseImageUrl: (url: string) => void,
      setPrompt: (prompt: string) => void,
      setCurrentGeneratedImage: (image: string | null) => void,
      closeHistory: () => void
    ) => {
      setBaseImageUrl(baseImageUrl);
      setPrompt(stripStyleQualifiers(originalPrompt));
      setCurrentGeneratedImage(null);
      closeHistory();
    },
    handleImageSelect: (
      imageUrl: string,
      setCurrentGeneratedImage: (image: string | null) => void,
      closeHistory: () => void
    ) => {
      setCurrentGeneratedImage(imageUrl);
      closeHistory();
    }
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
  
  // SIMPLIFIED: Use infinite generations hook for everything - eliminates redundancy
  const {
    generations: allGenerations,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchGenerations,
    isLoading,
  } = useInfiniteGenerations({}, { 
    enabled: true  // Always enabled
  });
  
  // Derive data for different views from single source - MEMOIZED to prevent unnecessary re-renders
  const generations = useMemo(() => {
    // Create stable reference to prevent unnecessary re-renders
    const recent = allGenerations.slice(0, 20);
    return recent;
  }, [allGenerations]); // Recent for main display
  const historyGenerations = allGenerations; // All for history panel
  
  // Initialize history panel (after refetchGenerations is defined)
  const historyPanel = useHistoryPanel();
  
  // Get the generate function separately
  const generateImageMutation = useGenerateImage();
  
  // Create generate function that matches expected API
  const generate = useCallback(async (
    prompt: string,
    width?: number,
    height?: number,
    safetyTolerance?: number,
    providerId?: string,
    modelId?: string,
    aspectRatio?: string,
    baseImageUrl?: string
  ) => {
    return await generateImageMutation.mutateAsync({
      prompt,
      width,
      height,
      aspectRatio,
      safetyTolerance,
      providerId,
      modelId,
      baseImageUrl,
    });
  }, [generateImageMutation]);

  const { latestGeneration } = useLatestGeneration({
    generations,
    onImageComplete: (imageUrl) => {
      formState.setCurrentGeneratedImage(imageUrl);
      coreGeneration.setIsGenerationClicked(false);
    },
  });

  const coreGeneration = useImageGeneratorCoordinator({
    prompt: formState.prompt,
    aspectRatio: formState.aspectRatio,
    safetyTolerance: formState.safetyTolerance,
    selectedProviderId,
    selectedModelId,
    styleValues: formState.styleValues,
    fileUpload,
    enhancePromptWithStyles: promptEnhancement.enhancePromptWithStyles,
    orchestrationHandleGenerate: orchestration.handleGenerate,
    generate,
    setCurrentGeneratedImage: formState.setCurrentGeneratedImage,
    latestGeneration,
  });

  const imageOperations = useImageGeneratorOperations({
    fileUpload,
    setCurrentGeneratedImage: formState.setCurrentGeneratedImage,
    setPrompt: formState.setPrompt,
    closeHistory: historyPanel.closeHistory,
  });

  useImageGeneratorEffects({
    toggleHistory: historyPanel.toggleHistory,
  });

  // Auto-cleanup cache to prevent memory bloat
  useCacheCleanup();


  const handleEditImage = useCallback((baseImageUrl: string, originalPrompt: string) => {
    orchestration.handleEditImage(
      baseImageUrl,
      originalPrompt,
      promptEnhancement.stripStyleQualifiers,
      fileUpload.setBaseImageUrl,
      formState.setPrompt,
      formState.setCurrentGeneratedImage,
      historyPanel.closeHistory
    );
  }, [
    orchestration.handleEditImage,
    promptEnhancement.stripStyleQualifiers,
    fileUpload.setBaseImageUrl,
    formState.setPrompt,
    formState.setCurrentGeneratedImage,
    historyPanel.closeHistory
  ]);


  const handleImageSelect = useCallback((imageUrl: string) => {
    orchestration.handleImageSelect(
      imageUrl,
      formState.setCurrentGeneratedImage,
      historyPanel.closeHistory
    );
  }, [orchestration.handleImageSelect, formState.setCurrentGeneratedImage, historyPanel.closeHistory]);


  const handleClearAction = useCallback(() => {
    formState.setCurrentGeneratedImage(null);
  }, [formState.setCurrentGeneratedImage]);



  return (
    <>
      <HeaderModelSelector
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        availableProviders={availableProviders}
        onProviderChange={onProviderChange}
        disabled={coreGeneration.formIsGenerating}
      />
      
      <div className="h-full bg-background flex">
        <ImagePromptForm
          prompt={formState.prompt}
          onPromptChange={formState.setPrompt}
          baseImageUrl={fileUpload.baseImageUrl}
          onFileUpload={fileUpload.handleFileUpload}
          onClearBaseImage={fileUpload.clearBaseImage}
          aspectRatio={formState.aspectRatio}
          onAspectRatioChange={formState.setAspectRatio}
          style={formState.style}
          onStyleChange={formState.setStyle}
          mood={formState.mood}
          onMoodChange={formState.setMood}
          safetyTolerance={formState.safetyTolerance}
          onSafetyToleranceChange={formState.setSafetyTolerance}
          isGenerating={coreGeneration.formIsGenerating}
          onGenerate={coreGeneration.handleGenerate}
          isStorageUrl={fileUpload.isStorageUrl}
          isUploading={fileUpload.isUploading}
          onStylesChange={formState.handleStylesChange}
          styleValues={formState.styleValues}
          generationError={coreGeneration.latestGenerationError}
          onClearError={() => {}}
          capabilities={capabilities}
        />

        <div className="flex-1 flex flex-col">
          <ActionButtonsToolbar
            hasImage={!!formState.currentGeneratedImage}
            onEdit={actionHandlers.handleEditAction}
            onDownload={actionHandlers.handleDownloadAction}
            onSaveToDAM={actionHandlers.handleSaveToDAMAction}
            onShare={actionHandlers.handleShareAction}
            onClear={handleClearAction}
            onDelete={actionHandlers.handleDeleteAction}
          />

          <div className="flex-1">
            <ImageDisplayArea
              isGenerating={generateImageMutation.isPending}
              currentGeneratedImage={formState.currentGeneratedImage}
              currentPrompt={formState.prompt}
              latestGeneration={latestGeneration}
              onMakeBaseImage={() => imageOperations.handleMakeBaseImageFromCurrent(formState.currentGeneratedImage)}
            />
          </div>
        </div>

        <HistoryPanel
          panelVisible={historyPanel.panelVisible}
          showHistory={historyPanel.showHistory}
          generations={historyGenerations}
          onRefresh={refetchGenerations}
          onEditImage={handleEditImage}
          onImageSelect={handleImageSelect}
          onMakeBaseImage={imageOperations.handleMakeBaseImageFromHistory}
          onClose={historyPanel.closeHistory}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </div>


    </>
  );
}; 
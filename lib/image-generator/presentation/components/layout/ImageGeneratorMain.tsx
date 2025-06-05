'use client';

import React, { useCallback } from 'react';
import { ImagePromptForm } from '../forms/prompt/ImagePromptForm';
import { ImageDisplayArea } from './ImageDisplayArea';
import { HistoryPanel } from '../generation/history/HistoryPanel';
import { ActionButtonsToolbar } from './ActionButtonsToolbar';
import { HeaderModelSelector } from '../providers/HeaderModelSelector';
import { 
  useImageGenerationOptimized, 
  useInfiniteGenerations,
  useFileUpload, 
  useHistoryPanel, 
  useLatestGeneration,
  useImageGeneratorState,
  usePromptEnhancement,
  useProviderSelection,
  useImageGeneratorCoordinator,
  useSharedGenerations
} from '../../hooks';
import { useOptimizedGenerate } from '../../hooks/shared/useOptimizedGenerate';
import { useImageGeneratorOperations } from '../../hooks/useImageGeneratorOperations';
import { useImageGeneratorEffects } from '../../hooks/useImageGeneratorEffects';

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
  const historyPanel = useHistoryPanel();

  const {
    selectedProviderId,
    selectedModelId,
    availableProviders,
    onProviderChange,
    getSelectedCapabilities
  } = useProviderSelection();

  const capabilities = getSelectedCapabilities();
  
  // Option 1: Optimized shared data approach (reduces API calls from 2 to 1)
  const {
    recentGenerations: generations,
    statistics,
    refetch: refetchGenerations,
    isLoading,
  } = useSharedGenerations({ limit: 20 });
  
  // Get the generate function separately since shared hook doesn't provide it
  const { generate, isGenerating, error } = useOptimizedGenerate();
  
  // Option 2: Current separate hooks approach (now commented out)
  // const {
  //   generations,
  //   isGenerating,
  //   generate,
  //   refetch: refetchGenerations,
  // } = useImageGenerationOptimized({ limit: 20 });

  // Lazy load infinite scroll data only when history panel is opened
  const {
    generations: historyGenerations,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchHistory,
  } = useInfiniteGenerations({}, { enabled: historyPanel.panelVisible });

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
              isGenerating={isGenerating}
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
          onRefresh={refetchHistory}
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
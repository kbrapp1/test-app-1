'use client';

// Image Generator Main - DDD Presentation Layer
// Single Responsibility: Orchestrate image generation UI components and state
// Following DDD principles with focused, single-purpose components

import React, { useCallback, useEffect, useState } from 'react';
import { ImagePromptForm } from '../forms/prompt/ImagePromptForm';
import { ImageDisplayArea } from './ImageDisplayArea';
import { HistoryPanel } from '../generation/history/HistoryPanel';
import { ActionButtonsToolbar } from './ActionButtonsToolbar';
import { HeaderModelSelector } from '../providers/HeaderModelSelector';
import { 
  useImageGenerationOptimized, 
  useFileUpload, 
  useHistoryPanel, 
  useLatestGeneration,
  useImageGeneratorState,
  usePromptEnhancement,
  useActionHandlers,
  useGenerationOrchestration,
  useProviderSelection
} from '../../hooks';

interface ImageGeneratorMainProps {
  className?: string;
}

/**
 * Image Generator Main Component
 * Orchestrates the main image generation interface with proper DDD layer separation
 * Single Responsibility: UI component orchestration and event coordination
 */
export const ImageGeneratorMain: React.FC<ImageGeneratorMainProps> = ({ className }) => {
  // Custom hooks for single responsibilities (DDD pattern)
  const formState = useImageGeneratorState();
  const promptEnhancement = usePromptEnhancement();
  const actionHandlers = useActionHandlers();
  const orchestration = useGenerationOrchestration();
  const fileUpload = useFileUpload();
  const historyPanel = useHistoryPanel();
  
  // IMMEDIATE FEEDBACK: Track when generation is clicked to show instant loading
  const [isGenerationClicked, setIsGenerationClicked] = useState(false);

  // Provider selection with capabilities
  const {
    selectedProviderId,
    selectedModelId,
    availableProviders,
    onProviderChange,
    getSelectedCapabilities
  } = useProviderSelection();

  const capabilities = getSelectedCapabilities();
  
  // Optimized generation management
  const {
    generations,
    isGenerating,
    generate,
    refetch: refetchGenerations,
  } = useImageGenerationOptimized({ limit: 20 });

  // Monitor latest generation for auto-completion
  const { latestGeneration, isLatestGenerating } = useLatestGeneration({
    generations,
    onImageComplete: (imageUrl) => {
      formState.setCurrentGeneratedImage(imageUrl);
      // Clear immediate feedback when generation completes
      setIsGenerationClicked(false);
    },
  });

  const latestGenerationError = latestGeneration?.status === 'failed' ? latestGeneration.errorMessage : null;

  // ENHANCED LOADING STATE: Include immediate click feedback to eliminate delay
  // Priority: Immediate click feedback > Active generation status > mutation status > no loading
  const formIsGenerating = isGenerationClicked || Boolean(
    latestGeneration && ['pending', 'processing'].includes(latestGeneration.status)
  ) || (isGenerating && !latestGeneration);

  // Clear immediate feedback when generation starts properly
  useEffect(() => {
    if (latestGeneration && ['pending', 'processing'].includes(latestGeneration.status)) {
      setIsGenerationClicked(false);
    }
  }, [latestGeneration?.status]);

  // Enhanced prompt function with current style values
  const enhancePromptWithCurrentStyles = useCallback((prompt: string) => {
    return promptEnhancement.enhancePromptWithStyles(prompt, formState.styleValues);
  }, [promptEnhancement.enhancePromptWithStyles, formState.styleValues]);

  // Generation handler with immediate feedback
  const handleGenerate = useCallback(async () => {
    // IMMEDIATE FEEDBACK: Set loading state instantly on click
    setIsGenerationClicked(true);
    
    try {
      await orchestration.handleGenerate(
        formState.prompt,
        formState.aspectRatio,
        formState.safetyTolerance,
        selectedProviderId,
        selectedModelId,
        enhancePromptWithCurrentStyles,
        generate,
        formState.setCurrentGeneratedImage
      );
    } catch (error) {
      // Clear immediate feedback on error
      setIsGenerationClicked(false);
      throw error;
    }
  }, [
    orchestration.handleGenerate,
    formState.prompt,
    formState.aspectRatio,
    formState.safetyTolerance,
    selectedProviderId,
    selectedModelId,
    enhancePromptWithCurrentStyles,
    generate,
    formState.setCurrentGeneratedImage
  ]);

  // Image editing handler with dependency injection
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

  // Image selection handler with dependency injection
  const handleImageSelect = useCallback((imageUrl: string) => {
    orchestration.handleImageSelect(
      imageUrl,
      formState.setCurrentGeneratedImage,
      historyPanel.closeHistory
    );
  }, [orchestration.handleImageSelect, formState.setCurrentGeneratedImage, historyPanel.closeHistory]);

  // Clear action with dependency injection
  const handleClearAction = useCallback(() => {
    actionHandlers.handleClearAction(formState.setCurrentGeneratedImage);
  }, [actionHandlers.handleClearAction, formState.setCurrentGeneratedImage]);

  // History panel integration effect
  useEffect(() => {
    const handleToggleHistory = () => {
      historyPanel.toggleHistory();
    };

    window.addEventListener('toggleImageGeneratorHistory', handleToggleHistory);
    return () => {
      window.removeEventListener('toggleImageGeneratorHistory', handleToggleHistory);
    };
  }, [historyPanel]);

  // Header portal cleanup effect
  useEffect(() => {
    const headerContainer = document.getElementById('image-generator-model-selector');
    
    if (!headerContainer) return;

    return () => {
      headerContainer.innerHTML = '';
    };
  }, []);

  return (
    <>
      <HeaderModelSelector
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        availableProviders={availableProviders}
        onProviderChange={onProviderChange}
        disabled={formIsGenerating}
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
          isGenerating={formIsGenerating}
          onGenerate={handleGenerate}
          onStylesChange={formState.handleStylesChange}
          generationError={latestGenerationError}
          onClearError={formState.handleClearError}
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
            />
          </div>
        </div>

        <HistoryPanel
          panelVisible={historyPanel.panelVisible}
          showHistory={historyPanel.showHistory}
          generations={generations}
          onRefresh={refetchGenerations}
          onEditImage={handleEditImage}
          onImageSelect={handleImageSelect}
          onClose={historyPanel.closeHistory}
        />
      </div>
    </>
  );
}; 
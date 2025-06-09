'use client';

import React, { memo } from 'react';
import { ImagePromptForm } from '../forms/prompt/ImagePromptForm';
import { ImageDisplayArea } from './ImageDisplayArea';
import { ActionButtonsToolbar } from './ActionButtonsToolbar';
import { HeaderModelSelector } from '../providers/HeaderModelSelector';
import {
  LazyHistoryPanelWithLoading,
  LazyProviderSelectorWithLoading
} from '../LazyComponentLoader';
import { useImageGeneratorMain } from '../../hooks/useImageGeneratorMain';
import { GenerationErrorBoundary } from '../shared/GenerationErrorBoundary';

interface ImageGeneratorMainProps {
  className?: string;
}

const ImageGeneratorMainComponent: React.FC<ImageGeneratorMainProps> = ({ className }) => {
  const {
    formState,
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
  } = useImageGeneratorMain();

  return (
    <GenerationErrorBoundary>
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
            secondImageUrl={fileUpload.secondImageUrl}
            onSecondFileUpload={fileUpload.handleSecondFileUpload}
            onClearSecondImage={fileUpload.clearSecondImage}
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
            isSecondImageStorageUrl={fileUpload.isSecondImageStorageUrl}
            isSecondImageUploading={fileUpload.isSecondImageUploading}
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

          <LazyHistoryPanelWithLoading
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
    </GenerationErrorBoundary>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: ImageGeneratorMainProps,
  nextProps: ImageGeneratorMainProps
): boolean => {
  // Component only has className prop, and it's optional
  return prevProps.className === nextProps.className;
};

// Export memoized component
export const ImageGeneratorMain = memo(ImageGeneratorMainComponent, arePropsEqual);
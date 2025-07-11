/**
 * Image Generator Main Component
 * 
 * AI INSTRUCTIONS:
 * - Remove unused props to keep interface clean
 * - Use memo for performance optimization
 * - Follow single responsibility principle
 */

'use client';

import React, { memo } from 'react';
import { ImagePromptForm } from '../forms/prompt/ImagePromptForm';
import { ImageDisplayArea } from './ImageDisplayArea';
import { ActionButtonsToolbar } from './ActionButtonsToolbar';
import { HeaderModelSelector } from '../providers/HeaderModelSelector';
import {
  LazyHistoryPanelWithLoading,
} from '../LazyComponentLoader';
import { useImageGeneratorMain } from '../../hooks/useImageGeneratorMain';
import { GenerationErrorBoundary } from '../shared/GenerationErrorBoundary';

const ImageGeneratorMainComponent: React.FC = () => {
  const {
    formState,
    actionHandlers,
    fileUpload,
    selectedProviderId,
    selectedModelId,
    availableProviders,
    onProviderChange,
    capabilities,
    historyGenerations,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetchGenerations,
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

// Export memoized component - no props needed
export const ImageGeneratorMain = memo(ImageGeneratorMainComponent);
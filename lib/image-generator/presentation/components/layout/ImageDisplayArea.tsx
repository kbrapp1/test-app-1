'use client';

import React from 'react';
import { RefreshCw, Wand2 } from 'lucide-react';

interface ImageDisplayAreaProps {
  isGenerating: boolean;
  currentGeneratedImage: string | null;
  currentPrompt?: string;
  latestGeneration?: { status: string; id: string } | null;
}

export const ImageDisplayArea: React.FC<ImageDisplayAreaProps> = ({
  isGenerating,
  currentGeneratedImage,
  currentPrompt,
  latestGeneration,
}) => {
  // CONSOLIDATED LOADING LOGIC: Single source of truth to prevent flicker
  // Priority: Active generation status > mutation status > no loading
  const shouldShowLoading = Boolean(
    latestGeneration && ['pending', 'processing'].includes(latestGeneration.status)
  ) || (isGenerating && !latestGeneration);

  // Determine loading message based on the most accurate state
  const getLoadingMessage = () => {
    if (latestGeneration?.status === 'pending') {
      return {
        title: "Image queued...",
        subtitle: "Waiting in queue for processing..."
      };
    }
    if (latestGeneration?.status === 'processing') {
      return {
        title: "Generating image...",
        subtitle: "This may take a few moments"
      };
    }
    if (isGenerating) {
      return {
        title: "Creating your image...",
        subtitle: "Submitting your request..."
      };
    }
    return {
      title: "Generating image...",
      subtitle: "This may take a few moments"
    };
  };

  const loadingMessage = getLoadingMessage();

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Generated Image Display - Top aligned and left justified */}
      <div className="flex-1 flex items-start justify-start p-4 pt-2">
        {shouldShowLoading ? (
          <div className="text-center max-w-md">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {loadingMessage.title}
            </h3>
            {currentPrompt && (
              <p className="text-sm text-foreground mb-3 font-medium">
                "{currentPrompt.length > 80 ? currentPrompt.substring(0, 80) + '...' : currentPrompt}"
              </p>
            )}
            <p className="text-muted-foreground">
              {loadingMessage.subtitle}
            </p>
          </div>
        ) : currentGeneratedImage ? (
          <div className="max-w-full max-h-full">
            <img 
              src={currentGeneratedImage} 
              alt="Generated image" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        ) : (
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">Ready to create amazing images</h3>
            <p className="text-muted-foreground">Enter a prompt and click "Create art" to generate your first AI image</p>
          </div>
        )}
      </div>
    </div>
  );
}; 
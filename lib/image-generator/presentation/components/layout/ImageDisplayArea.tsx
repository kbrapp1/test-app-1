'use client';

import React from 'react';
import Image from 'next/image';
import { RefreshCw, Wand2, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageDisplayAreaProps {
  isGenerating: boolean;
  currentGeneratedImage: string | null;
  currentPrompt?: string;
  latestGeneration?: { status: string; id: string } | null;
  onMakeBaseImage?: () => void;
}

export const ImageDisplayArea: React.FC<ImageDisplayAreaProps> = ({
  isGenerating,
  currentGeneratedImage,
  currentPrompt,
  latestGeneration,
  onMakeBaseImage,
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
      {/* Generated Image Display - Top aligned and left justified for actual images, middle centered for placeholder */}
      <div className={`flex-1 flex ${
        currentGeneratedImage ? 'p-4 pt-2 items-start justify-start' : 'items-center justify-center'
      }`}>
        {shouldShowLoading ? (
          <div className="text-center max-w-md">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {loadingMessage.title}
            </h3>
            {currentPrompt && (
              <p className="text-sm text-foreground mb-3 font-medium">
                &quot;{currentPrompt.length > 80 ? currentPrompt.substring(0, 80) + '...' : currentPrompt}&quot;
              </p>
            )}
            <p className="text-muted-foreground">
              {loadingMessage.subtitle}
            </p>
          </div>
        ) : currentGeneratedImage ? (
          <div className="relative max-w-full max-h-full group">
            <Image 
              src={currentGeneratedImage} 
              alt="Generated image" 
              width={800}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
            {onMakeBaseImage && (
              <Button
                onClick={onMakeBaseImage}
                variant="secondary"
                size="sm"
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 text-xs"
                title="Use as base image for editing"
              >
                <ArrowDownToLine className="w-3 h-3" />
                Make Base
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center max-w-md mt-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">Ready to create amazing images</h3>
            <p className="text-muted-foreground">Enter a prompt and click &quot;Create art&quot; to generate your first AI image</p>
          </div>
        )}
      </div>
    </div>
  );
}; 
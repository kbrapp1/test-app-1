'use client';

import React from 'react';
import { RefreshCw, Wand2 } from 'lucide-react';

interface ImageDisplayAreaProps {
  isGenerating: boolean;
  currentGeneratedImage: string | null;
  currentPrompt?: string;
}

export const ImageDisplayArea: React.FC<ImageDisplayAreaProps> = ({
  isGenerating,
  currentGeneratedImage,
  currentPrompt,
}) => {
  return (
    <div className="flex-1 bg-muted/30 flex flex-col relative">
      {/* Generated Image Display - Top aligned */}
      <div className="flex-1 flex items-start justify-center p-4 pt-2">
        {isGenerating ? (
          <div className="text-center max-w-md">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Creating your image...</h3>
            {currentPrompt && (
              <p className="text-sm text-foreground mb-3 font-medium">
                "{currentPrompt.length > 80 ? currentPrompt.substring(0, 80) + '...' : currentPrompt}"
              </p>
            )}
            <p className="text-muted-foreground">This may take a few moments</p>
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
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, RefreshCw, DollarSign } from 'lucide-react';

interface GenerationControlsProps {
  isGenerating: boolean;
  estimatedCost: string;
  canGenerate: boolean;
  onGenerate: () => void;
  className?: string;
}

/**
 * Component for generation controls and cost display
 * Single Responsibility: Action controls and cost information
 */
export const GenerationControls: React.FC<GenerationControlsProps> = ({
  isGenerating,
  estimatedCost,
  canGenerate,
  onGenerate,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Badge variant="outline" className="flex items-center gap-1">
        <DollarSign className="w-3 h-3" />
        Est. Cost: {estimatedCost}
      </Badge>
      
      <Button
        type="submit"
        disabled={!canGenerate || isGenerating}
        onClick={onGenerate}
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Image
          </>
        )}
      </Button>
    </div>
  );
}; 
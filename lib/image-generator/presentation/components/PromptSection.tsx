import React from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ErrorDisplay } from './ErrorDisplay';

interface PromptSectionProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  generationError?: string | null;
  onClearError?: () => void;
}

/**
 * PromptSection Component
 * Single Responsibility: Handle prompt input and generation trigger
 * Presentation Layer - Focused on prompt-related UI and interactions
 */
export const PromptSection: React.FC<PromptSectionProps> = ({
  prompt,
  onPromptChange,
  isGenerating,
  onGenerate,
  generationError,
  onClearError
}) => (
  <div>
    <Textarea
      value={prompt}
      onChange={(e) => onPromptChange(e.target.value)}
      placeholder="Describe what you want to create... Night market food vendors in Bangkok, illuminated by paper lanterns, ultra detailed"
      className="w-full min-h-32 text-sm bg-background border-input/70 text-foreground placeholder-muted-foreground rounded-lg p-3 resize-none focus:ring-ring focus:border-ring"
      disabled={isGenerating}
    />
    
    <Button
      onClick={onGenerate}
      disabled={!prompt.trim() || isGenerating}
      className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg mt-4"
    >
      {isGenerating ? (
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Creating...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Create art
        </div>
      )}
    </Button>
    
    {generationError && (
      <ErrorDisplay error={generationError} onClear={onClearError} />
    )}
  </div>
); 
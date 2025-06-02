'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';
import { useGeneratorFormState, GenerationType } from '../hooks/useGeneratorFormState';
import { GenerationModeSelector } from './GenerationModeSelector';
import { BaseImageSelector } from './BaseImageSelector';
import { AspectRatioSelector } from './AspectRatioSelector';
import { PromptInput } from './PromptInput';
import { GenerationControls } from './GenerationControls';

interface GeneratorFormProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: (options: {
    prompt: string;
    generationType: GenerationType;
    baseImageUrl?: string;
    aspectRatio?: string;
    damAssetId?: string;
  }) => void;
  isGenerating: boolean;
  estimatedCost: string;
  className?: string;
}

/**
 * Main generator form component
 * Single Responsibility: Form orchestration and submission
 */
export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  estimatedCost,
  className = ''
}) => {
  const { state, actions } = useGeneratorFormState();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate({
        prompt,
        generationType: state.generationType,
        baseImageUrl: state.baseImageUrl || undefined,
        aspectRatio: state.aspectRatio,
        damAssetId: state.damAssetId || undefined,
      });
    }
  };

  const handleDamSelect = () => {
    // TODO: Open DAM picker dialog
    console.log('Open DAM picker');
  };

  const canGenerate = Boolean(prompt.trim()) && 
    (state.generationType === 'text-to-image' || Boolean(state.baseImageUrl));

  return (
    <Card className={`shadow-sm border-gray-200 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="w-5 h-5 text-purple-600" />
          AI Image Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <GenerationModeSelector
            generationType={state.generationType}
            onGenerationTypeChange={actions.setGenerationType}
            hasBaseImage={!!state.baseImageUrl}
          />

          <BaseImageSelector
            baseImageUrl={state.baseImageUrl}
            damAssetId={state.damAssetId}
            generationType={state.generationType}
            onFileUpload={actions.handleFileUpload}
            onClearImage={actions.clearBaseImage}
            onDamSelect={handleDamSelect}
          />

          <AspectRatioSelector
            aspectRatio={state.aspectRatio}
            onAspectRatioChange={actions.setAspectRatio}
          />

          <PromptInput
            prompt={prompt}
            onPromptChange={onPromptChange}
            generationType={state.generationType}
          />

                     <GenerationControls
             isGenerating={isGenerating}
             estimatedCost={estimatedCost}
             canGenerate={canGenerate}
             onGenerate={() => {
               const event = new Event('submit') as any;
               handleSubmit(event);
             }}
           />
        </form>
      </CardContent>
    </Card>
  );
}; 
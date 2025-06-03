'use client';

import React from 'react';
import { StyleSection } from '../settings/StyleSection';
import { ImageDimensionsSection } from '../settings/ImageDimensionsSection';
import { SettingsSection } from '../settings/SettingsSection';
import { ImageUploadSection } from '../settings/ImageUploadSection';
import { PromptSection } from './PromptSection';
import { CollapsibleSection } from '../../ui/CollapsibleSection';
import { useStyleState } from '../../../hooks/useStyleState';
import { useCollapsibleSections } from '../../../hooks/useCollapsibleSections';

interface ImagePromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  baseImageUrl: string | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBaseImage: () => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  mood: string;
  onMoodChange: (value: string) => void;
  safetyTolerance: number;
  onSafetyToleranceChange: (value: number) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onStylesChange?: (styles: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  }) => void;
  generationError?: string | null;
  onClearError?: () => void;
  capabilities?: {
    supportsImageEditing: boolean;
    supportsStyleControls: boolean;
    maxSafetyTolerance?: number;
    minSafetyTolerance?: number;
    supportedAspectRatios: string[];
    supportedOutputFormats: string[];
  };
}



/**
 * ImagePromptForm Component
 * Single Responsibility: Form orchestration and coordination of sub-components
 * Follows DDD principles by delegating specific concerns to focused components
 */
export const ImagePromptForm: React.FC<ImagePromptFormProps> = ({
  prompt,
  onPromptChange,
  baseImageUrl,
  onFileUpload,
  onClearBaseImage,
  aspectRatio,
  onAspectRatioChange,
  style,
  onStyleChange,
  mood,
  onMoodChange,
  safetyTolerance,
  onSafetyToleranceChange,
  isGenerating,
  onGenerate,
  onStylesChange,
  generationError,
  onClearError,
  capabilities,
}) => {
  // Custom hooks for state management
  const styleState = useStyleState({
    initialStyle: style,
    onStylesChange
  });

  const sectionState = useCollapsibleSections();

  const handleStyleClear = () => {
    onStyleChange('none');
    styleState.clearAllStyles();
  };

  const handleStyleRandomize = () => {
    const vibeOptions = ['photography', 'digital-art', 'painting', 'sketch', 'cinematic'];
    onStyleChange(vibeOptions[Math.floor(Math.random() * vibeOptions.length)]);
    styleState.randomizeAllStyles();
  };

  return (
    <div className="w-96 bg-background overflow-y-auto flex-shrink-0 border-r border-border/50">
      <div className="p-4 space-y-6">
        {/* Prompt Section */}
        <PromptSection
          prompt={prompt}
          onPromptChange={onPromptChange}
          isGenerating={isGenerating}
          onGenerate={onGenerate}
          generationError={generationError}
          onClearError={onClearError}
        />

        {/* Image Upload Section - only show if provider supports image editing */}
        {capabilities?.supportsImageEditing && (
          <ImageUploadSection
            baseImageUrl={baseImageUrl}
            onFileUpload={onFileUpload}
            onClearBaseImage={onClearBaseImage}
          />
        )}

        {/* Image Dimensions Section */}
        <ImageDimensionsSection
          aspectRatio={aspectRatio}
          onAspectRatioChange={onAspectRatioChange}
          supportedAspectRatios={capabilities?.supportedAspectRatios}
        />

        {/* Style Section - only show if provider supports style controls */}
        {capabilities?.supportsStyleControls && (
          <CollapsibleSection
            title="Style"
            isOpen={sectionState.isStyleOpen}
            onToggle={sectionState.toggleStyleSection}
            onClear={handleStyleClear}
            onRandomize={handleStyleRandomize}
          >
            <StyleSection
              vibe={style}
              onVibeChange={onStyleChange}
              lighting={styleState.lighting}
              onLightingChange={styleState.setLighting}
              shotType={styleState.shotType}
              onShotTypeChange={styleState.setShotType}
              colorTheme={styleState.colorTheme}
              onColorThemeChange={styleState.setColorTheme}
            />
          </CollapsibleSection>
        )}

        {/* Advanced Settings Section - only show if provider has configurable settings */}
        {(capabilities?.maxSafetyTolerance || capabilities?.supportedOutputFormats?.length) && (
          <CollapsibleSection
            title="Advanced"
            isOpen={sectionState.isAdvancedOpen}
            onToggle={sectionState.toggleAdvancedSection}
          >
            <SettingsSection
              safetyTolerance={safetyTolerance}
              onSafetyToleranceChange={onSafetyToleranceChange}
              outputFormat={styleState.outputFormat}
              onOutputFormatChange={styleState.setOutputFormat}
              hasInputImage={!!baseImageUrl}
              maxSafetyTolerance={capabilities?.maxSafetyTolerance}
              minSafetyTolerance={capabilities?.minSafetyTolerance}
              supportedOutputFormats={capabilities?.supportedOutputFormats}
            />
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}; 
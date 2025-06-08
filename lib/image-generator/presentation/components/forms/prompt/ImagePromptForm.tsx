'use client';

import React, { memo } from 'react';
import { StyleSection } from '../settings/StyleSection';
import { ImageDimensionsSection } from '../settings/ImageDimensionsSection';
import { SettingsSection } from '../settings/SettingsSection';
import { ImageUploadSection } from '../settings/ImageUploadSection';
import { PromptSection } from './PromptSection';
import { CollapsibleSection } from '../../ui/CollapsibleSection';
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
  isStorageUrl?: boolean;
  isUploading?: boolean;
  onStylesChange?: (styles: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  }) => void;
  styleValues?: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  };
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
const ImagePromptFormComponent: React.FC<ImagePromptFormProps> = ({
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
  isStorageUrl = true,
  isUploading = false,
  onStylesChange,
  styleValues,
  generationError,
  onClearError,
  capabilities,
}) => {
  // Custom hooks for state management
  const sectionState = useCollapsibleSections();

  const handleStyleClear = () => {
    onStyleChange('none');
    onStylesChange?.({
      vibe: 'none',
      lighting: 'none',
      shotType: 'none',
      colorTheme: 'none'
    });
  };

  const handleStyleRandomize = () => {
    const vibeOptions = ['photography', 'digital-art', 'painting', 'sketch', 'cinematic'];
    const lightingOptions = ['natural', 'dramatic', 'soft', 'neon', 'golden-hour'];
    const shotTypeOptions = ['close-up', 'medium-shot', 'wide-shot', 'aerial', 'macro'];
    const colorThemeOptions = ['warm', 'cool', 'monochrome', 'vibrant', 'pastel'];
    
    const randomVibe = vibeOptions[Math.floor(Math.random() * vibeOptions.length)];
    onStyleChange(randomVibe);
    
    onStylesChange?.({
      vibe: randomVibe,
      lighting: lightingOptions[Math.floor(Math.random() * lightingOptions.length)],
      shotType: shotTypeOptions[Math.floor(Math.random() * shotTypeOptions.length)],
      colorTheme: colorThemeOptions[Math.floor(Math.random() * colorThemeOptions.length)]
    });
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
            aspectRatio={aspectRatio}
            onFileUpload={onFileUpload}
            onClearBaseImage={onClearBaseImage}
            isStorageUrl={isStorageUrl}
            isUploading={isUploading}
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
              lighting={styleValues?.lighting || 'none'}
              onLightingChange={(value) => onStylesChange?.({ 
                vibe: styleValues?.vibe || style,
                lighting: value,
                shotType: styleValues?.shotType || 'none',
                colorTheme: styleValues?.colorTheme || 'none'
              })}
              shotType={styleValues?.shotType || 'none'}
              onShotTypeChange={(value) => onStylesChange?.({ 
                vibe: styleValues?.vibe || style,
                lighting: styleValues?.lighting || 'none',
                shotType: value,
                colorTheme: styleValues?.colorTheme || 'none'
              })}
              colorTheme={styleValues?.colorTheme || 'none'}
              onColorThemeChange={(value) => onStylesChange?.({ 
                vibe: styleValues?.vibe || style,
                lighting: styleValues?.lighting || 'none',
                shotType: styleValues?.shotType || 'none',
                colorTheme: value
              })}
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
              outputFormat="png"
              onOutputFormatChange={() => {}}
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

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: ImagePromptFormProps,
  nextProps: ImagePromptFormProps
): boolean => {
  // Compare primitive props
  if (
    prevProps.prompt !== nextProps.prompt ||
    prevProps.baseImageUrl !== nextProps.baseImageUrl ||
    prevProps.aspectRatio !== nextProps.aspectRatio ||
    prevProps.style !== nextProps.style ||
    prevProps.mood !== nextProps.mood ||
    prevProps.safetyTolerance !== nextProps.safetyTolerance ||
    prevProps.isGenerating !== nextProps.isGenerating ||
    prevProps.isStorageUrl !== nextProps.isStorageUrl ||
    prevProps.isUploading !== nextProps.isUploading ||
    prevProps.generationError !== nextProps.generationError
  ) {
    return false;
  }

  // Compare styleValues object
  const prevStyles = prevProps.styleValues;
  const nextStyles = nextProps.styleValues;
  if (prevStyles !== nextStyles) {
    if (!prevStyles || !nextStyles) return false;
    if (
      prevStyles.vibe !== nextStyles.vibe ||
      prevStyles.lighting !== nextStyles.lighting ||
      prevStyles.shotType !== nextStyles.shotType ||
      prevStyles.colorTheme !== nextStyles.colorTheme
    ) {
      return false;
    }
  }

  // Compare capabilities object (deep comparison for key properties)
  const prevCap = prevProps.capabilities;
  const nextCap = nextProps.capabilities;
  if (prevCap !== nextCap) {
    if (!prevCap || !nextCap) return false;
    if (
      prevCap.supportsImageEditing !== nextCap.supportsImageEditing ||
      prevCap.supportsStyleControls !== nextCap.supportsStyleControls ||
      prevCap.maxSafetyTolerance !== nextCap.maxSafetyTolerance ||
      prevCap.minSafetyTolerance !== nextCap.minSafetyTolerance ||
      JSON.stringify(prevCap.supportedAspectRatios) !== JSON.stringify(nextCap.supportedAspectRatios) ||
      JSON.stringify(prevCap.supportedOutputFormats) !== JSON.stringify(nextCap.supportedOutputFormats)
    ) {
      return false;
    }
  }

  // Function props are assumed to be stable (created with useCallback)
  return true;
};

// Export memoized component
export const ImagePromptForm = memo(ImagePromptFormComponent, arePropsEqual);
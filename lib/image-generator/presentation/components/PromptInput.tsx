'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { GenerationType } from '../hooks/useGeneratorFormState';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  generationType: GenerationType;
  className?: string;
}

/**
 * Component for prompt input with dynamic placeholders
 * Single Responsibility: Prompt text input management
 */
export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  onPromptChange,
  generationType,
  className = ''
}) => {
  const getPromptPlaceholder = () => {
    switch (generationType) {
      case 'image-editing':
        return 'Describe how you want to edit this image... e.g., "put a sunrise behind the mountain"';
      case 'style-transfer':
        return 'Describe the style you want... e.g., "make it look like a watercolor painting"';
      case 'background-swap':
        return 'Describe the new background... e.g., "place this in a magical forest"';
      default:
        return 'Describe the image you want to generate... Be as detailed as possible for best results.';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Prompt <span className="text-red-500">*</span>
      </label>
      <Textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={getPromptPlaceholder()}
        rows={4}
        className="resize-none"
      />
    </div>
  );
}; 
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PresetPromptsProps {
  onPresetSelect: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

const PRESET_PROMPTS = [
  "A futuristic cityscape at sunset with flying cars",
  "A magical forest with glowing mushrooms and fairy lights",
  "An elegant modern living room with natural lighting",
  "A vintage coffee shop in Paris with warm lighting",
  "A minimalist workspace with plants and natural wood",
  "A cozy cabin in the mountains during winter"
];

export const PresetPrompts: React.FC<PresetPromptsProps> = ({
  onPresetSelect,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Quick starts
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_PROMPTS.map((preset, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onPresetSelect(preset)}
            disabled={disabled}
            className="text-xs h-7 px-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
          >
            {preset.slice(0, 30)}...
          </Button>
        ))}
      </div>
    </div>
  );
}; 
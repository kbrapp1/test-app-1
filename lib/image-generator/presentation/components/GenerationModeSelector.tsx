'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Edit3 } from 'lucide-react';
import { GenerationType } from '../hooks/useGeneratorFormState';

interface GenerationModeSelectorProps {
  generationType: GenerationType;
  onGenerationTypeChange: (type: GenerationType) => void;
  hasBaseImage: boolean;
  className?: string;
}

/**
 * Component for selecting generation mode and editing type
 * Single Responsibility: Mode selection UI
 */
export const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({
  generationType,
  onGenerationTypeChange,
  hasBaseImage,
  className = ''
}) => {
  return (
    <div className={className}>
      <Tabs 
        value={generationType} 
        onValueChange={(value) => onGenerationTypeChange(value as GenerationType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-to-image" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="image-editing" disabled={!hasBaseImage} className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text-to-image" className="space-y-4 mt-4">
          <div className="text-sm text-gray-600">
            Create entirely new images from your imagination
          </div>
        </TabsContent>

        <TabsContent value="image-editing" className="space-y-4 mt-4">
          <div className="text-sm text-gray-600">
            Transform existing images with text prompts
          </div>
          
          <Select 
            value={generationType} 
            onValueChange={(value) => onGenerationTypeChange(value as GenerationType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select editing type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image-editing">General Editing</SelectItem>
              <SelectItem value="style-transfer">Style Transfer</SelectItem>
              <SelectItem value="background-swap">Background Change</SelectItem>
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 
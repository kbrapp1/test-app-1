'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe } from 'lucide-react';

/**
 * PlatformSelector Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle platform selection for embed code generation
 * - Presentation layer component for platform switching
 * - Keep under 80 lines, focused on platform selection only
 * - Use clean typography and minimal color usage
 */

export type PlatformType = 'html' | 'wordpress' | 'react';

interface PlatformSelectorProps {
  selectedPlatform: PlatformType;
  onPlatformChange: (platform: PlatformType) => void;
}

export function PlatformSelector({ selectedPlatform, onPlatformChange }: PlatformSelectorProps) {
  return (
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger 
        value="html" 
        className="flex items-center gap-2"
        onClick={() => onPlatformChange('html')}
      >
        <Globe className="h-4 w-4" />
        HTML/JS
      </TabsTrigger>
      <TabsTrigger 
        value="wordpress" 
        className="flex items-center gap-2"
        onClick={() => onPlatformChange('wordpress')}
      >
        📝
        WordPress
      </TabsTrigger>
      <TabsTrigger 
        value="react" 
        className="flex items-center gap-2"
        onClick={() => onPlatformChange('react')}
      >
        ⚛️
        React
      </TabsTrigger>
    </TabsList>
  );
} 
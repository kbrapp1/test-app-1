'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { PlatformType } from './PlatformSelector';

/**
 * CodeDisplaySection Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display embed code with copy functionality
 * - Presentation layer component for code visualization and interaction
 * - Keep under 120 lines, focused on code display and copying
 * - Handle clipboard operations with proper error handling
 */

interface CodeDisplaySectionProps {
  platform: PlatformType;
  code: string;
}

export function CodeDisplaySection({ platform, code }: CodeDisplaySectionProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getCodeTypeLabel = (platform: PlatformType): string => {
    switch (platform) {
      case 'wordpress':
        return 'PHP Code';
      case 'react':
        return 'React Component';
      default:
        return 'JavaScript Code';
    }
  };

  const copyToClipboard = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      // Copy failed - user will need to manually copy
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {getCodeTypeLabel(platform)}
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(code, platform)}
          className="flex items-center gap-2"
        >
          {copiedCode === platform ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copiedCode === platform ? 'Copied!' : 'Copy Code'}
        </Button>
      </div>
      
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-80">
        <pre>{code}</pre>
      </div>
    </div>
  );
} 
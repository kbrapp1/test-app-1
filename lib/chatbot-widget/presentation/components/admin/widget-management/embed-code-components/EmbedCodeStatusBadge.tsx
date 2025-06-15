'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

/**
 * EmbedCodeStatusBadge Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display chatbot configuration status
 * - Presentation layer component for status visualization
 * - Keep under 50 lines, focused on status display only
 * - Use theme-aware styling with minimal color usage
 */

interface EmbedCodeStatusBadgeProps {
  isActive: boolean;
}

export function EmbedCodeStatusBadge({ isActive }: EmbedCodeStatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Ready to Deploy
        </Badge>
      ) : (
        <Badge variant="secondary">
          Inactive - Enable in Configuration
        </Badge>
      )}
    </div>
  );
} 
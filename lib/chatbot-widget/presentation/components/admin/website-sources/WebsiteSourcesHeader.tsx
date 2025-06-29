/**
 * Website Sources Header Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Header with cleanup functionality
 * - Keep under 50 lines - focused component
 * - Follow @golden-rule patterns exactly
 * - Delegate actions to parent component
 */

import { Button } from '@/components/ui/button';

interface WebsiteSourcesHeaderProps {
  hasAnySources: boolean;
  onCleanup: () => void;
  actionLoading: boolean;
}

export function WebsiteSourcesHeader({ 
  hasAnySources, 
  onCleanup, 
  actionLoading 
}: WebsiteSourcesHeaderProps) {
  if (!hasAnySources) return null;

  return (
    <div className="flex justify-end">
      <Button 
        onClick={onCleanup} 
        variant="outline" 
        size="sm"
        disabled={actionLoading}
      >
        🧹 Clean Database
      </Button>
    </div>
  );
} 
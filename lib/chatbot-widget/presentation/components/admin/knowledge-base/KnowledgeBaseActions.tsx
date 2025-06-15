/**
 * Knowledge Base Actions Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Action buttons for knowledge base operations
 * - Handle save/cancel actions with loading states
 * - Keep under 200-250 lines
 * - Simple, focused component
 * - Follow @golden-rule patterns exactly
 */

import { Button } from '@/components/ui/button';

interface KnowledgeBaseActionsProps {
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function KnowledgeBaseActions({
  onSave,
  onCancel,
  isLoading,
}: KnowledgeBaseActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onSave}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
    </div>
  );
} 
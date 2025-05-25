import React from 'react';
import { Loader2, Sparkles, Tag as TagIcon } from "lucide-react";

interface TagEditorEmptyStateProps {
  isLoading: boolean;
  canCreateNew: boolean;
}

/**
 * TagEditorEmptyState - Domain-Focused Empty State Component
 * 
 * Responsible for rendering loading and empty states.
 * Separated from business logic for better maintainability.
 */
export const TagEditorEmptyState: React.FC<TagEditorEmptyStateProps> = ({
  isLoading,
  canCreateNew,
}) => {
  return (
    <div className="py-6 text-center">
      <div className="text-gray-400">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading tags...</p>
          </div>
        ) : canCreateNew ? (
          <div className="flex flex-col items-center space-y-2">
            <Sparkles className="h-6 w-6" />
            <p className="text-sm font-medium">Ready to create new tag</p>
            <p className="text-xs text-gray-500">Press Enter or click below</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <TagIcon className="h-6 w-6" />
            <p className="text-sm">No matching tags found</p>
          </div>
        )}
      </div>
    </div>
  );
}; 

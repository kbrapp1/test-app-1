'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface GenerationEmptyStateProps {
  hasSearchQuery: boolean;
  onClearSearch: () => void;
}

export const GenerationEmptyState: React.FC<GenerationEmptyStateProps> = ({
  hasSearchQuery,
  onClearSearch,
}) => {
  return (
    <div className="p-8 text-center">
      <div className="text-gray-400 mb-2">No generations found</div>
      {hasSearchQuery && (
        <Button variant="ghost" size="sm" onClick={onClearSearch}>
          Clear search
        </Button>
      )}
    </div>
  );
}; 
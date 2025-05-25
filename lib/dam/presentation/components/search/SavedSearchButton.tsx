'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark } from 'lucide-react';
import { CurrentSearchCriteria, useSavedSearches } from '../../hooks/search/useSavedSearches';
import { SavedSearchDialog } from './components/SavedSearchDialog';

interface SavedSearchButtonProps {
  currentSearchCriteria: CurrentSearchCriteria;
  onExecuteSearch?: (searchCriteria: CurrentSearchCriteria) => void;
}

export function SavedSearchButton({ 
  currentSearchCriteria, 
  onExecuteSearch 
}: SavedSearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Single source of truth for saved searches
  const savedSearchesHook = useSavedSearches();
  const { savedSearches } = savedSearchesHook;

  const handleSearchSaved = () => {
    // The hook automatically updates when saveCurrentSearch is called
    // No need to manually refresh since we're sharing the same hook instance
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-9"
        onClick={() => setIsOpen(true)}
      >
        <Bookmark className="h-4 w-4 mr-1" />
        Searches
        {savedSearches.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
            {savedSearches.length}
          </Badge>
        )}
      </Button>
      
      <SavedSearchDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        currentSearchCriteria={currentSearchCriteria}
        onExecuteSearch={onExecuteSearch}
        onSearchSaved={handleSearchSaved}
        savedSearchesHook={savedSearchesHook}
      />
    </>
  );
} 

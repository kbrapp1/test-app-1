'use client';

import React from 'react';
import { Loader2, Bookmark } from 'lucide-react';
import { CurrentSearchCriteria, useSavedSearches, UseSavedSearchesReturn } from '../../../hooks/search/useSavedSearches';
import { SavedSearchList } from './SavedSearchList';

interface SavedSearchBrowseTabProps {
  onExecuteSearch: (searchCriteria: CurrentSearchCriteria) => void;
  savedSearchesHook: UseSavedSearchesReturn;
}

export function SavedSearchBrowseTab({ onExecuteSearch, savedSearchesHook }: SavedSearchBrowseTabProps) {
  const { savedSearches, popularSearches, isLoading } = savedSearchesHook;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading searches...
      </div>
    );
  }

  if (savedSearches.length === 0 && popularSearches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No saved searches yet</p>
        <p className="text-sm">Save your current search to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedSearches.length > 0 && (
        <SavedSearchList
          title="Your Saved Searches"
          icon="clock"
          searches={savedSearches}
          onExecuteSearch={onExecuteSearch}
          showUseCount
        />
      )}

      {popularSearches.length > 0 && (
        <SavedSearchList
          title="Popular in Organization"
          icon="trending"
          searches={popularSearches}
          onExecuteSearch={onExecuteSearch}
          showUseCount
        />
      )}
    </div>
  );
} 

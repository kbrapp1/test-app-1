'use client';

import React from 'react';
import { CurrentSearchCriteria } from '../../../hooks/search/useSavedSearches';

interface SearchCriteriaPreviewProps {
  searchCriteria: CurrentSearchCriteria;
}

export function SearchCriteriaPreview({ searchCriteria }: SearchCriteriaPreviewProps) {
  const hasSearchTerm = searchCriteria.searchTerm?.trim();
  const hasTypeFilter = searchCriteria.filters?.type && searchCriteria.filters.type !== 'any';
  const hasTagFilters = searchCriteria.tagIds && searchCriteria.tagIds.length > 0;
  const hasFolderFilter = searchCriteria.folderId;

  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium mb-2">Current Search Preview</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        {hasSearchTerm && (
          <div>Search: &ldquo;{searchCriteria.searchTerm}&rdquo;</div>
        )}
        {hasTypeFilter && (
          <div>Type: {searchCriteria.filters?.type}</div>
        )}
        {hasTagFilters && (
          <div>{searchCriteria.tagIds?.length} tag(s) selected</div>
        )}
        {hasFolderFilter && (
          <div>Folder: {searchCriteria.folderId}</div>
        )}
        {!hasSearchTerm && !hasTypeFilter && !hasTagFilters && !hasFolderFilter && (
          <div className="text-muted-foreground/70">No specific criteria set</div>
        )}
      </div>
    </div>
  );
} 

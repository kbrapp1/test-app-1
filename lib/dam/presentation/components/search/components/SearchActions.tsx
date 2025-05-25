'use client';

import React from 'react';
import { SavedSearchButton } from '../SavedSearchButton';
import { DamTagFilter } from '../../filters/DamTagFilter';
import { DamUploadButton } from '../../upload/DamUploadButton';
import { CurrentSearchCriteria } from '../../../hooks/search/useSavedSearches';

interface SearchActionsProps {
  currentSearchCriteria: CurrentSearchCriteria;
  onExecuteSearch: (searchCriteria: CurrentSearchCriteria) => void;
  activeOrgId: string | null;
  selectedTagIds: string[];
  onTagFilterChange: (tagIds: string[]) => void;
  currentFolderId: string | null;
}

/**
 * SearchActions Component
 * Follows Single Responsibility Principle - handles search-related actions (saved search, tag filter, upload)
 */
export const SearchActions: React.FC<SearchActionsProps> = ({
  currentSearchCriteria,
  onExecuteSearch,
  activeOrgId,
  selectedTagIds,
  onTagFilterChange,
  currentFolderId,
}) => {
  const handleTagFilterChange = (newTagIds: Set<string>) => {
    onTagFilterChange(Array.from(newTagIds));
  };

  return (
    <>
      <SavedSearchButton 
        currentSearchCriteria={currentSearchCriteria}
        onExecuteSearch={onExecuteSearch}
      />
      
      <DamTagFilter
        organizationId={activeOrgId}
        selectedTagIds={new Set(selectedTagIds)}
        onTagFilterChange={handleTagFilterChange}
      />

      <DamUploadButton currentFolderId={currentFolderId} />
    </>
  );
}; 

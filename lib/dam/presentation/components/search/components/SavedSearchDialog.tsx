'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { CurrentSearchCriteria, useSavedSearches, UseSavedSearchesReturn } from '../../../hooks/search/useSavedSearches';
import { SavedSearchBrowseTab } from './SavedSearchBrowseTab';
import { SavedSearchSaveTab } from './SavedSearchSaveTab';

interface SavedSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentSearchCriteria: CurrentSearchCriteria;
  onExecuteSearch?: (searchCriteria: CurrentSearchCriteria) => void;
  onSearchSaved?: () => void;
  savedSearchesHook: UseSavedSearchesReturn;
}

export function SavedSearchDialog({
  isOpen,
  onOpenChange,
  currentSearchCriteria,
  onExecuteSearch,
  onSearchSaved,
  savedSearchesHook
}: SavedSearchDialogProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'save'>('browse');
  
  const { canSaveCurrentSearch } = savedSearchesHook;
  const canSave = canSaveCurrentSearch(currentSearchCriteria);

  const handleExecuteSearch = (searchCriteria: CurrentSearchCriteria) => {
    onOpenChange(false);
    onExecuteSearch?.(searchCriteria);
  };

  const handleSearchSaved = () => {
    setActiveTab('browse');
    onSearchSaved?.(); // Notify parent component
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved Searches</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('browse')}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-1" />
            Browse
          </Button>
          <Button
            variant={activeTab === 'save' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('save')}
            disabled={!canSave}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Save Current
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'browse' && (
          <SavedSearchBrowseTab 
            onExecuteSearch={handleExecuteSearch}
            savedSearchesHook={savedSearchesHook}
          />
        )}

        {activeTab === 'save' && (
          <SavedSearchSaveTab
            currentSearchCriteria={currentSearchCriteria}
            onSearchSaved={handleSearchSaved}
            savedSearchesHook={savedSearchesHook}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 

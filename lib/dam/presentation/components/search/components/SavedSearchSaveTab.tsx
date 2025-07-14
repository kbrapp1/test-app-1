'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bookmark, Search } from 'lucide-react';
import { 
  CurrentSearchCriteria, 
  SavedSearchFormData, 

  UseSavedSearchesReturn 
} from '../../../hooks/search/useSavedSearches';
import { SearchCriteriaPreview } from './SearchCriteriaPreview';

interface SavedSearchSaveTabProps {
  currentSearchCriteria: CurrentSearchCriteria;
  onSearchSaved: () => void;
  savedSearchesHook: UseSavedSearchesReturn;
}

export function SavedSearchSaveTab({
  currentSearchCriteria,
  onSearchSaved,
  savedSearchesHook
}: SavedSearchSaveTabProps) {
  const [saveFormData, setSaveFormData] = useState<SavedSearchFormData>({
    name: '',
    description: '',
    isGlobal: true,
  });

  const { saveCurrentSearch, canSaveCurrentSearch, isLoading } = savedSearchesHook;
  const canSave = canSaveCurrentSearch(currentSearchCriteria);

  const handleSaveSearch = async () => {
    if (!saveFormData.name.trim()) return;

    const result = await saveCurrentSearch(saveFormData, currentSearchCriteria);
    if (result) {
      setSaveFormData({ name: '', description: '', isGlobal: true });
      onSearchSaved();
    }
  };

  const updateFormData = (updates: Partial<SavedSearchFormData>) => {
    setSaveFormData((prev: SavedSearchFormData) => ({ ...prev, ...updates }));
  };

  if (!canSave) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No search criteria to save</p>
        <p className="text-sm">Add filters or a search term first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchCriteriaPreview searchCriteria={currentSearchCriteria} />

      <div className="space-y-4">
        <div>
          <Label htmlFor="search-name">Search Name *</Label>
          <Input
            id="search-name"
            value={saveFormData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., Recent Product Images"
            maxLength={100}
          />
        </div>

        <div>
          <Label htmlFor="search-description">Description (optional)</Label>
          <Textarea
            id="search-description"
            value={saveFormData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe what this search is for..."
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="search-global"
            checked={saveFormData.isGlobal}
            onCheckedChange={(checked) => updateFormData({ isGlobal: checked })}
          />
          <Label htmlFor="search-global" className="text-sm">
            Global search (applies across all folders)
          </Label>
        </div>

        <Button 
          onClick={handleSaveSearch}
          disabled={!saveFormData.name.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Save Search
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 

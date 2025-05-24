'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bookmark, Plus, Search, Clock, TrendingUp } from 'lucide-react';
import { useSavedSearches, SavedSearchFormData, CurrentSearchCriteria } from '../../hooks/useSavedSearches';
import { SavedSearch } from '../../../domain/entities/SavedSearch';

interface SavedSearchButtonProps {
  currentSearchCriteria: CurrentSearchCriteria;
  onExecuteSearch?: (searchCriteria: CurrentSearchCriteria) => void;
}

export function SavedSearchButton({ 
  currentSearchCriteria, 
  onExecuteSearch 
}: SavedSearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'save'>('browse');
  const [saveFormData, setSaveFormData] = useState<SavedSearchFormData>({
    name: '',
    description: '',
    isGlobal: true,
  });

  const {
    savedSearches,
    popularSearches,
    isLoading,
    isExecuting,
    saveCurrentSearch,
    executeSearch,
    canSaveCurrentSearch,
  } = useSavedSearches();

  const handleSaveSearch = async () => {
    if (!saveFormData.name.trim()) return;

    const result = await saveCurrentSearch(saveFormData, currentSearchCriteria);
    if (result) {
      setSaveFormData({ name: '', description: '', isGlobal: true });
      setActiveTab('browse');
    }
  };

  const handleExecuteSearch = async (savedSearch: SavedSearch) => {
    setIsOpen(false);
    if (onExecuteSearch) {
      onExecuteSearch(savedSearch.searchCriteria);
    }
  };

  const canSave = canSaveCurrentSearch(currentSearchCriteria);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Bookmark className="h-4 w-4 mr-1" />
          Searches
          {savedSearches.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
              {savedSearches.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
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

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading searches...
              </div>
            )}

            {!isLoading && savedSearches.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved searches yet</p>
                <p className="text-sm">Save your current search to get started</p>
              </div>
            )}

            {/* User's Saved Searches */}
            {savedSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  <h3 className="font-medium">Your Saved Searches</h3>
                </div>
                <div className="space-y-2">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleExecuteSearch(search)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{search.name}</h4>
                          {search.useCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {search.useCount} uses
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {search.getDisplaySummary()}
                        </p>
                        {search.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {search.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4" />
                  <h3 className="font-medium">Popular in Organization</h3>
                </div>
                <div className="space-y-2">
                  {popularSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleExecuteSearch(search)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{search.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {search.useCount} uses
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {search.getDisplaySummary()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Tab */}
        {activeTab === 'save' && (
          <div className="space-y-4">
            {!canSave ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No search criteria to save</p>
                <p className="text-sm">Add filters or a search term first</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Current Search Preview</h4>
                  <div className="text-sm text-muted-foreground">
                    {/* Show search summary */}
                    {currentSearchCriteria.searchTerm && (
                      <div>Search: "{currentSearchCriteria.searchTerm}"</div>
                    )}
                    {currentSearchCriteria.filters?.type && currentSearchCriteria.filters.type !== 'any' && (
                      <div>Type: {currentSearchCriteria.filters.type}</div>
                    )}
                    {currentSearchCriteria.tagIds && currentSearchCriteria.tagIds.length > 0 && (
                      <div>{currentSearchCriteria.tagIds.length} tag(s) selected</div>
                    )}
                    {/* Add more filter displays as needed */}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search-name">Search Name *</Label>
                    <Input
                      id="search-name"
                      value={saveFormData.name}
                      onChange={(e) => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Recent Product Images"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="search-description">Description (optional)</Label>
                    <Textarea
                      id="search-description"
                      value={saveFormData.description}
                      onChange={(e) => setSaveFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this search is for..."
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="search-global"
                      checked={saveFormData.isGlobal}
                      onCheckedChange={(checked) => setSaveFormData(prev => ({ ...prev, isGlobal: checked }))}
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
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 